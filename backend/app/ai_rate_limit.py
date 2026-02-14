"""In-memory tracker for AI (Gemini) API requests.

Tracks daily request counts so the frontend can pre-check before
triggering expensive AI calls.  The actual hard limit lives on
Google's side, but this gives us visibility and fast-fail behaviour.

NOTE: In-memory — resets on server restart.
"""

import time
from collections import defaultdict

# Config — mirrors Gemini free-tier limits.
# gemini-2.5-flash: 20 RPD, gemini-2.0-flash: 1500 RPD.
# We track the conservative outer limit (the fallback model).
DAILY_LIMIT = 1500
WINDOW_SECONDS = 86400  # 24 hours

# Store: "global" -> list of timestamps (we track server-wide, not per-IP,
# because the Gemini API key is shared across all users).
_hits: dict[str, list[float]] = defaultdict(list)
_KEY = "global"

# When Gemini returns a 429 we mark the limit as hit so subsequent
# pre-checks fail instantly without another network round-trip.
_exhausted_until: float = 0.0


def _clean(now: float) -> None:
    cutoff = now - WINDOW_SECONDS
    _hits[_KEY] = [t for t in _hits[_KEY] if t > cutoff]


def record_ai_request() -> None:
    """Call this after every successful AI API dispatch."""
    _hits[_KEY].append(time.time())


def mark_exhausted(cooldown_seconds: float = 300.0) -> None:
    """Mark the AI limit as externally exhausted (e.g. Gemini 429).

    Subsequent pre-checks will fail instantly for `cooldown_seconds`
    (default 5 minutes).  After the cooldown expires the next request
    will reach Gemini again — if it still 429s the cooldown renews.
    """
    global _exhausted_until
    _exhausted_until = time.time() + cooldown_seconds


def get_ai_rate_status() -> dict:
    """Return current usage info for the frontend."""
    now = time.time()
    _clean(now)
    used = len(_hits[_KEY])
    externally_blocked = now < _exhausted_until
    retry_after = max(0, int(_exhausted_until - now)) if externally_blocked else 0
    return {
        "used": used,
        "limit": DAILY_LIMIT,
        "remaining": 0 if externally_blocked else max(DAILY_LIMIT - used, 0),
        "allowed": not externally_blocked and used < DAILY_LIMIT,
        "retry_after": retry_after,
    }


def check_ai_rate_limit() -> None:
    """Raise if the daily AI limit has been exceeded.

    Call this *before* dispatching an AI request for fast-fail.
    """
    status = get_ai_rate_status()
    if not status["allowed"]:
        raise AIRateLimitExceeded(
            "AI rate limit reached (20 requests/day on free tier). "
            "Please wait and try again."
        )


class AIRateLimitExceeded(Exception):
    """Raised when the app-level AI daily limit is hit."""
