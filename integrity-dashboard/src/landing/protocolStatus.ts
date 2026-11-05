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
 * So: no row may be added without a `source` naming the file that backs it, and the
 * numbers are transcribed from a command that can be re-run, not from memory. The
 * previous version of this page carried five "Implemented" ticks (ZK via
 * Noir/Barretenberg, the VC Data Model, EIP-712) that appear nowhere in the current
 * normative spec or execution plan, plus latency figures ("under 50ms", "~18-35ms")
 * and a "9 seconds" incident window with no source at all. Those are gone. If a claim
 * cannot cite a line, it does not belong on the page.
 *
 * Refresh procedure (do all three together, then update AS_OF):
 *   1. cd <integrity-core> && git pull
 *   2. python3 scripts/plan_progress.py      -> PLAN_PROGRESS + the gate rows
 *   3. re-read STATUS.md's phase table       -> MISSION_PHASES statuses
 */

/** Date the figures below were last transcribed from integrity-core. */
export const AS_OF = '2026-11-04';

/** integrity-core commit the figures were read at (`git rev-parse --short HEAD`). */
export const AS_OF_COMMIT = 'd460736c';

/**
 * Plan-wide checkbox progress, from `python3 scripts/plan_progress.py` in
 * integrity-core. Not hand-maintained there and not hand-maintained here:
 * STATUS.md records that this figure had already drifted once (a stale
 * "88/201 (43%)") before its 2026-10-06 refresh, so it gets re-run, not recalled.
 */
export const PLAN_PROGRESS = {
  done: 134,
  total: 232,
  get percent(): number {
    // Floor, not round. 134/232 is 57.76%, which rounds to 58 — but `plan_progress.py`
    // and STATUS.md both report 57%, and the page must not contradict the authority it
    // cites by a percentage point. Caught by the pinned literal in e2e/landing.spec.ts.
    return Math.floor((this.done / this.total) * 100);
  },
  source: 'integrity-core: scripts/plan_progress.py',
} as const;

export type PhaseState = 'complete' | 'in-progress' | 'not-started' | 'not-claimed';

export interface MissionPhase {
  /** Flight-test stage the gate corresponds to. The analogy, stated plainly. */
  stage: string;
  /** The real gate name in the execution plan. */
  gate: string;
  state: PhaseState;
  /** Checkbox count, where the plan tracks one for this gate. */
  count?: string;
  /** What this gate actually demonstrates — and what it explicitly does not. */
  detail: string;
  source: string;
}

/**
 * The gate timeline, as a flight-test campaign. Ordered; the state values are
 * transcribed from STATUS.md's phase table and the plan_progress run above.
 *
 * The honest shape of this list is the point. Two of five stages are open and one
 * is explicitly unclaimed — a page that hid that would be the open-loop failure it
 * is selling against.
 */
export const MISSION_PHASES: readonly MissionPhase[] = [
  {
    stage: 'Integrated and static-fired',
    gate: 'Gate A',
    state: 'complete',
    count: '12/12',
    detail:
      'SDK core, the minimal kernel patch, independently operable Shield and Cortex, the ' +
      'documentation authority merge, the eight local-first SaaS seams, and the DecisionTrace ' +
      'foundation. Builds, all six Shield sub-items, Cortex, Docs and Identity are checked ' +
      'against fresh evidence.',
    source: 'integrity-core: STATUS.md, docs/EXECUTION_PLAN.md Gate A',
  },
  {
    stage: 'First flight, synthetic propellant',
    gate: 'Gate B-local',
    state: 'in-progress',
    count: '4/16',
    detail:
      'Signed packs, gates that emit chained and checkpointed receipts, the conformance kit and ' +
      'Claude Code hooks have landed. The four checked gate criteria are the two Jev trace and ' +
      'two pack criteria. Enforcement, evidence, data-boundary, tenancy and resilience criteria ' +
      'are still open, and SaaS productization (B0) is the largest unstarted block in the plan.',
    source: 'integrity-core: STATUS.md B0-B7, Gate B-local',
  },
  {
    stage: 'Crewed flight: real PHI, real funds',
    gate: 'Gate C',
    state: 'not-started',
    count: '0/42',
    detail:
      'Proven kernel mediation, forgery-resistant registration, spot-checked memory, real purge, ' +
      'non-replayable approvals. Gate B-local explicitly excludes HIPAA certification and ' +
      'real-PHI readiness; those are Gate C questions and are not answered yet.',
    source: 'integrity-core: STATUS.md Phase C, docs/EXECUTION_PLAN.md Gate C',
  },
  {
    stage: 'Orbit',
    gate: 'Mainnet',
    state: 'not-claimed',
    detail:
      'Not authorized and not claimed. ADR-0002 holds that mainnet readiness is a gated ' +
      'deployment decision, not a consequence of local source, testnet or simulated evidence: ' +
      'signer custody, verifier coverage, external security review and key-custody evidence all ' +
      'remain open rows. Queued receipts are not settlement proof.',
    source: 'integrity-core: docs/adr/ADR-0002-mainnet-readiness.md',
  },
] as const;

/**
 * Conformance levels, verbatim in substance from SPEC.md §1. We publish these because
 * "does it conform" is the first question an integrator asks, and the answer is a
 * level, not a yes.
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

/** Document authority, from docs/DOCUMENT_STATUS.yaml. */
export const DOCUMENT_AUTHORITY = {
  normative: { name: 'docs/SPEC.md', version: 'v1.0.0-draft' },
  whitepaper: { name: 'docs/WHITEPAPER.md', version: 'v3.2', authority: 'informative' },
  /** The PDF this app serves from public/. Archived, and labelled as such. */
  archivedPdf: { name: 'Integrity Protocol Specification', version: 'v0.3' },
} as const;
