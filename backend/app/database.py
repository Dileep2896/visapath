"""Dual-mode database: PostgreSQL (via DATABASE_URL) or SQLite fallback."""
from __future__ import annotations

import os
import json
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL")

# ---------------------------------------------------------------------------
# Backend detection
# ---------------------------------------------------------------------------
if DATABASE_URL:
    import psycopg2
    from psycopg2.extras import RealDictCursor

    USE_PG = True
    PH = "%s"  # placeholder
else:
    USE_PG = False
    PH = "?"

# SQLite path (only used when USE_PG is False)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "visapath.db")


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------
def get_db():
    """Return a database connection."""
    if USE_PG:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


def _cursor(conn):
    """Return a cursor that produces dicts for both backends."""
    if USE_PG:
        return conn.cursor(cursor_factory=RealDictCursor)
    return conn.cursor()


def _row_to_dict(row):
    """Convert a row to a plain dict."""
    if row is None:
        return None
    if USE_PG:
        return dict(row)  # RealDictRow → dict
    return dict(row)  # sqlite3.Row → dict


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
_SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile TEXT,
    cached_timeline TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_timelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_input TEXT NOT NULL,
    timeline_response TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
"""

_PG_SCHEMA_USERS = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile TEXT,
    cached_timeline TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
"""

_PG_SCHEMA_TIMELINES = """
CREATE TABLE IF NOT EXISTS saved_timelines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_input TEXT NOT NULL,
    timeline_response TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
"""


# ---------------------------------------------------------------------------
# init_db
# ---------------------------------------------------------------------------
def init_db():
    """Create tables if they don't exist, seed demo user."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(_PG_SCHEMA_USERS)
            cur.execute(_PG_SCHEMA_TIMELINES)
            conn.commit()

            # Migration: add profile column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'profile'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN profile TEXT")
                conn.commit()

            # Migration: add cached_timeline column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'cached_timeline'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN cached_timeline TEXT")
                conn.commit()

            # Migration: add cached_tax_guide column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'cached_tax_guide'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN cached_tax_guide TEXT")
                conn.commit()

            cur.execute(
                f"SELECT id FROM users WHERE email = {PH}", ("demo@visapath.com",)
            )
            existing = cur.fetchone()
            if not existing:
                from app.services.auth_service import hash_password
                pw_hash = hash_password("demo123")
                cur.execute(
                    f"INSERT INTO users (email, password_hash) VALUES ({PH}, {PH})",
                    ("demo@visapath.com", pw_hash),
                )
                conn.commit()
            cur.close()
        else:
            conn.executescript(_SQLITE_SCHEMA)
            conn.commit()

            # Migration: add profile column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "profile" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN profile TEXT")
                conn.commit()

            # Migration: add cached_timeline column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "cached_timeline" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN cached_timeline TEXT")
                conn.commit()

            # Migration: add cached_tax_guide column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "cached_tax_guide" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN cached_tax_guide TEXT")
                conn.commit()

            existing = conn.execute(
                f"SELECT id FROM users WHERE email = {PH}", ("demo@visapath.com",)
            ).fetchone()
            if not existing:
                from app.services.auth_service import hash_password
                pw_hash = hash_password("demo123")
                conn.execute(
                    f"INSERT INTO users (email, password_hash) VALUES ({PH}, {PH})",
                    ("demo@visapath.com", pw_hash),
                )
                conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------
def create_user(email: str, password_hash: str) -> dict:
    """Insert a new user and return their record."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"INSERT INTO users (email, password_hash) VALUES ({PH}, {PH}) "
                f"RETURNING id, email, created_at",
                (email, password_hash),
            )
            user = cur.fetchone()
            conn.commit()
            cur.close()
            result = dict(user)
            # Convert timestamp to string for consistency
            if hasattr(result["created_at"], "isoformat"):
                result["created_at"] = result["created_at"].isoformat()
            return result
        else:
            cursor = conn.execute(
                f"INSERT INTO users (email, password_hash) VALUES ({PH}, {PH})",
                (email, password_hash),
            )
            conn.commit()
            user = conn.execute(
                f"SELECT id, email, created_at FROM users WHERE id = {PH}",
                (cursor.lastrowid,),
            ).fetchone()
            return dict(user)
    finally:
        conn.close()


