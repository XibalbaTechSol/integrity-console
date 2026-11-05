/**
 * Protocol status shown on the public landing page.
 *
 * Every row here is a *sourced* claim. The landing page is marketing copy, but it is
 * also the most-read status surface in the ecosystem, and integrity-core's own
 * `docs/SPEC.md` §1 puts a hard floor under what we are allowed to say:
 *
 *   "Until M1-M5 are demonstrated, implementations MUST describe themselves as: a
 *    testnet/prototype protocol specification with a narrow experimental reference
 *    implementation."
 *
 * So: no row may be added without a `source` naming the file that backs it. The
 * previous version of this page carried five "Implemented" ticks (ZK via
 * Noir/Barretenberg, the VC Data Model, EIP-712), latency figures ("under 50ms",
 * "~18-35ms") and a "9 seconds" incident window, none of which appear in the normative
 * spec or the execution plan. Those are gone. If a claim cannot cite a line, it does
 * not belong on the page.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO PERCENTAGE HERE
 *
 * An earlier draft of this page showed "134/232 (57%)", counted by
 * `scripts/plan_progress.py` over `docs/EXECUTION_PLAN.md`. That figure no longer
 * exists. As of integrity-core 2026-11-03, `docs/EXECUTION_PLAN.md` is a compatibility
 * redirect: the authoritative plan is `docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md`,
 * which contains **no task checkboxes at all**, and the gap register is
 * `docs/ecosystem/STATUS.md`, which is qualitative by design ("intentionally short").
 *
 * Publishing a percentage recovered from the superseded plan would have been precisely
 * the failure this page argues against: reporting a stale state estimate with more
 * confidence than the measurement supports. The stages below therefore carry the
 * current authority's own open-requirement lists instead of a progress bar.
 *
 * Refresh procedure:
 *   1. Confirm the current authority in `docs/DOCUMENT_STATUS.yaml` (the execution_plan
 *      key) — it has moved once and may move again.
 *   2. Re-read `docs/ecosystem/STATUS.md` and restate its open requirements here.
 *   3. Update AS_OF and AS_OF_COMMIT, and the pinned literals in e2e/landing.spec.ts.
 */

/** Date the rows below were last reconciled against integrity-core `main`. */
export const AS_OF = '2026-11-04';

/** integrity-core `main` the rows were read at. */
export const AS_OF_COMMIT = '5626041b';

/**
 * Why no single number appears beside the campaign. Rendered on the page, because
 * "we deliberately do not publish a percentage, and here is why" is a stronger
 * signal than a percentage would be.
 */
export const PROGRESS_NOTE =
  'The current execution plan tracks outcomes, not checkboxes, and the gap register is ' +
  'deliberately qualitative. There is no honest single percentage to publish, so we ' +
  'publish the open requirements instead.';

export type PhaseState = 'complete' | 'in-progress' | 'not-started' | 'not-claimed';

export interface MissionPhase {
  /** Flight-test stage the gate corresponds to. The analogy, stated plainly. */
  stage: string;
  /** The gate's real name in the execution plan. */
  gate: string;
  state: PhaseState;
  /** What this stage is for. */
  detail: string;
  /** The current authority's own list of what is still required. Verbatim in substance. */
  open: readonly string[];
  source: string;
}

/**
 * The gate timeline, as a flight-test campaign, from
 * `docs/ecosystem/STATUS.md` (the current-gap register) and the phase structure of
 * `docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md`.
 *
 * The honest shape of this list is the point: the first stage is still open, and the
 * last is not claimed at all. A page that hid that would be the open-loop failure it
 * is selling against.
 */
