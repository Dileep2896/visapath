"""Core timeline generation engine.

Takes user input and calculates all relevant immigration dates, deadlines,
and milestones based on USCIS rules.
"""

from datetime import date, timedelta
from app.data.immigration_rules import (
    OPT_RULES,
    STEM_OPT_RULES,
    H1B_RULES,
    CAP_GAP_RULES,
    CPT_RULES,
)
from app.data.country_backlogs import get_green_card_wait, get_country_category


def generate_timeline(user_input: dict) -> list[dict]:
    """Generate a personalized immigration timeline based on user input."""
    events = []
    today = date.today()

    visa_type = user_input["visa_type"]
    degree_level = user_input.get("degree_level", "Master's")
    is_stem = user_input.get("is_stem", False)
    program_start = _parse_date(user_input.get("program_start"))
    graduation = _parse_date(user_input.get("expected_graduation"))
    cpt_months = user_input.get("cpt_months_used", 0)
    career_goal = user_input.get("career_goal", "stay_us_longterm")
    country = user_input.get("country", "Rest of World")

    if visa_type == "F-1":
        events.extend(_f1_timeline(
            today, graduation, program_start, is_stem, degree_level,
            cpt_months, career_goal, country
        ))
    elif visa_type == "OPT":
        events.extend(_opt_timeline(
            today, graduation, is_stem, degree_level, career_goal, country
        ))
    elif visa_type == "H-1B":
        events.extend(_h1b_timeline(today, career_goal, country))

    # Add program milestones
    if program_start and program_start > today:
        events.append(_event(
            "program_start", "Program Start Date", program_start,
            "milestone", "none",
            "Your academic program begins."
        ))

    if graduation:
        urgency = _deadline_urgency(today, graduation)
        events.append(_event(
            "graduation", "Expected Graduation", graduation,
            "milestone", urgency,
            "Your program completion date. Key deadlines are calculated from this date."
        ))

    # Add green card info if long-term goal
    if career_goal == "stay_us_longterm":
        events.extend(_green_card_events(today, graduation, country, degree_level))

    # Sort by date
    events.sort(key=lambda e: e["date"])

    # Mark past events
    for event in events:
        event["is_past"] = _parse_date(event["date"]) < today

    return events


