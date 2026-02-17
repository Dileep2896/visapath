"""Authentication service: password hashing and JWT token management."""

import os
import re
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable is required")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def validate_email(email: str) -> bool:
    """Validate email format."""
    return bool(EMAIL_RE.match(email))


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_token(user_id: int) -> str:
    """Create a JWT token for a user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "exp": now + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": now,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload["sub"] = int(payload["sub"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError, KeyError):
        return None


def register_user(email: str, password: str) -> dict:
    """Register a new user. Returns user dict with token."""
    from app.database import create_user, get_user_by_email

    if not validate_email(email):
        raise ValueError("Invalid email format")

    existing = get_user_by_email(email)
    if existing:
        raise ValueError("Email already registered")

    pw_hash = hash_password(password)
    try:
        user = create_user(email, pw_hash)
    except Exception as e:
        # Handle race condition: concurrent registration with same email
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise ValueError("Email already registered")
        raise
    token = create_token(user["id"])
    return {"id": user["id"], "email": user["email"], "token": token}


def login_user(email: str, password: str) -> dict:
    """Login a user. Returns user dict with token."""
    from app.database import get_user_by_email

    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password")

    token = create_token(user["id"])
    return {"id": user["id"], "email": user["email"], "token": token, "is_admin": bool(user.get("is_admin"))}
