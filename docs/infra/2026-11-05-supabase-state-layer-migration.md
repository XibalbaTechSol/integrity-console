# Render compute + Supabase state: the ecosystem storage pattern

**Status:** plan, approved conversationally 2026-11-05. Not executed.
**Driver:** `integrity-userapi-db` (Render, free plan) has `expiresAt: 2026-12-04`. Free Render
Postgres is **deleted** at expiry, so this has a dated deadline independent of any new work.
**First migration:** `integrity-userapi`. Cortex and Shield follow once proven.

---

## 1. The pattern

> **Render runs the code. Supabase holds the state.**

- **Render** — compute (the long-lived Python services) and static frontends.
- **Supabase** — Postgres, auth, storage.

### 1.1 Why not "Supabase for all backend"

Supabase is not an application host. It offers Postgres, auth, storage, realtime, and Edge
Functions — and Edge Functions are Deno/TypeScript with short execution limits. Every backend here
is long-lived Python:

| Service | Runtime | Hostable on Supabase? |
|---|---|---|
| `xibalba-shield` | `uv run shield-backend` — threaded `HTTPServer`, background retention threads | No |
| `cortex-managed-pilot` | Docker / Python | No |
| `integrity-userapi` | Docker / FastAPI + asyncpg | No |
| `integrity-console-test` | Render `static_site` | N/A — already a static frontend |

Moving these to Supabase means rewriting three Python services in TypeScript. Shield's planned
remote-contain command channel is a **long-poll** (`?wait=30`), which is the opposite of a
short-lived serverless function. So the split is by *layer*, not by vendor.

### 1.2 What the pattern actually fixes

Render free gives **one** Postgres per workspace and hard-deletes it at 30 days. Shield, Cortex and
userapi cannot all live on that. Supabase Postgres does not hard-delete, and each product gets its
own project. Row-level security also moves tenant isolation into the database, which the Cortex
production notes already require ("tenant-bound membership, short-lived scoped sessions").

---

## 2. Measured starting position (2026-11-05)

- **Render Postgres:** one instance — `integrity-userapi-db` (`dpg-dbld7sqjnfac73flo1p0-a`), free,
  region `oregon`, Postgres 16, `expiresAt: 2026-12-04`. Its IP allowlist is **empty**, so it
  accepts no external connections; contents could not be inspected from outside and are **unverified**.
- **Its service:** `integrity-userapi-test` (`srv-dbldb9gu01pc739t33b0`), free, Docker, deployed
  from branch `fix/ui-consistency`. 24h of logs show **only `GET /health`** — no application
  traffic. Suggestive of a test deployment, not proof the database is empty.
- **Schema it holds** (`integrity-userapi/migrations/`): `users`, `api_keys`, `user_agents`,
  `demo_runs`, `revoked_tokens`, `user_wallets`, `policy_packs`, `policy_revisions`. This includes
  account data, API keys and wallets — treat as production-sensitive until proven otherwise.
- **Supabase:** org `Jacob` (`iexukzgrkyrfoynqmcwp`), plan **free** (`tier_free`). Three projects,
  **all INACTIVE/paused**: `DustInTime` (us-east-1), `app` (us-west-2), `CognitoFlow` (us-east-1).
- **Cortex:** `cortex-managed-pilot` has **no database at all** — it is absent from the Postgres
  listing, consistent with the managed pilot having no ingestion path.
- **Shield:** SQLite on an ephemeral disk (`shield/backend/store.py`); accounts and sessions are
  wiped on every redeploy or free-tier spin-down.

### 2.1 Free-tier constraints that shape this plan

1. **Two active Supabase projects per free org.** Three exist, all paused. Separate-project-per-
   product (the chosen option) therefore needs slots — see Phase 0, where the limit is tested
   rather than assumed, since a paused project may not count against the active limit.
2. **Supabase free pauses a project after ~1 week idle.** Acceptable for userapi and console data.
   **Not** acceptable for Shield's eventual control plane: a paused control plane means the
   remote-contain channel is dead. Shield's control plane remains a paid-tier item.
3. **Region pairing matters.** Pair Supabase region to the Render service region to avoid adding
   cross-region latency to every query: `oregon` → `us-west-2`, `ohio` → `us-east-1`.

---

## 3. The technical risk that would silently break this

`integrity-userapi/app/db.py` uses **raw asyncpg** (no ORM, hand-written SQL):

```python
await asyncpg.create_pool(dsn=database_url, min_size=1, max_size=10, init=_register_jsonb_codec)
```

Two things follow, and both are migration-blocking:

1. **asyncpg + Supabase's transaction-mode pooler is incompatible by default.** asyncpg uses
   prepared statements; transaction-mode pooling (port `6543`) does not support them, which
   surfaces as intermittent `prepared statement "__asyncpg_stmt_x__" does not exist` errors under
   concurrency — not at startup. Either use the **session-mode** pooler, or pass
   `statement_cache_size=0`. This must be decided and tested, not discovered in production.
2. **Supabase's direct connection host is IPv6-only** on current free projects. If Render's egress
   has no IPv6 route, the direct host fails and the **pooler is mandatory**, not optional.

Also: `max_size=10` per instance is generous against free-tier connection limits and should come
down, and `init=_register_jsonb_codec` runs per connection — fine with pooling, but it must stay,
or `demo_runs.result_summary` silently round-trips as text instead of dict.

---

## 4. Authorizations and remaining holds

