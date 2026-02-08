"""
User endpoints - profile and subscription management.

GET  /api/v1/users/me         -> Current user profile
POST /api/v1/users/checkout   -> Create Stripe checkout session
POST /api/v1/users/portal     -> Create Stripe billing portal
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_auth
from app.core.config import settings
from app.models.user import User
from app.services.stripe_service import stripe_service
from app.schemas.user import UserProfile

import stripe

router = APIRouter()


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
