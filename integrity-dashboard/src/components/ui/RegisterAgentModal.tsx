import React from 'react';
import { ethers } from 'ethers';
import { X, Loader2, Check, ExternalLink, Download, KeyRound } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { oracle, type OnchainRecordDto } from '../../services/oracle';
import { describeHandleWriteError, handleStatusColor, handleStatusMessage, useHandleAvailability } from '../../services/xnsAvailability';
import { AGENT_REGISTRY_ADDRESS, BASE_SEPOLIA_CHAIN_ID, EXPLORER_URL } from '../../constants';
import {
  AGENT_REGISTRY_REGISTER_ABI,
  exportPrivateKeyPem,
  generateAgentKey,
  importPrivateKeyPem,
  registerArgs,
  registerOffchain,
  requestAttestation,
  type AgentKey,
} from '../../services/agentRegistration';

// Registration v3 (Phase 4 PR 4.5). Replaces the v2 flow (deploy SovereignAgent +
// StateAnchor, factory registerCore, then the legacy Oracle route), which 4.6 deletes.
//   1. Identity: an Ed25519 agent key, generated here or imported from an SDK
//      `private_key.pem`. The DID is sha256(pubkey); the key never leaves this page.
//   2. Off-chain registration (gasless, no wallet): the key signs a proof the Oracle checks.
//   3. Optional on-chain record: the Oracle attests, the connected wallet (the guardian)
//      sends one AgentRegistry.register, then /onchain/sync reads the chain back. Disabled
//      until an AgentRegistry deployment is mirrored into deployments.baseSepolia.json.
// Binding a SovereignAgent actor (settlement eligibility) stays with the CLI's
// `integrity register --onchain --confined --domain ID`.

