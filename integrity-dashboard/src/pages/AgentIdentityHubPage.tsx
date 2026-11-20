import React, { useState } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  MessageSquare,
  Globe,
  Radio,
  FileCode,
  Sparkles,
  Layers,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { useDashboard, type Agent } from '../context/DashboardContext';
import { Agent0Explorer } from '../components/agent0/Agent0Explorer';
import { Agent0A2ADispatcher } from '../components/agent0/Agent0A2ADispatcher';
import { RegisterAgentModal } from '../components/ui/RegisterAgentModal';
import { ClaimAgentModal } from '../components/ui/ClaimAgentModal';
import { Agent0RegisterModal } from '../components/agent0/Agent0RegisterModal';
import { BASE_SEPOLIA_CHAIN_ID, EXPLORER_URL } from '../constants';
import { BASE_SEPOLIA_IDENTITY_REGISTRY } from '../services/agent0';

export interface CanonicalAgentProfile {
  handle: string;
  name: string;
  role: string;
  harness: 'antigravity' | 'claude_code' | 'hermes' | 'codex';
  did: string;
  keyPath: string;
  scope: string;
  tokenId?: number;
  tier: number;
  description: string;
  isConfined: boolean;
  status: 'active' | 'standby';
}

export const CANONICAL_TRIAD: CanonicalAgentProfile[] = [
  {
    handle: 'xibalba.agy',
    name: 'Xibalba AGY Control Agent',
    role: 'Global Orchestrator & Quantitative Control Systems Engineer',
    harness: 'antigravity',
    did: 'did:integrity:b1a72980e8e45e97c7b92982a89b1963e470b45fa955c9bd245f046e1e32e39a',
    keyPath: '~/.integrity/did/profiles/b9d266955a00e041ee5c2cc5b136e6a8/agy/private_key.pem',
    scope: 'agent:agy',
    tokenId: 10774,
    tier: 1,
    description: 'Autonomous Antigravity control agent and quantitative orchestrator executing dynamic feedback loops with Base Sepolia ERC-8004 Token #10774 public passport.',
    isConfined: true,
    status: 'active',
  },
  {
    handle: 'xibalba.claude',
    name: 'Xibalba Claude Engineering Specialist',
    role: 'Principal Systems Architect & Software Engineering Lead',
    harness: 'claude_code',
    did: 'did:integrity:f07438ae1fb67f6ab1a21df87fb4771bead162c502c6e98cfa0bbdd7020a7e75',
    keyPath: '~/.claude/.integrity/did/claude/private_key.pem',
    scope: 'agent:claude',
    tier: 1,
    description: 'High-order systems architect and primary engineering harness driving full-stack monorepo implementations and test-driven verification.',
    isConfined: true,
    status: 'active',
  },
  {
    handle: 'xibalba.codex',
    name: 'Xibalba Codex Engineering Specialist',
    role: 'Code Synthesis & Refactoring Autonomous Harness',
    harness: 'codex',
    did: 'did:integrity:d73b98dd869948c27c7cc16d53683779a23c46daf3020e221955d67d1a8723c5',
    keyPath: '~/.codex/.integrity/did/codex/private_key.pem',
    scope: 'agent:codex',
    tier: 1,
    description: 'Autonomous OpenAI Codex harness dedicated to rigorous algorithmic synthesis, code optimization, and mathematical AST transformations.',
    isConfined: true,
    status: 'active',
  },
];

export const SHIELD_FLEET_AGENTS = [
  {
    handle: 'shield.local',
    name: 'Xibalba Shield Local (Jev Classifier)',
    role: 'Local Endpoint eBPF Containment Responder',
    model: 'Jev (Fast Edge Classifier)',
    did: 'did:integrity:68fed1331613937555a59398223e8e87520a87dd0305aac4fd7ecdc32a14a861',
    scope: 'agent:shield.local',
    tier: 1,
    description: 'On-device edge containment agent utilizing a small, fast classification model (Jev) for rapid execve triage and sub-millisecond freeze_process containment.',
  },
  {
    handle: 'shield.cloud',
    name: 'Xibalba Shield Cloud (Hermes)',
    role: 'Centralized Policy Distribution & Reasoning',
    model: 'Hermes (Cloud Reasoning)',
    did: 'did:integrity:2ea17967f7a65589d570ca7e800844701fb36e6aa7374243e8766de8651f6bc4',
    scope: 'agent:shield.cloud',
    tier: 1,
    description: 'Centralized cloud defense harness powered by Hermes, orchestrating fleet threat intelligence, OPA canary updates, and multi-endpoint risk scoring.',
  },
];

