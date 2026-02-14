"""AI-powered timeline generator using Google Gemini.

Builds a context-aware prompt from user input and USCIS rules,
sends it to Gemini for structured JSON, validates the response,
and falls back to the hardcoded generator on any failure.
"""

import json
import logging
from datetime import date

from app.data.immigration_rules import (
    OPT_RULES,
    STEM_OPT_RULES,
    H1B_RULES,
    CAP_GAP_RULES,
    CPT_RULES,
    F1_RULES,
    PROCESSING_TIMES,
)
from app.data.country_backlogs import (
    EB_WAIT_TIMES,
    get_green_card_wait,
    get_country_category,
)
from app.services.gemini_service import generate_structured_json_async
from app.services.timeline_generator import generate_timeline
from app.services.risk_analyzer import analyze_risks

logger = logging.getLogger(__name__)

# ---------- valid enum values (must match frontend contract) ----------

VALID_EVENT_TYPES = {"deadline", "milestone", "risk"}
VALID_URGENCY = {"critical", "high", "medium", "low", "none", "passed"}
VALID_SEVERITY = {"critical", "high", "warning", "info"}

# ---------- prompt construction ----------

SYSTEM_INSTRUCTION = """\
You are an expert US immigration timeline planner. You ONLY output valid JSON.
Given a user's immigration profile and reference rules, produce a personalised
timeline of events and risk alerts. Every date you output must be a real
calendar date in YYYY-MM-DD format. Do not hallucinate rules — use only the
reference data provided."""


def _build_prompt(user_input: dict) -> str:
    today = date.today()
    country_cat = get_country_category(user_input.get("country", "Rest of World"))
    gc_wait = get_green_card_wait(user_input.get("country", "Rest of World"), "EB-2")

    sections = []

    # --- 1. User profile ---
    sections.append(f"""\
[USER PROFILE]
- Today's date: {today.isoformat()}
- Visa type: {user_input.get("visa_type")}
- Degree level: {user_input.get("degree_level", "Master's")}
- STEM: {user_input.get("is_stem", False)}
- Major field: {user_input.get("major_field", "not specified")}
- Program start: {user_input.get("program_start") or "not specified"}
- Expected graduation: {user_input.get("expected_graduation") or "not specified"}
- CPT months used (full-time): {user_input.get("cpt_months_used", 0)}
- OPT status: {user_input.get("opt_status", "none")}
- Currently employed: {user_input.get("currently_employed", False)}
- Has job offer: {user_input.get("has_job_offer", False)}
- Unemployment days used: {user_input.get("unemployment_days", 0)}
- Career goal: {user_input.get("career_goal", "stay_us_longterm")}
- Country of citizenship: {user_input.get("country", "Rest of World")} (category: {country_cat})
- Program extended: {user_input.get("program_extended", False)}
- Original graduation: {user_input.get("original_graduation") or "N/A"}
- H-1B lottery attempts so far: {user_input.get("h1b_attempts", 0)}""")

    # --- 2. USCIS reference rules ---
    sections.append(f"""\
[USCIS REFERENCE RULES — use these numbers exactly]
OPT: {json.dumps(OPT_RULES)}
STEM OPT: {json.dumps(STEM_OPT_RULES)}
CPT: {json.dumps(CPT_RULES)}
H-1B: {json.dumps(H1B_RULES)}
Cap-Gap: {json.dumps(CAP_GAP_RULES)}
F-1 General: {json.dumps(F1_RULES)}
Processing times (months): {json.dumps(PROCESSING_TIMES)}""")

    # --- 3. Country backlog data ---
    sections.append(f"""\
[GREEN CARD BACKLOG DATA]
Country category: {country_cat}
EB wait times for {country_cat}: {json.dumps(EB_WAIT_TIMES.get(country_cat, EB_WAIT_TIMES["Rest of World"]))}""")

    # --- 4. Sequencing & filtering rules ---
    sections.append("""\
[SEQUENCING & FILTERING RULES — follow strictly]
1. Logical order: graduation → OPT application → OPT start → STEM OPT (if eligible) → H-1B lottery → H-1B start → green card.
2. Skip STEM OPT events entirely if is_stem is false.
3. Skip H-1B and green card events if career_goal is "return_home".
4. If cpt_months_used >= 12, the user is INELIGIBLE for OPT — skip all OPT events and add a critical risk alert.
5. If visa_type is "H-1B", skip OPT events — the user is past that stage.
6. If visa_type is "OPT" and opt_status is "active", skip the OPT application events — the user already has OPT.
7. If opt_status is "applied", skip OPT application window events but include a "pending" milestone.
8. Include at most one upcoming H-1B lottery cycle (the next one after today).
9. Mark events whose date is before today with is_past: true.
10. Every event MUST have a unique id string, a real YYYY-MM-DD date, and at least one action_items entry.
11. For risk_alerts: include only risks that actually apply to this user's current situation. Do not include generic informational risks that don't match the profile.""")

    # --- 5. Output schema ---
    sections.append("""\
[OUTPUT JSON SCHEMA — follow exactly]
{
  "timeline_events": [
    {
      "id": "<unique_string>",
      "title": "<short descriptive title>",
      "date": "YYYY-MM-DD",
      "type": "deadline" | "milestone" | "risk",
      "urgency": "critical" | "high" | "medium" | "low" | "none" | "passed",
      "description": "<1-3 sentence explanation>",
      "action_items": ["<actionable step>", ...],
      "is_past": true | false
    }
  ],
  "risk_alerts": [
    {
      "type": "<risk_id_string>",
      "severity": "critical" | "high" | "warning" | "info",
      "message": "<explanation of the risk>",
      "recommendation": "<what the user should do>"
    }
  ]
}

Return ONLY this JSON object — no markdown, no commentary.""")

    return "\n\n".join(sections)


