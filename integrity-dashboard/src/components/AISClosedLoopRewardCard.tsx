import React from 'react';
import type { ScopedResource } from '../integrity/types';
import type { OracleAISRewardTelemetry } from '../integrity/aisRewardTelemetry';
import { formatOracleAISRewardView } from '../integrity/aisRewardTelemetry';

export interface AISClosedLoopRewardCardProps {
  resource: ScopedResource<OracleAISRewardTelemetry>;
}

/**
 * Operator Telemetry Card rendering Oracle-verified `ais/v1-geometric-1` axes,
 * Closed-Loop Action Zone (`GREEN`/`YELLOW`/`RED`), Policy Pack digest, and
 * Step/Epoch Reward (`R_total = R_task + lambda * AIS`).
 *
 * Strictly zero-authority: never synthesizes or overrides Oracle state.
 */
export const AISClosedLoopRewardCard: React.FC<AISClosedLoopRewardCardProps> = ({
  resource,
}) => {
  const view = formatOracleAISRewardView(resource);
  const data = resource.value;

  const badgeColors: Record<typeof view.zoneSeverity, string> = {
    nominal: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    degraded: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    halted: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    unverified: 'bg-slate-900 text-slate-400 border-slate-700',
  };

  return (
    <section
      aria-label="AIS Closed-Loop Control and Reward Telemetry"
      className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 text-slate-100 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Integrity Oracle Telemetry · {data?.formulaVersion ?? 'ais/v1-geometric-1'}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Closed-Loop AIS Governor &amp; Reward Function
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-mono font-semibold ${badgeColors[view.zoneSeverity]}`}
        >
          {view.zoneBadgeLabel}
        </span>
      </div>

      {!view.isVerified || !data ? (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <p className="font-mono text-xs text-amber-300">{view.equationSummary}</p>
          <p className="mt-1 text-xs text-slate-400">{view.authorityNotice}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs text-slate-400">Entropy (S_E)</div>
              <div className="mt-1 font-mono text-base font-bold text-white">
                {data.axes.sEntropy.toFixed(0)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs text-slate-400">Grounding (S_G)</div>
              <div className="mt-1 font-mono text-base font-bold text-white">
                {data.axes.sGrounding.toFixed(0)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs text-slate-400">Contribution (S_S)</div>
              <div className="mt-1 font-mono text-base font-bold text-white">
                {data.axes.sContribution.toFixed(0)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs text-slate-400">Compliance (S_C)</div>
              <div className="mt-1 font-mono text-base font-bold text-white">
                {data.axes.sCompliance.toFixed(0)}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Oracle-Verified Step Reward Decomposition</span>
              <span className="font-mono text-emerald-400">AIS: {view.displayScore}</span>
            </div>
            <div className="mt-1.5 font-mono text-xs text-slate-200">
              {view.equationSummary}
            </div>
            {data.latestStepReward.gatedByCompliance && (
              <div className="mt-2 rounded bg-rose-950/70 px-2.5 py-1 text-xs font-mono text-rose-300">
                Task Reward Gated to 0.00 (Policy Pack DENY / Compliance Annihilation)
              </div>
            )}
          </div>

          {data.activePolicyPack && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                Active Policy Pack:{' '}
                <strong className="font-mono text-slate-200">
                  {data.activePolicyPack.name}@{data.activePolicyPack.version}
                </strong>
              </span>
              <span className="font-mono text-slate-400">
                {data.activePolicyPack.packHash.slice(0, 24)}…
              </span>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-2 text-[11px] font-mono text-slate-400">
            {view.authorityNotice}
          </div>
        </div>
      )}
    </section>
  );
};
