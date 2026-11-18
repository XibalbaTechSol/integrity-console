import React, { useState } from 'react';
import { Globe, Cpu, DollarSign, BookOpen, ShieldCheck, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { Agent0Explorer } from '../components/agent0/Agent0Explorer';
import { Agent0A2ADispatcher } from '../components/agent0/Agent0A2ADispatcher';
import { Agent0MicropaymentModal } from '../components/agent0/Agent0MicropaymentModal';
import { BASE_SEPOLIA_CHAIN_ID, EXPLORER_URL } from '../constants';
import { BASE_SEPOLIA_IDENTITY_REGISTRY } from '../services/agent0';

export function Agent0HubPage() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'a2a' | 'x402' | 'architecture'>('explorer');

  // Interactive quick modals
  const [a2aOpen, setA2aOpen] = useState(false);
  const [x402Open, setX402Open] = useState(false);

  return (
    <div className="agent0-hub-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(99,102,241,0.08))',
        border: '1px solid var(--border-color, #272a31)', borderRadius: '16px',
        padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--accent-color, #00e5ff)',
            padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(0,229,255,0.1)'
          }}>
            ERC-8004 · Agentic Economy
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)' }}>
            Base Sepolia ({BASE_SEPOLIA_CHAIN_ID})
          </span>
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          Agent0 Identity & Autonomous Workflows
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary, #aaa)', maxWidth: '780px', margin: 0, lineHeight: 1.6 }}>
          A modular on-chain identity passport connecting autonomous agents to public discovery, inter-agent delegation (A2A), and HTTP 402 pay-per-request monetization—secured by Xibalba Shield and bound to Integrity DIDs.
        </p>

        {/* Quick metrics row */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #777)', display: 'block' }}>Identity Registry</span>
            <code style={{ fontSize: '0.85rem', color: '#00e5ff', fontFamily: 'monospace' }}>
              {BASE_SEPOLIA_IDENTITY_REGISTRY.slice(0, 10)}…{BASE_SEPOLIA_IDENTITY_REGISTRY.slice(-6)}
            </code>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #777)', display: 'block' }}>Wallet Model</span>
            <strong style={{ fontSize: '0.9rem', color: '#a78bfa' }}>Policy-Confined SovereignAgent</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #777)', display: 'block' }}>Attestation Standard</span>
            <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>RFC 8785 Two-Way DID Backlink</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color, #272a31)',
        paddingBottom: '0.75rem', flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.15rem', borderRadius: '8px', border: 'none',
            background: activeTab === 'explorer' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
            color: activeTab === 'explorer' ? 'var(--accent-color, #00e5ff)' : 'var(--text-secondary, #888)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          <Globe size={16} />
          <span>Registry Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('a2a')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.15rem', borderRadius: '8px', border: 'none',
            background: activeTab === 'a2a' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
            color: activeTab === 'a2a' ? '#818cf8' : 'var(--text-secondary, #888)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          <Cpu size={16} />
          <span>Inter-Agent (A2A) Bench</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('x402')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.15rem', borderRadius: '8px', border: 'none',
            background: activeTab === 'x402' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            color: activeTab === 'x402' ? '#10b981' : 'var(--text-secondary, #888)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          <DollarSign size={16} />
          <span>x402 Micropayments</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.15rem', borderRadius: '8px', border: 'none',
            background: activeTab === 'architecture' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'architecture' ? '#fff' : 'var(--text-secondary, #888)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          <BookOpen size={16} />
          <span>Architecture & Rules</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'explorer' && <Agent0Explorer />}

      {activeTab === 'a2a' && (
        <div style={{
          background: 'var(--surface-color, #121316)', border: '1px solid var(--border-color, #272a31)',
          borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Inter-Agent Delegation (A2A) Test Bench</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>
              Test autonomous sub-agent contracting: dispatch jobs with escrow guarantees and verify results inside Xibalba Shield containment.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem',
            padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'
          }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>1. Select & Verify Agent</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                Query the public ERC-8004 registry for an agent offering the required capability (e.g. security audit or knowledge extraction).
              </p>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>2. Lock Escrow Bounty</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                Funds are held in a smart contract and released only when execution hashes match Oracle policy receipts.
              </p>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>3. Execute in Sandbox</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                Shield eBPF guarantees the hired agent cannot access unauthorized networks or exfiltrate private credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => setA2aOpen(true)}
            style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Cpu size={16} />
            <span>Launch A2A Task Dispatcher</span>
          </button>
        </div>
      )}

      {activeTab === 'x402' && (
        <div style={{
          background: 'var(--surface-color, #121316)', border: '1px solid var(--border-color, #272a31)',
          borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>HTTP 402 Pay-Per-Request & Wallet Budgeting</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>
              Simulate external micropayments to an agent's smart wallet and inspect policy spend limits.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem',
            padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'
          }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Confined Smart Wallet</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                The agent holds an isolated `SovereignAgent` smart contract wallet rather than an unconstrained private key.
              </p>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Autonomous Gas Spend</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                The agent can buy its own inference tokens, LLM API calls, or cloud compute up to strict hourly caps.
              </p>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Anti-Rug Pull Protection</strong>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                Even if model weights are prompt-injected, the policy Merkle tree prevents unapproved balance transfers.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => setX402Open(true)}
            style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <DollarSign size={16} />
            <span>Open Micropayment Console</span>
          </button>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div style={{
          background: 'var(--surface-color, #121316)', border: '1px solid var(--border-color, #272a31)',
          borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>3-Tier Identity Architecture & Parity Invariants</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>
              The canonical multi-tier architecture enforced across Super-Cortex, Xibalba Shield, and Integrity Console.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#10b981' }}>
                <CheckCircle2 size={16} />
                <strong>Tier 0: Off-Chain Sovereign (0 Gas)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
                Default for all agents in Shield, Cortex, and SDK. Agents generate an Ed25519 keypair (<code>did:integrity:&lt;hex&gt;</code>) and register gaslessly with the Integrity Oracle. Shield enforces local eBPF confinement with zero EVM dependencies.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#a78bfa' }}>
                <Wallet size={16} />
                <strong>Tier 1: On-Chain Confined Wallet (`SovereignAgent.sol`)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
                Contract-using agents register in `AgentRegistry.sol`. A policy-confined smart contract actor is deployed, gated by the domain's compiled Policy Pack Merkle root.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-color, #00e5ff)' }}>
                <Globe size={16} />
                <strong>Tier 2: Modular Agent0 / ERC-8004 Public Passport</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
                When an agent enters public discovery, the Agent0 adapter mints an ERC-8004 identity with an RFC 8785 two-way cryptographic backlink to <code>did:integrity:&lt;hex&gt;</code>, points <code>agentWallet</code> to the confined <code>SovereignAgent</code> actor address, and verifies with the Oracle (<code>POST /v1/agent/&#123;did&#125;/erc8004</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Modals */}
      <Agent0A2ADispatcher isOpen={a2aOpen} onClose={() => setA2aOpen(false)} />
      <Agent0MicropaymentModal isOpen={x402Open} onClose={() => setX402Open(false)} />
    </div>
  );
}
