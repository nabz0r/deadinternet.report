"""
Scanner endpoints - AI content detection powered by Claude.

POST /api/v1/scanner/scan    -> Analyze a URL (requires Hunter+)
POST /api/v1/scanner/batch   -> Batch analyze URLs (requires Operator, supports API tokens)
GET  /api/v1/scanner/usage   -> Current scan usage
GET  /api/v1/scanner/history  -> Scan history (requires Hunter+)
"""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, HttpUrl, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import require_auth, require_tier, require_tier_with_token
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
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scan failed: {str(e)}")

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
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
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


# ── Bulk Scanning (Operator only, supports API tokens) ───────────────

MAX_BATCH_SIZE = 10
BATCH_CONCURRENCY = 3


class BatchScanRequest(BaseModel):
    """POST /api/v1/scanner/batch"""
    urls: list[HttpUrl] = Field(..., min_length=1, max_length=MAX_BATCH_SIZE)


class BatchScanResultItem(BaseModel):
    """Result for a single URL in a batch."""
    url: str
    status: str  # "success" | "error"
    result: ScanResult | None = None
    error: str | None = None


class BatchScanResponse(BaseModel):
    """Full batch scan response."""
    total: int
    succeeded: int
    failed: int
    results: list[BatchScanResultItem]
    usage: ScanUsage


@router.post("/batch", response_model=BatchScanResponse)
async def batch_scan(
    request: BatchScanRequest,
    user: dict = Depends(require_tier_with_token("operator")),
    db: AsyncSession = Depends(get_db),
):
    """
    Batch-analyze up to 10 URLs. Operator tier only.
    Supports both JWT and API token authentication.
    URLs are processed concurrently (max 3 at a time).
    Each URL counts toward the daily scan limit.
    """
    urls = [str(u) for u in request.urls]

    # Pre-check rate limit for the full batch
    usage = await check_scan_limit(user["id"], user["tier"])
    remaining_after_first = usage["remaining"]
    if remaining_after_first < len(urls) - 1:
        raise HTTPException(
            status_code=429,
            detail=f"Not enough remaining scans. Need {len(urls)}, have {remaining_after_first + 1}",
        )

    # Consume remaining rate limit slots (first one already consumed by check_scan_limit)
    for _ in range(len(urls) - 1):
        await check_scan_limit(user["id"], user["tier"])

    # Scan concurrently with semaphore (analysis only, no DB writes)
    semaphore = asyncio.Semaphore(BATCH_CONCURRENCY)
    scan_outputs: list[tuple[str, dict | None, str | None]] = []

    async def scan_one(url: str) -> tuple[str, dict | None, str | None]:
        async with semaphore:
            try:
                result = await scanner_service.analyze(url)
                return (url, result, None)
            except Exception as e:
                logger.warning(f"Batch scan failed for {url[:80]}: {e}")
                return (url, None, str(e)[:200])

    tasks = [scan_one(url) for url in urls]
    scan_outputs = await asyncio.gather(*tasks)

    # Save successful scans to DB sequentially (avoids session conflicts)
    results: list[BatchScanResultItem] = []
    for url, result, error in scan_outputs:
        if result is not None:
            scan = Scan(user_id=user["id"], url=url, **result)
            db.add(scan)
            await db.flush()
            results.append(BatchScanResultItem(
                url=url,
                status="success",
                result=ScanResult.model_validate(scan),
            ))
        else:
            results.append(BatchScanResultItem(
                url=url,
                status="error",
                error=error,
            ))

    succeeded = sum(1 for r in results if r.status == "success")
    failed = sum(1 for r in results if r.status == "error")

    # Get updated usage
    from app.core.redis import redis_client
    key = f"scan_count:{user['id']}"
    current = await redis_client.get_cached(key)
    used = int(current) if current else 0
    from app.core.rate_limiter import TIER_LIMITS
    limit = TIER_LIMITS.get(user["tier"], 0)

    return BatchScanResponse(
        total=len(urls),
        succeeded=succeeded,
        failed=failed,
        results=list(results),
        usage=ScanUsage(used=used, limit=limit, remaining=max(0, limit - used)),
    )
