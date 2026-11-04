# integrity-console

The operator console for the Integrity Protocol: the web dashboard agents are registered and
monitored through, the user-account API behind it, and the demo scenario engine.

The cross-product execution authority is maintained in [integrity-core/docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md](https://github.com/XibalbaTechSol/integrity-core/blob/main/docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md). Console documentation defines UI and API implementation only; the console holds no authority over Integrity identity, packs, receipts, Shield enforcement, or Cortex content.

It was split out of [integrity-core](https://github.com/XibalbaTechSol/integrity-core) with its
full history (integrity-core `docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md`, Phase A1). The console is a *client* of
the protocol: it reads the oracle's HTTP API and the chain, and talks to Shield and Cortex. It
holds no protocol logic of its own.

## What this repository is, and is not

**It is** the presentation and account layer: a React operator UI, a FastAPI service for user
accounts and developer API keys, and a Python scenario runner used for demos and seeding.

**It is not** a trust backend. Nothing here computes an Agent Integrity Score, anchors a
Behavioral Commitment Chain, defines a Merkle convention, enforces a policy, or owns a chain
schema. Those live in `integrity-core` (protocol, oracle, BCC, contracts), `xibalba-shield`
(endpoint enforcement) and `xibalba-cortex` (memory and provenance). When those services are not
running, the UI is meant to show an honest unavailable state rather than invent data.

A consequence worth stating plainly: **the console cannot be the source of truth for anything it
displays.** If a number here disagrees with the oracle or the chain, the oracle or the chain is
right and this is a rendering bug.

## Repository layout

| Path | Stack | Role |
|---|---|---|
| `integrity-dashboard/` | React 18 / Vite / TypeScript / Tailwind | Operator UI; Playwright end-to-end tests in `e2e/` |
| `integrity-dashboard/demo/` | Python 3.12 (uv) | Demo scenario engine against a live deployment |
| `integrity-userapi/` | Python 3.12 / FastAPI / Postgres 16 | User accounts, API keys, ownership pointers; its own database, never the oracle's |
| `docs/ecosystem/` | Markdown | Pointer to the authoritative cross-product documents |
| `deploy/systemd/` | systemd unit | Local managed preview of the built dashboard |
| `docker-compose.yml` | Compose | Local console stack (dashboard, userapi, its Postgres) |
| `.github/workflows/ci.yml` | GitHub Actions | The repository's only active CI workflow |

## Architecture

The dashboard is a browser application, so most of its "backends" are origins the *browser*
reaches, not services this repo runs.

```
                       browser (operator)
                              │
        ┌────────────┬────────┴────────┬──────────────┐
        │            │                 │              │
   oracle :8080  BCC :8000       userapi :8090   dashboard :5173
  (integrity-core)(integrity-core)      │        (this repo, Vite)
        ▲                               │              │
        └───────── read-only HTTP ───────┘              │ same-origin proxies
                  (GET /v1/agent/{id})                  │  (Node side, token attached)
                                                        ├── /api/shield → 127.0.0.1:8435
   userapi Postgres :5435 ◀── userapi                   └── /cortex-api → 127.0.0.1:8420
   (separate trust domain)
```

Three boundaries are deliberate and should not be "simplified" away:

1. **The user API has its own Postgres, separate from the oracle's.** Accounts, password hashes,
   developer API keys, wallet pointers and demo-run rows are user data, not protocol data.
2. **The user API never touches a chain.** There is no `RPC_URL`, `CHAIN_ID` or deployments
   setting in `integrity-userapi/app/config.py`, by design. Its single cross-service knob is
   `oracle_url`, used only to proxy read-only HTTP reads (e.g. `GET /v1/agent/{id}`) when
   serving `GET /me/agents`. The `/me/wallet` endpoints are consistent with this: they are a
   **custodial ITK ledger held in Postgres**, not a chain wallet. A row is created on first read
   with a development faucet balance and a randomly generated address, and a transfer debits the
   sender and credits the recipient only if the recipient is another custodial app wallet — an
   external `0x` address is a debit only. No transaction is ever broadcast.
3. **Shield and Cortex credentials never enter the browser bundle.** `vite.config.ts` reads
   their token files on the Node side and attaches `Authorization` to proxied requests only,
   replacing (never forwarding) whatever the browser sent. Any `VITE_*` value, by contrast, is
   compiled into the bundle and must be treated as public. Both proxies are configured for the
   dev server *and* `vite preview`, and both bind to loopback. A missing token file leaves the
   request unauthenticated so the page shows its unavailable state instead of failing to boot.

Token files, overridable via `DASHBOARD_SHIELD_TOKEN_FILE` / `DASHBOARD_CORTEX_TOKEN_FILE`:

| Service | Default token file |
|---|---|
| Shield backend | `~/.xibalba-shield/backend-admin.token` |
| Cortex local API | `~/.hermes/xibalba-cortex/.viewer-dev.token` |

## Ports

| Port | Service | Owner |
|---|---|---|
| 5173 | Dashboard dev server (`npm run dev`, and the compose `dashboard` service) | this repo |
| 4173 | Dashboard `vite preview` (the systemd unit) | this repo |
| 5189 | Dashboard dev server booted by the Playwright suites | this repo |
| 8090 | `integrity-userapi` | this repo |
| 5435 | `integrity-userapi` Postgres, on the host | this repo |
| 8080 | Oracle HTTP API | integrity-core |
| 8000 | BCC middleware | integrity-core |
| 8435 | Shield backend control plane (proxy target) | xibalba-shield |
| 8420 | Cortex local API (proxy target) | xibalba-cortex |
| 5193 / 5190 | Shield UI / Cortex UI deep links, as compose sets them | xibalba-shield / xibalba-cortex |

Note a real inconsistency: `src/config.ts` defaults the Shield and Cortex **UI** deep links to
`https://localhost:9444` and `https://localhost:9443`, while `docker-compose.yml` sets them to
`http://localhost:5193` and `http://localhost:5190`. Whichever your local deployment actually
serves is the one to set explicitly; the defaults are not a contract.

## Dashboard routes

Canonical routes (`integrity-dashboard/src/App.tsx`):

| Route | Page | Notes |
|---|---|---|
| `/` | `LandingPage` | Public, no app chrome |
| `/auth` | `AuthPage` | Login and registration |
| `/docs`, `/privacy`, `/terms` | `DocsPage`, `PrivacyPage`, `TermsPage` | Public layout |
| `/dashboard` | `ProtocolDashboardPage` | "Command center"; identity register/claim lives on its Overview tab |
| `/agents` | `AgentRegistryPage` | Agent registry |
| `/ais` | `AisPage` | AIS radar, simulator, telemetry, derivation math — display only; scoring is the oracle's |
| `/evidence` | `CorrelationPage` | Evidence ledger |
| `/treasury` | `TreasuryControlPage` | Wallets, transactions, markets |
| `/health` | `HealthPage` | Integrity Health vertical: Smart BAA authoring and EHR-gate compliance. Not service health — that lives in `services/health.ts`, used by the header and the guided system test |
| `/system` | `SystemControlPage` | Operations |
| `/settings` | `SettingsPage` | Operator settings |
| `/wiki` | `WikiPage` | Lazy-loaded, read-only generated wiki projection |

Legacy deep links redirect rather than 404, each converging on one canonical page:

| Redirects to | From |
|---|---|
| `/dashboard` | `/identity`, `/security`, `/shield` |
| `/agents` | `/knowledge`, `/memory`, `/fleet` |
| `/ais` | `/intelligence` |
| `/evidence` | `/records`, `/proofs`, `/contracts`, `/activity`, `/correlation` |
| `/treasury` | `/wallets`, `/transactions`, `/financials`, `/prediction-markets`, `/quant` |
| `/system` | `/kernel`, `/kernel-intent`, `/licence`, `/developer` |

Left-rail navigation is declared once in `src/navigation.tsx`, which also carries each item's
legacy aliases so an aliased URL still highlights the right nav entry.

Service clients live in `src/services/` — `oracle.ts`, `userapi.ts`, `bccMiddleware.ts`,
`shieldBackend.ts`, `graphMemory.ts`, `aisProfile.ts`, `health.ts`, `testResults.ts` — and chain
reads in `src/chain/` (`agent`, `kernel`, `licence`, `shield`, `xns`, `bytecode`, `retry`).

## User API reference

Base URL `http://127.0.0.1:8090` locally. Session auth is an HttpOnly cookie carrying a JWT;
CORS runs with `allow_credentials=True` against an explicit origin allow-list in
`app/config.py`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness |
| `POST` | `/auth/register` | Create an account, returns a token and sets the session cookie |
| `POST` | `/auth/login` | Log in |
| `POST` | `/auth/logout` | Revoke the session (JWT revocation table) |
| `GET` | `/me` | Current user |
| `GET` | `/me/wallet` | The user's custodial app wallet, created on first read with a development faucet balance |
| `POST` | `/me/wallet/transfer` | Move ITK between custodial balances, inside one Postgres transaction |
| `GET` | `/me/agents` | Owned agents, enriched via read-only oracle reads |
| `POST` | `/me/agents` | Attach an agent to the account |
| `GET` | `/api-keys` | List developer API keys |
| `POST` | `/api-keys` | Issue a key. Only the hash is stored, so the raw key is returned exactly once |
| `DELETE` | `/api-keys/{key_id}` | Revoke a key |
| `GET` | `/me/policy-packs` | List policy packs |
| `POST` | `/me/policy-packs` | Create a pack |
| `POST` | `/me/policy-packs/{pack_id}/revisions` | Add a revision |
| `POST` | `/me/policy-packs/{pack_id}/activate` | Activate a revision |
| `POST` | `/demo/run` | Start a demo run (background task) |
| `GET` | `/demo/runs` | List demo runs |
| `PATCH` | `/demo/runs/{run_id}` | Update a run |

A word on policy packs, because the state is easy to misread. The endpoints above are **live on
`main`** — `park/policy-packs-2026-09-26` has been merged, and migration `0004_policy_packs`
ships with the schema. But storing packs in the user API is *not* the target architecture: under
the ecosystem plan packs are signed files, and only this UI surface is intended for reuse.
`PolicyPacksPage.tsx` is correspondingly unrouted. Treat the endpoints as a reachable but
superseded surface, not as the pack system.

Migrations are plain SQL in `integrity-userapi/migrations/`, applied in order:
`0001_init`, `0002_jwt_revocation`, `0003_user_wallets`, `0004_policy_packs`.

## Configuration

Dashboard, read in `src/config.ts`. Every `VITE_*` value is compiled into the browser bundle —
never put a secret in one.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_ORACLE_URL` | `http://localhost:8080` | Oracle HTTP API |
| `VITE_USERAPI_URL` | `http://localhost:8090` | This repo's user API |
| `VITE_BCC_MIDDLEWARE_URL` | `http://localhost:8000` | BCC middleware |
| `VITE_CHAIN_ID` | `84532` | Base Sepolia |
| `VITE_GRAPH_MEMORY_URL` | `/cortex-api` | Cortex API; the default keeps it same-origin through the proxy |
| `VITE_GRAPH_MEMORY_TOKEN` | *(empty)* | Opt-in only, so a production bundle never ships a dev credential |
| `VITE_SHIELD_BACKEND_URL` | *(empty)* | Empty means same-origin `/api/shield` proxy |
| `VITE_SHIELD_BACKEND_TOKEN` | *(empty)* | As above — prefer the proxy over a bundled token |
| `VITE_SHIELD_TENANT_ID` | *(empty)* | Shield tenants are control-plane namespaces, not agent DIDs |
| `VITE_SHIELD_UI_URL` | `https://localhost:9444` | Deep link to Shield's own UI |
| `VITE_CORTEX_UI_URL` | `https://localhost:9443` | Deep link to Cortex's own UI |
| `VITE_ALLOW_UNSCOPED_AGENT_DIRECTORY` | `false` | Operator/dev view of the global oracle directory. **Not** an authorization boundary — production agent selection must come from the authenticated userapi ownership projection |

Copy `integrity-dashboard/.env.example` to `.env` to set these locally; `.env` is untracked.

Cross-UI agent handoff is carried in the URL, not browser storage: the Dashboard, Cortex and
Shield UIs are separate origins and cannot share `localStorage`. `config.ts` exports
`sharedAgentParams()` / `withSharedAgentScope()`, which pass the pair `{store_id, agent_id}` —
the DID alone is not a namespace. This is a hint for continuity, not an authorization boundary.

User API, read in `app/config.py` (and `app/security.py` for the cookie flag):

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | local Postgres | User data only |
| `ORACLE_URL` | `http://localhost:8080` | Read-only oracle proxying |
| `ORACLE_TIMEOUT_SECONDS` | `5.0` | Oracle call timeout |
| `JWT_SECRET` | random per process | **Set this.** Unset means a freshly generated secret each boot, so every session dies on restart |
| `JWT_ALGORITHM` / `JWT_EXPIRY_MINUTES` | `HS256` / `1440` | Session token shape |
| `DEFAULT_API_KEY_TRUST_CEILING` | `300` | AIS trust ceiling stamped on new developer keys |
| `LOGIN_FAILURE_THRESHOLD` / `LOGIN_LOCKOUT_DURATION_SECONDS` | `5` / `300` | Login rate limiting (`app/login_limiter.py`), deliberately looser than BCC's agent circuit breaker because humans mistype passwords |
| `CORS_ORIGINS` | local UI ports | Must list both `localhost` and `127.0.0.1` forms — they are distinct CORS origins |
| `USERAPI_INSECURE_COOKIES` | unset | `1` omits the `Secure` cookie attribute. Required for plain-HTTP localhost, where the browser would otherwise never return the session cookie. Never set it in production |

Demo (`integrity-dashboard/demo/`) needs `FUNDER_PRIVATE_KEY` and `INTEGRITY_WALLET_PASSWORD`,
supplied through the environment. Do not commit either.

## Running locally

integrity-core is a prerequisite — it serves the oracle and BCC middleware this console reads.

1. **Start the core stack** in an integrity-core checkout: `make up`. That serves the oracle on
   `:8080` and BCC on `:8000`.
2. **Start the console:** `docker compose up --build`. The dashboard comes up on
   `http://127.0.0.1:5173` and the user API on `:8090`, with its Postgres on `:5435`.

The compose `dashboard` service runs the Vite **dev** server (`npm run dev --host 0.0.0.0`), so
its `VITE_*` values take effect when the container starts. Those values are browser-facing by
design: they name host ports, because the code using them runs in the operator's browser, not in
the container. The browser reaches the oracle, BCC and the user API through the host this way.

One limit to know about compose: **the token-attaching proxies do not work in the container.**
Compose sets `VITE_SHIELD_BACKEND_URL` explicitly, so Shield calls go straight from the browser
with no token attached, bypassing `/api/shield` entirely. `VITE_GRAPH_MEMORY_URL` is unset, so
Cortex falls back to the same-origin `/cortex-api` proxy — which runs *inside* the container,
where `127.0.0.1:8420` is the container's own loopback and the `~/.hermes/...` token file is not
present. If you need authenticated Shield or Cortex panels, run the dashboard on the host with
`npm run dev` or `npm run preview`.

Per package, without compose:

```bash
cd integrity-dashboard && npm ci --legacy-peer-deps && npm run dev   # also: build, lint
cd integrity-userapi && uv sync && uv run pytest                    # needs userapi-postgres on :5435
cd integrity-dashboard/demo && uv sync && uv run integrity-demo      # needs FUNDER_PRIVATE_KEY, INTEGRITY_WALLET_PASSWORD
```

`docker compose up userapi-postgres` alone is enough to run the user API test suite, which
expects that instance on `:5435` and otherwise fails with a connection error.

The demo ships three entry points, and the difference between them matters:

| Entry point | What it does |
|---|---|
| `integrity-demo` | Runs the demo scenario |
| `integrity-heartbeat` | Continuous activity generator for the demo personas. Every event goes through the real signed pipelines — Ed25519-signed telemetry verified by the oracle, and signed BCC commitments evaluated by the middleware's OPA engine. The task text is scripted; the signatures and policy decisions are genuine, and it writes to no database directly |
| `integrity-seed-audit` | A **labeled test harness** that writes backdated rows directly into integrity-oracle's Postgres, so a full UI audit has deep history immediately. It reuses real registered testnet identities, but it bypasses ingestion — never point it at anything you would call production data |

It depends on `integrity-sdk` pinned to integrity-core's `main` branch until the
`integrity-sdk-v0.1.0` tag exists; then it pins that tag. Because that is a git dependency on a
private repository, `uv sync` here needs GitHub read access to integrity-core.

## Dashboard commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server, with the Shield and Cortex proxies |
| `npm run build` | `tsc -b` then the Vite production bundle |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the built `dist/`, proxies included |
| `npm run test-e2e` | Playwright suite against a real backend stack |
| `npm run test:e2e:validation` | Validation suite (`playwright.validation.config.ts`), with HTML/JSON/JUnit reports |
| `npm run test:e2e:validation:headed` | The same, in a visible browser |
| `npm run test:e2e:validation:all-browsers` | The same, across every configured browser |
| `npm run test:e2e:validation:report` | Open the last validation HTML report |
| `npm run sync-wiki` | Regenerate `src/generated/wiki-data.json`. Needs `INTEGRITY_WIKI_SOURCE` after the split — see below |
| `npm run sync-chain-bytecode` | Rewrite `src/chain/bytecode.ts` from Foundry artifacts. Does not work in this repo as-is — see below |

Both sync scripts predate the A1 split and still resolve paths as if this were the old
monorepo:

- `sync-wiki.mjs` defaults its source to `<repo>/docs/wiki`, which does not exist here. Point it
  at an integrity-core checkout with `INTEGRITY_WIKI_SOURCE=/path/to/integrity-core/docs/wiki`.
  `INTEGRITY_WIKI_COMMIT` and `INTEGRITY_WIKI_UPDATED_AT` override the recorded provenance.
- `sync-chain-bytecode.mjs` reads `<repo>/contracts/out/<Name>.sol/<Name>.json`. This repo has no
  `contracts/` directory and the script takes no override, so it cannot run here without being
  changed. The contracts live in integrity-core.

## Testing

| Suite | Command | Needs |
|---|---|---|
| User API | `uv run pytest` in `integrity-userapi` | Postgres on `:5435` |
| Demo | `uv run pytest` in `integrity-dashboard/demo` | GitHub read access to integrity-core, for the `integrity-sdk` git dependency |
| Dashboard build + lint | `npm run build`, `npm run lint` | Nothing external |
| Dashboard end-to-end | `npm run test-e2e` | A real backend stack |

The end-to-end suites are real-backend, not mocked: both configs boot their own dev server on
`:5189` and expect the oracle, BCC and user API to be reachable. The tree currently holds 24 spec
files in `integrity-dashboard/e2e/` with 137 test declarations, across desktop, tablet and mobile
viewport projects, with `@axe-core/playwright` available for accessibility assertions.

CI (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`, in two jobs:

- **`integrity-userapi (pytest)`** — `uv sync` then `uv run pytest`, against a Postgres service
  container.
- **`integrity-dashboard (build + lint)`** — `npm ci --legacy-peer-deps`, `npm run build`,
  `npm run lint`, and `uv run pytest` for the demo package.

**End-to-end tests do not run in CI.** `integrity-dashboard/.github/workflows/` also contains
`e2e.yml` and `wiki-sync.yml`, but GitHub Actions only reads workflows from the repository root
`.github/workflows/`, so those two are inert. Run the end-to-end suite locally.

## Deployment

`deploy/systemd/integrity-dashboard.service` serves whatever `npm run build` last produced, via
`vite preview` on `127.0.0.1:4173`, from the **base checkout** at
`~/Projects/integrity-console/integrity-dashboard`.

Because a live service reads that checkout, it is a read-only base: editing it is an accidental
deploy. Feature work belongs in a worktree — see `~/.hermes/WORKFLOW.md` and the `xb-wt` helper.
Building there is the deploy step itself, not routine development: land the change through a
worktree and a pull request first, then fast-forward the base and rebuild, and restart the unit
to serve the new `dist/`.

## Known caveats

Verified against the current tree, and worth knowing before you trust a surface:

- `integrity-dashboard/package.json` is still named `integrity-mvp`, from the repository's
  earlier identity. The nested `integrity-dashboard/README.md` is **stale**: it documents
  Identity, Shield, Financials, Intelligence and Memory pages that are now redirects, and its
  relative links predate the A1 split. Treat this file as the current description.
- `src/pages/KernelPage.tsx` and `src/pages/PolicyPacksPage.tsx` exist but are not routed in
  `App.tsx`; they are unreachable in the running app.
- `integrity-userapi/app/config.py` declares `jwt_secret` twice (and imports `Field` twice). The
  second declaration wins, so the named `_generate_jwt_secret()` helper and its explicit warning
  are dead code, replaced by a bare lambda. The documented behaviour above is unaffected: with
  no `JWT_SECRET`, a fresh secret is generated per process and sessions do not survive a
  restart.
- About thirty one-off `fix_*.py` / `patch_*.py` / `strip_*.py` / `rewrite_*.py` scripts sit at
  the root of `integrity-dashboard/`. They are historical single-use codemods, not tooling to
  run.
- `integrity-dashboard/Dockerfile` runs a plain `npm ci`, while every documented host workflow
  uses `npm ci --legacy-peer-deps`. Whether the image build trips on peer dependencies has not
  been verified here, but the two install paths differ.
- The dashboard's Vite build warns about large chunks (Mermaid, KaTeX, three.js, graph and chart
  dependencies). It is a performance target, not a build failure.
- The `/wiki` route is a read-only projection of `integrity-core/docs/wiki`. Edits made to the
  rendered surface are not reconciled upstream and will be overwritten by `npm run sync-wiki`.

## History

Commits up to the import are integrity-core's own, filtered to these directories with
`git filter-repo`, so `git log` and `git blame` keep their original authors and dates. The
unmerged dashboard work from integrity-core came across as branches:
`feat/cortex-operations-dashboard` and `park/policy-packs-2026-09-26`. Both have since been
merged into `main`; the pack branch's ref still exists on the remote, which is why its status is
worth stating explicitly above rather than inferring from the branch list.

Licensed under the MIT License (see `LICENSE`).
