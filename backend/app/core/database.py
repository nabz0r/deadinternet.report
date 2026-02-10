"""
Async SQLAlchemy setup with PostgreSQL.
Uses asyncpg driver for non-blocking DB operations.
"""

from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,      # Detect stale connections before use
    pool_recycle=3600,        # Recycle connections after 1 hour
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


@asynccontextmanager
async def get_db_direct():
    """Context manager: yields an async DB session (non-dependency use)."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_db() -> AsyncSession:
    """Dependency: yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
