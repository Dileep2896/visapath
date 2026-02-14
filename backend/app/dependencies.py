"""FastAPI dependencies for authentication."""

from fastapi import Header, HTTPException
from app.services.auth_service import decode_token
from app.database import get_user_by_id


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Extract and validate Bearer token, return user dict."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Strip "Bearer "
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
