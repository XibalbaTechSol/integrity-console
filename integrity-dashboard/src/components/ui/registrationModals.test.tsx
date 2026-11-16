import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// The dashboard context needs a provider plus wallet plumbing; the modals only read these.
vi.mock('../../context/DashboardContext', () => ({
  useDashboard: () => ({ addToast: () => {}, walletAddress: null, connectWallet: () => {} }),
}));

import { RegisterAgentModal } from './RegisterAgentModal';
import { ClaimAgentModal, describeSyncError } from './ClaimAgentModal';
import { oracle } from '../../services/oracle';

const LEGACY_URL = /\/v1\/agent\/register$/;
const DID = `did:integrity:${'ab'.repeat(32)}`;

function stubFetch(status = 200, payload: unknown = {}) {
  const urls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    urls.push(url);
    return new Response(JSON.stringify(payload), { status });
  }));
  return urls;
}

afterEach(() => vi.unstubAllGlobals());

describe('RegisterAgentModal (v3)', () => {
  it('renders the off-chain-first flow with an optional handle and no legacy request', () => {
    const urls = stubFetch();
    const html = renderToStaticMarkup(<RegisterAgentModal isOpen onClose={() => {}} onSuccess={() => {}} />);
    expect(html).toContain('Register with the Oracle (off-chain, no gas)');
    expect(html).toContain('XNS handle (optional)');
    expect(html).toContain('Save private_key.pem');
    // No AgentRegistry in the Base Sepolia mirror yet: the on-chain step says so.
    expect(html).toContain('available once AgentRegistry is deployed');
    expect(html).not.toMatch(/SovereignAgent|registerCore|100 ITK/);
    expect(urls.filter((u) => LEGACY_URL.test(u))).toEqual([]);
  });
});

describe('ClaimAgentModal (v3)', () => {
  it('renders a DID sync form prefilled from the selected agent', () => {
    const urls = stubFetch();
    const html = renderToStaticMarkup(<ClaimAgentModal isOpen defaultDid={DID} onClose={() => {}} onSuccess={() => {}} />);
    expect(html).toContain('Sync On-Chain Record');
    expect(html).toContain(`value="${DID}"`);
    expect(html).not.toMatch(/controller role|rotateController|XNS handle/);
    expect(urls).toEqual([]);
  });

  it('does not prefill a non-DID value (the old prop carried an address)', () => {
    const html = renderToStaticMarkup(<ClaimAgentModal isOpen defaultDid="0x1234" onClose={() => {}} onSuccess={() => {}} />);
    expect(html).not.toContain('0x1234');
  });

  it('claims by POSTing /onchain/sync for the DID, never the legacy route', async () => {
    const urls = stubFetch(200, { agent_id: DID, guardian: `0x${'22'.repeat(20)}`, actor: null, active: true, settlement_eligible: false, synced_block: 7 });
    const rec = await oracle.onchainSync(DID);
    expect(rec.synced_block).toBe(7);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(new RegExp(`/v1/agent/${encodeURIComponent(DID)}/onchain/sync$`));
    expect(urls.filter((u) => LEGACY_URL.test(u))).toEqual([]);
  });

  it.each([
    [404, /no AgentRegistry record/],
    [503, /no AgentRegistry deployment configured/],
    [400, /did:integrity:/],
  ])('explains a %s from the sync route', (status, msg) => {
    expect(describeSyncError({ status, message: 'x' })).toMatch(msg);
  });
});
