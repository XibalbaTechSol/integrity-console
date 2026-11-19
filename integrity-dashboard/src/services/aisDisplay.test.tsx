import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ComponentValue, formatComponent, radarValue, NOT_OBSERVED } from './aisDisplay';
import {
  formatOracleAISRewardView,
  toOracleAISRewardResource,
  createUnavailableAISRewardResource,
} from '../integrity/aisRewardTelemetry';
import { AISClosedLoopRewardCard } from '../components/AISClosedLoopRewardCard';

describe('null compliance rendering', () => {
  it('formats null as an em dash, never 0', () => {
    expect(formatComponent(null)).toBe('—');
    expect(formatComponent(undefined)).toBe('—');
    expect(formatComponent(0)).toBe('0');
    expect(formatComponent(812.4)).toBe('812');
  });

  it('radar value is null (omitted) for null, 0 stays 0', () => {
    expect(radarValue(null)).toBeNull();
    expect(radarValue(0)).toBe(0);
    expect(radarValue(1000)).toBe(100);
  });

  it('renders Not observed without throwing for null', () => {
    const html = renderToStaticMarkup(<ComponentValue value={null} />);
    expect(html).toContain(NOT_OBSERVED);
    expect(html).toContain('—');
    expect(html).not.toMatch(/>0</);
  });

  it('renders a real zero as 0', () => {
    expect(renderToStaticMarkup(<ComponentValue value={0} />)).toContain('>0<');
  });
});

describe('AIS Closed-Loop Multiplicative v2 Reward Telemetry', () => {
  it('converts valid AisResponse to verified v2 resource in green zone', () => {
    const aisData = {
      agent_id: '0x1234567890abcdef1234567890abcdef12345678',
      ais: 950.0,
      zk_boost: 1.15,
      tier_ceiling: 1000,
      components: {
        entropy: 940,
        grounding: 960,
        sacrifice: 920,
        compliance: 980,
      },
      authoritative_input_source: '0xabc123',
    };

    const res = toOracleAISRewardResource(aisData);
    expect(res.metadata.verification).toBe('verified');
    expect(res.value?.formulaVersion).toBe('ais/v2-multiplicative-1');
    expect(res.value?.controlZone).toBe('green');
    expect(res.value?.allowedActions).toContain('execute');
    expect(res.value?.latestStepReward.rTotal).toBe(0.95);
    expect(res.value?.latestStepReward.gatedByCompliance).toBe(false);

    const view = formatOracleAISRewardView(res);
    expect(view.isVerified).toBe(true);
    expect(view.zoneSeverity).toBe('nominal');
    expect(view.equationSummary).toContain('R_step (0.950)');
    expect(view.equationSummary).toContain('1 (COMPLIANT)');
  });

  it('zero-gates step reward to 0.00 when non-compliant', () => {
    const aisData = {
      agent_id: '0x1234567890abcdef1234567890abcdef12345678',
      ais: 720.0,
      components: {
        entropy: 800,
        grounding: 850,
        sacrifice: 700,
        compliance: 0, // zero compliance
      },
    };

    const res = toOracleAISRewardResource(aisData);
    expect(res.value?.controlZone).toBe('red');
    expect(res.value?.latestStepReward.rTotal).toBe(0.0);
    expect(res.value?.latestStepReward.gatedByCompliance).toBe(true);

    const view = formatOracleAISRewardView(res);
    expect(view.zoneSeverity).toBe('halted');
    expect(view.equationSummary).toContain('R_step (0.000)');
    expect(view.equationSummary).toContain('0 (NON-COMPLIANT)');

    const html = renderToStaticMarkup(<AISClosedLoopRewardCard resource={res} />);
    expect(html).toContain('Task Reward Gated to 0.00');
    expect(html).toContain('Permitted Actions');
  });

  it('handles null/unavailable resource gracefully without throwing', () => {
    const res = toOracleAISRewardResource(null, '0xdeadbeef');
    expect(res.metadata.verification).toBe('unavailable');
    expect(res.value).toBeNull();

    const view = formatOracleAISRewardView(res);
    expect(view.isVerified).toBe(false);
    expect(view.displayScore).toBe('UNVERIFIED');

    const html = renderToStaticMarkup(<AISClosedLoopRewardCard resource={res} />);
    expect(html).toContain('Console holds zero protocol authority');
  });
});
