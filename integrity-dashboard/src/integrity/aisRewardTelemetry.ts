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

export type AISFormulaVersion = 'ais/v1-geometric-1' | 'ais/v2-multiplicative-1';

export interface OracleAISRewardTelemetry {
  agentDid: string;
  formulaVersion: AISFormulaVersion;
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
  let eq: string;
  if (telemetry.formulaVersion === 'ais/v2-multiplicative-1') {
    const isGated = step.gatedByCompliance;
    const rTask = step.rTaskEffective.toFixed(2);
    const aisTerm = (telemetry.aisScore1000 / 1000).toFixed(3);
    const compIndicator = isGated ? '0 (NON-COMPLIANT)' : '1 (COMPLIANT)';
    eq = `R_step (${step.rTotal.toFixed(3)}) = max(0, R_task [${rTask}] - Cost [0.00]) × (AIS/1000 [${aisTerm}]) × 𝕀(compliant [${compIndicator}])`;
  } else {
    const sign = step.potentialShaping >= 0 ? '+' : '-';
    eq = `R_total (${step.rTotal.toFixed(3)}) = R_task (${step.rTaskEffective.toFixed(2)}) + λ·AIS (${step.aisTerm.toFixed(3)}) ${sign} ΔΦ (${Math.abs(step.potentialShaping).toFixed(3)}) - Penalty (${step.violationPenalty.toFixed(2)})`;
  }

  return {
    displayScore: `${telemetry.aisScore1000.toFixed(1)} / 1000`,
    zoneBadgeLabel: zoneInfo.label,
    zoneSeverity: telemetry.latestStepReward.gatedByCompliance ? 'halted' : zoneInfo.severity,
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

export function toOracleAISRewardResource(
  aisData?: {
    agent_id?: string;
    ais?: number;
    zk_boost?: number;
    tier_ceiling?: number;
    components?: {
      entropy?: number;
      grounding?: number;
      sacrifice?: number;
      compliance?: number | null;
    };
    authoritative_input_source?: string;
    period_end?: string;
  } | null,
  agentDid?: string,
  latestStep?: Partial<OracleStepRewardTelemetry>,
): ScopedResource<OracleAISRewardTelemetry> {
  const did = aisData?.agent_id || agentDid;
  if (!aisData || typeof aisData.ais !== 'number') {
    return createUnavailableAISRewardResource(did);
  }

  const aisScore = aisData.ais;
  const zone: AISControlZoneType =
    aisScore >= 900 ? 'green' : aisScore >= 750 ? 'yellow' : 'red';

  const allowedActions =
    zone === 'green'
      ? ['read', 'draft', 'execute', 'transact', 'deploy']
      : zone === 'yellow'
        ? ['read', 'draft', 'co_sign_execute']
        : ['read', 'escalate'];

  const compVal = aisData.components?.compliance ?? null;
  const isGated = compVal === 0 || aisScore === 0;

  const rTask = latestStep?.rTaskEffective ?? 1.0;
  const stepReward: OracleStepRewardTelemetry = {
    rTaskEffective: rTask,
    aisTerm: Math.round((aisScore / 1000) * 1000) / 1000,
    potentialShaping: latestStep?.potentialShaping ?? 0.0,
    violationPenalty: latestStep?.violationPenalty ?? 0.0,
    rTotal: isGated ? 0.0 : Math.round(rTask * (aisScore / 1000) * 1000) / 1000,
    gatedByCompliance: isGated,
    ...latestStep,
  };

  const telemetry: OracleAISRewardTelemetry = {
    agentDid: did || 'unknown-did',
    formulaVersion: 'ais/v2-multiplicative-1',
    aisScore1000: aisScore,
    zkBoost: aisData.zk_boost ?? 1.0,
    didTierCeiling: aisData.tier_ceiling ?? 1000,
    zeroAnnihilated: aisScore === 0,
    controlZone: zone,
    allowedActions,
    axes: {
      sEntropy: aisData.components?.entropy ?? 0,
      sGrounding: aisData.components?.grounding ?? 0,
      sContribution: aisData.components?.sacrifice ?? 0,
      sCompliance: compVal ?? 0,
    },
    latestStepReward: stepReward,
    oracleReceiptHash:
      aisData.authoritative_input_source ||
      `0x${(did || '0').replace(/[^a-fA-F0-9]/g, '').padEnd(40, '0').slice(0, 40)}`,
  };

  return {
    value: telemetry,
    metadata: {
      source: 'externally-verified',
      network: 'Base Sepolia',
      chainId: 84532,
      fetchedAt: aisData.period_end || new Date().toISOString(),
      freshness: 'current',
      verification: 'verified',
      agentId: did,
      permission: isGated ? 'denied' : 'allowed',
    },
  };
}