**Granted 2026-11-05:** *all inactive Supabase projects are expendable.* All three
(`DustInTime`, `app`, `CognitoFlow`) are `INACTIVE`, so the whole set is released and Phase 0 no
longer waits on a decision. Recorded consequence: their contents are **not** inspected first. A
paused project cannot be read without restoring it, and restoring consumes one of the two free
active slots, so this authorization trades inspection for slots deliberately.

**Still on hold:**

- **Deleting `integrity-userapi-db`.** Only after a verified backup and a verified cutover
  (§5, gate G5). This one holds because it is the database with the unverified contents.

---

## 5. Migration phases, with gates

Backup first, delete last. Each phase has a gate that must pass before the next begins.

### Phase 0 — free a Supabase slot *(needs an operator action, not a decision)*
Authorized per §4: all three inactive projects go. **But the Supabase MCP surface has no project
delete tool** — it exposes `create_project`, `pause_project` and `restore_project` only. So the
deletion is a dashboard action the operator performs; an agent cannot do it from here.

Before asking for that, probe whether it is even needed: attempt Phase 1's `create_project`
directly. Supabase's free limit is on *active* projects, and all three existing ones are paused, so
the create may simply succeed. If it is refused for a project-count limit, the dashboard deletions
become a hard prerequisite. Ordering the probe first avoids three irreversible deletions that might
buy nothing.

**Gate G0:** either a successful `create_project`, or the operator confirms the deletions are done.
Either way, record which projects were removed — nothing inspected them, so the record is the only
trace that they existed.

### Phase 1 — provision the userapi project
Create a Supabase project in **us-west-2** (pairs with Render `oregon`). Record project ref, pooler
host, and port. Capture both the session-mode and transaction-mode connection strings.
**Gate G1:** project `ACTIVE_HEALTHY`.

### Phase 2 — make the pool pooler-safe *(code change, TDD)*
Modify `app/db.py`'s `create_pool` to take an explicit `statement_cache_size` and a lower
`max_size`, defaulting to values that work through a transaction-mode pooler.

- Failing test first: a test asserting `create_pool` passes `statement_cache_size=0` through to
  asyncpg (patch `asyncpg.create_pool`, assert the kwarg) — it fails today because the kwarg is absent.
- Then the change, keeping `init=_register_jsonb_codec` intact.
- **Gate G2:** new test passes; `integrity-userapi`'s existing suite still passes against a local
  Postgres (`TEST_DATABASE_URL`).

### Phase 3 — back up the Render database
Its IP allowlist is empty, so an external `pg_dump` cannot reach it. Two options, operator's choice:
(a) temporarily add an allowlist entry, dump, then remove it; or (b) run `pg_dump` from inside
Render (one-off job / shell on the existing service) and ship the dump out.
**Gate G3:** a restorable dump exists off-platform, with `schema_migrations` rows and a per-table
row-count summary captured alongside it. **This gate also finally answers whether the database holds
real data** — which §2 could not determine.

### Phase 4 — stand the schema up on Supabase
Point `TEST_DATABASE_URL` at the new project and run the existing migration test — it asserts every
`migrations/*.sql` on disk was applied, so it is a real schema-completeness gate, not a smoke test:

```
cd integrity-userapi && TEST_DATABASE_URL=<supabase-session-pooler-dsn> \
  uv run pytest tests/test_db_migrations.py -v
```

Then restore the Phase 3 dump's **data** (schema already created by the migrator; restore data only,
to avoid conflicting DDL).
**Gate G4:** migration test green against Supabase, and per-table row counts equal the Phase 3
summary. A mismatch stops the migration.

### Phase 5 — cut the service over
Update `DATABASE_URL` on `integrity-userapi-test` to the Supabase pooler DSN; redeploy. Exercise a
real write path, not just `/health` — `/health` returns 200 without touching Postgres, so it cannot
detect a broken database. Re-run under light concurrency to catch the prepared-statement failure
mode from §3, which does not appear on a single request.
**Gate G5:** a real read and a real write succeed, and no `prepared statement` errors appear in logs
under concurrency.

### Phase 6 — release the Render database
Only now, and only on operator confirmation: delete `integrity-userapi-db`, removing the
2026-12-04 liability. Keep the Phase 3 dump for at least 30 days.
**Gate G6:** deletion confirmed; dump retained and its location recorded.

### Phase 7 — promote the pattern
Record "Render = compute + static, Supabase = state" as the ecosystem standard, then apply it:
- **Cortex** — has no database today, so it is a greenfield adopter rather than a migration.
- **Shield** — Phase A of the Tier 3 work needs no database. Its control plane (durable promotion
  state, device identity, remote-contain audit) adopts the pattern but on a **paid** tier, because
  of the idle-pausing constraint in §2.1.

This document lives in `integrity-console` because the first migration does. Once Phase 5 proves the
pattern, promote §1 to `integrity-core`'s `docs/ecosystem/` as the cross-repo standard.

---

## 6. Open questions

1. ~~Which Supabase projects are expendable~~ — answered 2026-11-05: all inactive ones (§4).
   What remains is mechanical: whether a `create_project` succeeds with three paused projects in
   place, or the dashboard deletions are a prerequisite (Phase 0).
2. Session-mode vs transaction-mode pooler. Transaction mode scales better and needs
   `statement_cache_size=0`; session mode preserves prepared statements with fewer connections.
   Phase 2 should make this configuration, not a hardcoded choice.
3. Whether `integrity-userapi-test` should keep running from `fix/ui-consistency` or move to `main`
   before being treated as the thing worth migrating.
4. Whether the console's own backend needs for the Shield/Cortex consoles change this allocation —
   deferred until Shield's control-plane spec exists.
