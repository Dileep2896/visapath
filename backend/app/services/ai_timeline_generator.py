"""AI-powered timeline generator using Google Gemini.

Builds a comprehensive prompt from user input and USCIS rules,
sends it to Gemini for structured JSON, validates the response,
and retries on failure. No hardcoded fallback — the AI is the
sole source of truth for timeline generation.
"""

import asyncio
import json
import logging
import re
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
    BACKLOGGED_COUNTRIES,
)
from app.services.gemini_service import generate_structured_json_async

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

# ---------- valid enum values (must match frontend contract) ----------

VALID_EVENT_TYPES = {"deadline", "milestone", "risk"}
VALID_URGENCY = {"critical", "high", "medium", "low", "none", "passed"}
VALID_SEVERITY = {"critical", "high", "warning", "info"}

# ---------- prompt construction ----------

SYSTEM_INSTRUCTION = """\
You are an expert US immigration timeline planner. You ONLY output valid JSON.
Given a user's immigration profile and reference rules, produce a comprehensive,
personalised timeline of events and risk alerts.

You must be thorough — cover every relevant deadline, milestone, and risk for this
user's specific situation. Do not omit events. Every date must be a real calendar
date in YYYY-MM-DD format. Do not hallucinate rules — use only the reference data
provided. Think step by step about what this user needs to know and when."""


