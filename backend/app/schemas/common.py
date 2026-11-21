from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")


def get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=get_timestamp)


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    environment: str
    database: dict
    timestamp: str = Field(default_factory=get_timestamp)
