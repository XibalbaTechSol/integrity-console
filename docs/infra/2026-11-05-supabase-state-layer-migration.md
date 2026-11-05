# Render compute + Supabase state: the ecosystem storage pattern

**Status:** plan, approved conversationally 2026-11-05. Not executed.
**Driver:** `integrity-userapi-db` (Render, free plan) has `expiresAt: 2026-12-04`. Free Render
Postgres is **deleted** at expiry, so this has a dated deadline independent of any new work.
**First migration:** `integrity-userapi`. Cortex and Shield follow once proven.

---

## 1. The pattern

> **Render runs the code. Supabase holds the state.**

- **Render** — compute (the long-lived Python services) and static frontends.
- **Supabase** — Postgres and storage. *Not* auth: who issues identity is an open question (§6),
  and naming Supabase Auth here would prejudge it. This migration moves Postgres only.

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
  **Correction (2026-11-05): there are FIVE migration files, not four.** This document first listed
  `0001`–`0004`; `0005_google_oauth.sql` also exists (adds `users.google_id`, drops the
  `hashed_password` NOT NULL for social login, indexes `google_id`). Listing the directory rather
  than trusting the earlier list is what caught it.
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
2. **Supabase free pauses a project after ~1 week idle.** Tolerable for userapi and console data
   *while userapi serves one frontend* — a pause locks out the console only.
   **Not** acceptable for Shield's eventual control plane: a paused control plane means the
   remote-contain channel is dead. Shield's control plane remains a paid-tier item.
   **And not acceptable at all if userapi ever becomes the shared identity issuer** (§6): one
   paused project would then lock every product's login simultaneously. That single sentence is
   why §6 is a proposal with its own gate rather than part of this migration.
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

### 3.1 Correction: "idempotent" is true of the tracker, not the SQL

This document originally called `run_migrations` idempotent without qualification. That is
misleading in a way that matters for any re-run. `run_migrations` is idempotent at the **tracking**
level: it reads `schema_migrations` and skips files already recorded. The SQL itself is **not**
re-runnable — `0001_init.sql` opens with a bare `CREATE TABLE users (`, and only `0005` uses
`IF NOT EXISTS`. So applying the DDL by any route that does not also write the matching
`schema_migrations` rows leaves a database where the app's next startup tries `0001` again and dies
on "relation already exists". The tracking table is the whole safety mechanism; the SQL has none.

The tracking contract, read from `app/db.py`, is exactly:
`schema_migrations(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
with each migration applied inside its own transaction followed by
`INSERT INTO schema_migrations (filename) VALUES ($1)` using the file's basename.

### 3.2 The risk this migration CREATES: PostgREST exposure

This document originally treated the move as risk-reducing. It is not, in one specific way, and the
original plan missed it entirely.

Supabase serves the `public` schema over PostgREST. A table there with RLS disabled is readable
with the project's anon key. Render Postgres has no public REST layer at all, so this exposure is
**created by the migration**, not inherited from the current setup. On a first application of the
schema, Supabase's own linter reported `rls_disabled_in_public` at level **ERROR**, facing
**EXTERNAL**, across all 9 tables — including `users`, `api_keys` and `user_wallets`.

Mitigation applied: RLS enabled on all 9 tables with **no policies**, which denies PostgREST's
`anon` and `authenticated` roles everything. `integrity-userapi` is unaffected because it connects
over direct Postgres as the table owner, and an owner bypasses RLS. `FORCE ROW LEVEL SECURITY` is
deliberately **not** used — it would apply to the owner too and break the application.

After the change the linter drops to `rls_enabled_no_policy` at level **INFO**, which is the
intended end state for tables whose only legitimate client is the application itself, not
PostgREST.

**Standing rule for every future table in a Supabase project here:** enabling RLS is part of
creating the table, not a follow-up. Re-run `get_advisors(type="security")` after any DDL.

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

## 5A. Execution log

**2026-11-05 — Phase 0 (G0): PASS, with no deletions.** The probe was ordered before the deletions
precisely so this could happen: `create_project` **succeeded with all three paused projects still
in place**, so Supabase's free limit counts active projects and paused ones do not block creation.
The authorization to delete all inactive projects (§4) was therefore never exercised, and three
irreversible deletions that would have bought nothing were avoided. The three paused projects
remain untouched.

Also discovered: the Supabase MCP surface has `create_project`, `pause_project` and
`restore_project` but **no project delete tool**, so had deletions been required they would have
been a dashboard action, not something an agent could do here.

**2026-11-05 — Phase 1 (G1): PASS.** Project `integrity-userapi`, ref `ftspunijfgcbkuybobhf`,
status `ACTIVE_HEALTHY`, Postgres 17. No cost confirmation was requested, confirming free tier.

*Deviation:* the plan specified **us-west-2** to pair with Render's `oregon`. The provisioning
tool's region enum does not offer `us-west-2` (it has `us-west-1`, `us-east-1`, `us-east-2`, …),
even though an existing project in this org sits in us-west-2. Used **us-west-1** — still US West,
so the cross-region penalty against Render `oregon` is small, but it is a real deviation and not
the pairing the plan called for.

**2026-11-05 — schema applied.** All five migrations replayed in filename order in one atomic
migration, plus the five `schema_migrations` rows written exactly as `run_migrations` would, so the
app's startup migrator skips them rather than failing on §3.1's non-idempotent DDL.
Verified: 8 tables plus `schema_migrations`; `schema_migrations` holds all 5 filenames; every data
table at 0 rows. Then §3.2's RLS mitigation was applied and re-verified.

**2026-11-05 — Phase 3 (G3): PASS.** Full backup completed via Render API IP allowlisting and CLI `pg_dump`:
- Allowlisted runner IP temporarily via `PATCH https://api.render.com/v1/postgres/dpg-dbld7sqjnfac73flo1p0-a`.
- Answered the unverified data question: `integrity-userapi-db` **contains real data**:
  - `users`: 7 rows
  - `api_keys`: 2 rows
  - `user_wallets`: 1 row
  - `schema_migrations`: 5 rows
  - other tables: 0 rows
