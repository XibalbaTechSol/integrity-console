#!/usr/bin/env bash
set -euo pipefail

CONSOLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_ROOT="$(cd "$CONSOLE_ROOT/.." && pwd)"
INTEGRITY_ROOT="${INTEGRITY_ROOT:-$PROJECTS_ROOT/integrity-core}"
GRAPH_ROOT="${GRAPH_ROOT:-$PROJECTS_ROOT/xibalba-cortex}"
SHIELD_ROOT="${SHIELD_ROOT:-$PROJECTS_ROOT/xibalba-shield}"
GRAPH_HOME="${XIBALBA_CORTEX_HOME:-$HOME/.hermes/xibalba-cortex}"
GRAPH_PORT="${GRAPH_PORT:-8420}"
SHIELD_PORT="${SHIELD_PORT:-8765}"
SHIELD_TOKEN="${SHIELD_BACKEND_TOKEN:-dev-shield-admin}"
# MVP_ORIGIN is the superseded name, still honoured so an existing external override
# keeps working after the Console rename.
CONSOLE_ORIGIN="${CONSOLE_ORIGIN:-${MVP_ORIGIN:-http://localhost:5174}}"
GRAPH_PID=""
SHIELD_PID=""
CONSOLE_PID=""

cleanup() {
  for pid_var in GRAPH_PID SHIELD_PID CONSOLE_PID; do
    pid="${!pid_var}"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

# --- 🧠 Graph Memory Local API ---
if ! curl --silent --fail "http://localhost:${GRAPH_PORT}/api/status" >/dev/null 2>&1; then
  if [[ ! -x "$GRAPH_ROOT/.venv/bin/python" ]]; then
    printf 'Missing xibalba-cortex virtualenv: %s\n' "$GRAPH_ROOT/.venv/bin/python" >&2
    exit 1
  fi
  printf '🧠 Starting xibalba-cortex on port %s\n' "$GRAPH_PORT"
  (
    cd "$GRAPH_ROOT"
    exec .venv/bin/python -m xibalba_cortex.local_api \
      --home "$GRAPH_HOME" \
      --host localhost \
      --port "$GRAPH_PORT" \
      --allowed-origin "$CONSOLE_ORIGIN"
  ) &
  GRAPH_PID=$!
else
  printf '🧠 Using existing xibalba-cortex on port %s\n' "$GRAPH_PORT"
fi

# --- 🛡️ Shield Backend ---
if ! curl --silent --fail "http://localhost:${SHIELD_PORT}/api/shield/health" >/dev/null 2>&1; then
  if [[ ! -x "$SHIELD_ROOT/.venv/bin/python" ]]; then
    printf '⚠️  Missing shield virtualenv: %s (skipping)\n' "$SHIELD_ROOT/.venv/bin/python" >&2
  else
    printf '🛡️ Starting xibalba-shield backend on port %s\n' "$SHIELD_PORT"
    (
      cd "$SHIELD_ROOT"
      exec .venv/bin/python -m shield.backend.api \
        --host 127.0.0.1 \
        --port "$SHIELD_PORT" \
        --admin-token "$SHIELD_TOKEN"
    ) &
    SHIELD_PID=$!
  fi
else
  printf '🛡️ Using existing xibalba-shield backend on port %s\n' "$SHIELD_PORT"
fi

# --- 👁️ Human Control Center (Console) ---
printf '👁️ Starting integrity-console dashboard on %s\n' "$CONSOLE_ORIGIN"
(
  cd "$CONSOLE_ROOT"
  exec npm run dev
) &
CONSOLE_PID=$!

# --- 🦴 Oracle + BCC Middleware ---
printf '🦴 Starting Integrity Oracle and BCC middleware via %s\n' "$INTEGRITY_ROOT/docker-compose.yml"
exec docker compose -f "$INTEGRITY_ROOT/docker-compose.yml" up --build oracle-backend bcc-middleware