export const MISSION_PHASES: readonly MissionPhase[] = [
  {
    stage: 'Integration and static fire',
    gate: 'Phase A — architecture and documentation',
    state: 'in-progress',
    detail:
      'One authority each for identity, packs, receipts, verification, anchoring and AIS; ' +
      'independently operable Shield and Cortex; a documented SDK contract a third party can ' +
      'build an adapter against. Substantial work has merged — the SDK core, the kernel patch, ' +
      'signed packs, receipt-emitting gates and the Claude Code hooks are in — but the outcome ' +
      'gate is not closed.',
    open: [
      'Create the canonical documentation namespace and archive competing active plans.',
      'Publish SDK JCS, identity, pack, receipt, memory, tenant and verification contracts.',
      'Prove Shield/BCC pack-hash and deny-by-default conformance.',
      'Prove Cortex authenticated ingestion, provenance binding, and tenant/store isolation.',
      'Define signed DID-file rotation and universal Shield/BCC fail-closed fallback.',
      'Publish pure pack-adapter versus network-connector contracts.',
    ],
    source: 'integrity-core: docs/ecosystem/STATUS.md, "Required before Phase A outcome gate"',
  },
  {
    stage: 'First flight, synthetic propellant',
    gate: 'Gate B-local — pilot-ready SaaS',
    state: 'not-started',
    detail:
      'A single tenant, running a real pilot on synthetic data, surviving the loss of anchoring ' +
      'and hosted services. This is the gate that makes Shield and Cortex products rather than ' +
      'components.',
    open: [
      'Demonstrate a single-tenant customer-local or managed single-tenant pilot.',
      'Prove tenant isolation, device revocation, entitlements, retention, purge, export and queue recovery.',
      'Keep optional Jev/DecisionTrace out of core authorization and make its absence non-blocking.',
    ],
    source: 'integrity-core: docs/ecosystem/STATUS.md, "Required before Gate B-local"',
  },
  {
    stage: 'Crewed flight: real PHI, real funds',
    gate: 'Gate C — mediation and registration',
    state: 'not-started',
    detail:
      'The gate that would make the on-chain account genuinely mediated rather than ' +
      'mediated-by-convention, and registration forgery-resistant. Until it closes, the ' +
      'protocol is not a candidate for real patient data or real money.',
    open: [
      'Select one account-authorization model and prove kernel mediation.',
      'Verify the canonical account implementation and reject unapproved proxies or upgrades.',
      'Prove provider-backed memory spot-checks and purge behaviour.',
      'Complete registration, approval replay, rescue recovery and regenesis evidence.',
    ],
    source: 'integrity-core: docs/ecosystem/STATUS.md, "Required before Gate C"',
  },
  {
    stage: 'Orbit',
    gate: 'Mainnet and hosted operation',
    state: 'not-claimed',
    detail:
      'Not authorized and not claimed. ADR-0002 holds that mainnet readiness is a gated ' +
      'deployment decision, not a consequence of local source, testnet or simulated evidence: ' +
      'signer custody, verifier coverage, external security review and key-custody evidence all ' +
      'remain open. Queued receipts are not settlement proof.',
    open: [
      'Testnet StateAnchor deployment and Oracle connectivity remain separate gates.',
      'Hosted multi-tenant scale, billing and payment processing are deferred.',
      'Real-PHI operation is a separate gate, and still needs SOC 2 Type II and a BAA.',
    ],
    source:
      'integrity-core: docs/adr/ADR-0002-mainnet-readiness.md; docs/ecosystem/STATUS.md, "External or deferred"',
  },
] as const;

/**
 * Conformance levels, from SPEC.md §1. We publish these because "does it conform" is
 * the first question an integrator asks, and the answer is a level, not a yes.
 */
export const CONFORMANCE_LEVELS = [
  {
    level: 'L0 — Record',
    requires: 'Signed spans, an evidence store, and an oracle that verifies and anchors. No hook.',
  },
  {
    level: 'L1 — Constrain + record',
    requires: "L0, plus a hook that evaluates a pack's constraint vector C on the enclosed account.",
  },
  {
    level: 'L2 — Full v1',
    requires: 'L1, plus escalate (deny-on-timeout) and at least one non-stub pack.',
  },
] as const;

/** What v1.0.0-draft targets, per SPEC.md §1. Stated so the levels above aren't read as all-green. */
export const CONFORMANCE_TARGET =
  'v1.0.0-draft targets L1 on one chain, one OS, one pack stub. Independent audit and a ' +
  'machine-checked invariance argument are the named gate for non-draft v1.0.0.';

/**
 * The self-description SPEC.md §1 *requires* until M1-M5 are demonstrated. M3 is N/A on
 * the production account and M4 still requires a multi-party delayed swap before a
 * mainnet proxy, so the requirement is live and this string is not optional decoration.
 */
export const MANDATED_SELF_DESCRIPTION =
  'A testnet/prototype protocol specification with a narrow experimental reference implementation.';

/**
 * The enforcement gap the spec discloses and this page must not gloss. SPEC.md §12 calls
 * it "Deployed-vs-live gap, disclosed, not glossed over"; repeating it here keeps the
 * hook card honest about the difference between the contract and the deployment.
 */
export const HOOK_DEPLOYMENT_GAP =
  'The post-state hook is the specified contract, and the reference policy hooks are ' +
  'implemented and covered by tests. It is not uniformly live: accounts are deployed ' +
  'per agent rather than behind a shared proxy, so the hook only reaches an agent ' +
  'registered after it landed in the deployed bytecode — verified on-chain, ' +
  'executionPolicy() reverts for all three currently registered Base Sepolia agents. ' +
  'Proving kernel mediation is Gate C work and has not started. Shield’s hook gate ' +
  'enforces only while its gate daemon is running; otherwise it fails open with a ' +
  'warning. Fail-closed is the contract and the default where the gate runs, not yet a ' +
  'property of every deployment.';

/** Document authority, from docs/DOCUMENT_STATUS.yaml (updated 2026-11-03). */
export const DOCUMENT_AUTHORITY = {
  normative: { name: 'docs/SPEC.md', version: 'v1.0.0-draft' },
  whitepaper: { name: 'docs/WHITEPAPER.md', version: 'v3.2', authority: 'informative' },
  /** Moved 2026-11-03; docs/EXECUTION_PLAN.md is now a redirect stub. */
  executionPlan: { name: 'docs/ecosystem/INTEGRITY_ECOSYSTEM_PLAN.md' },
  /** The PDF this app serves from public/. Archived, and labelled as such. */
  archivedPdf: { name: 'Integrity Protocol Specification', version: 'v0.3' },
} as const;
