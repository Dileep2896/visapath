"""Timeline generation API route."""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_timeline_generator import generate_ai_timeline
from app.ai_rate_limit import (
    check_ai_rate_limit,
    record_ai_request,
    get_ai_rate_status,
    mark_exhausted,
    AIRateLimitExceeded,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/rate-limit-status")
async def rate_limit_status():
    """Return current AI usage so the frontend can pre-check."""
    return get_ai_rate_status()


class TimelineRequest(BaseModel):
    visa_type: str
    degree_level: str = "Master's"
    is_stem: bool = False
    program_start: str | None = None
    expected_graduation: str | None = None
    cpt_months_used: int = 0
    currently_employed: bool = False
    career_goal: str = "stay_us_longterm"
    country: str = "Rest of World"
    # Enhanced fields
    major_field: str = ""
    opt_status: str = "none"  # "none" | "applied" | "active" | "expired"
    program_extended: bool = False
    original_graduation: str = ""
    h1b_attempts: int = 0
    unemployment_days: int = 0
    has_job_offer: bool = False


@router.post("/generate-timeline")
async def create_timeline(request: TimelineRequest):
    # Fast-fail if we already know we're rate-limited
    try:
        check_ai_rate_limit()
    except AIRateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))

    user_input = request.model_dump()

    try:
        result = await generate_ai_timeline(user_input)
        record_ai_request()
    except Exception as e:
        logger.exception("Timeline generation failed")
        detail = str(e)
        if "rate limit" in detail.lower() or "429" in detail:
            mark_exhausted()
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached (20 requests/day on free tier). Please wait and try again.",
            )
        raise HTTPException(status_code=502, detail="AI timeline generation failed. Please try again.")

    timeline_events = result["timeline_events"]
    risk_alerts = result["risk_alerts"]

    # Determine current status
    current_status = {
        "visa": request.visa_type,
        "work_auth": _get_work_auth(request.visa_type),
    }

    # Find next upcoming deadline
    from datetime import date
    today = date.today()
    upcoming = [
        e for e in timeline_events
        if e["type"] == "deadline" and not e.get("is_past", False)
    ]
    if upcoming:
        next_deadline = upcoming[0]
        days_until = (date.fromisoformat(next_deadline["date"]) - today).days
        current_status["days_until_next_deadline"] = days_until
        current_status["next_deadline"] = next_deadline["title"]

    return {
        "timeline_events": timeline_events,
        "risk_alerts": risk_alerts,
        "current_status": current_status,
    }


def _get_work_auth(visa_type: str) -> str:
    """Map visa type to current work authorization."""
    mapping = {
        "F-1": "Student (CPT/On-Campus)",
        "OPT": "OPT EAD",
        "H-1B": "H-1B Employment",
        "H-4": "H-4 (limited)",
        "J-1": "Academic Training",
        "L-1": "L-1 Employment",
    }
    return mapping.get(visa_type, visa_type)
