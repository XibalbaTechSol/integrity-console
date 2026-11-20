import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Globe, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { type Agent0Record, fetchAgent0Record, BASE_SEPOLIA_IDENTITY_REGISTRY, searchAgentsUniversal } from '../../services/agent0';
import { Agent0PassportCard } from './Agent0PassportCard';
import { Agent0RegisterModal } from './Agent0RegisterModal';
import { Agent0A2ADispatcher } from './Agent0A2ADispatcher';
import { Agent0MicropaymentModal } from './Agent0MicropaymentModal';
import { Agent0FeedbackModal } from './Agent0FeedbackModal';
import { BASE_SEPOLIA_CHAIN_ID, XIBALBA_TEST_AGENT_ID } from '../../constants';

// Initial seeds or cached agents on Base Sepolia
const INITIAL_AGENT0_SEEDS: Agent0Record[] = [
  {
    agentId: `${BASE_SEPOLIA_CHAIN_ID}:1`,
    tokenId: '1',
    chainId: BASE_SEPOLIA_CHAIN_ID,
    name: 'Xibalba Quant Engine (PID Daemon)',
    description: 'Autonomous trading & risk daemon executing PID feedback control loops on Base Sepolia with strict 5% capital guardrails.',
    image: null,
    agentURI: 'data:application/json;base64,...',
    owner: '0x7530bd7Cb142C50d5cC742EdF02263f368e89E2f',
    walletAddress: '0x388D0180725E0F757C6Ef01ef0474E718faA3776',
    active: true,
    x402Support: true,
    services: [
      { name: 'DID', endpoint: XIBALBA_TEST_AGENT_ID },
      { name: 'MCP', endpoint: 'https://quant.xibalba.solutions/mcp' },
      { name: 'A2A', endpoint: 'https://quant.xibalba.solutions/a2a' },
    ],
    registrations: [
      { agentId: '1', agentRegistry: `eip155:${BASE_SEPOLIA_CHAIN_ID}:${BASE_SEPOLIA_IDENTITY_REGISTRY.toLowerCase()}` },
    ],
    trustModels: ['reputation', 'integrity-attestation'],
    integrityDid: XIBALBA_TEST_AGENT_ID,
    isConfinedWallet: true,
  },
  {
    agentId: `${BASE_SEPOLIA_CHAIN_ID}:2`,
    tokenId: '2',
    chainId: BASE_SEPOLIA_CHAIN_ID,
    name: 'Super-Cortex Knowledge Ingestion Agent',
    description: 'Neuro-symbolic R-GCN knowledge graph parser with provenance verification and dynamic logit masking.',
    image: null,
    agentURI: 'data:application/json;base64,...',
    owner: '0x7530bd7Cb142C50d5cC742EdF02263f368e89E2f',
    walletAddress: '0x62526e8B67F04A5ea3F09Bd48C171A7e1dBA7373',
    active: true,
    x402Support: true,
    services: [
      { name: 'DID', endpoint: 'did:integrity:b1a72980e8e45e97c7b92982a89b1963e470b45fa955c9bd245f046e1e32e39a' },
      { name: 'MCP', endpoint: 'http://127.0.0.1:4174/mcp' },
    ],
    registrations: [
      { agentId: '2', agentRegistry: `eip155:${BASE_SEPOLIA_CHAIN_ID}:${BASE_SEPOLIA_IDENTITY_REGISTRY.toLowerCase()}` },
    ],
    trustModels: ['reputation', 'integrity-attestation'],
    integrityDid: 'did:integrity:b1a72980e8e45e97c7b92982a89b1963e470b45fa955c9bd245f046e1e32e39a',
    isConfinedWallet: true,
  },
];