# ---------- validation ----------

def _validate_event(event: dict, today: date) -> dict | None:
    """Validate and coerce a single timeline event. Returns None if invalid."""
    if not isinstance(event, dict):
        return None

    # Required fields
    for field in ("id", "title", "date", "type", "urgency", "description"):
        if field not in event or not event[field]:
            return None

    # Validate date
    try:
        event_date = date.fromisoformat(event["date"])
    except (ValueError, TypeError):
        return None

    # Coerce enums
    if event["type"] not in VALID_EVENT_TYPES:
        event["type"] = "milestone"
    if event["urgency"] not in VALID_URGENCY:
        event["urgency"] = "medium"

    # Ensure action_items is a list of strings
    items = event.get("action_items")
    if not isinstance(items, list):
        event["action_items"] = []
    else:
        event["action_items"] = [str(i) for i in items if i]

    # Recalculate is_past from today's date (don't trust the model)
    event["is_past"] = event_date < today

    return event


def _validate_risk(risk: dict) -> dict | None:
    """Validate a single risk alert. Returns None if invalid."""
    if not isinstance(risk, dict):
        return None
    for field in ("type", "severity", "message", "recommendation"):
        if field not in risk or not risk[field]:
            return None
    if risk["severity"] not in VALID_SEVERITY:
        risk["severity"] = "info"
    return risk


def _validate_response(data: dict) -> dict | None:
    """Validate the full Gemini response. Returns cleaned data or None."""
    if not isinstance(data, dict):
        return None

    today = date.today()

    raw_events = data.get("timeline_events")
    if not isinstance(raw_events, list):
        return None

    events = [e for e in (
        _validate_event(ev, today) for ev in raw_events
    ) if e is not None]

    if not events:
        return None

    raw_risks = data.get("risk_alerts")
    if not isinstance(raw_risks, list):
        raw_risks = []
    risks = [r for r in (_validate_risk(r) for r in raw_risks) if r is not None]

    # Sort events by date, risks by severity
    events.sort(key=lambda e: e["date"])
    severity_order = {"critical": 0, "high": 1, "warning": 2, "info": 3}
    risks.sort(key=lambda r: severity_order.get(r["severity"], 99))

    return {"timeline_events": events, "risk_alerts": risks}


# ---------- public entry point ----------

async def generate_ai_timeline(user_input: dict) -> dict:
    """Generate a context-aware timeline using Gemini.

    Falls back to the hardcoded generator on any failure.
    """
    try:
        prompt = _build_prompt(user_input)
        raw = await generate_structured_json_async(prompt, SYSTEM_INSTRUCTION)
        result = _validate_response(raw)
        if result is None:
            logger.warning("Gemini returned invalid timeline JSON — falling back")
            return _fallback(user_input)
        logger.info(
            "AI timeline generated: %d events, %d risks",
            len(result["timeline_events"]),
            len(result["risk_alerts"]),
        )
        return result
    except Exception:
        logger.exception("AI timeline generation failed — falling back")
        return _fallback(user_input)


def _fallback(user_input: dict) -> dict:
    """Use the hardcoded timeline generator as fallback."""
    timeline_events = generate_timeline(user_input)
    risk_alerts = analyze_risks(user_input, timeline_events)
    return {"timeline_events": timeline_events, "risk_alerts": risk_alerts}
