import React, { useState } from 'react';
import { X, DollarSign, Wallet, ArrowRight, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { sendX402Micropayment, type Agent0Record } from '../../services/agent0';
import { EXPLORER_URL } from '../../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetAgent?: Agent0Record | null;
}

export function Agent0MicropaymentModal({ isOpen, onClose, targetAgent }: Props) {
  const [amount, setAmount] = useState('0.0005');
  const [recipient, setRecipient] = useState(targetAgent?.walletAddress || '');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const res = await sendX402Micropayment(recipient || targetAgent?.walletAddress || '', amount);
      setTxHash(res.txHash);
    } catch (err: any) {
      setError(err?.message || 'Micropayment transaction failed.');
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
        borderRadius: 0, width: '100%', maxWidth: '520px',
        padding: '2rem', color: 'var(--text-primary, #fff)', position: 'relative'
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
            padding: '0.6rem', borderRadius: 0,
            background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-color, #00e5ff)'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>HTTP 402 Pay-Per-Request</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
              Send autonomous micropayments directly to the agent's confined smart wallet.
            </p>
          </div>
        </div>

        {txHash ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Payment Confirmed!</h3>
            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Transferred {amount} ETH to agent wallet on Base Sepolia.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', borderRadius: 0, textDecoration: 'none'
                }}
              >
                <span>View Receipt</span> <ExternalLink size={13} />
              </a>
              <button
                type="button"
                className="primary-button"
                onClick={onClose}
                style={{ padding: '0.55rem 1rem', borderRadius: 0 }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Target Smart Wallet Address
              </label>
              <input
                type="text"
                required
                value={recipient || targetAgent?.walletAddress || ''}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace'
                }}
              />
              {targetAgent?.isConfinedWallet && (
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.25rem', display: 'block' }}>
                  ✓ Policy-confined SovereignAgent actor smart contract
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Payment Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: 0, background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444', fontSize: '0.85rem'
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
                style={{ padding: '0.65rem 1.25rem', borderRadius: 0 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 0,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Confirming in Wallet…</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={15} />
                    <span>Send Micropayment</span>
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
