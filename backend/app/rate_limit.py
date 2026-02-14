"""Simple in-memory rate limiter for auth endpoints."""

import time
from collections import defaultdict
from fastapi import HTTPException, Request

# Store: ip -> list of timestamps
_hits: dict[str, list[float]] = defaultdict(list)

# Config
MAX_REQUESTS = 10  # max attempts
WINDOW_SECONDS = 60  # per minute


def _clean(ip: str, now: float):
    cutoff = now - WINDOW_SECONDS
    _hits[ip] = [t for t in _hits[ip] if t > cutoff]


async def rate_limit_auth(request: Request):
    """FastAPI dependency that rate-limits by client IP."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _clean(ip, now)

    if len(_hits[ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute and try again.",
        )
    _hits[ip].append(now)
