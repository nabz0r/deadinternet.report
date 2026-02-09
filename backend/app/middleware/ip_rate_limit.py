"""
IP-based rate limiting middleware for FastAPI.
Complements nginx rate limiting with application-level protection.
Uses Redis sliding window counters per IP.
"""

import time
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Limits: requests per window
IP_RATE_LIMIT = 60  # requests
IP_RATE_WINDOW = 60  # seconds (1 minute)


class IPRateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limiting using Redis counters."""

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and webhooks
        path = request.url.path
        if path in ("/health", "/api/v1/webhooks/stripe"):
            return await call_next(request)

        # Get client IP (trust X-Forwarded-For from nginx)
        client_ip = request.headers.get(
            "x-forwarded-for", request.client.host if request.client else "unknown"
        )
        # Take first IP if multiple proxies
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        key = f"ip_rate:{client_ip}"

        try:
            # Import at call time so tests can swap the module-level singleton
            from app.core.redis import redis_client
            current = await redis_client.increment_daily(key)
        except Exception:
            # If Redis is down, allow the request (fail open)
            return await call_next(request)

        # Set rate limit headers
        remaining = max(0, IP_RATE_LIMIT - current)

        if current > IP_RATE_LIMIT:
            logger.warning(f"IP rate limit exceeded: {client_ip} ({current}/{IP_RATE_LIMIT})")
            return Response(
                content='{"detail":"Too many requests. Please slow down."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "X-RateLimit-Limit": str(IP_RATE_LIMIT),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(IP_RATE_WINDOW),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(IP_RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
