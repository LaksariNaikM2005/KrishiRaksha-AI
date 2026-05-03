"""Shared serialization helpers for API responses."""

from datetime import datetime
from typing import Optional, Any


def optional_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    return float(value)


def optional_isoformat(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat()