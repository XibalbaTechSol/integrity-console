import { describe, expect, it, vi } from 'vitest';

vi.mock('../context/DashboardContext', () => ({ useDashboard: () => ({}) }));

import { actorOf, onchainContractRows } from './v3';
import { identityStatusRows } from '../components/ui/DIDExplorer';
import { mergePrefsIntoUri, parseRecordUri } from '../components/tabs/PrivacyPanel';
import type { AgentResponse, OnchainRecordDto } from '../services/oracle';
import { SOVEREIGN_AGENT_ABI } from './bytecode';

const ACTOR = '0x1111111111111111111111111111111111111111';
const record = (over: Partial<OnchainRecordDto> = {}): OnchainRecordDto => ({
  agent_id: `did:integrity:${'ab'.repeat(32)}`,
  chain_id: 84532,
  agent_registry: '0x2222222222222222222222222222222222222222',
  pubkey: '0x' + 'cd'.repeat(32),
  guardian: '0x3333333333333333333333333333333333333333',
  actor: ACTOR,
  domain_id: '0x' + '00'.repeat(32),
  uri: '',
  registered_at: 1,
  retired_at: null,
  proof_kind: 1,
  active: true,
  settlement_eligible: true,
  synced_block: 1,
  synced_at: '2026-11-17T00:00:00Z',
  ...over,
});

// A v3 Oracle response: `onchain` present, the v2 per-agent set absent (as after PR 4.6).
const detail = (onchain: OnchainRecordDto | null) => ({ onchain }) as Pick<AgentResponse, 'onchain'>;

describe('actorOf (AgentRegistry actor, not the v2 per-agent set)', () => {
  it('returns the bound actor of an active record', () => {
    expect(actorOf(detail(record()))).toBe(ACTOR);
  });
  it('returns null for an off-chain agent, an existence-only record, or a retired one', () => {
    expect(actorOf(detail(null))).toBeNull();
    expect(actorOf(detail(record({ actor: null })))).toBeNull();
    expect(actorOf(detail(record({ actor: '0x' + '0'.repeat(40) })))).toBeNull();
    expect(actorOf(detail(record({ active: false, retired_at: 5 })))).toBeNull();
  });
  it('ignores a legacy v2 sovereign_agent field', () => {
    const legacy = { onchain: null, primitives: { sovereign_agent: ACTOR } } as unknown as Pick<AgentResponse, 'onchain'>;
    expect(actorOf(legacy)).toBeNull();
  });
});

describe('DIDExplorer identity rows', () => {
  it('shows the actor from `onchain` when there is no v2 per-agent set', () => {
    const rows = identityStatusRows({}, null, actorOf(detail(record())), null);
    const actorRow = rows.find((r) => r.label === 'ACTOR');
    expect(actorRow).toEqual({ label: 'ACTOR', value: '0x111111…111111', active: true });
  });
  it('shows an off-chain agent honestly', () => {
    expect(identityStatusRows({}, null, null, null).find((r) => r.label === 'ACTOR')?.value).toBe('OFF-CHAIN');
  });
});

describe('onchainContractRows', () => {
  it('lists the registry record and the bound actor', () => {
    expect(onchainContractRows(detail(record()))).toEqual([
      ['agent_registry_record', record().agent_registry],
      ['sovereign_agent', ACTOR],
    ]);
    expect(onchainContractRows(detail(null))).toEqual([]);
  });
});

describe('PrivacyPanel record uri', () => {
  const prefs = { privacy_mode: 'public', publish_telemetry: false };
  it('writes prefs into an empty uri', () => {
    expect(parseRecordUri(mergePrefsIntoUri('', prefs))).toEqual(prefs);
  });
  it('keeps other keys of an existing JSON document', () => {
    const existing = 'data:application/json,' + encodeURIComponent(JSON.stringify({ name: 'agent', publish_telemetry: true }));
    expect(parseRecordUri(mergePrefsIntoUri(existing, prefs))).toEqual({ name: 'agent', ...prefs });
  });
  it('refuses to overwrite an external uri', () => {
    expect(() => mergePrefsIntoUri('https://example.com/did.json', prefs)).toThrow(/refusing to overwrite/);
  });
});

describe('bytecode.ts (regenerated after D4 + the ORACLE_ROLE removal)', () => {
  it('carries the 3-argument constructor and none of the removed members', () => {
    const ctor = SOVEREIGN_AGENT_ABI.find((i) => i.type === 'constructor') as unknown as { inputs: { name: string }[] };
    expect(ctor.inputs.map((i) => i.name)).toEqual(['did_', 'controller_', 'registry_']);
    const names = SOVEREIGN_AGENT_ABI.map((i) => ('name' in i ? i.name : '')).filter(Boolean);
    for (const removed of ['ORACLE_ROLE', 'updateAIS', 'ais', 'factory']) expect(names).not.toContain(removed);
  });
});
