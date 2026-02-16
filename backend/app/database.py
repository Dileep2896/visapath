"""Dual-mode database: PostgreSQL (via DATABASE_URL) or SQLite fallback."""
from __future__ import annotations

import os
import json
import logging
import sqlite3

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")

# ---------------------------------------------------------------------------
# Backend detection
# ---------------------------------------------------------------------------
if DATABASE_URL:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import pool as pg_pool

    USE_PG = True
    PH = "%s"  # placeholder
else:
    USE_PG = False
    PH = "?"

# SQLite path (only used when USE_PG is False)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "visapath.db")

# ---------------------------------------------------------------------------
# Connection pool (PostgreSQL only)
# ---------------------------------------------------------------------------
_pg_pool: pg_pool.SimpleConnectionPool | None = None


def _get_pool() -> pg_pool.SimpleConnectionPool:
    """Lazily create and return the PG connection pool."""
    global _pg_pool
    if _pg_pool is None or _pg_pool.closed:
        _pg_pool = pg_pool.SimpleConnectionPool(
            minconn=1, maxconn=10, dsn=DATABASE_URL, connect_timeout=5,
        )
        logger.info("PostgreSQL connection pool created (1-10 connections)")
    return _pg_pool


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------
def get_db():
    """Return a database connection (pooled for PG)."""
    if USE_PG:
        return _get_pool().getconn()
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