const short = (val?: string | null, start = 12, end = 8) => {
  if (!val) return 'Unavailable';
  if (val.length <= start + end + 1) return val;
  return `${val.slice(0, start)}…${val.slice(-end)}`;
};

export function AgentIdentityHubPage() {
  const { agents, selectedAgent, setSelectedAgent } = useDashboard();
  const [activeTab, setActiveTab] = useState<'fleet' | 'agent0' | 'a2a' | 'architecture'>('fleet');
  const [copiedDid, setCopiedDid] = useState<string | null>(null);

  // Modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [a2aModalOpen, setA2aModalOpen] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDid(id);
      setTimeout(() => setCopiedDid(null), 2000);
    } catch (e) {
      console.warn('Clipboard failed', e);
    }
  };

  return (
    <div className="agent-identity-hub-page" style={{ padding: '2rem', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        borderRadius: '16px',
        padding: '2.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{
                background: 'rgba(0, 229, 255, 0.15)',
                color: '#00e5ff',
                padding: '0.2rem 0.65rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Identity Core & Passports
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Base Sepolia ({BASE_SEPOLIA_CHAIN_ID}) · Ed25519 Pure
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Autonomous Agent Identity Architecture
            </h1>
            <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0.5rem 0 0 0', maxWidth: '820px', lineHeight: 1.6 }}>
              Cryptographically verified autonomous agents across Antigravity, Claude Code, and Codex. Bound to on-chain Base Sepolia ERC-8004 public passports, isolated Ed25519 keypairs, and real-time BCC intent containment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMintOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00e5ff, #0284c7)',
                color: '#03121d',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)'
              }}
            >
              <PlusCircle size={16} /> Mint ERC-8004
            </button>
            <button
              onClick={() => setRegisterOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer'
              }}
            >
              Register DID
            </button>
            <button
              onClick={() => setClaimOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer'
              }}
            >
              Claim Ownership
            </button>
          </div>
        </div>

        {/* Identity Registry Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Base Sepolia Registry</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <code style={{ fontSize: '0.85rem', color: '#00e5ff', fontFamily: 'monospace' }}>
                {short(BASE_SEPOLIA_IDENTITY_REGISTRY, 10, 6)}
              </code>
              <a
                href={`${EXPLORER_URL}/address/${BASE_SEPOLIA_IDENTITY_REGISTRY}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
                title="View on Basescan"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Passport Token</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>Token #10774</strong>
              <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                xibalba.agy
              </span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sovereign Actor Model</span>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600 }}>Policy-Confined SovereignAgent</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>DID Service Backlink</span>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>RFC 8785 Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Triad: Canonical Xibalba Agents */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#00e5ff" /> Canonical Agent Fleet
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              The three authoritative autonomous harnesses operating across the Xibalba monorepo.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
            3 Active Harnesses
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {CANONICAL_TRIAD.map((agent) => {
            const isSelected = selectedAgent?.alias === agent.handle || selectedAgent?.id === agent.did;
            return (
              <div
                key={agent.handle}
                style={{
                  background: isSelected ? 'rgba(0, 229, 255, 0.05)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  boxShadow: isSelected ? '0 0 20px rgba(0, 229, 255, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Top Row: Handle & Tier */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: agent.harness === 'antigravity'
                        ? 'linear-gradient(135deg, #00e5ff, #0284c7)'
                        : agent.harness === 'claude_code'
                        ? 'linear-gradient(135deg, #f97316, #ea580c)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.1rem'
                    }}>
                      {agent.handle.slice(8, 10).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{agent.handle}</strong>
                        {agent.tokenId && (
                          <span style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px'
                          }}>
                            #{agent.tokenId}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{agent.name}</span>
                    </div>
                  </div>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    <CheckCircle2 size={13} /> Tier {agent.tier}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                  {agent.description}
                </p>

                {/* Cryptographic Parameters */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>DID:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{short(agent.did, 12, 8)}</code>
                      <button
                        onClick={() => copyToClipboard(agent.did, agent.handle)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                        title="Copy DID"
                      >
                        <Copy size={13} color={copiedDid === agent.handle ? '#34d399' : '#64748b'} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Harness:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{agent.harness}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Cortex Scope:</span>
                    <code style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{agent.scope}</code>
                  </div>
                  {agent.tokenId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Passport Explorer:</span>
                      <a
                        href={`https://sepolia.basescan.org/token/${BASE_SEPOLIA_IDENTITY_REGISTRY}?a=${agent.tokenId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                      >
                        Basescan #{agent.tokenId} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      const matched = agents.find(a => a.id === agent.did || a.alias === agent.handle);
                      if (matched) {
                        setSelectedAgent(matched);
                      } else {
                        setSelectedAgent({
                          id: agent.did,
                          eth_address: agent.did,
                          alias: agent.handle,
                          name: agent.name,
                          verification_tier: agent.tier,
                          namespace_key: `shared:${agent.handle}`,
                          store_id: 'shared',
                          writable: true,
                        });
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#00e5ff' : '#f8fafc',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? 'Active Scope' : 'Select Namespace'}
                  </button>
                  <button
                    onClick={() => setActiveTab('a2a')}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#94a3b8',
                      fontSize: '0.82rem',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                    title="Send A2A Message"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shield Protection Fleet Agents */}
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} color="#34d399" /> Shield Protection Fleet Agents
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Autonomous security pair enforcing local kernel-level execution containment and centralized cloud policy intelligence.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              2 Active Agents
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {SHIELD_FLEET_AGENTS.map((agent) => {
              const isSelected = selectedAgent?.alias === agent.handle || selectedAgent?.id === agent.did;
              return (
                <div
                  key={agent.handle}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.6)',
                    border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    boxShadow: isSelected ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: agent.handle === 'shield.local'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #06b6d4, #0284c7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1rem'
                      }}>
                        {agent.handle === 'shield.local' ? 'SL' : 'SC'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#f8fafc' }}>{agent.handle}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{agent.name}</span>
                      </div>
                    </div>

                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px'
                    }}>
                      <CheckCircle2 size={12} /> Tier {agent.tier}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    {agent.description}
                  </p>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '0.7rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Model:</span>
                      <strong style={{ color: agent.handle === 'shield.local' ? '#34d399' : '#38bdf8' }}>{agent.model}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>DID:</span>
                      <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{short(agent.did, 12, 8)}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Cortex Scope:</span>
                      <code style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{agent.scope}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => {
                        setSelectedAgent({
                          id: agent.did,
                          eth_address: agent.did,
                          alias: agent.handle,
                          name: agent.name,
                          verification_tier: agent.tier,
                          namespace_key: `shared:${agent.handle}`,
                          store_id: 'shared',
                          writable: true,
                        });
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#34d399' : '#f8fafc',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? 'Active Scope' : 'Select Namespace'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '0.75rem',
        marginTop: '0.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'fleet' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
            color: activeTab === 'fleet' ? '#00e5ff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Layers size={16} /> All Scoped Namespaces ({agents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agent0')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'agent0' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
            color: activeTab === 'agent0' ? '#00e5ff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Globe size={16} /> Agent0 Universal Directory
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('a2a')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'a2a' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
            color: activeTab === 'a2a' ? '#00e5ff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Radio size={16} /> A2A Containment Dispatcher
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'architecture' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
            color: activeTab === 'architecture' ? '#00e5ff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <FileCode size={16} /> Cryptographic Proofs & Backlinks
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
              Namespaces visible through authenticated Cortex session ({agents.length} total)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {agents.filter(a => a.writable !== false).length} Writable
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {agents.filter(a => a.writable === false).length} Read-Only
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem'
          }}>
            {agents.map((agent) => {
              const isSelected = (selectedAgent?.namespace_key || selectedAgent?.id) === (agent.namespace_key || agent.id);
              return (
                <div
                  key={agent.namespace_key || agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    background: isSelected ? 'rgba(0, 229, 255, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                    border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(0, 229, 255, 0.15)',
                        color: '#00e5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {(agent.alias || agent.name || 'A').slice(0, 2).toUpperCase()}
                      </div>
                      <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
                        {agent.alias || agent.name || short(agent.id, 10, 6)}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      color: agent.writable !== false ? '#34d399' : '#f59e0b',
                      background: agent.writable !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px'
                    }}>
                      {agent.writable !== false ? 'Writable' : 'Read-only'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>DID: <code style={{ color: '#94a3b8' }}>{short(agent.id, 12, 8)}</code></div>
                    {agent.store_id && <div>Store: <code style={{ color: '#a78bfa' }}>{agent.store_id}</code></div>}
                    {agent.profile_id && <div>Profile: <span style={{ color: '#f8fafc' }}>{agent.profile_id}</span></div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tier {agent.verification_tier || 0}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                      {agent.current_ais != null ? `${agent.current_ais.toFixed(1)} AIS` : '— AIS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'agent0' && (
        <div>
          <Agent0Explorer />
        </div>
      )}

      {activeTab === 'a2a' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* A2A Topology Hero */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 165, 233, 0.06) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}>
                    Agent-to-Agent Protocol
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    RFC 8785 Canonical JSON · Mutual Ed25519 DID Auth
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc', fontWeight: 800 }}>
                  Cryptographic A2A Inter-Agent Mesh
                </h3>
                <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem', maxWidth: '800px', lineHeight: 1.6 }}>
                  Direct peer-to-peer verification and capability delegation across isolated agent harnesses. Enables deterministic telemetry streaming, canary policy distribution, and micro-task dispatch without shared master keys.
                </p>
              </div>

              <button
                onClick={() => setA2aModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Cpu size={16} />
                Dispatch A2A Task
              </button>
            </div>
          </div>

          {/* Secure Channels Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
            {/* Shield Pair A2A Channel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={20} color="#34d399" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
                    Shield Defense Secure A2A Channel
                  </span>
                </div>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  MUTUAL DID AUTH · ACTIVE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>shield.local</div>
                  <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Jev Classifier · Edge Daemon</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>did:integrity:68fed1331...</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#34d399', letterSpacing: '0.08em', fontWeight: 700 }}>A2A ENVELOPE</span>
                  <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, #10b981, #00e5ff)', margin: '4px 0' }} />
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>RFC 8785 Ed25519</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>shield.cloud</div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Hermes Reasoning · Fleet Coordinator</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>did:integrity:2ea17967f...</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>▲ Uplink:</span>
                  <span>High-velocity eBPF <code>sys_enter_execve</code> telemetry &amp; <code>freeze_process</code> containment events stream from local edge to cloud.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>▼ Downlink:</span>
                  <span>Hermes distributes signed OPA canary policy bundles and fleet-wide threat mitigation directives down to edge daemons.</span>
                </div>
              </div>
            </div>

            {/* Triad A2A Channel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '12px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Cpu size={20} color="#00e5ff" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
                    Engineering Triad A2A Federation
                  </span>
                </div>
                <span style={{
                  background: 'rgba(0, 229, 255, 0.15)',
                  color: '#00e5ff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  FEDERATED
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>xibalba.agy</div>
                  <div style={{ fontSize: '0.75rem', color: '#00e5ff' }}>Orchestrator</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>xibalba.claude</div>
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Code Author</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>xibalba.codex</div>
                  <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>Verification</div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Subagent delegation, cross-worktree code verification, and multi-agent consensus are signed via explicit A2A capability envelopes anchored to the Integrity Oracle.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
              3-Tier Modular Agent0 & ERC-8004 Architecture
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.35rem', lineHeight: 1.6 }}>
              How offline Ed25519 DIDs bind directly to Base Sepolia on-chain ERC-8004 identity NFTs and policy-confined SovereignAgent wallets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Tier 0</span>
              <h4 style={{ margin: '0.4rem 0', color: '#f8fafc' }}>Pure Ed25519 DID</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Gas-free, local cryptographic identity (<code style={{ color: '#00e5ff' }}>did:integrity:&lt;sha256&gt;</code>). Used for instant offline signing, process attribution, and local telemetry.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>Tier 1</span>
              <h4 style={{ margin: '0.4rem 0', color: '#f8fafc' }}>On-Chain SovereignAgent</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Policy-confined actor wallet bound in the Integrity Oracle AgentRegistry. Controls smart contract execution with strict drawdown guardrails.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Tier 2</span>
              <h4 style={{ margin: '0.4rem 0', color: '#f8fafc' }}>ERC-8004 Public Passport</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Standardized on-chain identity NFT with two-way DID backlink. Discovered by universal AI agent explorers and compliant with HTTP 402 micro-settlement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {registerOpen && (
        <RegisterAgentModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSuccess={() => setRegisterOpen(false)}
        />
      )}
      {claimOpen && (
        <ClaimAgentModal
          isOpen={claimOpen}
          defaultDid={selectedAgent?.id}
          onClose={() => setClaimOpen(false)}
          onSuccess={() => setClaimOpen(false)}
        />
      )}
      {mintOpen && (
        <Agent0RegisterModal
          isOpen={mintOpen}
          onClose={() => setMintOpen(false)}
          onSuccess={() => setMintOpen(false)}
        />
      )}
      <Agent0A2ADispatcher
        isOpen={a2aModalOpen}
        onClose={() => setA2aModalOpen(false)}
      />
    </div>
  );
}
