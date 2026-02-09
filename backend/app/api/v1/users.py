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
from app.services.stripe_service import stripe_service
from app.schemas.user import UserProfile

import stripe
import secrets

router = APIRouter()


class UserSyncRequest(BaseModel):
    """Payload from NextAuth JWT callback on first login."""
    id: str
    email: EmailStr  # Validate email format
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


@router.post("/checkout")
async def create_checkout(
    price_id: str,
    user: dict = Depends(require_auth),
):
    """Create a Stripe Checkout session for subscription."""
    valid_prices = [settings.stripe_price_hunter, settings.stripe_price_operator]
    if price_id not in valid_prices:
        raise HTTPException(status_code=400, detail="Invalid price ID")

    url = await stripe_service.create_checkout_session(
        user_id=user["id"],
        email=user["email"],
        price_id=price_id,
        success_url=f"{settings.cors_origins[0]}/dashboard?upgraded=true",
        cancel_url=f"{settings.cors_origins[0]}/pricing",
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

    session = stripe.billing_portal.Session.create(
        customer=db_user.stripe_customer_id,
        return_url=f"{settings.cors_origins[0]}/dashboard",
    )
    return {"portal_url": session.url}
