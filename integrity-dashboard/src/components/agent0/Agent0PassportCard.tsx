import React, { useState } from 'react';
import {
  Globe, ShieldCheck, Wallet, ArrowUpRight, Copy, Check,
  Send, DollarSign, Star, ExternalLink, Activity, Cpu, MessageSquare
} from 'lucide-react';
import { type Agent0Record } from '../../services/agent0';
import { EXPLORER_URL } from '../../constants';

interface Props {
  record: Agent0Record;
  onOpenMessenger?: (record: Agent0Record) => void;
  onDispatchTask?: (record: Agent0Record) => void;
  onSendPayment?: (record: Agent0Record) => void;
  onSubmitFeedback?: (record: Agent0Record) => void;
}

export function Agent0PassportCard({
  record,
  onOpenMessenger,
  onDispatchTask,
  onSendPayment,
  onSubmitFeedback,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const hasTwoWayBinding = Boolean(record.integrityDid);
  const mcpEndpoint = record.services.find((s) => s.name === 'MCP')?.endpoint;
  const a2aEndpoint = record.services.find((s) => s.name === 'A2A')?.endpoint;

  return (
    <div className="agent0-passport-card" style={{
      background: 'var(--surface-color, #131418)',
      border: '1px solid var(--border-color, #272a31)',
      borderRadius: 0, padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Top Banner & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: 0,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(99,102,241,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(0,229,255,0.3)', color: 'var(--accent-color, #00e5ff)'
          }}>
            <Globe size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{record.name}</h3>
              <span style={{
                fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 0,
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary, #aaa)',
                fontFamily: 'monospace'
              }}>
                #{record.tokenId}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary, #888)' }}>
              {record.description || 'Public Web3 Agent with verified cryptographic identity.'}
            </p>
          </div>
        </div>

        {/* Verification badges */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {hasTwoWayBinding ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.25rem 0.6rem', borderRadius: 0,
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981', fontSize: '0.75rem', fontWeight: 600
            }}>
              <ShieldCheck size={14} /> Tier 2 Verified
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.25rem 0.6rem', borderRadius: 0,
              background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b', fontSize: '0.75rem'
            }}>
              Unlinked DID
            </span>
          )}

          {record.isConfinedWallet && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.25rem 0.6rem', borderRadius: 0,
              background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600
            }}>
              <Wallet size={13} /> Confined Actor
            </span>
          )}

          {record.x402Support && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.25rem 0.6rem', borderRadius: 0,
              background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)',
              color: 'var(--accent-color, #00e5ff)', fontSize: '0.75rem', fontWeight: 600
            }}>
              <DollarSign size={13} /> x402 Active
            </span>
          )}
        </div>
      </div>

      {/* Identity & Technical Details Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem',
        padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: 0,
        border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem'
      }}>
        {record.integrityDid && (
          <div>
            <span style={{ color: 'var(--text-secondary, #777)', display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
              Integrity DID (RFC 8785 Proof)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <code style={{ fontFamily: 'monospace', color: '#10b981' }}>
                {record.integrityDid.slice(0, 18)}…{record.integrityDid.slice(-6)}
              </code>
              <button
                type="button"
                onClick={() => copy(record.integrityDid!, 'did')}
                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: 0 }}
                title="Copy DID"
              >
                {copiedKey === 'did' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}

        <div>
          <span style={{ color: 'var(--text-secondary, #777)', display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
            Smart Wallet ({record.isConfinedWallet ? 'SovereignAgent Actor' : 'Owner EOA'})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <code style={{ fontFamily: 'monospace', color: record.isConfinedWallet ? '#a78bfa' : '#ddd' }}>
              {record.walletAddress.slice(0, 10)}…{record.walletAddress.slice(-6)}
            </code>
            <button
              type="button"
              onClick={() => copy(record.walletAddress, 'wallet')}
              style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: 0 }}
              title="Copy Wallet"
            >
              {copiedKey === 'wallet' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {mcpEndpoint && (
          <div>
            <span style={{ color: 'var(--text-secondary, #777)', display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
              MCP Endpoint
            </span>
            <span style={{ color: '#ccc', wordBreak: 'break-all' }}>{mcpEndpoint}</span>
          </div>
        )}

        {a2aEndpoint && (
          <div>
            <span style={{ color: 'var(--text-secondary, #777)', display: 'block', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
              A2A Dispatch Gateway
            </span>
            <span style={{ color: '#ccc', wordBreak: 'break-all' }}>{a2aEndpoint}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onOpenMessenger && (
            <button
              type="button"
              onClick={() => onOpenMessenger(record)}
              className="primary-button"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.85rem', fontSize: '0.82rem', borderRadius: 0,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: 'none', color: '#fff', cursor: 'pointer'
              }}
            >
              <MessageSquare size={13} />
              <span>Talk via A2A</span>
            </button>
          )}

          {onDispatchTask && (
            <button
              type="button"
              onClick={() => onDispatchTask(record)}
              className="secondary-button"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.85rem', fontSize: '0.82rem', borderRadius: 0
              }}
            >
              <Send size={13} />
              <span>Dispatch A2A Task</span>
            </button>
          )}

          {onSendPayment && (
            <button
              type="button"
              onClick={() => onSendPayment(record)}
              className="secondary-button"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.85rem', fontSize: '0.82rem', borderRadius: 0
              }}
            >
              <DollarSign size={13} />
              <span>x402 Micropayment</span>
            </button>
          )}

          {onSubmitFeedback && (
            <button
              type="button"
              onClick={() => onSubmitFeedback(record)}
              className="secondary-button"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.85rem', fontSize: '0.82rem', borderRadius: 0
              }}
            >
              <Star size={13} />
              <span>Reputation Feedback</span>
            </button>
          )}
        </div>

        <a
          href={`${EXPLORER_URL}/token/0x8004A818BFB912233c491871b3d84c89A494BD9e?a=${record.tokenId}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            color: 'var(--text-secondary, #888)', fontSize: '0.8rem', textDecoration: 'none'
          }}
        >
          <span>BaseScan</span> <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