def get_user_by_email(email: str) -> dict | None:
    """Find a user by email."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"SELECT id, email, password_hash, created_at FROM users WHERE email = {PH}",
                (email,),
            )
            row = cur.fetchone()
            cur.close()
            if row is None:
                return None
            result = dict(row)
            if hasattr(result.get("created_at"), "isoformat"):
                result["created_at"] = result["created_at"].isoformat()
            return result
        else:
            row = conn.execute(
                f"SELECT id, email, password_hash, created_at FROM users WHERE email = {PH}",
                (email,),
            ).fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int) -> dict | None:
    """Find a user by id."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"SELECT id, email, profile, cached_timeline, cached_tax_guide, created_at FROM users WHERE id = {PH}",
                (user_id,),
            )
            row = cur.fetchone()
            cur.close()
            if row is None:
                return None
            result = dict(row)
            if hasattr(result.get("created_at"), "isoformat"):
                result["created_at"] = result["created_at"].isoformat()
            if result.get("profile"):
                result["profile"] = json.loads(result["profile"])
            else:
                result["profile"] = None
            if result.get("cached_timeline"):
                result["cached_timeline"] = json.loads(result["cached_timeline"])
            else:
                result["cached_timeline"] = None
            if result.get("cached_tax_guide"):
                result["cached_tax_guide"] = json.loads(result["cached_tax_guide"])
            else:
                result["cached_tax_guide"] = None
            return result
        else:
            row = conn.execute(
                f"SELECT id, email, profile, cached_timeline, cached_tax_guide, created_at FROM users WHERE id = {PH}",
                (user_id,),
            ).fetchone()
            if row is None:
                return None
            result = dict(row)
            if result.get("profile"):
                result["profile"] = json.loads(result["profile"])
            else:
                result["profile"] = None
            if result.get("cached_timeline"):
                result["cached_timeline"] = json.loads(result["cached_timeline"])
            else:
                result["cached_timeline"] = None
            if result.get("cached_tax_guide"):
                result["cached_tax_guide"] = json.loads(result["cached_tax_guide"])
            else:
                result["cached_tax_guide"] = None
            return result
    finally:
        conn.close()


def save_user_profile(user_id: int, profile_dict: dict) -> None:
    """Save/update a user's profile data."""
    conn = get_db()
    try:
        profile_json = json.dumps(profile_dict)
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET profile = {PH} WHERE id = {PH}",
                (profile_json, user_id),
            )
            conn.commit()
            cur.close()
        else:
            conn.execute(
                f"UPDATE users SET profile = {PH} WHERE id = {PH}",
                (profile_json, user_id),
            )
            conn.commit()
    finally:
        conn.close()


def save_cached_timeline(user_id: int, timeline_response: dict) -> None:
    """Save/update a user's cached timeline (auto-saved after generation)."""
    conn = get_db()
    try:
        timeline_json = json.dumps(timeline_response)
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET cached_timeline = {PH} WHERE id = {PH}",
                (timeline_json, user_id),
            )
            conn.commit()
            cur.close()
        else:
            conn.execute(
                f"UPDATE users SET cached_timeline = {PH} WHERE id = {PH}",
                (timeline_json, user_id),
            )
            conn.commit()
    finally:
        conn.close()


def save_cached_tax_guide(user_id: int, tax_guide: dict) -> None:
    """Save/update a user's cached tax guide (auto-saved after generation)."""
    conn = get_db()
    try:
        tax_json = json.dumps(tax_guide)
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET cached_tax_guide = {PH} WHERE id = {PH}",
                (tax_json, user_id),
            )
            conn.commit()
            cur.close()
        else:
            conn.execute(
                f"UPDATE users SET cached_tax_guide = {PH} WHERE id = {PH}",
                (tax_json, user_id),
            )
            conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Timeline CRUD
# ---------------------------------------------------------------------------
def save_timeline(user_id: int, user_input: dict, timeline_response: dict) -> dict:
    """Save a timeline for a user."""
    conn = get_db()
    try:
        input_json = json.dumps(user_input)
        response_json = json.dumps(timeline_response)

        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"INSERT INTO saved_timelines (user_id, user_input, timeline_response) "
                f"VALUES ({PH}, {PH}, {PH}) "
                f"RETURNING id, user_id, user_input, timeline_response, created_at",
                (user_id, input_json, response_json),
            )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            result = dict(row)
            result["user_input"] = json.loads(result["user_input"])
            result["timeline_response"] = json.loads(result["timeline_response"])
            if hasattr(result.get("created_at"), "isoformat"):
                result["created_at"] = result["created_at"].isoformat()
            return result
        else:
            cursor = conn.execute(
                f"INSERT INTO saved_timelines (user_id, user_input, timeline_response) "
                f"VALUES ({PH}, {PH}, {PH})",
                (user_id, input_json, response_json),
            )
            conn.commit()
            row = conn.execute(
                f"SELECT id, user_id, user_input, timeline_response, created_at "
                f"FROM saved_timelines WHERE id = {PH}",
                (cursor.lastrowid,),
            ).fetchone()
            result = dict(row)
            result["user_input"] = json.loads(result["user_input"])
            result["timeline_response"] = json.loads(result["timeline_response"])
            return result
    finally:
        conn.close()


def get_user_timelines(user_id: int) -> list[dict]:
    """Get all saved timelines for a user."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"SELECT id, user_id, user_input, timeline_response, created_at "
                f"FROM saved_timelines WHERE user_id = {PH} ORDER BY created_at DESC",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
        else:
            rows = conn.execute(
                f"SELECT id, user_id, user_input, timeline_response, created_at "
                f"FROM saved_timelines WHERE user_id = {PH} ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()

        results = []
        for row in rows:
            d = dict(row)
            d["user_input"] = json.loads(d["user_input"])
            d["timeline_response"] = json.loads(d["timeline_response"])
            if hasattr(d.get("created_at"), "isoformat"):
                d["created_at"] = d["created_at"].isoformat()
            results.append(d)
        return results
    finally:
        conn.close()