def _return_conn(conn):
    """Return a PG connection to the pool, or close SQLite."""
    if USE_PG:
        try:
            _get_pool().putconn(conn)
        except Exception:
            try:
                conn.close()
            except Exception:
                pass
    else:
        conn.close()


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
    is_admin INTEGER NOT NULL DEFAULT 0,
    credit_limit INTEGER NOT NULL DEFAULT 5,
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
    is_admin INTEGER NOT NULL DEFAULT 0,
    credit_limit INTEGER NOT NULL DEFAULT 5,
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

            # Migration: add credits_used column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'credits_used'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN credits_used INTEGER NOT NULL DEFAULT 0")
                conn.commit()

            # Migration: add is_admin column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'is_admin'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
                conn.commit()

            # Migration: add credit_limit column if missing
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'credit_limit'"
            )
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN credit_limit INTEGER NOT NULL DEFAULT 5")
                conn.commit()

            # Seed demo user
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

            # Seed admin user
            admin_email = os.environ.get("ADMIN_EMAIL")
            admin_password = os.environ.get("ADMIN_PASSWORD")
            if admin_email and admin_password:
                cur.execute(
                    f"SELECT id FROM users WHERE email = {PH}", (admin_email,)
                )
                existing_admin = cur.fetchone()
                if not existing_admin:
                    from app.services.auth_service import hash_password
                    admin_hash = hash_password(admin_password)
                    cur.execute(
                        f"INSERT INTO users (email, password_hash, is_admin) VALUES ({PH}, {PH}, 1)",
                        (admin_email, admin_hash),
                    )
                    conn.commit()
                    logger.info("Admin user seeded: %s", admin_email)
                else:
                    # Ensure existing admin user has is_admin=1
                    cur.execute(
                        f"UPDATE users SET is_admin = 1 WHERE email = {PH}",
                        (admin_email,),
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

            # Migration: add credits_used column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "credits_used" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN credits_used INTEGER NOT NULL DEFAULT 0")
                conn.commit()

            # Migration: add is_admin column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "is_admin" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
                conn.commit()

            # Migration: add credit_limit column if missing
            cols = [
                row[1]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            ]
            if "credit_limit" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN credit_limit INTEGER NOT NULL DEFAULT 5")
                conn.commit()

            # Seed demo user
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

            # Seed admin user
            admin_email = os.environ.get("ADMIN_EMAIL")
            admin_password = os.environ.get("ADMIN_PASSWORD")
            if admin_email and admin_password:
                existing_admin = conn.execute(
                    f"SELECT id FROM users WHERE email = {PH}", (admin_email,)
                ).fetchone()
                if not existing_admin:
                    from app.services.auth_service import hash_password
                    admin_hash = hash_password(admin_password)
                    conn.execute(
                        f"INSERT INTO users (email, password_hash, is_admin) VALUES ({PH}, {PH}, 1)",
                        (admin_email, admin_hash),
                    )
                    conn.commit()
                    logger.info("Admin user seeded: %s", admin_email)
                else:
                    conn.execute(
                        f"UPDATE users SET is_admin = 1 WHERE email = {PH}",
                        (admin_email,),
                    )
                    conn.commit()
    finally:
        _return_conn(conn)


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
        _return_conn(conn)


def get_all_users() -> list[dict]:
    """Return all users (admin use only). Excludes password_hash."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                "SELECT id, email, credits_used, credit_limit, is_admin, created_at FROM users ORDER BY id"
            )
            rows = cur.fetchall()
            cur.close()
            results = []
            for row in rows:
                d = dict(row)
                if hasattr(d.get("created_at"), "isoformat"):
                    d["created_at"] = d["created_at"].isoformat()
                results.append(d)
            return results
        else:
            rows = conn.execute(
                "SELECT id, email, credits_used, credit_limit, is_admin, created_at FROM users ORDER BY id"
            ).fetchall()
            return [dict(row) for row in rows]
    finally:
        _return_conn(conn)


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
        _return_conn(conn)


def get_user_by_id(user_id: int) -> dict | None:
    """Find a user by id."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"SELECT id, email, profile, cached_timeline, cached_tax_guide, credits_used, credit_limit, is_admin, created_at FROM users WHERE id = {PH}",
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
                f"SELECT id, email, profile, cached_timeline, cached_tax_guide, credits_used, credit_limit, is_admin, created_at FROM users WHERE id = {PH}",
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
        _return_conn(conn)


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
        _return_conn(conn)


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
        _return_conn(conn)


def increment_credits_used(user_id: int) -> int:
    """Increment credits_used for a user and return the new count."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET credits_used = credits_used + 1 WHERE id = {PH} RETURNING credits_used",
                (user_id,),
            )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            return row["credits_used"]
        else:
            conn.execute(
                f"UPDATE users SET credits_used = credits_used + 1 WHERE id = {PH}",
                (user_id,),
            )
            conn.commit()
            row = conn.execute(
                f"SELECT credits_used FROM users WHERE id = {PH}",
                (user_id,),
            ).fetchone()
            return dict(row)["credits_used"]
    finally:
        _return_conn(conn)


def try_consume_credit(user_id: int, limit: int) -> bool:
    """Atomically increment credits_used only if under the limit. Returns True if credit was consumed."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET credits_used = credits_used + 1 "
                f"WHERE id = {PH} AND credits_used < {PH} "
                f"RETURNING credits_used",
                (user_id, limit),
            )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            return row is not None
        else:
            cursor = conn.execute(
                f"UPDATE users SET credits_used = credits_used + 1 "
                f"WHERE id = {PH} AND credits_used < {PH}",
                (user_id, limit),
            )
            conn.commit()
            return cursor.rowcount > 0
    finally:
        _return_conn(conn)


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
        _return_conn(conn)


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
        _return_conn(conn)


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
        _return_conn(conn)


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------
def delete_user(user_id: int) -> bool:
    """Delete a user by id. Returns True if a row was deleted."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(f"DELETE FROM users WHERE id = {PH}", (user_id,))
            deleted = cur.rowcount > 0
            conn.commit()
            cur.close()
            return deleted
        else:
            cursor = conn.execute(f"DELETE FROM users WHERE id = {PH}", (user_id,))
            conn.commit()
            return cursor.rowcount > 0
    finally:
        _return_conn(conn)


def update_user_credits(user_id: int, credits: int) -> bool:
    """Set credits_used for a user. Returns True if updated."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET credits_used = {PH} WHERE id = {PH}",
                (credits, user_id),
            )
            updated = cur.rowcount > 0
            conn.commit()
            cur.close()
            return updated
        else:
            cursor = conn.execute(
                f"UPDATE users SET credits_used = {PH} WHERE id = {PH}",
                (credits, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    finally:
        _return_conn(conn)


def update_user_credit_limit(user_id: int, credit_limit: int) -> bool:
    """Set credit_limit for a user. Returns True if updated."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET credit_limit = {PH} WHERE id = {PH}",
                (credit_limit, user_id),
            )
            updated = cur.rowcount > 0
            conn.commit()
            cur.close()
            return updated
        else:
            cursor = conn.execute(
                f"UPDATE users SET credit_limit = {PH} WHERE id = {PH}",
                (credit_limit, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    finally:
        _return_conn(conn)


def update_user_email(user_id: int, email: str) -> bool:
    """Update email for a user. Returns True if updated."""
    conn = get_db()
    try:
        if USE_PG:
            cur = _cursor(conn)
            cur.execute(
                f"UPDATE users SET email = {PH} WHERE id = {PH}",
                (email, user_id),
            )
            updated = cur.rowcount > 0
            conn.commit()
            cur.close()
            return updated
        else:
            cursor = conn.execute(
                f"UPDATE users SET email = {PH} WHERE id = {PH}",
                (email, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    finally:
        _return_conn(conn)
