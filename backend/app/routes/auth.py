"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.auth_service import register_user, login_user, validate_email
from app.dependencies import get_current_user, get_admin_user
from app.database import (
    save_timeline, get_user_timelines, save_user_profile,
    save_cached_timeline, save_cached_tax_guide, get_all_users,
    delete_user, update_user_credits, update_user_email, update_user_credit_limit,
    update_user_created_at,
)
from app.rate_limit import rate_limit_auth

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


class SaveTimelineRequest(BaseModel):
    user_input: dict
    timeline_response: dict


class SaveProfileRequest(BaseModel):
    profile: dict


@router.post("/auth/register", status_code=201, dependencies=[Depends(rate_limit_auth)])
async def register(request: AuthRequest):
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isdigit() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not any(c.isalpha() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one letter")
    try:
        result = register_user(request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/login", dependencies=[Depends(rate_limit_auth)])
async def login(request: AuthRequest):
    try:
        result = login_user(request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "profile": user.get("profile"),
        "cached_timeline": user.get("cached_timeline"),
        "cached_tax_guide": user.get("cached_tax_guide"),
        "credits_used": user.get("credits_used", 0) or 0,
        "is_admin": bool(user.get("is_admin")),
    }


@router.put("/auth/profile")
async def update_profile(
    request: SaveProfileRequest,
    user: dict = Depends(get_current_user),
):
    save_user_profile(user["id"], request.profile)
    return {"status": "ok"}


class CachedTimelineRequest(BaseModel):
    timeline_response: dict


@router.put("/auth/cached-timeline")
async def update_cached_timeline(
    request: CachedTimelineRequest,
    user: dict = Depends(get_current_user),
):
    save_cached_timeline(user["id"], request.timeline_response)
    return {"status": "ok"}


class CachedTaxGuideRequest(BaseModel):
    tax_guide: dict


@router.put("/auth/cached-tax-guide")
async def update_cached_tax_guide(
    request: CachedTaxGuideRequest,
    user: dict = Depends(get_current_user),
):
    save_cached_tax_guide(user["id"], request.tax_guide)
    return {"status": "ok"}


@router.post("/auth/save-timeline")
async def save_user_timeline(
    request: SaveTimelineRequest,
    user: dict = Depends(get_current_user),
):
    result = save_timeline(user["id"], request.user_input, request.timeline_response)
    return result


@router.get("/auth/my-timelines")
async def my_timelines(user: dict = Depends(get_current_user)):
    timelines = get_user_timelines(user["id"])
    return {"timelines": timelines}


@router.get("/admin/users")
async def admin_list_users(user: dict = Depends(get_admin_user)):
    """List all users (admin only)."""
    users = get_all_users()
    return {"users": users, "total": len(users)}


class UpdateCreditsRequest(BaseModel):
    credits_used: int


class UpdateCreditLimitRequest(BaseModel):
    credit_limit: int


class UpdateEmailRequest(BaseModel):
    email: str


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, user: dict = Depends(get_admin_user)):
    """Delete a user (admin only). Cannot delete self."""
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.put("/admin/users/{user_id}/credits")
async def admin_update_credits(
    user_id: int,
    request: UpdateCreditsRequest,
    user: dict = Depends(get_admin_user),
):
    """Set credits_used for a user (admin only)."""
    updated = update_user_credits(user_id, request.credits_used)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.put("/admin/users/{user_id}/limit")
async def admin_update_credit_limit(
    user_id: int,
    request: UpdateCreditLimitRequest,
    user: dict = Depends(get_admin_user),
):
    """Set credit_limit for a user (admin only)."""
    if request.credit_limit < 0:
        raise HTTPException(status_code=400, detail="Credit limit must be non-negative")
    updated = update_user_credit_limit(user_id, request.credit_limit)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: int,
    request: UpdateEmailRequest,
    user: dict = Depends(get_admin_user),
):
    """Update a user's email (admin only)."""
    updated = update_user_email(user_id, request.email)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


class UpdateCreatedAtRequest(BaseModel):
    created_at: str


@router.put("/admin/users/{user_id}/created-at")
async def admin_update_created_at(
    user_id: int,
    request: UpdateCreatedAtRequest,
    user: dict = Depends(get_admin_user),
):
    """Set created_at for a user (admin only)."""
    updated = update_user_created_at(user_id, request.created_at)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}
