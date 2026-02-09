"""
Webhook endpoints - Stripe event processing.

POST /api/v1/webhooks/stripe  -> Stripe webhook receiver
"""

import logging
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.stripe_service import stripe_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stripe webhook receiver.
    Verifies signature and processes subscription events.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        result = await stripe_service.handle_webhook_event(payload, sig_header, db)
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception:
        # Log full error server-side, return generic message to caller
        logger.exception("Stripe webhook processing failed")
        raise HTTPException(status_code=400, detail="Webhook processing failed")
