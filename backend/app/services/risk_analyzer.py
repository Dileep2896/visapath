"""Risk detection engine.

Analyzes user input and generated timeline to flag potential issues.
"""

from datetime import date, timedelta
from app.data.immigration_rules import OPT_RULES, STEM_OPT_RULES, CPT_RULES
from app.data.country_backlogs import get_green_card_wait, get_country_category, BACKLOGGED_COUNTRIES


def analyze_risks(user_input: dict, timeline_events: list[dict]) -> list[dict]:
    """Analyze risks based on user input and generated timeline."""
    risks = []
    today = date.today()

    visa_type = user_input["visa_type"]
    is_stem = user_input.get("is_stem", False)
    cpt_months = user_input.get("cpt_months_used", 0)
    country = user_input.get("country", "Rest of World")
    career_goal = user_input.get("career_goal", "stay_us_longterm")
    graduation = _parse_date(user_input.get("expected_graduation"))
    currently_employed = user_input.get("currently_employed", False)

    # Enhanced fields
    program_extended = user_input.get("program_extended", False)
    h1b_attempts = user_input.get("h1b_attempts", 0)
    unemployment_days = user_input.get("unemployment_days", 0)
    has_job_offer = user_input.get("has_job_offer", False)
    opt_status = user_input.get("opt_status", "none")

    # CPT overuse risk
    if cpt_months >= 12:
        risks.append(_risk(
            "cpt_overuse", "critical",
            "You have used 12+ months of full-time CPT, which makes you INELIGIBLE for OPT. "
            "You will need to secure H-1B sponsorship or another visa status directly.",
            recommendation="Consult with your DSO and an immigration attorney immediately."
        ))
    elif cpt_months >= 9:
        risks.append(_risk(
            "cpt_approaching_limit", "warning",
            f"You have used {cpt_months} months of full-time CPT. Using 12+ months will "
            "make you ineligible for OPT. Be cautious about additional CPT usage.",
            recommendation="Plan remaining CPT usage carefully and discuss with your DSO."
        ))

    # Country backlog risk
    if career_goal == "stay_us_longterm":
        country_cat = get_country_category(country)
        if country_cat in BACKLOGGED_COUNTRIES:
            gc_wait = get_green_card_wait(country, "EB-2")
            risks.append(_risk(
                "country_backlog", "warning",
                f"As a national of {country_cat}, EB-2/EB-3 green card wait times currently "
                f"range from {gc_wait['wait_years_min']}-{gc_wait['wait_years_max']} years. "
                "This means maintaining non-immigrant status for an extended period.",
                recommendation=(
                    "Consider EB-1 eligibility (extraordinary ability), "
                    "explore O-1 visa options, or plan for long-term H-1B extensions. "
                    "Start the green card process as early as possible."
                )
            ))

    # Upcoming deadline risks
    if graduation and visa_type == "F-1":
        days_to_grad = (graduation - today).days

        # OPT window closing soon
        opt_deadline = graduation + timedelta(days=OPT_RULES["apply_after_graduation_days"])
        days_to_opt_deadline = (opt_deadline - today).days
        if 0 < days_to_opt_deadline <= 30:
            risks.append(_risk(
                "opt_deadline_approaching", "critical",
                f"Your OPT application deadline is only {days_to_opt_deadline} days away "
                f"({opt_deadline.isoformat()}). Missing this deadline means losing OPT eligibility entirely.",
                recommendation="Apply for OPT IMMEDIATELY if you haven't already."
            ))

        # Graduation approaching without OPT applied
        if 0 < days_to_grad <= 30:
            risks.append(_risk(
                "graduation_approaching", "high",
                f"Graduation is {days_to_grad} days away. Ensure your OPT application is filed.",
                recommendation="Contact your DSO to confirm OPT application status."
            ))

    # Non-STEM on OPT — shorter window
    if visa_type in ("F-1", "OPT") and not is_stem:
        risks.append(_risk(
            "non_stem_limited", "info",
            "As a non-STEM student, you are only eligible for 12 months of OPT "
            "(no STEM extension). Your window to transition to H-1B is shorter.",
            recommendation=(
                "Begin employer discussions about H-1B sponsorship early. "
                "The H-1B lottery happens once per year in March."
            )
        ))

    # Unemployment tracking on OPT
    if visa_type == "OPT" and not currently_employed:
        limit = STEM_OPT_RULES["unemployment_limit_days"] if is_stem else OPT_RULES["unemployment_limit_days"]
        risks.append(_risk(
            "unemployment_tracking", "high",
            f"You are currently unemployed on OPT. You have a maximum of {limit} days "
            "of unemployment. Exceeding this will terminate your OPT and F-1 status.",
            recommendation="Track your unemployment days carefully and pursue employment actively."
        ))

    # H-1B lottery uncertainty
    if career_goal == "stay_us_longterm" and visa_type in ("F-1", "OPT"):
        risks.append(_risk(
            "h1b_lottery_risk", "info",
            "The H-1B lottery selection rate is approximately 25-30%. "
            "Not being selected is common, and you may need to try multiple years.",
            recommendation=(
                "Have a backup plan (STEM OPT extension, employer with cap-exempt status, "
                "O-1 visa, or returning to school for a new program)."
            )
        ))

    # --- NEW ENHANCED RISK CHECKS ---

    # 1. Unemployment day limit approaching (actual days tracked)
    if unemployment_days > 0 and visa_type in ("F-1", "OPT"):
        limit = STEM_OPT_RULES["unemployment_limit_days"] if is_stem else OPT_RULES["unemployment_limit_days"]
        warning_threshold = 120 if is_stem else 60
        remaining = limit - unemployment_days

        if remaining <= 0:
            risks.append(_risk(
                "unemployment_limit_exceeded", "critical",
                f"You have used {unemployment_days} of {limit} allowed unemployment days. "
                "You have exceeded the limit. Your OPT and F-1 status may be terminated.",
                recommendation="Contact your DSO and an immigration attorney immediately."
            ))
        elif unemployment_days >= warning_threshold:
            risks.append(_risk(
                "unemployment_limit_approaching", "high",
                f"You have used {unemployment_days} of {limit} allowed unemployment days "
                f"({remaining} days remaining). You are approaching the limit.",
                recommendation=(
                    "Secure employment as soon as possible. Consider volunteer work in your "
                    "field of study that can be reported to reduce unemployment days."
                )
            ))

    # 2. Program extension without updated I-20
    if program_extended:
        risks.append(_risk(
            "program_extension_i20", "high",
            "You indicated your program has been extended. An updated I-20 with the new "
            "program end date is required. Without it, your SEVIS record may be out of date, "
            "which can affect OPT eligibility and other immigration benefits.",
            recommendation=(
                "Contact your DSO immediately to obtain an updated I-20 reflecting "
                "the new program end date. Ensure your SEVIS record is updated."
            )
        ))

    # 3. Multiple H-1B lottery failures
    if h1b_attempts >= 3:
        risks.append(_risk(
            "multiple_h1b_failures", "warning",
            f"You have had {h1b_attempts} unsuccessful H-1B lottery attempts. While each "
            "lottery is independent (~30% chance), relying solely on the H-1B lottery is risky.",
            recommendation=(
                "Strongly consider alternative visa pathways: EB-1A (extraordinary ability), "
                "O-1 (extraordinary achievement), L-1 (intracompany transfer), or EB-2 NIW "
                "(National Interest Waiver). Consult an immigration attorney to evaluate eligibility."
            )
        ))
    elif h1b_attempts >= 1:
        risks.append(_risk(
            "h1b_prior_attempts", "info",
            f"You have had {h1b_attempts} prior H-1B lottery attempt(s). Each lottery is "
            "independent with ~30% selection rate. Having a backup plan is important.",
            recommendation=(
                "Continue applying while exploring alternative options. Consider cap-exempt "
                "employers (universities, research institutions) that don't require lottery."
            )
        ))

    # 4. No job offer with approaching OPT deadline
    if not has_job_offer and visa_type in ("F-1", "OPT") and graduation:
        opt_end = graduation + timedelta(days=365)
        days_to_opt_end = (opt_end - today).days
        if 0 < days_to_opt_end <= 120:
            severity = "critical" if days_to_opt_end <= 60 else "high"
            risks.append(_risk(
                "no_job_offer_opt_ending", severity,
                f"You don't have a job offer and your OPT expires in {days_to_opt_end} days. "
                "Without employment, you will need to leave the US or change status.",
                recommendation=(
                    "Intensify your job search immediately. Consider reaching out to staffing "
                    "agencies, attending job fairs, and leveraging alumni networks. "
                    + ("Apply for STEM OPT extension if eligible." if is_stem else
                       "Explore other visa options or consider further education.")
                )
            ))

    # 5. Non-STEM with limited post-graduation options
    if not is_stem and visa_type in ("F-1", "OPT") and career_goal == "stay_us_longterm":
        risks.append(_risk(
            "non_stem_limited_options", "warning",
            "As a non-STEM student, you only have 12 months of OPT with no extension option. "
            "This gives you a single H-1B lottery attempt during your OPT period. "
            "If not selected, maintaining legal status becomes challenging.",
            recommendation=(
                "Start H-1B sponsorship discussions with employers immediately. "
                "Consider pursuing a STEM-designated program for additional OPT time. "
                "Look into cap-exempt H-1B employers (universities, nonprofits). "
                "Explore O-1 or other visa categories as alternatives."
            )
        ))

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "warning": 2, "info": 3}
    risks.sort(key=lambda r: severity_order.get(r["severity"], 99))

    return risks


def _risk(risk_type: str, severity: str, message: str, recommendation: str = "") -> dict:
    """Create a risk alert dict."""
    return {
        "type": risk_type,
        "severity": severity,
        "message": message,
        "recommendation": recommendation,
    }


def _parse_date(date_str: str | None) -> date | None:
    """Parse a date string to a date object."""
    if not date_str:
        return None
    if isinstance(date_str, date):
        return date_str
    return date.fromisoformat(date_str)
