import React, { useState } from 'react';
import { X, Globe, Shield, Wallet, ArrowRight, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { registerAgent0WithWallet, type Agent0RegistrationInput } from '../../services/agent0';
import { EXPLORER_URL } from '../../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tokenId: string, txHash: string) => void;
  defaultDid?: string;
  defaultActorWallet?: string;
  defaultName?: string;
}

export function Agent0RegisterModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDid = '',
  defaultActorWallet = '',
  defaultName = '',
}: Props) {
  const [name, setName] = useState(defaultName || 'Autonomous Operator');
  const [description, setDescription] = useState('Production-grade autonomous AI agent verified via Integrity Protocol and Xibalba Shield.');
  const [image, setImage] = useState('');
  const [did, setDid] = useState(defaultDid);
  const [agentWallet, setAgentWallet] = useState(defaultActorWallet);
  const [mcpEndpoint, setMcpEndpoint] = useState('https://agent.xibalba.solutions/mcp');
  const [a2aEndpoint, setA2aEndpoint] = useState('https://agent.xibalba.solutions/a2a');
  const [x402Support, setX402Support] = useState(true);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tokenId: string; txHash: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const input: Agent0RegistrationInput = {
        name,
        description,
        image: image || undefined,
        did: did || undefined,
        agentWallet: agentWallet || undefined,
        mcpEndpoint: mcpEndpoint || undefined,
        a2aEndpoint: a2aEndpoint || undefined,
        x402Support,
        trustModels: ['reputation', 'integrity-attestation'],
      };

      const res = await registerAgent0WithWallet(input, (msg) => setStatusMessage(msg));
      setResult({ tokenId: res.tokenId, txHash: res.txHash });
      onSuccess?.(res.tokenId, res.txHash);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete ERC-8004 registration.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
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
        borderRadius: 0, width: '100%', maxWidth: '640px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            padding: '0.6rem', borderRadius: 0,
            background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-color, #00e5ff)'
          }}>
            <Globe size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, margin: 0 }}>Register Agent0 Public Passport</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
              Mint an ERC-8004 identity on Base Sepolia with two-way Integrity DID verification.
            </p>
          </div>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Passport Successfully Minted!</h3>
            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Agent0 Token ID: <strong>#{result.tokenId}</strong> on Base Sepolia
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <a
                href={`${EXPLORER_URL}/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.2rem', borderRadius: 0, textDecoration: 'none'
                }}
              >
                <span>View on BaseScan</span> <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="primary-button"
                onClick={onClose}
                style={{ padding: '0.6rem 1.2rem', borderRadius: 0 }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Agent Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Quantitative Market Maker #1"
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                Description
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                  background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                  color: '#fff', fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                  Integrity DID (Two-Way Binding)
                </label>
                <input
                  type="text"
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  placeholder="did:integrity:..."
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                    background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                    color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                  Confined SovereignAgent Wallet
                </label>
                <input
                  type="text"
                  value={agentWallet}
                  onChange={(e) => setAgentWallet(e.target.value)}
                  placeholder="0x... (actor address)"
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                    background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                    color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                  Model Context Protocol (MCP) Endpoint
                </label>
                <input
                  type="url"
                  value={mcpEndpoint}
                  onChange={(e) => setMcpEndpoint(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                    background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                    color: '#fff', fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary, #aaa)' }}>
                  Agent-to-Agent (A2A) Endpoint
                </label>
                <input
                  type="url"
                  value={a2aEndpoint}
                  onChange={(e) => setA2aEndpoint(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 0,
                    background: 'var(--bg-color, #0a0b0d)', border: '1px solid var(--border-color, #333)',
                    color: '#fff', fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem', background: 'rgba(255,255,255,0.03)',
              borderRadius: 0, border: '1px solid var(--border-color, #333)'
            }}>
              <input
                type="checkbox"
                id="x402-toggle"
                checked={x402Support}
                onChange={(e) => setX402Support(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="x402-toggle" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                <strong>Enable HTTP 402 Pay-Per-Request (`x402Support`)</strong>
                <span style={{ display: 'block', color: 'var(--text-secondary, #888)', fontSize: '0.78rem' }}>
                  Allows external agents and users to pay this agent directly for inference and tasks.
                </span>
              </label>
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

            {statusMessage && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: 0, background: 'rgba(0, 229, 255, 0.08)',
                color: 'var(--accent-color, #00e5ff)', fontSize: '0.85rem'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>{statusMessage}</span>
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
                    <span>Minting on Base Sepolia…</span>
                  </>
                ) : (
                  <>
                    <span>Mint Agent0 Passport</span>
                    <ArrowRight size={16} />
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
