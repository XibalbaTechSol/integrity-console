import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Flame,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react';

import { useDashboard } from '../context/DashboardContext';
import {
  oracle,
  type AisResponse,
  type AgentResponse,
  type AuditLogEntryDto,
  type Erc8004BindingDto,
  type ProvenanceEntryDto,
  type WalletResponse,
} from '../services/oracle';
import { actorOf, onchainContractRows } from '../chain/v3';
import { graphMemory, type MerkleRoot, type StoreStatus } from '../services/graphMemory';
import {
  shieldBackend,
  type ShieldDashboardSummary,
  type ShieldPolicyPackManifest,
} from '../services/shieldBackend';
import { readAgentBalances, type OnChainBalance } from '../integrity/wallet/chainClient';
import { ALLOW_UNSCOPED_AGENT_DIRECTORY } from '../config';
import './ProtocolDashboardPage.css';

const short = (value?: string | null, start = 10, end = 8) => {
  if (!value) return 'Unavailable';
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const copyText = async (value?: string | null) => {
  if (!value) return;
  try {
    await navigator.clipboard?.writeText(value);
  } catch {
    // Clipboard access optional
  }
};

const formatItk = (value?: string | null) => {
  if (!value) return '0.00';
  try {
    return parseFloat(ethers.formatEther(value)).toFixed(2);
  } catch {
    return value;
  }
};

const CANONICAL_TRIAD = [
  {
    alias: 'xibalba.agy',
    role: 'Antigravity Orchestrator',
    model: 'Gemini 2.5 Pro Extended',
    did: 'did:integrity:b1a72980e8e45e97c7b92982a89b1963e470b45fa955c9bd245f046e1e32e39a',
    erc8004Token: '10774',
    scope: 'agent:agy',
    badge: 'TRIAD CORE',
  },
  {
    alias: 'xibalba.claude',
    role: 'Claude Code Author',
    model: 'Claude 3.7 Sonnet',
    did: 'did:integrity:f07438ae1fb67f6ab1a21df87fb4771bead162c502c6e98cfa0bbdd7020a7e75',
    erc8004Token: 'Pending',
    scope: 'agent:claude',
    badge: 'TRIAD AUTHOR',
  },
  {
    alias: 'xibalba.codex',
    role: 'Codex Verification Specialist',
    model: 'Codex Reasoning',
    did: 'did:integrity:d73b98dd869948c27c7cc16d53683779a23c46daf3020e221955d67d1a8723c5',
    erc8004Token: 'Pending',
    scope: 'agent:codex',
    badge: 'TRIAD VERIFIER',
  },
];

const CANONICAL_SHIELD_PAIR = [
  {
    alias: 'shield.local',
    role: 'Workstation Edge Daemon',
    model: 'Jev Fast Classifier',
    did: 'did:integrity:68fed1331613937555a59398223e8e87520a87dd0305aac4fd7ecdc32a14a861',
    scope: 'agent:shield.local',
    badge: 'EDGE KERNEL',
  },
  {
    alias: 'shield.cloud',
    role: 'Fleet Defense Coordinator',
    model: 'Hermes 3 Reasoning',
    did: 'did:integrity:2ea17967f7a65589d570ca7e800844701fb36e6aa7374243e8766de8651f6bc4',
    scope: 'agent:shield.cloud',
    badge: 'FLEET C2',
  },
];

export default function ProtocolDashboardPage() {
  const { agents, selectedAgent, setSelectedAgent } = useDashboard();
  const [ais, setAis] = useState<AisResponse | null>(null);
  const [detail, setDetail] = useState<AgentResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [onChainBalance, setOnChainBalance] = useState<OnChainBalance | null>(null);
  const [erc8004, setErc8004] = useState<Erc8004BindingDto | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceEntryDto[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntryDto[]>([]);
  const [cortex, setCortex] = useState<StoreStatus | null>(null);
  const [merkle, setMerkle] = useState<MerkleRoot | null>(null);
  const [shieldSummary, setShieldSummary] = useState<ShieldDashboardSummary | null>(null);
  const [shieldPack, setShieldPack] = useState<ShieldPolicyPackManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;

    // Fetch cross-system backbone health: Shield + Cortex
    Promise.allSettled([
      shieldBackend.dashboardSummary('default'),
      shieldBackend.getPolicyPack(),
      graphMemory.status(),
    ]).then(([shieldRes, packRes, cortexRes]) => {
      if (!active) return;
      if (shieldRes.status === 'fulfilled') setShieldSummary(shieldRes.value);
      if (packRes.status === 'fulfilled') setShieldPack(packRes.value);
      if (cortexRes.status === 'fulfilled') setCortex(cortexRes.value);
    });

    return () => {
      active = false;
    };
  }, [refreshNonce]);

  useEffect(() => {
    if (!selectedAgent) return;
    let active = true;
    setEthBalance(null);
    setOnChainBalance(null);
    setErc8004(null);
    setProvenance([]);
    setAuditLog([]);
    setLoading(true);

    Promise.allSettled([
      oracle.getAis(selectedAgent.id),
      oracle.getAgent(selectedAgent.id),
      oracle.getWallet(selectedAgent.id),
      oracle.getErc8004(selectedAgent.id),
      oracle.getProvenance(selectedAgent.id),
      oracle.getAuditLog(selectedAgent.id, 10),
      graphMemory.sessions(1, selectedAgent.id, selectedAgent.store_id),
    ])
      .then(([aisRes, detailRes, walletRes, ercRes, provRes, auditRes, sessRes]) => {
        if (!active) return;
        if (aisRes.status === 'fulfilled') setAis(aisRes.value);
        if (detailRes.status === 'fulfilled') {
          setDetail(detailRes.value);
          const sovereignAgent = actorOf(detailRes.value);
          if (sovereignAgent && ethers.isAddress(sovereignAgent)) {
            readAgentBalances(sovereignAgent)
              .then((bal) => {
                if (!active) return;
                setOnChainBalance(bal);
                setEthBalance(bal.eth);
              })
              .catch(() => active && setEthBalance(null));
          }
        }
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
        if (ercRes.status === 'fulfilled') setErc8004(ercRes.value);
        if (provRes.status === 'fulfilled') setProvenance(provRes.value);
        if (auditRes.status === 'fulfilled') setAuditLog(auditRes.value);
        if (sessRes.status === 'fulfilled' && sessRes.value[0]) {
          graphMemory
            .sessionMerkleRoot(sessRes.value[0].external_session_id)
            .then((root) => active && setMerkle(root))
            .catch(() => undefined);
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [selectedAgent, refreshNonce]);

  const actor = actorOf(detail);
  const primitiveRows = useMemo(() => onchainContractRows(detail), [detail]);

  return (
    <div className="protocol-app-inner" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* ─── SYSTEM STATUS PULSE BAR ────────────────────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Integrity Backbone
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                Base Sepolia (84532)
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            ACTIVE
          </span>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <Brain size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Super-Cortex Fabric
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                {cortex ? `${(cortex.memory_count ?? cortex.memories ?? 0).toLocaleString()} Memories` : 'Provenance Active'}
              </div>
            </div>
          </div>
          <Link
            to="/cortex"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#d8b4fe',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            EXPLORE <ArrowRight size={12} />
          </Link>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Shield Defense Grid
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                {shieldPack?.version ? `Pack v${shieldPack.version}` : 'eBPF Enforcing'}
              </div>
            </div>
          </div>
          <Link
            to="/shield"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            DEFENSE <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ─── AGENT IDENTITY MESH SUMMARY ─────────────────────────────────── */}
      <section
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersRound size={18} style={{ color: '#38bdf8' }} /> Autonomous Agent Identity Mesh
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Canonical Triad & Shield Defense Pair bound to individual Ed25519 DIDs with mutual A2A verification.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setRefreshNonce((n) => n + 1)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <Link
              to="/identity"
              style={{
                background: '#2563eb',
                color: '#fff',
                borderRadius: '8px',
                padding: '6px 14px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Identity Hub <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {CANONICAL_TRIAD.map((agent) => (
            <div
              key={agent.alias}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.05em' }}>
                  {agent.badge}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>{agent.alias}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>{agent.role}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                {short(agent.did, 12, 6)}
              </div>
            </div>
          ))}

          {CANONICAL_SHIELD_PAIR.map((agent) => (
            <div
              key={agent.alias}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', letterSpacing: '0.05em' }}>
                  {agent.badge}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>{agent.alias}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>{agent.role}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                {short(agent.did, 12, 6)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SELECTED AGENT 360 & CROSS-SYSTEM INTELLIGENCE ─────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
          gap: '20px',
        }}
      >
        {/* Left Column: Agent 360 & On-Chain Custody */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                Active Agent Inspection
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>
                {selectedAgent?.alias || selectedAgent?.name || (selectedAgent ? short(selectedAgent.id, 14, 8) : 'No agent selected')}
              </h3>
            </div>
            <div
              style={{
                textAlign: 'right',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                AIS Score
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>
                {ais?.ais == null ? '—' : ais.ais.toFixed(1)}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / 100</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>ERC-8004 DID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ color: '#38bdf8' }}>{short(selectedAgent?.id, 14, 8)}</code>
                <button
                  onClick={() => void copyText(selectedAgent?.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Sovereign Actor</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ color: '#4ade80' }}>{short(actor, 12, 6)}</code>
                <button
                  onClick={() => void copyText(actor)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Passport Status</span>
              <span style={{ color: erc8004?.binding_status === 'verified' ? '#4ade80' : '#f59e0b', fontWeight: 700 }}>
                {erc8004?.binding_status === 'verified' ? 'Verified On-Chain' : 'Off-Chain Tier 0'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              On-Chain Sovereign Balances (Base Sepolia)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ETH Gas</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {ethBalance ? parseFloat(ethBalance).toFixed(4) : '0.0000'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ITK Bond</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {formatItk(onChainBalance?.itk)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Block Height</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {onChainBalance?.blockNumber ? `#${onChainBalance.blockNumber.toLocaleString()}` : 'Synced'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cross-Pillar Quick Actions & Telemetry */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
              Autonomous System Navigation
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>
              Integrated Ecosystem Pillars
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
            <Link
              to="/identity"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                textDecoration: 'none',
                color: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UsersRound size={20} style={{ color: '#60a5fa' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Agent Identity & A2A Mesh</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DIDs, ERC-8004 Passports, Mutual Envelopes</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#60a5fa' }} />
            </Link>

            <Link
              to="/cortex"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                textDecoration: 'none',
                color: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Brain size={20} style={{ color: '#c084fc' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Super-Cortex Memory Browser</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Scoped Memory Ledger, Merkle Anchors & Trajectories</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#c084fc' }} />
            </Link>

            <Link
              to="/shield"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                textDecoration: 'none',
                color: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={20} style={{ color: '#f87171' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Shield Defense & Policy Studio</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>eBPF Containment, Rego Policy Packs, History & Rollback</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#f87171' }} />
            </Link>

            <Link
              to="/intelligence"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                textDecoration: 'none',
                color: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={20} style={{ color: '#4ade80' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>AIS & Evidence Ledger</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reward Functions, Non-Gameable Proofs & Audits</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#4ade80' }} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
