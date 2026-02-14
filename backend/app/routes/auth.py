"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.auth_service import register_user, login_user, validate_email
from app.dependencies import get_current_user
from app.database import save_timeline, get_user_timelines, save_user_profile, save_cached_timeline, save_cached_tax_guide
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


@router.post("/auth/register", dependencies=[Depends(rate_limit_auth)])
async def register(request: AuthRequest):
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
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
