"""
Stripe Service - subscription management.

Handles:
  - Creating checkout sessions
  - Processing webhooks
  - Syncing subscription state to DB
"""

import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription

stripe.api_key = settings.stripe_secret_key

# Map Stripe price IDs to tier names
PRICE_TO_TIER = {
    settings.stripe_price_hunter: "hunter",
    settings.stripe_price_operator: "operator",
}


class StripeService:
    """Manages Stripe interactions."""

    async def create_checkout_session(
        self, user_id: str, email: str, price_id: str, success_url: str, cancel_url: str
    ) -> str:
        """Create a Stripe Checkout session. Returns the session URL."""
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=email,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user_id},
        )
        return session.url

    async def handle_webhook_event(
        self, payload: bytes, sig_header: str, db: AsyncSession
    ) -> dict:
        """Process Stripe webhook event."""
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )

        if event.type == "checkout.session.completed":
            await self._handle_checkout_complete(event.data.object, db)
        elif event.type == "customer.subscription.updated":
            await self._handle_subscription_update(event.data.object, db)
        elif event.type == "customer.subscription.deleted":
            await self._handle_subscription_cancel(event.data.object, db)

        return {"event": event.type, "processed": True}

    async def _handle_checkout_complete(self, session, db: AsyncSession):
        """New subscription created."""
        user_id = session.metadata.get("user_id")
        if not user_id:
            return

        sub = stripe.Subscription.retrieve(session.subscription)
        price_id = sub["items"]["data"][0]["price"]["id"]
        tier = PRICE_TO_TIER.get(price_id, "hunter")

        # Update user
        user = await db.get(User, user_id)
        if user:
            user.tier = tier
            user.stripe_customer_id = session.customer

        # Create subscription record
        db_sub = Subscription(
            user_id=user_id,
            stripe_subscription_id=sub.id,
            stripe_price_id=price_id,
            status=sub.status,
            tier=tier,
        )
        db.add(db_sub)

    async def _handle_subscription_update(self, sub, db: AsyncSession):
        """Subscription updated (upgrade/downgrade/renewal)."""
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub.id
            )
        )
        db_sub = result.scalar_one_or_none()
        if db_sub:
            price_id = sub["items"]["data"][0]["price"]["id"]
            db_sub.status = sub.status
            db_sub.tier = PRICE_TO_TIER.get(price_id, db_sub.tier)

            # Sync user tier
            user = await db.get(User, db_sub.user_id)
            if user:
                user.tier = db_sub.tier

    async def _handle_subscription_cancel(self, sub, db: AsyncSession):
        """Subscription canceled."""
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub.id
            )
        )
        db_sub = result.scalar_one_or_none()
        if db_sub:
            db_sub.status = "canceled"
            user = await db.get(User, db_sub.user_id)
            if user:
                user.tier = "ghost"


stripe_service = StripeService()
