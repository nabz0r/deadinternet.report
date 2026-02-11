"""
deadinternet.report - Backend API

FastAPI application serving:
  - Public stats endpoints (cached)
  - URL scanner (Claude AI powered)
  - User management
  - Stripe webhook handling
  - Health checks
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import redis_client
from app.middleware.ip_rate_limit import IPRateLimitMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware

# CRITICAL: import all models so SQLAlchemy knows about them
# for Base.metadata.create_all() to work
import app.models  # noqa: F401

from app.api.v1 import stats, scanner, users, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    # Startup: create tables (dev only, use alembic in prod)
    if settings.debug:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    # Connect redis
    await redis_client.connect()
    yield
    # Shutdown
    await redis_client.close()
    await engine.dispose()


app = FastAPI(
    title="deadinternet.report API",
    version="0.1.0",
    docs_url="/docs",  # Always available, useful for debugging
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Middleware (order matters: last added = first executed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(IPRateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Routes
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
app.include_router(scanner.router, prefix="/api/v1/scanner", tags=["scanner"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])


@app.get("/health")
async def health_check():
    """Health check for Docker and load balancers. Verifies DB + Redis."""
    checks = {"service": "deadinternet-api"}

    # Check database
    try:
        from sqlalchemy import text
        from app.core.database import get_db_direct
        async with get_db_direct() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"

    # Check Redis
    try:
        pong = await redis_client.ping()
        checks["redis"] = "ok" if pong else "error"
    except Exception:
        checks["redis"] = "error"

    all_ok = checks.get("database") == "ok" and checks.get("redis") == "ok"
    checks["status"] = "healthy" if all_ok else "degraded"

    from fastapi.responses import JSONResponse
    status_code = 200 if all_ok else 503
    return JSONResponse(content=checks, status_code=status_code)
