from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

from config import settings

# Fix for Render postgres:// URL
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with appropriate settings and connection timeout
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # PostgreSQL connection with timeout
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args={
            "connect_timeout": 10,  # 10 second timeout
            "keepalives": 1,
            "keepalives_idle": 30
        }
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)

def drop_db() -> None:
    """Drop all tables (use with caution)"""
    Base.metadata.drop_all(bind=engine)