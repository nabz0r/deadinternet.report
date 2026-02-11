"""
User endpoints - profile and subscription management.

GET  /api/v1/users/me         -> Current user profile
POST /api/v1/users/sync       -> Sync user from NextAuth (internal only)
POST /api/v1/users/checkout   -> Create Stripe checkout session
POST /api/v1/users/portal     -> Create Stripe billing portal
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import require_auth
from app.core.config import settings
from app.models.user import User
from app.models.scan import Scan
from app.services.stripe_service import stripe_service
from app.schemas.user import UserProfile, UserAnalyticsResponse, VerdictBreakdown, DomainAnalytics, DailyActivity

import stripe
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from collections import defaultdict

router = APIRouter()


class UserSyncRequest(BaseModel):
    """Payload from NextAuth JWT callback on first login."""
    id: str
    email: EmailStr
    name: str | None = None
    image: str | None = None


async def verify_internal_secret(
    x_internal_secret: str | None = Header(None, alias="X-Internal-Secret"),
) -> None:
    """Verify that the request comes from our NextAuth backend."""
    if not x_internal_secret:
        raise HTTPException(status_code=401, detail="Missing internal auth")
    if not secrets.compare_digest(x_internal_secret, settings.internal_api_secret):
        raise HTTPException(status_code=403, detail="Invalid internal auth")


@router.post("/sync")
async def sync_user(
    payload: UserSyncRequest,
    _: None = Depends(verify_internal_secret),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync user from NextAuth on login.
    Creates user if not exists, returns current tier.
    Protected by internal API secret - not accessible from public internet.
    """
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if user:
        user.name = payload.name or user.name
        user.image = payload.image or user.image
        await db.flush()
        return {"id": user.id, "tier": user.tier, "synced": True}

    user = User(
        id=payload.id,
        email=payload.email,
        name=payload.name,
        image=payload.image,
        tier="ghost",
    )
    db.add(user)
    await db.flush()
    return {"id": user.id, "tier": "ghost", "synced": True, "created": True}


@router.get("/me", response_model=UserProfile)
async def get_profile(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    db_user = await db.get(User, user["id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile.model_validate(db_user)


@router.get("/me/analytics", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get personal scan analytics for the authenticated user."""
    from sqlalchemy import func as sa_func

    user_id = user["id"]
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total scans
    total_result = await db.execute(
        select(sa_func.count()).select_from(Scan).where(Scan.user_id == user_id)
    )
    total_scans = total_result.scalar() or 0

    # Scans this month
    month_result = await db.execute(
        select(sa_func.count()).select_from(Scan).where(
            Scan.user_id == user_id, Scan.created_at >= month_start
        )
    )
    scans_this_month = month_result.scalar() or 0

    # Average AI probability
    avg_result = await db.execute(
        select(sa_func.avg(Scan.ai_probability)).where(Scan.user_id == user_id)
    )
    avg_ai_probability = round(avg_result.scalar() or 0.0, 4)

    # Verdict breakdown
    verdict_rows = await db.execute(
        select(Scan.verdict, sa_func.count()).where(
            Scan.user_id == user_id
        ).group_by(Scan.verdict)
    )
    verdict_map = {row[0]: row[1] for row in verdict_rows}
    verdict_breakdown = VerdictBreakdown(
        ai_generated=verdict_map.get("ai_generated", 0),
        mixed=verdict_map.get("mixed", 0),
        human=verdict_map.get("human", 0),
    )

    # Top domains (from user's scans)
    all_scans_result = await db.execute(
        select(Scan.url, Scan.verdict, Scan.ai_probability).where(
            Scan.user_id == user_id
        )
    )
    domain_data: dict[str, dict] = defaultdict(
        lambda: {"count": 0, "ai": 0, "mixed": 0, "human": 0, "prob_sum": 0.0}
    )
    for url, verdict, prob in all_scans_result:
        try:
            domain = urlparse(url).netloc.lower().removeprefix("www.")
        except Exception:
            continue
        if not domain:
            continue
        d = domain_data[domain]
        d["count"] += 1
        d["prob_sum"] += prob or 0.0
        if verdict == "ai_generated":
            d["ai"] += 1
        elif verdict == "mixed":
            d["mixed"] += 1
        else:
            d["human"] += 1

    top_domains = sorted(domain_data.items(), key=lambda x: x[1]["count"], reverse=True)[:10]
    domain_analytics = [
        DomainAnalytics(
            domain=domain,
            scan_count=d["count"],
            ai_generated_count=d["ai"],
            mixed_count=d["mixed"],
            human_count=d["human"],
            avg_ai_probability=round(d["prob_sum"] / d["count"], 4) if d["count"] else 0.0,
            ai_rate=round(d["ai"] / d["count"], 4) if d["count"] else 0.0,
        )
        for domain, d in top_domains
    ]

    # Recent daily activity (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    recent_scans_result = await db.execute(
        select(Scan.created_at, Scan.verdict).where(
            Scan.user_id == user_id, Scan.created_at >= thirty_days_ago
        ).order_by(Scan.created_at)
    )
    daily: dict[str, dict] = defaultdict(
        lambda: {"total": 0, "ai_generated": 0, "mixed": 0, "human": 0}
    )
    for created_at, verdict in recent_scans_result:
        day_key = created_at.strftime("%Y-%m-%d")
        daily[day_key]["total"] += 1
        if verdict in ("ai_generated", "mixed", "human"):
            daily[day_key][verdict] += 1

    recent_activity = [
        DailyActivity(
            date=day,
            total=d["total"],
            ai_generated=d["ai_generated"],
            mixed=d["mixed"],
            human=d["human"],
        )
        for day, d in sorted(daily.items())
    ]

    return UserAnalyticsResponse(
        total_scans=total_scans,
        scans_this_month=scans_this_month,
        avg_ai_probability=avg_ai_probability,
        verdict_breakdown=verdict_breakdown,
        top_domains=domain_analytics,
        recent_activity=recent_activity,
    )


@router.post("/checkout")
async def create_checkout(
    price_id: str,
    user: dict = Depends(require_auth),
):
    """Create a Stripe Checkout session for subscription."""
    valid_prices = [settings.stripe_price_hunter, settings.stripe_price_operator]
    if price_id not in valid_prices:
        raise HTTPException(status_code=400, detail="Invalid price ID")

    # Determine base URL from CORS origins
    base_url = settings.cors_origins[0] if settings.cors_origins else 'https://deadinternet.report'

    url = await stripe_service.create_checkout_session(
        user_id=user["id"],
        email=user["email"],
        price_id=price_id,
        success_url=f"{base_url}/dashboard/success",
        cancel_url=f"{base_url}/pricing",
    )
    return {"checkout_url": url}


@router.post("/portal")
async def create_portal(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Create Stripe billing portal for subscription management."""
    db_user = await db.get(User, user["id"])
    if not db_user or not db_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    base_url = settings.cors_origins[0] if settings.cors_origins else 'https://deadinternet.report'

    session = stripe.billing_portal.Session.create(
        customer=db_user.stripe_customer_id,
        return_url=f"{base_url}/dashboard",
    )
    return {"portal_url": session.url}
