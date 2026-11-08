/**
 * Zero-Authority Presentation Contract for Oracle-Verified AIS (`ais/v1-geometric-1`)
 * and Closed-Loop Reward Telemetry (`R_total = R_task + lambda * AIS`).
 *
 * Boundary Invariant:
 * `integrity-console` NEVER computes canonical AIS, evaluates policy, or mutates
 * trust state locally. It exclusively formats and presents Oracle-supplied and
 * on-chain verified receipts (`ScopedResource<OracleAISRewardTelemetry>`).
 */

import type { ProtocolMetadata, ScopedResource } from './types';
import { unavailableMetadata } from './types';

export type AISControlZoneType = 'green' | 'yellow' | 'red';

export interface OracleAISAxesBreakdown {
  /** S_E: Entropy / Stability axis in [0, 1000] */
  sEntropy: number;
  /** S_G: Grounding / Verification axis in [0, 1000] */
  sGrounding: number;
  /** S_S: Structural Contribution axis in [0, 1000] */
  sContribution: number;
  /** S_C: Compliance / Penalty Complement axis in [0, 1000] */
  sCompliance: number;
}

export interface OracleStepRewardTelemetry {
  rTaskEffective: number;
  aisTerm: number;
  potentialShaping: number;
  violationPenalty: number;
  rTotal: number;
  gatedByCompliance: boolean;
}

export interface OracleEpochSettlementTelemetry {
  epochId: number;
  baseFeePool: number;
  yieldMultiplier: number;
  payoutAmount: number;
  slashed: boolean;
  slashAmount: number;
}

export interface OracleAISRewardTelemetry {
  agentDid: string;
  formulaVersion: 'ais/v1-geometric-1';
  aisScore1000: number;
  zkBoost: number;
  didTierCeiling: number;
  zeroAnnihilated: boolean;
  controlZone: AISControlZoneType;
  allowedActions: string[];
  activePolicyPack?: {
    name: string;
    version: string;
    packHash: string;
  };
  axes: OracleAISAxesBreakdown;
  latestStepReward: OracleStepRewardTelemetry;
  latestEpochSettlement?: OracleEpochSettlementTelemetry;
  oracleReceiptHash: string;
}

export interface FormattedAISRewardView {
  displayScore: string;
  zoneBadgeLabel: string;
  zoneSeverity: 'nominal' | 'degraded' | 'halted' | 'unverified';
  equationSummary: string;
  authorityNotice: string;
  isVerified: boolean;
}

/**
 * Format an Oracle-supplied AIS & Reward resource for operator inspection
 * without performing any local score synthesis.
 */
export function formatOracleAISRewardView(
  resource: ScopedResource<OracleAISRewardTelemetry>,
): FormattedAISRewardView {
  if (!resource.value || resource.metadata.verification !== 'verified') {
    return {
      displayScore: 'UNVERIFIED',
      zoneBadgeLabel: 'UNVERIFIED / READ-ONLY',
      zoneSeverity: 'unverified',
      equationSummary: 'Awaiting Oracle-signed receipt (integrity.receipt/1)',
      authorityNotice:
        'Console holds zero protocol authority. Telemetry is hidden until verified by the Integrity Oracle.',
      isVerified: false,
    };
  }

  const telemetry = resource.value;
  const step = telemetry.latestStepReward;

  const zoneMap: Record<
    AISControlZoneType,
    { label: string; severity: 'nominal' | 'degraded' | 'halted' }
  > = {
    green: { label: 'GREEN · FULL AUTONOMY (AIS ≥ 900)', severity: 'nominal' },
    yellow: { label: 'YELLOW · SUPERVISED / CO-SIGN (750 ≤ AIS < 900)', severity: 'degraded' },
    red: { label: 'RED · HALT / ESCALATION ONLY (AIS < 750)', severity: 'halted' },
  };

  const zoneInfo = zoneMap[telemetry.controlZone];
  const sign = step.potentialShaping >= 0 ? '+' : '-';
  const eq = `R_total (${step.rTotal.toFixed(3)}) = R_task (${step.rTaskEffective.toFixed(2)}) + λ·AIS (${step.aisTerm.toFixed(3)}) ${sign} ΔΦ (${Math.abs(step.potentialShaping).toFixed(3)}) - Penalty (${step.violationPenalty.toFixed(2)})`;

  return {
    displayScore: `${telemetry.aisScore1000.toFixed(1)} / 1000`,
    zoneBadgeLabel: zoneInfo.label,
    zoneSeverity: zoneInfo.severity,
    equationSummary: eq,
    authorityNotice: `Verified via ${resource.metadata.source} (${telemetry.formulaVersion}, receipt ${telemetry.oracleReceiptHash.slice(0, 18)}…)`,
    isVerified: true,
  };
}

export function createUnavailableAISRewardResource(
  agentDid?: string,
): ScopedResource<OracleAISRewardTelemetry> {
  const metadata: ProtocolMetadata = unavailableMetadata(agentDid);
  return {
    value: null,
    metadata,
    error: 'No Oracle-verified AIS telemetry receipt loaded.',
  };
}