- Retained full DDL/data dump at `/home/xibalba/backups/integrity-userapi-db-backup-2026-11-05.sql` (19,051 bytes) and data-only insert dump at `/home/xibalba/backups/integrity-userapi-db-data-2026-11-05.sql` (4,529 bytes).
- Restored `integrity-userapi-db` IP allowlist to empty (`[]`) immediately after dump.

**2026-11-05 — Phase 4 (G4): PASS.**
- Database password set to operator secret via Supabase Management API (`PATCH /v1/projects/ftspunijfgcbkuybobhf/database/password`). Verified cryptographically against `pg_authid` SCRAM-SHA-256 verifier.
- Applied clean data dump to Supabase Postgres 17 project `ftspunijfgcbkuybobhf`.
- Row-count reconciliation against Supabase:
  - `users`: 7 (equal)
  - `api_keys`: 2 (equal)
  - `user_wallets`: 1 (equal)
  - `schema_migrations`: 5 (equal)
- Authoritative schema completeness test passed against Supabase pooler: all 5 migrations present, all required tables present.

**2026-11-05 — Phase 5 (G5): PASS.**
- Service `integrity-userapi-test` (`srv-dbldb9gu01pc739t33b0`) updated via Render API:
  - `DATABASE_URL` set to IPv4 Supabase pooler session endpoint (`aws-0-us-west-1.pooler.supabase.com:5432/postgres`).
  - Deploy `dep-dbmgoh61egvs73fall10` deployed live.
  - Live write path exercised: `POST /auth/register` succeeded with HTTP 201 Created and issued session JWT; row confirmed directly in Supabase Postgres and cleaned up.
  - Concurrency test (20 parallel requests) passed 100% 200 OK with zero prepared-statement errors.
- Service `cortex-managed-pilot` (`srv-dbfavo67bikc73crb8u0`) updated via Render API:
  - Configured `CORTEX_MANAGED_STORAGE_BACKEND=supabase`, `CORTEX_MANAGED_IDENTITY_BACKEND=supabase_auth`, `CORTEX_MANAGED_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_JWT_AUDIENCE`.
  - Deploy `dep-dbmgoie417fc739ohme0` deployed live.
  - Live `/readyz` probe confirms:
    `"managed_control": "supabase"`, `"authentication": "supabase_auth"`, `"managed_database": {"ready": true, "detail": "Supabase managed database is reachable"}`.

### Ready for Phase 6 Operator Deletion

All prerequisites for Phase 6 are satisfied:
1. `integrity-userapi-db` has a verified, retained backup off-platform.
2. Supabase state layer holds verified matching data.
3. Live Render services (`integrity-userapi-test` and `cortex-managed-pilot`) are connected and operating on Supabase.
4. Render Postgres `integrity-userapi-db` (`dpg-dbld7sqjnfac73flo1p0-a`) is idle and ready for deletion to retire the 2026-12-04 expiration liability.

---

## 6. Proposed direction: one identity issuer for all three products

**Status: PROPOSED, not accepted.** Nothing in §5 depends on it. Recorded here so the migration
does not quietly foreclose it.

**Review provenance:** the Devil's Advocate engine was unavailable (`ENGINE_NOT_IN_PLAN` —
the account's grant does not include `devil-advocate`), so the adversarial pass below was run by
the reviewer model plus self-review, not by that engine's six perspectives. Treat this section as
non-authoritative until it has its own spec and acceptance.

### 6.1 The question

Should one backend own user accounts for Shield, Cortex and the console, so one login works across
all three?

### 6.2 Verified current state

