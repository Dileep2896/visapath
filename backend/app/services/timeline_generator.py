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

    # Enhanced fields
    major_field = user_input.get("major_field", "")
    opt_status = user_input.get("opt_status", "none")
    program_extended = user_input.get("program_extended", False)
    original_graduation = _parse_date(user_input.get("original_graduation"))
    h1b_attempts = user_input.get("h1b_attempts", 0)
    unemployment_days = user_input.get("unemployment_days", 0)
    has_job_offer = user_input.get("has_job_offer", False)

    field_label = f" ({major_field})" if major_field else ""

    # Program extension awareness
    if program_extended:
        events.extend(_program_extension_events(today, graduation, original_graduation, field_label))

    if visa_type == "F-1":
        events.extend(_f1_timeline(
            today, graduation, program_start, is_stem, degree_level,
            cpt_months, career_goal, country, opt_status, unemployment_days,
            h1b_attempts, has_job_offer, field_label, program_extended
        ))
    elif visa_type == "OPT":
        events.extend(_opt_timeline(
            today, graduation, is_stem, degree_level, career_goal, country,
            opt_status, unemployment_days, h1b_attempts, has_job_offer, field_label
        ))
    elif visa_type == "H-1B":
        events.extend(_h1b_timeline(today, career_goal, country, h1b_attempts, field_label))

    # Add program milestones
    if program_start and program_start > today:
        events.append(_event(
            "program_start", f"Program Start Date{field_label}", program_start,
            "milestone", "none",
            "Your academic program begins."
        ))

    if graduation:
        urgency = _deadline_urgency(today, graduation)
        if program_extended:
            grad_title = f"New Expected Graduation (Extended){field_label}"
            grad_desc = (
                "Your updated program completion date after the extension. "
                "All OPT deadlines and work authorization dates are calculated from THIS date. "
                "You will still receive the full 12-month OPT period"
                + (" (plus 24-month STEM extension)" if is_stem else "")
                + " starting from this graduation date."
            )
        else:
            grad_title = f"Expected Graduation{field_label}"
            grad_desc = "Your program completion date. Key deadlines are calculated from this date."
        events.append(_event(
            "graduation", grad_title, graduation,
            "milestone", urgency,
            grad_desc,
        ))

    # Job offer awareness milestones
    if not has_job_offer and visa_type in ("F-1", "OPT") and graduation:
        _add_job_search_events(events, today, graduation, opt_status)

    if has_job_offer and visa_type in ("F-1", "OPT"):
        events.append(_event(
            "employer_h1b_prep", "Employer H-1B Preparation", today + timedelta(days=14),
            "milestone", "medium",
            "Begin coordinating with your employer on H-1B sponsorship. "
            "Your employer's immigration attorney should start LCA filing preparation.",
            action_items=[
                "Confirm employer will sponsor H-1B",
                "Connect with employer's immigration attorney",
                "Prepare documents for LCA (Labor Condition Application) filing",
                "Verify job title and wage level meet H-1B requirements",
            ]
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


def _program_extension_events(today, graduation, original_graduation, field_label):
    """Generate events related to program extension."""
    events = []

    grad_note = f" New graduation date: {graduation.isoformat()}." if graduation else ""
    events.append(_event(
        "program_extension_notice",
        f"Program Extended{field_label} — Update Required",
        today,
        "deadline", "high",
        "Your program has been extended. You need an updated I-20 reflecting "
        "the new program end date. Your SEVIS record must also be updated by your DSO. "
        "Important: Your OPT eligibility and duration are NOT reduced by the extension — "
        "you will still receive the full 12-month OPT (plus STEM extension if eligible) "
        f"calculated from your new graduation date.{grad_note}",
        action_items=[
            "Request updated I-20 from DSO with new program end date",
            "Confirm SEVIS record has been updated",
            "Keep copies of both original and updated I-20",
            "Note: All OPT deadlines will be based on your NEW graduation date",
        ]
    ))

    if original_graduation and graduation:
        events.append(_event(
            "original_graduation",
            "Original Graduation Date (Before Extension)",
            original_graduation,
            "milestone", "none",
            f"Your original program end date before extension. "
            f"This date is no longer used for OPT or deadline calculations. "
            f"All deadlines now use your new graduation date: {graduation.isoformat()}.",
        ))

    return events


def _f1_timeline(today, graduation, program_start, is_stem, degree_level,
                 cpt_months, career_goal, country, opt_status, unemployment_days,
                 h1b_attempts, has_job_offer, field_label, program_extended=False):
    """Generate F-1 specific timeline events."""
    events = []

    if not graduation:
        return events

    ext_note = " (based on your extended graduation date)" if program_extended else ""

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

    # Skip OPT application steps if already applied or active
    if opt_status in ("applied", "active"):
        if opt_status == "applied":
            events.append(_event(
                "opt_pending", "OPT Application Pending", today,
                "milestone", "medium",
                "Your OPT application has been submitted. Processing typically takes "
                f"{OPT_RULES['ead_processing_months_min']}-{OPT_RULES['ead_processing_months_max']} months. "
                "You can track your case at uscis.gov/casestatus.",
                action_items=[
                    "Check case status regularly at uscis.gov",
                    "Keep receipt notice (I-797C) safe",
                    "Do not travel outside the US without valid EAD",
                ]
            ))
        elif opt_status == "active":
            _add_unemployment_tracking(events, today, graduation, is_stem, unemployment_days)
    else:
        # OPT application window opens (90 days before graduation)
        opt_window_open = graduation - timedelta(days=OPT_RULES["apply_before_graduation_days"])
        events.append(_event(
            "opt_apply_window_open", f"OPT Application Window Opens{field_label}", opt_window_open,
            "deadline", _deadline_urgency(today, opt_window_open),
            f"You can start applying for post-completion OPT{ext_note}. Apply as early as possible — "
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
        f"Your full 12-month OPT period starts{ext_note}. You have 90 days to find employment. "
        "Track your unemployment days carefully."
        + (" Your OPT duration is not reduced by the program extension." if program_extended else ""),
        action_items=[
            "Begin job search if not already employed",
            f"Track unemployment days (max {OPT_RULES['unemployment_limit_days']} days)",
            "Report employment to DSO within 10 days of starting",
        ]
    ))

    # Unemployment tracking based on actual days used
    if unemployment_days > 0 and opt_status != "active":
        remaining = OPT_RULES["unemployment_limit_days"] - unemployment_days
        if remaining <= 30:
            events.append(_event(
                "unemployment_critical", "Unemployment Limit Critical", today,
                "risk", "critical",
                f"You have used {unemployment_days} of {OPT_RULES['unemployment_limit_days']} "
                f"unemployment days. Only {remaining} days remaining. "
                "Your OPT and F-1 status will be terminated if you exceed the limit.",
                action_items=[
                    "Secure employment immediately",
                    "Contact DSO about emergency options",
                    "Consider volunteer work reporting (must be in field of study)",
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
        f"Your 12-month OPT period ends{ext_note}.",
        action_items=["Apply for STEM OPT extension (if eligible)" if is_stem else "Secure H-1B sponsorship or other status"]
    ))

    # STEM OPT extension
    if is_stem:
        stem_apply_deadline = opt_end - timedelta(days=STEM_OPT_RULES["apply_before_opt_expires_days"])
        events.append(_event(
            "stem_opt_apply", f"STEM OPT Extension — Apply By This Date{field_label}", stem_apply_deadline,
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
        events.extend(_h1b_lottery_events(today, graduation, degree_level, h1b_attempts))

    return events


def _opt_timeline(today, graduation, is_stem, degree_level, career_goal, country,
                  opt_status, unemployment_days, h1b_attempts, has_job_offer, field_label):
    """Generate timeline for someone already on OPT."""
    events = []

    if graduation:
        opt_end = graduation + timedelta(days=365)

        # Unemployment tracking for active OPT
        if opt_status == "active":
            _add_unemployment_tracking(events, today, graduation, is_stem, unemployment_days)

        if is_stem and opt_end > today:
            stem_apply_deadline = opt_end - timedelta(days=STEM_OPT_RULES["apply_before_opt_expires_days"])
            if stem_apply_deadline > today:
                events.append(_event(
                    "stem_opt_apply", f"STEM OPT Extension — Apply By This Date{field_label}", stem_apply_deadline,
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
        events.extend(_h1b_lottery_events(today, graduation, degree_level, h1b_attempts))

    # Job offer specific events
    if has_job_offer:
        events.append(_event(
            "employer_h1b_prep", "Employer H-1B Preparation", today + timedelta(days=14),
            "milestone", "medium",
            "Coordinate with your employer on H-1B sponsorship. "
            "Immigration attorney should begin LCA filing preparation.",
            action_items=[
                "Connect with employer's immigration attorney",
                "Prepare documents for LCA filing",
                "Verify job title and wage level meet H-1B requirements",
            ]
        ))

    return events


def _h1b_timeline(today, career_goal, country, h1b_attempts, field_label):
    """Generate timeline for someone already on H-1B."""
    events = []

    if career_goal == "stay_us_longterm":
        events.append(_event(
            "i140_filing", f"Consider Filing I-140 (Green Card){field_label}", today + timedelta(days=30),
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


def _add_unemployment_tracking(events, today, graduation, is_stem, unemployment_days):
    """Add unemployment day tracking events for active OPT."""
    limit = STEM_OPT_RULES["unemployment_limit_days"] if is_stem else OPT_RULES["unemployment_limit_days"]
    remaining = limit - unemployment_days

    if remaining <= 0:
        events.append(_event(
            "unemployment_exceeded", "Unemployment Limit EXCEEDED", today,
            "risk", "critical",
            f"You have used {unemployment_days} of {limit} unemployment days. "
            "Your OPT status may be terminated. Contact your DSO immediately.",
            action_items=[
                "Contact DSO immediately",
                "Consult an immigration attorney",
                "Secure employment as soon as possible",
            ]
        ))
    elif remaining <= 30:
        events.append(_event(
            "unemployment_critical", "Unemployment Limit Critical", today,
            "risk", "critical",
            f"You have used {unemployment_days} of {limit} unemployment days. "
            f"Only {remaining} days remaining before your OPT is terminated.",
            action_items=[
                "Secure employment immediately",
                "Contact DSO about emergency options",
            ]
        ))
    elif remaining <= 60:
        events.append(_event(
            "unemployment_warning", "Unemployment Days Running Low", today,
            "risk", "high",
            f"You have used {unemployment_days} of {limit} unemployment days. "
            f"{remaining} days remaining.",
            action_items=[
                "Intensify job search",
                "Consider broadening job search to more employers",
                "Contact DSO to discuss options",
            ]
        ))


def _add_job_search_events(events, today, graduation, opt_status):
    """Add job search timeline events when no job offer."""
    if opt_status in ("applied", "active"):
        events.append(_event(
            "job_search_milestone", "Job Search Milestone Check", today + timedelta(days=30),
            "milestone", "medium",
            "You don't have a job offer yet. Set concrete weekly targets for applications "
            "and networking to stay on track before unemployment limits approach.",
            action_items=[
                "Apply to at least 10 positions per week",
                "Attend 2+ networking events or career fairs per month",
                "Update LinkedIn and resume for target roles",
                "Connect with your university career services",
            ]
        ))
    elif graduation and graduation > today:
        search_start = graduation - timedelta(days=180)
        if search_start > today:
            events.append(_event(
                "begin_job_search", "Begin Job Search (6 Months Before Graduation)",
                search_start, "milestone", "medium",
                "Start your job search early. Many employers have long hiring cycles, "
                "especially for positions requiring H-1B sponsorship.",
                action_items=[
                    "Research employers known to sponsor H-1B visas",
                    "Attend career fairs and networking events",
                    "Update resume and LinkedIn profile",
                    "Practice for technical/behavioral interviews",
                ]
            ))


def _h1b_lottery_events(today, graduation, degree_level, h1b_attempts=0):
    """Generate H-1B lottery related events."""
    events = []

    # Don't show H-1B events if graduation is more than 6 months away
    if graduation and graduation > today + timedelta(days=180):
        return events

    current_year = today.year

    # H-1B attempt history messaging
    attempt_note = ""
    if h1b_attempts >= 3:
        attempt_note = (
            f" You have had {h1b_attempts} prior attempts. Each lottery is independent (~30% chance). "
            "Consider alternative pathways: EB-1 (extraordinary ability), O-1 (individuals with extraordinary "
            "achievement), or L-1 (intracompany transfer) visas."
        )
    elif h1b_attempts > 0:
        attempt_note = (
            f" This will be attempt #{h1b_attempts + 1}. Each lottery is independent with ~30% selection rate."
        )

    # Generate for next 3 years of lottery cycles
    for year in range(current_year, current_year + 3):
        reg_open = date(year, H1B_RULES["registration_month"], 1)
        reg_close = date(year, H1B_RULES["registration_month"], 31)
        results = date(year, 4, 1)  # Approximate
        start = date(year, H1B_RULES["start_date_month"], H1B_RULES["start_date_day"])

        if reg_open < today:
            continue

        year_label = f"FY{year + 1}"

        # Note if registration happens before graduation
        pre_grad_note = ""
        if graduation and reg_open < graduation:
            pre_grad_note = (
                f" Note: Registration occurs before your graduation ({graduation.isoformat()}). "
                "Your employer CAN register you now — if selected, you would graduate, start OPT, "
                "and transition to H-1B on Oct 1 via cap-gap extension."
            )

        description = (
            f"H-1B electronic registration period for {year_label}. Your employer must register you. "
            + ("US Master's cap gives you two chances in the lottery." if degree_level in ("Master's", "PhD") else "Regular cap: 65,000 slots.")
            + attempt_note
            + pre_grad_note
        )

        action_items = [
            "Confirm employer will sponsor H-1B",
            "Provide passport and immigration documents to employer/attorney",
            "Employer completes electronic registration on USCIS portal",
        ]

        # Add cap-gap note if re-applying
        if h1b_attempts > 0:
            action_items.append("Verify cap-gap extension eligibility if currently on OPT")

        events.append(_event(
            f"h1b_registration_{year}", f"H-1B Registration Opens ({year_label})", reg_open,
            "deadline", _deadline_urgency(today, reg_open),
            description,
            action_items=action_items,
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

    # After 3+ failed attempts, suggest alternatives
    if h1b_attempts >= 3:
        events.append(_event(
            "h1b_alternatives", "Consider Alternative Visa Pathways", today + timedelta(days=7),
            "milestone", "high",
            f"After {h1b_attempts} H-1B lottery attempts, consider alternative visa categories. "
            "Each H-1B lottery is independent (~30% chance), but diversifying your strategy is recommended.",
            action_items=[
                "Evaluate EB-1A eligibility (extraordinary ability) — no employer sponsorship needed",
                "Explore O-1 visa for individuals with extraordinary achievement in your field",
                "Check if your employer has offices abroad for L-1 intracompany transfer",
                "Consider EB-2 NIW (National Interest Waiver) if your work benefits the US",
                "Consult an immigration attorney about all available options",
            ]
        ))

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