export function Agent0Explorer() {
  const [agents, setAgents] = useState<Agent0Record[]>(INITIAL_AGENT0_SEEDS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'x402' | 'confined'>('all');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<Agent0Record | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Agent0Record | null>(null);
    const [feedbackTarget, setFeedbackTarget] = useState<Agent0Record | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const live = await searchAgentsUniversal(query);
        if (active && live.length > 0) {
          // Merge live results with initial seeds
          const ids = new Set(live.map((a) => a.agentId));
          const unindexedSeeds = INITIAL_AGENT0_SEEDS.filter((s) => !ids.has(s.agentId));
          setAgents([...live, ...unindexedSeeds]);
        }
      } catch (err) {
        console.warn('Universal search notice:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      if (filter === 'verified' && !a.integrityDid) return false;
      if (filter === 'x402' && !a.x402Support) return false;
      if (filter === 'confined' && !a.isConfinedWallet) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tokenId.includes(q) ||
        (a.integrityDid && a.integrityDid.toLowerCase().includes(q)) ||
        a.walletAddress.toLowerCase().includes(q)
      );
    });
  }, [agents, query, filter]);

  const handleRegisterSuccess = async (tokenId: string) => {
    try {
      const rec = await fetchAgent0Record(tokenId);
      setAgents((prev) => [rec, ...prev]);
    } catch {
      // Best effort
    }
  };

  return (
    <div className="agent0-explorer" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Action Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', background: 'var(--surface-color, #121316)',
        padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #272a31)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Globe size={20} color="var(--accent-color, #00e5ff)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Agent0 Public Identity Registry</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
            Decentralized ERC-8004 discovery on Base Sepolia with two-way Integrity DID verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="primary-button"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.15rem', borderRadius: '6px', fontWeight: 600
          }}
        >
          <Plus size={16} />
          <span>Mint Agent0 Passport</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by agent name, token ID, DID, or wallet..."
            style={{
              width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.4rem', borderRadius: '6px',
              background: 'var(--surface-color, #121316)', border: '1px solid var(--border-color, #2a2d35)',
              color: '#fff', fontSize: '0.88rem'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', 'verified', 'x402', 'confined'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem',
                border: filter === mode ? '1px solid var(--accent-color, #00e5ff)' : '1px solid var(--border-color, #333)',
                background: filter === mode ? 'rgba(0, 229, 255, 0.1)' : 'var(--surface-color, #121316)',
                color: filter === mode ? 'var(--accent-color, #00e5ff)' : 'var(--text-secondary, #aaa)',
                cursor: 'pointer', textTransform: 'capitalize'
              }}
            >
              {mode === 'all' ? 'All Passports' : mode === 'verified' ? 'Tier 2 Verified' : mode === 'x402' ? 'x402 Enabled' : 'Confined Wallets'}
            </button>
          ))}
        </div>
      </div>

      {/* Passports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAgents.length === 0 ? (
          <div style={{
            padding: '3rem 1rem', textAlign: 'center', background: 'var(--surface-color, #121316)',
            borderRadius: '12px', border: '1px dashed var(--border-color, #333)', color: 'var(--text-secondary, #888)'
          }}>
            <p>No matching Agent0 identities found.</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="secondary-button"
              style={{ marginTop: '0.5rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAgents.map((rec) => (
            <Agent0PassportCard
              key={rec.agentId}
              record={rec}
              onDispatchTask={(r) => setDispatchTarget(r)}
              onSendPayment={(r) => setPaymentTarget(r)}
              onSubmitFeedback={(r) => setFeedbackTarget(r)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <Agent0RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      <Agent0A2ADispatcher
        isOpen={Boolean(dispatchTarget)}
        onClose={() => setDispatchTarget(null)}
        targetAgent={dispatchTarget}
      />

      <Agent0MicropaymentModal
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        targetAgent={paymentTarget}
      />

      <Agent0FeedbackModal
        isOpen={Boolean(feedbackTarget)}
        onClose={() => setFeedbackTarget(null)}
        targetAgent={feedbackTarget}
      />
    </div>
  );
}