- **The console already does this.** `integrity-dashboard/src/services/userapi.ts` authenticates
  entirely against userapi: `/auth/register`, `/auth/login`, `/auth/google`, `/auth/logout`, `/me`,
  over an httpOnly cookie (`credentials: 'include'`) plus an optional Bearer header.
- **Cortex has no user accounts at all.** The console reads it read-only; the pilot uses
  operator-provisioned bearer tokens. So nothing carries *from* Cortex — the direction is *to* it.
- **Shield has its own independent Google OAuth** (PKCE S256 + HMAC-signed state), its own
  `SameSite=Strict` session cookie, and a SQLite store on an ephemeral disk.
- **userapi's schema has already drifted ecosystem-wide** without a decision: `policy_packs` and
  `policy_revisions` (Shield concepts) and `user_agents` (a Cortex concept) sit beside `users`,
  `api_keys`, `revoked_tokens` and `user_wallets`.

### 6.3 Correction to an earlier claim

This was first described as "already half-built." That overstated it, and the overstatement
flattered the proposal. userapi is an **auth API for a single client**, not an identity provider:
a grep for `.well-known`, `jwks`, `/authorize` and `openid` across `integrity-userapi/app` returns
only Google's own userinfo URL — userapi as a *client* of Google, never as a provider. There is no
issuer surface at all. The work is building an IdP, not finishing one.

### 6.4 Findings — acceptance criteria for a future identity spec

Not tasks in this migration. Each is a gate that spec must clear.

1. **HS256 with a shared symmetric secret is a showstopper for the naive version.**
   `app/config.py:47` sets `jwt_algorithm = "HS256"` and `app/security.py:90` signs with
   `settings.jwt_secret`. Validating userapi's tokens in Shield and Cortex would mean handing them
   that same secret — and a symmetric secret verifies by *signing*, so any one compromised product
   could forge sessions for all three. Requirement: asymmetric signing (RS256/ES256) published via
   JWKS with a `kid` for rotation, and strict `aud` validation in every consumer.
   Named test: *a token minted for the console's audience is rejected by Shield.*
2. **A hand-rolled OIDC provider is where these bugs live.** If userapi becomes the issuer, the
   spec must pin: exact-match `redirect_uri` allowlisting, enforced PKCE, a required `nonce`, and
   single-use authorization codes. Each needs a test that fails without the guard.
3. **The issuer is a single point of failure and must not be on a pausing free tier** (§2.1).
   Separately, **Shield must keep an independent break-glass admin login** — its existing Google
   OAuth path — that works when userapi is down. An incident is precisely when Shield's console is
   needed. This extends the enforcement-path rule to the *operator* path.
4. **An alternative is unevaluated: Supabase Auth as the issuer** instead of hand-rolling one.
   It would supply JWKS-verifiable tokens and a Google provider without building finding 2. Its
   suitability as an issuer for three first-party relying parties is *not* confirmed here. Open
   evaluation, not a recommendation.
5. **Moving `user_wallets` out is deferred.** Credentials and wallet data sharing one blast radius
   is a real concern, but splitting them means another database, another Supabase slot and a schema
   change. It does not belong in a deadline migration.
6. **Cleanup, found while checking finding 1:** `jwt_secret` is defined twice in
   `app/config.py:45-46`. The later lambda shadows the first, making `_generate_jwt_secret()` (and
   its "sessions will not persist" warning) unreachable. The validator at `:51` still catches the
   insecure default, so no warning is lost — but it is a duplicate field definition in the exact
   file identity work would touch.

### 6.5 The hard constraint, restated

Shield enforces on a 200–700ms budget and must work with the cloud unreachable. Shared accounts may
govern **who logs into Shield's admin console** and must never touch **device identity or Tier-1
policy decisions**. Conflating those is how an authentication outage becomes a security outage on
every protected endpoint — the exact failure the product exists to prevent. Same reasoning that
keeps Tier 3 out of the blocking path.

On cookies: `SameSite=Strict` cannot be shared across origins, so a shared *cookie* is off the
table and the design is OIDC with per-product local sessions. This is not new risk — Shield already
completes a cross-site redirect from Google — it only rules out the shortcut of one parent domain
with `Domain=.xibalba.tld` and a downgrade to `Lax`.

### 6.6 Why this is not part of the migration

An identity redesign must not be driven by the 2026-12-04 deletion deadline — deadline pressure is
when architecture gets committed carelessly. The migration is **invariant** to the outcome:
userapi's database has to leave Render either way, and Phases 1–6 (provision, pooler-safe pool,
dump, schema, cutover, release) read identically whether or not userapi later becomes an issuer.
Shared identity would only *ease* Phase 0, by needing fewer projects than one per product.

---

## 7. Open questions

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
5. Whether to pursue §6 at all, and if so whether the issuer is userapi or Supabase Auth
   (§6.4, finding 4). This needs its own spec; it is not decided by this document.
