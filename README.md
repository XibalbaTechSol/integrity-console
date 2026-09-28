# integrity-console

The operator console for the Integrity Protocol: the web dashboard agents are registered and
monitored through, the user-account API behind it, and the demo scenario engine.

It was split out of [integrity-core](https://github.com/XibalbaTechSol/integrity-core) with its
full history (integrity-core `docs/EXECUTION_PLAN.md`, Phase A1). The console is a *client* of
the protocol: it reads the oracle's HTTP API and the chain, and talks to Shield and Cortex. It
holds no protocol logic of its own.

| Directory | Stack | Role |
|---|---|---|
| `integrity-dashboard/` | React / Vite / TypeScript | Operator UI; Playwright end-to-end tests in `e2e/` |
| `integrity-dashboard/demo/` | Python (uv) | Demo scenario engine against a live deployment |
| `integrity-userapi/` | Python / FastAPI / Postgres | User accounts; its own database, never the oracle's |

## Running locally

1. Start the core stack in an integrity-core checkout (`make up`). It serves the oracle on
   `:8080` and BCC on `:8000`.
2. Start the console: `docker compose up --build`. The dashboard is on `http://127.0.0.1:5173`
   and the user API on `:8090`.

Per package:

```bash
cd integrity-dashboard && npm ci --legacy-peer-deps && npm run dev   # also: build, lint
cd integrity-userapi && uv sync && uv run pytest                       # needs userapi-postgres on :5435
cd integrity-dashboard/demo && uv sync && uv run integrity-demo        # needs FUNDER_PRIVATE_KEY, INTEGRITY_WALLET_PASSWORD
```

The demo depends on `integrity-sdk` from integrity-core's `main` branch until the
`integrity-sdk-v0.1.0` tag exists; then it pins that tag.

## History

Commits up to the import are integrity-core's own, filtered to these directories with
`git filter-repo`, so `git log` and `git blame` keep their original authors and dates. The
unmerged dashboard work from integrity-core came across as branches:
`feat/cortex-operations-dashboard`, and `park/policy-packs-2026-09-26` (packs stored in the user
API, parked because packs are signed files under the plan; only its UI is to be reused).

Licensed under the MIT License (see `LICENSE`).