type StepState = 'idle' | 'busy' | 'done';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (did: string) => void;
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/x-pem-file' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function RegisterAgentModal({ onClose, onSuccess }: Props) {
  const { addToast, walletAddress, connectWallet } = useDashboard();

  const [key, setKey] = React.useState<AgentKey | null>(null);
  const [keySaved, setKeySaved] = React.useState(false);
  const [handle, setHandle] = React.useState('');
  const handleCheck = useHandleAvailability(handle);
  const handleStatus = handleCheck.status;
  const handleSuggestions = handleCheck.suggestions;

  const [offchainDone, setOffchainDone] = React.useState(false);
  const [onchain, setOnchain] = React.useState<OnchainRecordDto | null>(null);
  const [lastTx, setLastTx] = React.useState<string | null>(null);
  const [busyStep, setBusyStep] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    generateAgentKey().then((k) => { if (!cancelled) setKey(k); }).catch((e) => setError(`This browser cannot create an Ed25519 key: ${e?.message ?? e}`));
    return () => { cancelled = true; };
  }, []);

  const run = async (step: number, fn: () => Promise<void>) => {
    setBusyStep(step);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      // Only step 1 claims a handle, so only its 409/503 are handle errors; a 503 from the
      // on-chain routes means the Oracle has no AgentRegistry configured.
      const message = step === 1 && handle.trim()
        ? describeHandleWriteError(err).message
        : err?.shortMessage || err?.message || 'Request failed.';
      setError(message);
      addToast('error', `Step ${step} failed: ${message}`);
    } finally {
      setBusyStep(null);
    }
  };

  const importKey = async (file: File) => {
    try {
      setKey(await importPrivateKeyPem(await file.text()));
      setKeySaved(true); // the operator already holds this key file
      setError(null);
    } catch (err: any) {
      setError(`Could not import ${file.name}: ${err?.message ?? err}`);
    }
  };

  const saveKey = async () => {
    if (!key) return;
    downloadText('private_key.pem', await exportPrivateKeyPem(key));
    setKeySaved(true);
  };

  const handleOk = handle.trim() === '' || handleStatus === 'available';

  const doOffchain = () => run(1, async () => {
    if (!key) throw new Error('No agent key yet.');
    const res = await registerOffchain(key, { handle });
    setOffchainDone(true);
    addToast('success', res.outcome === 'created' ? 'Agent registered with the Oracle.' : 'Agent was already registered with this key.');
  });

  const doOnchain = () => run(2, async () => {
    if (!key || !AGENT_REGISTRY_ADDRESS) throw new Error('No AgentRegistry deployment is configured for this network.');
    const eth = (window as any).ethereum;
    if (!eth || !walletAddress) throw new Error('Connect the wallet that will be this agent\'s guardian.');
    const provider = new ethers.BrowserProvider(eth);
    const { chainId } = await provider.getNetwork();
    if (Number(chainId) !== Number(BASE_SEPOLIA_CHAIN_ID)) throw new Error(`Switch the wallet to chain ${BASE_SEPOLIA_CHAIN_ID} first.`);
    const signer = await provider.getSigner();
    const guardian = await signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const att = await requestAttestation(key, { chainId: Number(BASE_SEPOLIA_CHAIN_ID), registry: AGENT_REGISTRY_ADDRESS, guardian, deadline });
    const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_REGISTER_ABI, signer);
    const tx = await registry.register(...registerArgs(att));
    setLastTx(tx.hash);
    await tx.wait();
    setOnchain(await oracle.onchainSync(key.did));
  });

  const stepState = (n: number, done: boolean): StepState => (busyStep === n ? 'busy' : done ? 'done' : 'idle');
  const STEPS = [
    { n: 1, label: 'Register with the Oracle (off-chain, no gas)', action: doOffchain, done: offchainDone, ready: !!key && keySaved && handleOk },
    {
      n: 2,
      label: AGENT_REGISTRY_ADDRESS ? 'Record on-chain (optional, one wallet transaction)' : 'Record on-chain (available once AgentRegistry is deployed)',
      action: doOnchain,
      done: !!onchain,
      ready: offchainDone && !!AGENT_REGISTRY_ADDRESS && !!walletAddress,
    },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Register agent" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: 'min(560px, 96vw)', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Register agent</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
          The agent's identity is its own Ed25519 key: the DID is the hash of the public key, and registration is proven by a signature from that key. The key is created in this browser and never sent anywhere.
        </div>

        <div className="form-group">
          <span className="form-label">Agent identity</span>
          <div style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
            {key ? <code data-testid="ra-did" style={{ color: 'var(--theme-accent)' }}>{key.did}</code> : <span className="text-muted"><Loader2 size={12} className="animate-spin" /> Creating key…</span>}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 6 }}>
            <button type="button" className="secondary-button" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', gap: 6, alignItems: 'center' }} onClick={saveKey} disabled={!key || offchainDone}>
              <Download size={13} /> Save private_key.pem
            </button>
            <label className="secondary-button" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', gap: 6, alignItems: 'center', cursor: offchainDone ? 'not-allowed' : 'pointer' }}>
              <KeyRound size={13} /> Use an existing key…
              <input type="file" accept=".pem" hidden disabled={offchainDone} onChange={(e) => { const f = e.target.files?.[0]; if (f) void importKey(f); }} />
            </label>
          </div>
          <small className="text-muted">
            {keySaved
              ? 'Key saved. Keep it with the agent (an integrity-sdk key store reads private_key.pem as-is).'
              : 'Save the key before registering: without it this DID can never sign again. To register an existing agent (for example a Shield DID), import its private_key.pem.'}
          </small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ra-handle">XNS handle (optional)</label>
          <input id="ra-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="atlas" aria-describedby="ra-handle-help" disabled={offchainDone} />
          <small id="ra-handle-help" className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {handleStatus === 'idle'
              ? 'Claimed in the same request if given. Unique across the ecosystem; agents without one are shown by DID.'
              : <span role="status" style={{ color: handleStatusColor(handleStatus) }}>{handleStatusMessage(handleCheck)}</span>}
          </small>
          {handleStatus === 'taken' && handleSuggestions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {handleSuggestions.map((s) => (
                <button key={s} type="button" className="secondary-button" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setHandle(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {STEPS.map((s) => {
            const st = stepState(s.n, s.done);
            return (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: st === 'done' ? 'var(--success)' : 'rgba(255,255,255,0.08)', color: st === 'done' ? '#001b0e' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>
                  {st === 'busy' ? <Loader2 size={13} className="animate-spin" /> : st === 'done' ? <Check size={13} /> : s.n}
                </span>
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</span>
                <button className="secondary-button" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  disabled={busyStep !== null || st === 'done' || !s.ready} onClick={s.action}>
                  {st === 'done' ? 'Done' : st === 'busy' ? 'Working…' : 'Run'}
                </button>
              </div>
            );
          })}
        </div>

        {offchainDone && AGENT_REGISTRY_ADDRESS && !walletAddress && (
          <button className="secondary-button" onClick={connectWallet}>Connect the guardian wallet for the on-chain step</button>
        )}

        {onchain && (
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            On-chain record synced at block {onchain.synced_block}. Guardian <code>{onchain.guardian}</code>; no actor bound, so not settlement-eligible yet.
          </div>
        )}

        {error && (
          <div role="alert" style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-dim)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        {lastTx && (
          <a href={`${EXPLORER_URL}/tx/${lastTx}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--theme-accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Registration tx <ExternalLink size={12} />
          </a>
        )}

        {offchainDone && key && (
          <button className="primary-button" onClick={() => onSuccess(key.did)}>Finish</button>
        )}
      </div>
    </div>
  );
}
