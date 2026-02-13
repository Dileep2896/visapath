"""Green card backlog data by country and category.

Based on USCIS Visa Bulletin data. Wait times are approximate.
"""

# EB (Employment-Based) Green Card Wait Times in years
# "current" means no significant backlog
EB_WAIT_TIMES = {
    "India": {
        "EB-1": {"wait_years_min": 2, "wait_years_max": 4, "status": "backlogged"},
        "EB-2": {"wait_years_min": 10, "wait_years_max": 30, "status": "severely_backlogged"},
        "EB-3": {"wait_years_min": 10, "wait_years_max": 25, "status": "severely_backlogged"},
    },
    "China": {
        "EB-1": {"wait_years_min": 1, "wait_years_max": 3, "status": "backlogged"},
        "EB-2": {"wait_years_min": 4, "wait_years_max": 8, "status": "backlogged"},
        "EB-3": {"wait_years_min": 4, "wait_years_max": 8, "status": "backlogged"},
    },
    "Rest of World": {
        "EB-1": {"wait_years_min": 0, "wait_years_max": 1, "status": "current"},
        "EB-2": {"wait_years_min": 0, "wait_years_max": 2, "status": "current"},
        "EB-3": {"wait_years_min": 0, "wait_years_max": 2, "status": "current"},
    },
}

# Countries with specific backlogs (all others fall under "Rest of World")
BACKLOGGED_COUNTRIES = {"India", "China"}


def get_country_category(country: str) -> str:
    """Map a country name to its backlog category."""
    if country.lower() in {"india"}:
        return "India"
    elif country.lower() in {"china", "mainland china", "prc"}:
        return "China"
    return "Rest of World"


def get_green_card_wait(country: str, category: str = "EB-2") -> dict:
    """Get green card wait time for a country and EB category."""
    country_cat = get_country_category(country)
    return EB_WAIT_TIMES.get(country_cat, EB_WAIT_TIMES["Rest of World"]).get(
        category, EB_WAIT_TIMES["Rest of World"]["EB-2"]
    )


# H-1B Lottery Statistics (recent years)
H1B_LOTTERY_STATS = {
    "2024": {
        "registrations": 758994,
        "selected": 188400,
        "selection_rate_percent": 24.8,
    },
    "2025": {
        "registrations": 470000,
        "selected": 120000,
        "selection_rate_percent": 25.5,
    },
}
