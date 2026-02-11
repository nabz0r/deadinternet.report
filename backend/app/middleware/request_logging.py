"""
Structured request logging middleware for FastAPI.
Logs method, path, status code, and duration for every request.
Skips noisy health-check endpoints to reduce log volume.
"""

import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

logger = logging.getLogger("app.requests")

# Paths to skip logging (high-frequency, low-value)
SKIP_PATHS = frozenset({"/health", "/favicon.ico"})


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with method, path, status, and duration."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in SKIP_PATHS:
            return await call_next(request)

        method = request.method
        start = time.monotonic()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.error(
                "%s %s 500 %dms [unhandled exception]",
                method,
                path,
                duration_ms,
            )
            raise

        duration_ms = int((time.monotonic() - start) * 1000)
        status = response.status_code

        if status >= 500:
            logger.error("%s %s %d %dms", method, path, status, duration_ms)
        elif status >= 400:
            logger.warning("%s %s %d %dms", method, path, status, duration_ms)
        else:
            logger.info("%s %s %d %dms", method, path, status, duration_ms)

        response.headers["X-Request-Duration-Ms"] = str(duration_ms)
        return response
