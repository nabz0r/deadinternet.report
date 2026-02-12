"""
JWT validation for requests coming from NextAuth.js frontend,
plus API token authentication for Operator-tier programmatic access.
"""

import hashlib
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import secrets as _secrets
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

security = HTTPBearer(auto_error=False)

# ── Token hashing ────────────────────────────────────────────────────

def hash_token(raw_token: str) -> str:
    """SHA-256 hash a raw API token for storage/lookup."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ── User resolution from API token ───────────────────────────────────

async def _resolve_api_token(token: str, db: AsyncSession) -> dict | None:
    """Look up an API token and return user info if valid."""
    from app.models.api_token import ApiToken
    from app.models.user import User

    token_hash = hash_token(token)
    result = await db.execute(
        select(ApiToken).where(
            ApiToken.token_hash == token_hash,
            ApiToken.revoked == False,  # noqa: E712
        )
    )
    api_token = result.scalar_one_or_none()
    if not api_token:
        return None

    user = await db.get(User, api_token.user_id)
    if not user:
        return None

    # Update last_used_at
    api_token.last_used_at = datetime.now(timezone.utc)
    await db.flush()

    return {
        "id": user.id,
        "email": user.email,
        "tier": user.tier,
        "via_api_token": True,
    }


# ── Auth dependencies ────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """
    Extract user info from JWT token.
    Returns None for unauthenticated requests (public endpoints).
    """
    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={
                "require_sub": True,
                "require_exp": True,
            },
        )

        sub = payload.get("sub")
        email = payload.get("email")
        if not sub or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing required claims",
            )

        return {
            "id": sub,
            "email": email,
            "tier": payload.get("tier", "ghost"),
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user_or_api_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """
    Resolve user from JWT or API token.
    Tries JWT first; if that fails, tries API token lookup.
    Returns None for unauthenticated requests.
    """
    if not credentials:
        return None

    token = credentials.credentials

    # Try JWT first
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require_sub": True, "require_exp": True},
        )
        sub = payload.get("sub")
        email = payload.get("email")
        if sub and email:
            return {
                "id": sub,
                "email": email,
                "tier": payload.get("tier", "ghost"),
            }
    except JWTError:
        pass

    # Try API token
    from app.core.database import get_db_direct
    async with get_db_direct() as db:
        user = await _resolve_api_token(token, db)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )


async def require_auth(
    user: dict | None = Depends(get_current_user),
) -> dict:
    """Dependency: requires authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


async def require_auth_or_token(
    user: dict | None = Depends(get_current_user_or_api_token),
) -> dict:
    """Dependency: requires authenticated user via JWT or API token."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def require_tier(min_tier: str):
    """Dependency factory: requires minimum subscription tier."""
    tier_levels = {"ghost": 0, "hunter": 1, "operator": 2}

    async def check_tier(user: dict = Depends(require_auth)) -> dict:
        user_level = tier_levels.get(user.get("tier", "ghost"), 0)
        required_level = tier_levels.get(min_tier, 0)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {min_tier} tier or above",
            )
        return user

    return check_tier


def require_tier_with_token(min_tier: str):
    """Dependency factory: requires minimum tier, accepts API tokens too."""
    tier_levels = {"ghost": 0, "hunter": 1, "operator": 2}

    async def check_tier(user: dict = Depends(require_auth_or_token)) -> dict:
        user_level = tier_levels.get(user.get("tier", "ghost"), 0)
        required_level = tier_levels.get(min_tier, 0)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {min_tier} tier or above",
            )
        return user

    return check_tier


async def require_internal(
    x_internal_secret: str | None = Header(None),
) -> dict:
    """
    Dependency: requires X-Internal-Secret header.
    Used for server-to-server calls (cron jobs, aggregation triggers).
    """
    if not x_internal_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing internal auth",
        )
    if not _secrets.compare_digest(x_internal_secret, settings.internal_api_secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal auth",
        )
    return {"internal": True}