def _build_prompt(user_input: dict) -> str:
    today = date.today()
    country = user_input.get("country", "Rest of World")
    country_cat = get_country_category(country)
    gc_wait = get_green_card_wait(country, "EB-2")

    visa_type = user_input.get("visa_type", "F-1")
    is_stem = user_input.get("is_stem", False)
    degree_level = user_input.get("degree_level", "Master's")
    graduation = user_input.get("expected_graduation") or "not specified"
    program_extended = user_input.get("program_extended", False)
    original_graduation = user_input.get("original_graduation") or "N/A"
    cpt_months = user_input.get("cpt_months_used", 0)
    opt_status = user_input.get("opt_status", "none")
    career_goal = user_input.get("career_goal", "stay_us_longterm")
    h1b_attempts = user_input.get("h1b_attempts", 0)
    unemployment_days = user_input.get("unemployment_days", 0)
    has_job_offer = user_input.get("has_job_offer", False)
    currently_employed = user_input.get("currently_employed", False)

    sections = []

    # --- 1. User profile ---
    sections.append(f"""\
[USER PROFILE]
- Today's date: {today.isoformat()}
- Visa type: {visa_type}
- Degree level: {degree_level}
- STEM: {is_stem}
- Major field: {user_input.get("major_field", "not specified")}
- Program start: {user_input.get("program_start") or "not specified"}
- Expected graduation: {graduation}
- CPT months used (full-time): {cpt_months}
- OPT status: {opt_status}
- Currently employed: {currently_employed}
- Has job offer: {has_job_offer}
- Unemployment days used: {unemployment_days}
- Career goal: {career_goal}
- Country of citizenship: {country} (category: {country_cat})
- Program extended: {program_extended}
- Original graduation: {original_graduation}
- H-1B lottery attempts so far: {h1b_attempts}""")

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
    is_backlogged = country_cat in BACKLOGGED_COUNTRIES
    sections.append(f"""\
[GREEN CARD BACKLOG DATA]
Country category: {country_cat}
Backlogged country: {is_backlogged}
EB wait times for {country_cat}: {json.dumps(EB_WAIT_TIMES.get(country_cat, EB_WAIT_TIMES["Rest of World"]))}
EB-2 estimate: {gc_wait['wait_years_min']}-{gc_wait['wait_years_max']} years ({gc_wait['status']})""")

    # --- 4. H-1B wage-level selection context ---
    sections.append("""\
[H-1B FY2027+ WAGE-LEVEL WEIGHTED SELECTION — effective Feb 27, 2026]
Starting FY2027, USCIS uses wage-level weighted selection instead of random lottery:
- Level I (entry-level): 1 entry → ~48% LOWER selection probability
- Level II (qualified): 2 entries → ~9% lower
- Level III (experienced): 3 entries → ~40% higher
- Level IV (fully competent): 4 entries → ~107% higher (doubled odds)
- Employers must provide SOC code, OEWS wage level, and area of employment
- US Master's cap registrants still get two chances
- If relevant, advise the student to target higher wage-level positions for better lottery odds""")

    # --- 5. Comprehensive timeline generation rules ---
    rules = f"""\
[TIMELINE GENERATION RULES — follow ALL of these strictly]

GENERAL:
1. Generate a COMPLETE timeline with ALL relevant events for this user. Be thorough.
2. Logical ordering: program start → graduation → OPT application → OPT start → STEM OPT → H-1B → green card.
3. Every event MUST have a unique id, a real YYYY-MM-DD date, type, urgency, description (2-4 sentences), and at least 2-3 action_items.
4. Mark events whose date < today with is_past: true.
5. Urgency mapping: <= 7 days = "critical", <= 30 days = "high", <= 90 days = "medium", > 90 days = "low", past = "passed".
6. Include the program start date as a milestone (is_past: true if in the past).

GRADUATION & PROGRAM EXTENSION:
7. If program_extended is true: show "Original Graduation Date (Before Extension)" as a past milestone with original_graduation date, AND "New Expected Graduation (Extended)" with expected_graduation date. Clearly state that ALL OPT deadlines use the NEW date and OPT duration (12mo + STEM 24mo) is NOT reduced.
8. If program_extended is false: show "Expected Graduation" with expected_graduation date.
9. In graduation event description, note that key immigration deadlines are calculated from this date.

CPT:
10. If cpt_months_used >= 12: add a CRITICAL risk event AND risk alert — user is INELIGIBLE for OPT. Skip all OPT events. Suggest direct H-1B or alternative pathways.
11. If cpt_months_used >= 9 but < 12: add a WARNING risk alert about approaching the 12-month OPT ineligibility threshold.
12. If cpt_months_used > 0 and user is currently employed on CPT, mention that converting CPT to full-time counts toward the 12-month limit and could affect OPT eligibility. Include action items about tracking CPT months carefully.

OPT APPLICATION:
13. OPT application window opens 90 days BEFORE graduation. Include this as a deadline event with specific action items (I-765, DSO recommendation, photos, I-94, copies).
14. "Recommended OPT Application Date" = about 75-80 days before graduation (apply ASAP after window opens).
15. OPT application DEADLINE = 60 days AFTER graduation. Mark as CRITICAL. Missing this = losing OPT entirely.
16. Skip OPT application events if opt_status is "applied" or "active". If "applied", add a "pending" milestone.

OPT PERIOD:
17. OPT starts the day after graduation (12-month period). Note 90-day unemployment limit.
18. OPT expires 12 months after graduation. Mark as critical deadline.
19. If unemployed, track unemployment days: max {OPT_RULES["unemployment_limit_days"]} days for regular OPT, {STEM_OPT_RULES["unemployment_limit_days"]} days for STEM OPT.
20. Add unemployment warning events if unemployment_days > 0.

STEM OPT:
21. Skip STEM OPT entirely if is_stem is false.
22. STEM OPT application deadline = the OPT expiration date (must file BEFORE OPT expires).
23. Recommend applying at least 90 days before OPT expires.
24. STEM OPT = 24 additional months. Employer MUST be E-Verify registered.
25. STEM OPT expiration = 36 months total after graduation.

H-1B LOTTERY:
26. Skip H-1B events if career_goal is "return_home".
27. Do NOT include H-1B events if graduation is more than 6 months from today — too early.
28. Include at most ONE upcoming H-1B lottery cycle (the next March registration after today).
29. H-1B registration period: March 1-31 each year. Results: ~April 1. Start date: October 1.
30. FY label = year + 1 (e.g., March 2026 registration = FY2027).
31. If registration occurs BEFORE graduation: explain that employer CAN register before graduation, and if selected the student graduates → starts OPT → transitions to H-1B Oct 1 via cap-gap extension.
32. For Master's/PhD: note dual lottery advantage (advanced degree + regular cap).
33. If h1b_attempts > 0: note this is attempt #{h1b_attempts + 1} and each lottery is independent (~25-30%).
34. If h1b_attempts >= 3: add a milestone suggesting alternative pathways (EB-1A, O-1, L-1, EB-2 NIW).
35. Include the new FY2027+ wage-level weighted selection context — advise targeting higher wage levels.

CAP-GAP:
36. If student has pending/approved H-1B with Oct 1 start and OPT is expiring: mention cap-gap automatic extension April 1 to October 1.

GREEN CARD:
37. Skip green card events if career_goal is "return_home".
38. Estimate green card process start ~2 years after graduation.
39. Include country-specific wait time information. For backlogged countries (India, China), emphasize the long wait and suggest EB-1/O-1 alternatives.

JOB SEARCH:
40. If no job offer and graduation is 3-6 months away: add "Begin Job Search" milestone with networking/application action items.
41. If no job offer and on active OPT: add job search urgency milestone.
42. If has job offer: add "Employer H-1B Preparation" milestone.

RISK ALERTS (separate from timeline events):
43. Only include risks that ACTUALLY apply to this user's current profile. Be specific, not generic.
44. Always include: country backlog risk (if backlogged), H-1B lottery uncertainty (if applicable), CPT overuse (if near limit).
45. If program_extended: add risk about needing updated I-20.
46. If on OPT and unemployed: add unemployment tracking risk.
47. If h1b_attempts >= 3: add multiple lottery failure risk.
48. If no job offer and OPT ending within 120 days: add critical/high no-job-offer risk.
49. If non-STEM and career_goal is stay_us_longterm: add risk about limited OPT period and single H-1B lottery window."""

    sections.append(rules)

    # --- 6. Output schema ---
    sections.append("""\
[OUTPUT JSON SCHEMA — follow exactly]
{
  "timeline_events": [
    {
      "id": "<unique_snake_case_string>",
      "title": "<short descriptive title>",
      "date": "YYYY-MM-DD",
      "type": "deadline" | "milestone" | "risk",
      "urgency": "critical" | "high" | "medium" | "low" | "none" | "passed",
      "description": "<2-4 sentence explanation, personalized to this user>",
      "action_items": ["<specific actionable step>", "<another step>", ...],
      "is_past": true | false
    }
  ],
  "risk_alerts": [
    {
      "type": "<risk_id_string>",
      "severity": "critical" | "high" | "warning" | "info",
      "message": "<specific explanation of the risk for THIS user>",
      "recommendation": "<specific actions the user should take>"
    }
  ]
}

Return ONLY this JSON object — no markdown, no commentary.
Generate at LEAST 8-12 timeline events for a typical F-1 student. Be comprehensive.""")

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

