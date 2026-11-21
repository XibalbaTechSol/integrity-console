import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { oracle, type OnchainRecordDto } from '../../services/oracle';

interface ClaimAgentModalProps {
  isOpen: boolean;
  /** Prefilled DID (the selected agent's id). */
  defaultDid?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Registration v3 (Phase 4 PR 4.5): "claim" an agent that is already registered on-chain by
// asking the Oracle to sync its AgentRegistry record (POST /v1/agent/{id}/onchain/sync).
// The sync reads AgentRegistry.resolveDID itself, so the chain, not this form, decides what
// is stored; nothing here is a write the wallet has to authorize. The record's guardian is
// the address that controls it, shown against the connected wallet.
export function describeSyncError(err: unknown): string {
  const status = (err as { status?: number } | null)?.status;
  const detail = String((err as { message?: string } | null)?.message ?? '');
  if (status === 404) return 'This DID has no AgentRegistry record yet. Register it on-chain first (Register agent, or `integrity register --onchain`).';
  if (status === 503) return 'This Oracle has no AgentRegistry deployment configured yet, so on-chain records cannot be synced.';
  if (status === 400) return 'Enter a DID of the form did:integrity: followed by 64 lowercase hex characters.';
  return detail || 'Sync failed. Try again shortly.';
}

const DID_RE = /^did:integrity:[0-9a-f]{64}$/;

export function ClaimAgentModal({ isOpen, defaultDid = '', onClose, onSuccess }: ClaimAgentModalProps) {
  const { addToast, walletAddress } = useDashboard();
  const [did, setDid] = useState(DID_RE.test(defaultDid) ? defaultDid : '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [record, setRecord] = useState<OnchainRecordDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    const id = did.trim();
    if (!DID_RE.test(id)) { setError(describeSyncError({ status: 400 })); return; }
    setIsSyncing(true);
    setError(null);
    try {
      setRecord(await oracle.onchainSync(id));
    } catch (err) {
      const message = describeSyncError(err);
      setError(message);
      addToast('error', message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;
  const isGuardian = !!record && !!walletAddress && record.guardian.toLowerCase() === walletAddress.toLowerCase();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'var(--navy-deep)', opacity: 0.85, backdropFilter: 'blur(8px)' }} />

      <motion.div role="dialog" aria-modal="true" aria-label="Claim on-chain agent" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', border: '1px solid var(--theme-accent-muted)', borderRadius: 0, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy-light)' }}>
          <div className="flex items-center gap-3">
            <Shield size={20} color="var(--theme-accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Claim On-Chain Agent</h3>
          </div>
          <button onClick={onClose} className="secondary-button" aria-label="Close" title="Close"><X size={20} /></button>
        </div>

        <div style={{ padding: 'var(--space-8)' }} className="flex-col gap-6">
          <div className="flex-col gap-2">
            <label htmlFor="ca-did" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Agent DID</label>
            <input id="ca-did" type="text" placeholder="did:integrity:…" className="input mono" value={did} onChange={(e) => { setDid(e.target.value.trim()); setRecord(null); }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              The Oracle reads this DID's AgentRegistry record from the chain and stores it. Nothing is signed or sent from your wallet.
            </p>
          </div>

          <button className="primary-button" onClick={handleSync} disabled={isSyncing || !did}>
            {isSyncing ? <><Loader2 className="spin" size={18} /> Reading the chain…</> : 'Sync On-Chain Record'}
          </button>

          {error && (
            <div role="alert" style={{ padding: 'var(--space-4)', background: 'rgba(255, 107, 122, 0.08)', borderRadius: 0, border: '1px solid var(--danger)', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: 'var(--danger)' }}>
              <XCircle size={18} style={{ flex: 'none' }} /> {error}
            </div>
          )}

          {record && (
            <div className="flex-col gap-3">
              <div style={{ padding: 'var(--space-4)', background: 'rgba(66, 214, 139, 0.1)', borderRadius: 0, border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} color="var(--success)" />
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                  {record.active ? 'Active' : 'Retired'} on-chain record synced at block {record.synced_block}.
                </div>
              </div>
              <dl style={{ fontSize: '0.75rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: 0 }}>
                <dt className="text-muted">Guardian</dt><dd className="mono" style={{ margin: 0, wordBreak: 'break-all' }}>{record.guardian}{isGuardian ? ' (your wallet)' : ''}</dd>
                <dt className="text-muted">Actor</dt><dd className="mono" style={{ margin: 0, wordBreak: 'break-all' }}>{record.actor ?? 'none (existence-only)'}</dd>
                <dt className="text-muted">Settlement</dt><dd style={{ margin: 0 }}>{record.settlement_eligible ? 'eligible' : 'not eligible (needs an active record with an actor)'}</dd>
              </dl>
              <button className="primary-button" onClick={onSuccess}>Done</button>
            </div>
          )}
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-8)', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={16} color="var(--text-muted)" />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
            For agents registered on-chain outside this dashboard (for example with the CLI). Control of the record belongs to its guardian address.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