def _f1_timeline(today, graduation, program_start, is_stem, degree_level,
                 cpt_months, career_goal, country):
    """Generate F-1 specific timeline events."""
    events = []

    if not graduation:
        return events

    # CPT warning if 12+ months full-time used
    if cpt_months >= 12:
        events.append(_event(
            "cpt_warning", "CPT Full-Time Limit Reached", today,
            "risk", "critical",
            "You have used 12+ months of full-time CPT. This makes you INELIGIBLE for OPT. "
            "Consult your DSO immediately about alternative options.",
            action_items=["Contact DSO to discuss options", "Consider H-1B sponsorship directly"]
        ))
        return events  # No OPT events if CPT maxed

    # OPT application window opens (90 days before graduation)
    opt_window_open = graduation - timedelta(days=OPT_RULES["apply_before_graduation_days"])
    events.append(_event(
        "opt_apply_window_open", "OPT Application Window Opens", opt_window_open,
        "deadline", _deadline_urgency(today, opt_window_open),
        "You can start applying for post-completion OPT. Apply as early as possible — "
        f"processing takes {OPT_RULES['ead_processing_months_min']}-{OPT_RULES['ead_processing_months_max']} months.",
        action_items=[
            "Request OPT recommendation from DSO",
            "Prepare Form I-765",
            "Get passport-style photos taken (2x2 inches)",
            "Download I-94 from i94.cbp.dhs.gov",
            "Make copies of passport, visa, and all previous I-20s",
        ]
    ))

    # OPT application deadline (60 days after graduation)
    opt_deadline = graduation + timedelta(days=OPT_RULES["apply_after_graduation_days"])
    events.append(_event(
        "opt_apply_deadline", "OPT Application Deadline", opt_deadline,
        "deadline", "critical",
        "Last day to apply for OPT (60 days post-graduation). "
        "Missing this means losing OPT eligibility entirely.",
        action_items=["Submit I-765 if not already done"]
    ))

    # OPT start (estimated — typically after graduation)
    opt_start = graduation + timedelta(days=1)
    events.append(_event(
        "opt_start", "OPT Period Begins (Estimated)", opt_start,
        "milestone", "none",
        "Your 12-month OPT period starts. You have 90 days to find employment. "
        "Track your unemployment days carefully.",
        action_items=[
            "Begin job search if not already employed",
            f"Track unemployment days (max {OPT_RULES['unemployment_limit_days']} days)",
            "Report employment to DSO within 10 days of starting",
        ]
    ))

    # OPT unemployment limit warning
    unemployment_warning = opt_start + timedelta(days=OPT_RULES["unemployment_limit_days"] - 30)
    events.append(_event(
        "opt_unemployment_warning", "OPT Unemployment Limit Approaching", unemployment_warning,
        "risk", "high",
        f"You are approaching the {OPT_RULES['unemployment_limit_days']}-day unemployment limit. "
        "If exceeded, your OPT and F-1 status will be terminated.",
        action_items=["Secure employment immediately", "Contact DSO about options"]
    ))

    # OPT expiration
    opt_end = graduation + timedelta(days=365)
    events.append(_event(
        "opt_expiration", "OPT Expires", opt_end,
        "deadline", "critical",
        "Your 12-month OPT period ends.",
        action_items=["Apply for STEM OPT extension (if eligible)" if is_stem else "Secure H-1B sponsorship or other status"]
    ))

    # STEM OPT extension
    if is_stem:
        stem_apply_deadline = opt_end - timedelta(days=STEM_OPT_RULES["apply_before_opt_expires_days"])
        events.append(_event(
            "stem_opt_apply", "STEM OPT Extension — Apply By This Date", stem_apply_deadline,
            "deadline", _deadline_urgency(today, stem_apply_deadline),
            "Apply for 24-month STEM OPT extension. Your employer MUST be E-Verify registered.",
            action_items=[
                "Confirm employer is E-Verify registered",
                "Complete Form I-983 (Training Plan) with employer",
                "Request updated I-20 from DSO with STEM OPT recommendation",
                "File I-765 for STEM OPT extension",
            ]
        ))

        stem_opt_end = opt_end + timedelta(days=730)  # 24 months
        events.append(_event(
            "stem_opt_expiration", "STEM OPT Extension Expires", stem_opt_end,
            "deadline", "critical",
            "Your STEM OPT extension ends (36 months total). You must transition to another status (H-1B, etc.).",
            action_items=["Ensure H-1B or other visa status is secured"]
        ))

    # H-1B lottery events
    if career_goal in ("stay_us_longterm", "undecided"):
        events.extend(_h1b_lottery_events(today, graduation, degree_level))

    return events


def _opt_timeline(today, graduation, is_stem, degree_level, career_goal, country):
    """Generate timeline for someone already on OPT."""
    events = []

    if graduation:
        opt_end = graduation + timedelta(days=365)

        if is_stem and opt_end > today:
            stem_apply_deadline = opt_end - timedelta(days=STEM_OPT_RULES["apply_before_opt_expires_days"])
            if stem_apply_deadline > today:
                events.append(_event(
                    "stem_opt_apply", "STEM OPT Extension — Apply By This Date", stem_apply_deadline,
                    "deadline", _deadline_urgency(today, stem_apply_deadline),
                    "Apply for 24-month STEM OPT extension. Your employer MUST be E-Verify registered.",
                    action_items=[
                        "Confirm employer is E-Verify registered",
                        "Complete Form I-983 with employer",
                        "Request updated I-20 from DSO",
                        "File I-765 for STEM OPT extension",
                    ]
                ))

            events.append(_event(
                "opt_expiration", "OPT Expires", opt_end,
                "deadline", "critical",
                "Your 12-month OPT period ends."
            ))

            if is_stem:
                stem_opt_end = opt_end + timedelta(days=730)
                events.append(_event(
                    "stem_opt_expiration", "STEM OPT Extension Expires", stem_opt_end,
                    "deadline", "critical",
                    "Your STEM OPT extension ends (36 months total)."
                ))

    if career_goal in ("stay_us_longterm", "undecided"):
        events.extend(_h1b_lottery_events(today, graduation, degree_level))

    return events


def _h1b_timeline(today, career_goal, country):
    """Generate timeline for someone already on H-1B."""
    events = []

    if career_goal == "stay_us_longterm":
        events.append(_event(
            "i140_filing", "Consider Filing I-140 (Green Card)", today + timedelta(days=30),
            "milestone", "medium",
            "Ask your employer to begin the green card process by filing PERM labor certification, "
            "followed by I-140 petition.",
            action_items=[
                "Discuss green card sponsorship with employer",
                "Start PERM labor certification process",
                "Gather required documents (education evaluations, experience letters)",
            ]
        ))

    return events


