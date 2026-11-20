# Integrity Dashboard

> **The Universal Verifiable Operator Window — Frontend Application**

`integrity-dashboard` is the React 18 / Vite / TypeScript / Tailwind web client for `integrity-console`. It serves as the unified operator and auditor window across the four-repository Integrity ecosystem.

---

## Ecosystem Topology

Integrity aligns autonomous machine behavior with cryptographic and thermodynamic reality across four specialized repositories:

| Repository | Role | Purpose |
|---|---|---|
| **`integrity-console`** (this repo) | 👁️ The Verifiable Operator Window | Presentation and account layer. Houses this dashboard, user API, and developer tooling. |
| **`integrity-core`** | 🦴 The Physics Engine | Autonomous Integrity Score (AIS) reward engine ($R_{\text{total}} = R_{\text{task}} + \lambda \cdot \text{AIS}$), Base Sepolia ERC-8004 contracts, BCC middleware, and on-chain DID anchors. |
| **`super-cortex`** | 🧠 The Navigational Engine | Neuro-symbolic knowledge graph, 768-D Supermemory vectors, dynamic logit masking, and active inference substrate. |
| **`xibalba-shield`** | 🛡️ Response Governance | Topological boundary gating, enterprise EDR response governance (CrowdStrike/Defender), eBPF containment, and tamper-evident audit packets. |

---

## Canonical Navigation Surfaces (5-Pillar Architecture)

| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | `ProtocolDashboardPage` | Executive command center, real-time telemetry, ecosystem status overview |
| `/identity` | `AgentIdentityHubPage` | Agent Identity Hub: Canonical Triad (`xibalba.agy`, `xibalba.claude`, `xibalba.codex`), Shield fleet (`shield.local`, `shield.cloud`), on-chain ERC-8004 Token #10774 passport, and A2A dispatcher |
| `/cortex` | `CortexMemoryPage` | Live Super-Cortex memory substrate (:4174), scope enclaves (`agent:*`, `shared`), knowledge graph propositions, and 3D studio integration |
| `/shield` | `ShieldDefensePage` | Real-time Shield defense plane (:8435), workstation eBPF sensors, OPA policy gate, and containment actions |
| `/intelligence` | `AisPage` | Oracle-computed Autonomous Integrity Score (AIS), derivation math, and closed-loop control zones (`GREEN` / `YELLOW` / `RED`) |

---

## Authentication & Security

- **OAuth 2.0 & Email/Password:** Federated sign-in using Google and GitHub via the Supabase Auth broker (`ftspunijfgcbkuybobhf.supabase.co`), alongside standard email/password authentication via `integrity-userapi`.
- **Zero Secrets in Bundle:** All sensitive tokens (Shield admin tokens, Cortex session tokens) are attached server-side via Vite proxies (`/api/shield` and `/cortex-api`) and never bundled into client-side javascript.
- **Zero Authority:** The dashboard never computes AIS scores, mints DIDs, or enforces policies locally; it honestly reflects verified backend telemetry.

---

## Live Cloud Deployments

| Service | Environment | URL |
|---|---|---|
| **Integrity Console** | Production Pilot | [integrity-console-test.onrender.com](https://integrity-console-test.onrender.com) |
| **Integrity User API** | Production Pilot | [integrity-userapi-test.onrender.com](https://integrity-userapi-test.onrender.com) |
| **Super-Cortex** | Production Pilot | [cortex-managed-pilot.onrender.com](https://cortex-managed-pilot.onrender.com) |
| **Xibalba Shield** | Production Pilot | [xibalba-shield.onrender.com](https://xibalba-shield.onrender.com) |

---

## Local Development

### Prerequisites
- Node.js 22+
- npm 10+

### Setup & Execution
```bash
# Install dependencies
npm ci --legacy-peer-deps

# Start Vite development server with local proxies (ports 5173 / 5189)
npm run dev

# Build production bundle (tsc -b && vite build)
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

### End-to-End Testing
Playwright E2E suites reside in `e2e/`:
```bash
# Run complete test suite against a running backend
npm run test-e2e

# Run focused validation suite with HTML report
npm run test:e2e:validation
```
