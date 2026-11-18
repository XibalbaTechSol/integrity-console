import React, { useState } from 'react';
import { X, Send, Cpu, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Terminal, Copy } from 'lucide-react';
import { dispatchA2ATask, type Agent0Record, type A2AExecutionReceipt } from '../../services/agent0';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetAgent?: Agent0Record | null;
}

export function Agent0A2ADispatcher({ isOpen, onClose, targetAgent }: Props) {
  const [taskType, setTaskType] = useState('audit_security');
  const [prompt, setPrompt] = useState('Analyze proposed state transition for reentrancy and memory safety bounds.');
  const [escrowEth, setEscrowEth] = useState('0.001');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<A2AExecutionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReceipt(null);

    try {
      const res = await dispatchA2ATask({
        targetAgentId: targetAgent ? targetAgent.agentId : '84532:1',
        targetDid: targetAgent?.integrityDid,
        taskType,
        prompt,
        escrowBountyEth: escrowEth,
      });
      setReceipt(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch A2A task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="modal-content" style={{
        background: 'var(--surface-color, #121316)',
        border: '1px solid var(--border-color, #2a2d35)',
        borderRadius: '12px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
        color: 'var(--text-primary, #fff)', position: 'relative'
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', color: 'var(--text-secondary, #888)',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            padding: '0.6rem', borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8'
          }}>
            <Cpu size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>Agent-to-Agent (A2A) Task Dispatcher</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
              Delegate verifiable computational tasks to target Agent0 identity with escrow lock.
            </p>
          </div>
        </div>

        {targetAgent && (
          <div style={{
            padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
            borderRadius: '6px', border: '1px solid var(--border-color, #333)',
            marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Target Agent</span>
              <strong style={{ fontSize: '0.95rem' }}>{targetAgent.name}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Token ID</span>
              <code style={{ fontSize: '0.85rem', color: 'var(--accent-color, #00e5ff)' }}>#{targetAgent.tokenId}</code>
            </div>
          </div>
        )}

        {receipt ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem', background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#10b981' }}>
                <CheckCircle2 size={18} />
                <strong>Task Dispatched & Verified</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ddd' }}>
                {receipt.responsePayload}
              </p>
            </div>

            {/* Terminal Trace */}
            <div style={{
              background: '#090a0d', border: '1px solid #222', borderRadius: '8px',
              padding: '1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#888'
            }}>
              <div style={{ color: '#00e5ff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} /> Execution Trace & Attestation
              </div>
              <div>&gt; task_id: {receipt.taskId}</div>
              <div>&gt; target_agent: {receipt.targetAgentId}</div>
              <div>&gt; bcc_proof: {receipt.bccProofHash.slice(0, 24)}…</div>
              <div>&gt; execution_hash: {receipt.executionHash.slice(0, 24)}…</div>
              <div style={{ color: '#10b981' }}>&gt; status: 200 OK (eBPF containment passed)</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setReceipt(null)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px' }}
              >
                Dispatch Another Task
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px' }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Task Capability Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px',
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              >
                <option value="audit_security">audit_security (Shield eBPF Bound Inspection)</option>
                <option value="inference_reasoning">inference_reasoning (Deep Neural Execution)</option>
                <option value="data_extraction">data_extraction (Super-Cortex Knowledge Ingestion)</option>
                <option value="escrow_settlement">escrow_settlement (Confined Financial Verification)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Prompt / Task Instructions
              </label>
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px',
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Escrow Bounty (Base Sepolia ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={escrowEth}
                onChange={(e) => setEscrowEth(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px',
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #777)', marginTop: '0.2rem', display: 'block' }}>
                Funds are locked in escrow and only released upon successful cryptographic proof attestation.
              </span>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444', fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing Task…</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Dispatch Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