def _is_rate_limit_error(exc: Exception) -> bool:
    """Check if an exception is a 429 rate-limit error."""
    return "429" in str(exc) or "ResourceExhausted" in type(exc).__name__


def _parse_retry_delay(exc: Exception) -> float:
    """Extract retry delay from a Gemini 429 error, default to 60s."""
    match = re.search(r"retry in ([\d.]+)s", str(exc))
    if match:
        return min(float(match.group(1)), 120.0)
    return 60.0


async def generate_ai_timeline(user_input: dict) -> dict:
    """Generate a context-aware timeline using Gemini.

    Retries up to MAX_RETRIES times on validation failure.
    Rate-limit errors (429) fail immediately — the Gemini free-tier
    limit is daily, so sleeping won't help.
    Raises on complete failure so the caller can show an error.
    """
    prompt = _build_prompt(user_input)
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = await generate_structured_json_async(prompt, SYSTEM_INSTRUCTION)
            result = _validate_response(raw)
            if result is not None:
                logger.info(
                    "AI timeline generated (attempt %d): %d events, %d risks",
                    attempt,
                    len(result["timeline_events"]),
                    len(result["risk_alerts"]),
                )
                return result
            logger.warning("Gemini returned invalid JSON (attempt %d) — retrying", attempt)
            last_error = "Invalid response structure from AI"
        except Exception as e:
            logger.exception("AI timeline generation failed (attempt %d)", attempt)
            last_error = str(e)

            # Rate-limit errors: fail fast — daily quota won't reset by retrying
            if _is_rate_limit_error(e):
                logger.warning("Rate limited — failing immediately (daily limit)")
                break

    # All retries exhausted — raise with a user-friendly message
    logger.error("AI timeline generation failed after %d attempts", MAX_RETRIES)
    if last_error and ("429" in last_error or "ResourceExhausted" in last_error):
        raise RuntimeError(
            "AI rate limit reached (20 requests/day on free tier). "
            "Please wait and try again."
        )
    raise RuntimeError(f"Timeline generation failed: {last_error}")
