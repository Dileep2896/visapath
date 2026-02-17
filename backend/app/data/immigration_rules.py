"""Hard-coded immigration rules, timelines, and logic constants.

Updated: February 2026 with current USCIS fees, processing times,
and recent regulatory changes.
"""

# OPT Rules
OPT_RULES = {
    "apply_before_graduation_days": 90,
    "apply_after_graduation_days": 60,
    "duration_months": 12,
    "unemployment_limit_days": 90,
    "requires_related_employment": True,
    "ead_processing_months_min": 3,
    "ead_processing_months_max": 5,
}

# STEM OPT Extension Rules
STEM_OPT_RULES = {
    "extension_months": 24,
    "total_duration_months": 36,
    "unemployment_limit_days": 150,
    "requires_e_verify": True,
    "requires_stem_degree": True,
    "apply_before_opt_expires_days": 90,
    "employer_reporting_interval_months": 6,
    "self_employment_allowed": False,
}

# CPT Rules
CPT_RULES = {
    "requires_one_academic_year": True,
    "full_time_12_months_kills_opt": True,
    "part_time_limit_hours": 20,
    "full_time_limit_hours": 40,
}

# H-1B Rules
H1B_RULES = {
    "regular_cap": 65000,
    "masters_cap": 20000,
    "registration_month": 3,  # March
    "registration_start_day": 1,
    "registration_end_day": 31,  # approximate
    "lottery_results_month": 3,  # March-April
    "start_date_month": 10,  # October 1
    "start_date_day": 1,
    "max_duration_years": 6,
    "requires_specialty_occupation": True,
    "requires_bachelor_or_higher": True,
    "employer_must_petition": True,
    "cap_exempt_employers": [
        "universities",
        "nonprofit_affiliated_with_university",
        "nonprofit_research_organizations",
        "government_research_organizations",
    ],
}

# Cap-Gap Rules
CAP_GAP_RULES = {
    "auto_extends_from_month": 4,  # April 1
    "auto_extends_from_day": 1,
    "auto_extends_to_month": 10,  # October 1
    "auto_extends_to_day": 1,
    "requires_h1b_selection": True,
    "extends_opt_and_ead": True,
}

# F-1 General Rules
F1_RULES = {
    "grace_period_days": 60,
    "max_on_campus_hours_during_school": 20,
    "transfer_requires_sevis": True,
}

# Visa Types
VISA_TYPES = {
    "F-1": {
        "name": "F-1 Student Visa",
        "description": "Non-immigrant student visa for academic programs",
        "work_options": ["CPT", "OPT", "STEM OPT", "On-Campus Employment"],
        "next_steps": ["OPT", "H-1B", "Change of Status"],
    },
    "J-1": {
        "name": "J-1 Exchange Visitor",
        "description": "Exchange visitor visa for scholars, researchers, students",
        "work_options": ["Academic Training"],
        "next_steps": ["H-1B (may require 2-year home residency waiver)", "Change of Status"],
    },
    "H-1B": {
        "name": "H-1B Specialty Occupation",
        "description": "Non-immigrant work visa for specialty occupations",
        "work_options": ["Employer-sponsored employment"],
        "next_steps": ["Green Card (EB-2/EB-3)", "H-1B Extension", "H-1B Transfer"],
    },
    "H-4": {
        "name": "H-4 Dependent Visa",
        "description": "Dependent visa for H-1B holders' spouses and children",
        "work_options": ["H-4 EAD (if spouse has approved I-140)"],
        "next_steps": ["H-4 EAD", "Change of Status"],
    },
    "L-1": {
        "name": "L-1 Intracompany Transferee",
        "description": "Intracompany transfer visa",
        "work_options": ["Employer-sponsored employment"],
        "next_steps": ["Green Card (EB-1C)", "L-1 Extension"],
    },
    "OPT": {
        "name": "Post-Completion OPT",
        "description": "12-month work authorization after degree completion",
        "work_options": ["Employment related to field of study"],
        "next_steps": ["STEM OPT Extension", "H-1B", "Change of Status"],
    },
}

# USCIS Filing Fees (as of 2025-2026)
FILING_FEES = {
    "i765_ead": 580,  # OPT / STEM OPT EAD application
    "i129_h1b_petition": 780,  # H-1B petition base fee
    "h1b_registration": 215,  # H-1B electronic registration (per beneficiary)
    "h1b_asylum_program_fee": 600,  # Asylum Program Fee for H-1B (employers with 25+ employees)
    "h1b_asylum_program_fee_small": 300,  # Asylum Program Fee (employers with <25 employees)
    "h1b_fraud_prevention_fee": 500,  # Fraud Prevention and Detection Fee
    "h1b_acwia_fee_large": 1500,  # ACWIA fee (25+ employees)
    "h1b_acwia_fee_small": 750,  # ACWIA fee (<25 employees)
    "premium_processing": 2805,  # I-907 Premium Processing
    "i140_immigrant_petition": 715,  # I-140 Immigrant Worker Petition
    "i485_adjustment_of_status": 1440,  # I-485 (includes biometrics)
    "i131_advance_parole": 630,  # Travel document
    "i983_training_plan": 0,  # No fee for I-983
}

# Processing Times (approximate, in months) — updated 2025-2026
PROCESSING_TIMES = {
    "opt_ead": {"min": 3, "max": 5},
    "stem_opt_ead": {"min": 3, "max": 5},
    "h1b_regular": {"min": 3, "max": 8},
    "h1b_premium": {"min": 0.5, "max": 0.5},  # 15 business days
    "i140_regular": {"min": 6, "max": 18},
    "i140_premium": {"min": 0.5, "max": 0.5},
    "i485": {"min": 8, "max": 36},
    "h1b_registration_to_results": {"min": 0.5, "max": 1},  # March to late March/April
    "perm_labor_cert": {"min": 8, "max": 18},
}

# Degree Levels
DEGREE_LEVELS = ["Associate", "Bachelor's", "Master's", "PhD"]

# H-1B Wage Level Descriptions (for FY2027+ weighted lottery)
H1B_WAGE_LEVELS = {
    1: {"label": "Level I (Entry)", "lottery_entries": 1, "description": "Entry-level / new graduates"},
    2: {"label": "Level II (Qualified)", "lottery_entries": 2, "description": "2-5 years experience"},
    3: {"label": "Level III (Experienced)", "lottery_entries": 3, "description": "5-10 years / mid-career"},
    4: {"label": "Level IV (Fully Competent)", "lottery_entries": 4, "description": "10+ years / senior"},
}
