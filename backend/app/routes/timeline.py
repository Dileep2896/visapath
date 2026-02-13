"""Timeline generation API route."""

from fastapi import APIRouter
from pydantic import BaseModel
from app.services.timeline_generator import generate_timeline
from app.services.risk_analyzer import analyze_risks

router = APIRouter()


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


@router.post("/generate-timeline")
async def create_timeline(request: TimelineRequest):
    user_input = request.model_dump()

    timeline_events = generate_timeline(user_input)
    risk_alerts = analyze_risks(user_input, timeline_events)

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
