"""`create_pool`'s settings have to survive a connection pooler.

Why this suite exists: this package talks to Postgres through raw asyncpg, which uses prepared
statements. A transaction-mode pooler (Supabase's port 6543, pgbouncer in transaction mode) does
not support them, and the failure is not a clean startup error -- it is an intermittent
`prepared statement "__asyncpg_stmt_N__" does not exist` under concurrency, once two requests
land on different upstream sessions. `statement_cache_size=0` is what makes asyncpg safe there.

These tests patch `asyncpg.create_pool` rather than opening a socket, so they assert the
arguments this package chooses -- which is the thing that was wrong -- without needing a database.
"""

from __future__ import annotations

import asyncpg
import pytest

from app import db


class _RecordingCreatePool:
    """Stands in for `asyncpg.create_pool` and records how it was called."""

    def __init__(self) -> None:
        self.kwargs: dict | None = None

    async def __call__(self, *args, **kwargs):
        self.kwargs = kwargs
        return object()  # a real pool is never used by these tests


@pytest.fixture
def recorder(monkeypatch) -> _RecordingCreatePool:
    rec = _RecordingCreatePool()
    monkeypatch.setattr(asyncpg, "create_pool", rec)
    return rec


@pytest.mark.asyncio
async def test_statement_cache_is_disabled_by_default(recorder):
    # The default must be pooler-safe, because the deployed DSN is the pooler's.
    await db.create_pool("postgresql://u:p@host:6543/postgres")
    assert recorder.kwargs["statement_cache_size"] == 0


@pytest.mark.asyncio
async def test_statement_cache_size_is_overridable_for_session_mode(recorder):
    # Session-mode pooling keeps prepared statements, so the cache is worth having there.
    await db.create_pool("postgresql://u:p@host:5432/postgres", statement_cache_size=100)
    assert recorder.kwargs["statement_cache_size"] == 100


@pytest.mark.asyncio
async def test_max_size_fits_a_free_tier_connection_budget(recorder):
    # 10 per instance was generous against a free-tier connection cap shared with
    # migrations, the dashboard and any other client.
    await db.create_pool("postgresql://u:p@host:6543/postgres")
    assert recorder.kwargs["max_size"] <= 5


@pytest.mark.asyncio
async def test_jsonb_codec_init_is_still_registered(recorder):
    # Regression guard, not a new feature: dropping this makes demo_runs.result_summary
    # silently round-trip as text instead of dict, at every call site.
    await db.create_pool("postgresql://u:p@host:6543/postgres")
    assert recorder.kwargs["init"] is db._register_jsonb_codec


@pytest.mark.asyncio
async def test_dsn_is_passed_through_unchanged(recorder):
    dsn = "postgresql://u:p@host:6543/postgres"
    await db.create_pool(dsn)
    assert recorder.kwargs["dsn"] == dsn
