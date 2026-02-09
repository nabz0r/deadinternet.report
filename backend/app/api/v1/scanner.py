"""
Scanner endpoints - AI content detection powered by Claude.

POST /api/v1/scanner/scan    -> Analyze a URL (requires Hunter+)
GET  /api/v1/scanner/usage   -> Current scan usage
GET  /api/v1/scanner/history  -> Scan history (requires Hunter+)
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Annotated

from app.core.database import get_db
from app.core.security import require_auth, require_tier
from app.core.rate_limiter import check_scan_limit
from app.services.scanner_service import scanner_service
from app.models.scan import Scan
from app.schemas.scan import ScanRequest, ScanResponse, ScanResult, ScanUsage

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
async def scan_url(
    request: ScanRequest,
    user: dict = Depends(require_tier("hunter")),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a URL for AI-generated content. Requires Hunter tier+."""
    # Check rate limit
    usage = await check_scan_limit(user["id"], user["tier"])

    # Run analysis
    try:
        result = await scanner_service.analyze(str(request.url))
    except ValueError as e:
        # Validation errors (SSRF, bad URL) — safe to show
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # All other errors — generic message, log details server-side
        logger.exception("Scan failed for URL: %s", str(request.url)[:200])
        raise HTTPException(status_code=502, detail="Scan failed. The URL may be unreachable or content could not be analyzed.")

    # Save to DB
    scan = Scan(
        user_id=user["id"],
        url=str(request.url),
        **result,
    )
    db.add(scan)
    await db.flush()

    return ScanResponse(
        result=ScanResult.model_validate(scan),
        usage=ScanUsage(**usage),
    )


@router.get("/usage")
async def get_usage(user: dict = Depends(require_auth)):
    """Get current scan usage for the day."""
    from app.core.redis import redis_client
    key = f"scan_count:{user['id']}"
    current = await redis_client.get_cached(key)
    used = int(current) if current else 0
    from app.core.rate_limiter import TIER_LIMITS
    limit = TIER_LIMITS.get(user["tier"], 0)
    return {"used": used, "limit": limit, "remaining": max(0, limit - used)}


@router.get("/history")
async def get_history(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    user: dict = Depends(require_tier("hunter")),
    db: AsyncSession = Depends(get_db),
):
    """Get scan history. Requires Hunter tier+."""
    result = await db.execute(
        select(Scan)
        .where(Scan.user_id == user["id"])
        .order_by(Scan.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    scans = result.scalars().all()

    # Total count
    count_result = await db.execute(
        select(func.count(Scan.id)).where(Scan.user_id == user["id"])
    )
    total = count_result.scalar()

    return {
        "scans": [ScanResult.model_validate(s) for s in scans],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
