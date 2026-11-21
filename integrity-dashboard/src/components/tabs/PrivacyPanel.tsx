/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Panel } from '../shared/Panel';
import { Shield, Save, Loader2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { oracle } from '../../services/oracle';
import { AGENT_REGISTRY_ADDRESS } from '../../constants';
import { AGENT_REGISTRY_ABI } from '../../chain/v3';

// Registration v3 wiring (v2-graph deletion C1). The agent's metadata lives in its
// AgentRegistry record's `uri` (the v2 per-agent profile clone is gone). There is no on-chain field
// for arbitrary privacy flags, so the preferences are serialized into that uri as a
// data:application/json document. `setUri` is guarded to the record's guardian, so the
// connected wallet must be the guardian. Prefs are read back from the Oracle's synced record.
const DEFAULT_PREFS = { privacy_mode: 'public' as const, publish_telemetry: true, publish_transactions: true, publish_staking: true };
const DATA_JSON = 'data:application/json,';

/** The JSON document a record uri carries, `{}` for an empty uri, or null for any other uri. */
export function parseRecordUri(uri: string | null | undefined): Record<string, unknown> | null {
  if (!uri) return {};
  if (!uri.startsWith(DATA_JSON)) return null;
  try {
    const doc = JSON.parse(decodeURIComponent(uri.slice(DATA_JSON.length)));
    return doc && typeof doc === 'object' && !Array.isArray(doc) ? doc : null;
  } catch {
    return null;
  }
}

/**
 * The uri to write: `prefs` merged into the record's existing JSON document, so other keys
 * survive. Throws rather than overwrite a uri that points somewhere else (e.g. an https DID doc).
 */
export function mergePrefsIntoUri(existing: string | null | undefined, prefs: typeof DEFAULT_PREFS | Record<string, unknown>): string {
  const doc = parseRecordUri(existing);
  if (doc === null) throw new Error('The record uri points at an external document; refusing to overwrite it.');
  return DATA_JSON + encodeURIComponent(JSON.stringify({ ...doc, ...prefs }));
}

export function PrivacyPanel() {
  const { selectedAgent, addToast, walletAddress, connectWallet } = useDashboard();
  const [privacyMode, setPrivacyMode] = useState<'public' | 'pseudonymous' | 'zero_knowledge'>('public');
  const [publishTelemetry, setPublishTelemetry] = useState(true);
  const [publishTransactions, setPublishTransactions] = useState(true);
  const [publishStaking, setPublishStaking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load the prefs from the agent's AgentRegistry record uri (the Oracle's synced copy).
  useEffect(() => {
    if (!selectedAgent) return;
    let active = true;
    (async () => {
      try {
        const detail = await oracle.getAgent(selectedAgent.eth_address);
        const doc = parseRecordUri(detail.onchain?.uri);
        if (!active || !doc) return;
        const p = { ...DEFAULT_PREFS, ...doc } as typeof DEFAULT_PREFS;
        setPrivacyMode(p.privacy_mode);
        setPublishTelemetry(p.publish_telemetry);
        setPublishTransactions(p.publish_transactions);
        setPublishStaking(p.publish_staking);
      } catch { /* leave defaults */ }
    })();
    return () => { active = false; };
  }, [selectedAgent]);

  const handleSave = async () => {
    if (!selectedAgent) return;
    if (!walletAddress) { addToast('error', 'Connect the agent controller wallet to save on-chain.'); return; }
    setIsSaving(true);
    try {
      if (!AGENT_REGISTRY_ADDRESS) throw new Error('AgentRegistry is not deployed on this network yet.');
      const detail = await oracle.getAgent(selectedAgent.eth_address);
      const rec = detail.onchain;
      if (!rec || !rec.active) throw new Error('Agent has no active AgentRegistry record (register it on-chain first).');

      const eth = (window as any).ethereum;
      const signer = await new ethers.BrowserProvider(eth).getSigner();
      if ((await signer.getAddress()).toLowerCase() !== rec.guardian.toLowerCase()) {
        throw new Error(`Connect the record's guardian wallet (${rec.guardian}); only it can change the uri.`);
      }

      const prefs = { privacy_mode: privacyMode, publish_telemetry: publishTelemetry, publish_transactions: publishTransactions, publish_staking: publishStaking };
      const uri = mergePrefsIntoUri(rec.uri, prefs);
      const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, signer);
      const fingerprint: string = await registry.fingerprintOfDID(rec.agent_id);

      addToast('info', 'Writing preferences to the AgentRegistry record…');
      await (await registry.setUri(fingerprint, uri)).wait();
      // Refresh the Oracle's mirror; the chain is the source either way.
      await oracle.onchainSync(selectedAgent.eth_address).catch(() => undefined);
      addToast('success', 'Privacy configurations written on-chain.');
    } catch (err: any) {
      addToast('error', `Failed to update profile: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedAgent) {
    return (
      <Panel title="Privacy & Security Options" icon={<Shield size={18} />}>
        <div className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          Select an agent from the sidebar to configure privacy settings.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Privacy & Security Options" icon={<Shield size={18} />}>
      <div className="flex-col gap-6">
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          Configure data visibility, credential exposure, and cryptographic zero-knowledge constraints for this agent.
        </div>

        {/* Privacy Mode */}
        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Privacy Mode</h4>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-4)' }}>
            Specify the degree of cryptographic abstraction used for agent verification on-chain.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: 'var(--space-4)',
                background: privacyMode === 'public' ? 'var(--primary-dim)' : 'var(--bg-primary)',
                border: `1px solid ${privacyMode === 'public' ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: 0,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="privacyMode"
                  value="public"
                  checked={privacyMode === 'public'}
                  onChange={() => setPrivacyMode('public')}
                />
                Public Mode
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transparent execution tracking and telemetry.</span>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: 'var(--space-4)',
                background: privacyMode === 'pseudonymous' ? 'var(--primary-dim)' : 'var(--bg-primary)',
                border: `1px solid ${privacyMode === 'pseudonymous' ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: 0,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="privacyMode"
                  value="pseudonymous"
                  checked={privacyMode === 'pseudonymous'}
                  onChange={() => setPrivacyMode('pseudonymous')}
                />
                Pseudonymous
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Decouples real-world metadata; binds identity strictly to cryptographic DID.</span>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: 'var(--space-4)',
                background: privacyMode === 'zero_knowledge' ? 'var(--primary-dim)' : 'var(--bg-primary)',
                border: `1px solid ${privacyMode === 'zero_knowledge' ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: 0,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--theme-accent)' }}>
                <input
                  type="radio"
                  name="privacyMode"
                  value="zero_knowledge"
                  checked={privacyMode === 'zero_knowledge'}
                  onChange={() => setPrivacyMode('zero_knowledge')}
                />
                Zero-Knowledge
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Noir standard ZK-proofs verifying metrics and scores without telemetry disclosure.</span>
            </label>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Data Publishing Consents</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Publish Telemetry Logs</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enable streaming system performance logs and entropy signals.</div>
              </div>
              <input
                type="checkbox"
                checked={publishTelemetry}
                onChange={(e) => setPublishTelemetry(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Publish Transaction History</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expose task executions, outcome compliance, and dispute history.</div>
              </div>
              <input
                type="checkbox"
                checked={publishTransactions}
                onChange={(e) => setPublishTransactions(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Publish Staking Data</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Allow public verification of locked collateral and sacrifice score.</div>
              </div>
              <input
                type="checkbox"
                checked={publishStaking}
                onChange={(e) => setPublishStaking(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
            </div>

          </div>
        </div>

        {/* Save Button */}
        <button
          className="primary-button"
          onClick={handleSave}
          disabled={isSaving}
          style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          Save Privacy Configurations
        </button>
      </div>
    </Panel>
  );
}