def _h1b_lottery_events(today, graduation, degree_level):
    """Generate H-1B lottery related events."""
    events = []
    current_year = today.year

    # Generate for next 3 years of lottery cycles
    for year in range(current_year, current_year + 3):
        reg_open = date(year, H1B_RULES["registration_month"], 1)
        reg_close = date(year, H1B_RULES["registration_month"], 31)
        results = date(year, 4, 1)  # Approximate
        start = date(year, H1B_RULES["start_date_month"], H1B_RULES["start_date_day"])

        if reg_open < today:
            continue

        year_label = f"FY{year + 1}"

        events.append(_event(
            f"h1b_registration_{year}", f"H-1B Registration Opens ({year_label})", reg_open,
            "deadline", _deadline_urgency(today, reg_open),
            f"H-1B electronic registration period for {year_label}. Your employer must register you. "
            + ("US Master's cap gives you two chances in the lottery." if degree_level in ("Master's", "PhD") else "Regular cap: 65,000 slots."),
            action_items=[
                "Confirm employer will sponsor H-1B",
                "Provide passport and immigration documents to employer/attorney",
                "Employer completes electronic registration on USCIS portal",
            ]
        ))

        events.append(_event(
            f"h1b_results_{year}", f"H-1B Lottery Results ({year_label})", results,
            "milestone", "medium",
            "H-1B lottery selection results are typically announced. "
            "If selected, your employer has 90 days to file the full petition.",
        ))

        # Cap-gap
        events.append(_event(
            f"h1b_capgap_{year}", f"Cap-Gap Extension Period ({year_label})", date(year, 4, 1),
            "milestone", "none",
            "If your OPT is expiring and you're selected in the H-1B lottery, "
            "your status is automatically extended from April 1 to October 1 (cap-gap).",
        ))

        events.append(_event(
            f"h1b_start_{year}", f"H-1B Start Date ({year_label})", start,
            "milestone", "none",
            f"H-1B employment begins for {year_label} if selected and petition approved.",
        ))

        break  # Only show the next lottery cycle

    return events


def _green_card_events(today, graduation, country, degree_level):
    """Generate green card related informational events."""
    events = []
    country_cat = get_country_category(country)
    gc_wait = get_green_card_wait(country, "EB-2")

    # Estimate when GC process might start (H-1B + 1 year typically)
    if graduation:
        gc_process_start = graduation + timedelta(days=365 * 2)  # ~2 years after graduation
    else:
        gc_process_start = today + timedelta(days=365)

    if gc_process_start > today:
        severity = "warning" if gc_wait["status"] != "current" else "none"
        wait_text = (
            f"Estimated EB-2 wait time for {country_cat}: "
            f"{gc_wait['wait_years_min']}-{gc_wait['wait_years_max']} years."
        )

        events.append(_event(
            "green_card_info", "Green Card Process (Estimated Start)", gc_process_start,
            "milestone", severity,
            f"Typical timeline to begin green card process through employer sponsorship. {wait_text}",
            action_items=[
                "Discuss green card sponsorship with employer early",
                "Start gathering education and experience documentation",
                "Consider EB-1 eligibility if you have extraordinary ability or publications",
            ]
        ))

    return events


def _event(id: str, title: str, event_date: date, event_type: str,
           urgency: str, description: str, action_items: list[str] | None = None) -> dict:
    """Create a timeline event dict."""
    return {
        "id": id,
        "title": title,
        "date": event_date.isoformat(),
        "type": event_type,
        "urgency": urgency,
        "description": description,
        "action_items": action_items or [],
    }


def _deadline_urgency(today: date, deadline: date) -> str:
    """Determine urgency level based on how far away a deadline is."""
    days = (deadline - today).days
    if days < 0:
        return "passed"
    elif days <= 7:
        return "critical"
    elif days <= 30:
        return "high"
    elif days <= 90:
        return "medium"
    return "low"


def _parse_date(date_str: str | None) -> date | None:
    """Parse a date string (YYYY-MM-DD) to a date object."""
    if not date_str:
        return None
    if isinstance(date_str, date):
        return date_str
    return date.fromisoformat(date_str)
