"""
JWT validation for requests coming from NextAuth.js frontend.
We don't issue tokens here - NextAuth handles that.
We only verify them to protect API endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

security = HTTPBearer(auto_error=False)


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
