"""
Postgres access layer -- raw asyncpg + hand-written SQL, no ORM.

Chosen to match integrity-oracle's sqlx style (hand-written, runtime SQL
over a connection pool) rather than SQLAlchemy, so this package's DB layer
stays as thin and inspectable as the oracle's `db.rs`. See README.md
"Design choices" for the full rationale.

`run_migrations` is a small hand-rolled equivalent of oracle's
`sqlx::migrate!`: it applies every `*.sql` file in migrations/ in filename
order, exactly once, tracked in a `schema_migrations` table, each inside its
own transaction.
"""

from __future__ import annotations

import json
from pathlib import Path

import asyncpg

MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "migrations"


async def _register_jsonb_codec(conn: asyncpg.Connection) -> None:
    # Without this, asyncpg round-trips `jsonb` columns (demo_runs.result_summary)
    # as raw text, so callers would have to json.dumps/loads by hand at every
    # call site instead of passing/receiving plain dicts -- registered once
    # per connection here instead.
    await conn.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog", format="text"
    )


async def create_pool(
    database_url: str,
    *,
    min_size: int = 1,
    max_size: int = 5,
    statement_cache_size: int = 0,
) -> asyncpg.Pool:
    """Open the connection pool.

    `statement_cache_size=0` by default, and that default is load-bearing rather than cautious.
    asyncpg uses prepared statements; a TRANSACTION-mode pooler (Supabase's port 6543, pgbouncer
    in transaction mode) does not support them, because consecutive statements from one client can
    land on different upstream sessions. The failure is not a clean error at startup -- it is an
    intermittent `prepared statement "__asyncpg_stmt_N__" does not exist` that only appears under
    concurrency, which is the worst way to discover a configuration problem. Disabling the cache
    costs a re-parse per query and makes the pool safe behind either pooling mode.

    Pass a non-zero `statement_cache_size` when connecting through a SESSION-mode pooler or
    directly, where prepared statements work and the cache is worth having.

    `max_size` is 5, not the 10 this used to hardcode: a free-tier Postgres connection cap is
    shared with migrations, any other client and every other instance of this service.
    """
    return await asyncpg.create_pool(
        dsn=database_url,
        min_size=min_size,
        max_size=max_size,
        statement_cache_size=statement_cache_size,
        init=_register_jsonb_codec,
    )


async def run_migrations(pool: asyncpg.Pool) -> list[str]:
    """
    Applies every migration file not yet recorded in `schema_migrations`, in
    filename order. Returns the list of migration filenames actually applied
    (empty if the schema was already up to date). Safe to call on every
    startup / test-fixture setup -- idempotent.
    """
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename    TEXT PRIMARY KEY,
                applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        already_applied = {
            row["filename"] for row in await conn.fetch("SELECT filename FROM schema_migrations")
        }

        applied: list[str] = []
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if path.name in already_applied:
                continue
            sql = path.read_text()
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)", path.name
                )
            applied.append(path.name)
        return applied
