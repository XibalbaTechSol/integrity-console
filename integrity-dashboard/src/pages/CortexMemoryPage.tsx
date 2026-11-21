import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  ExternalLink,
  Search,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Hash,
  Database,
  Terminal,
  Activity,
} from 'lucide-react';
import { graphMemory, type GraphMemoryStats, type Memory, type StoreStatus } from '../services/graphMemory';

const SCOPES = [
  { id: 'shared', label: 'shared', desc: 'Global architecture, rules & invariants' },
  { id: 'agent:agy', label: 'xibalba.agy', desc: 'Antigravity control & PID trading' },
  { id: 'agent:claude', label: 'xibalba.claude', desc: 'Claude systems engineering' },
  { id: 'agent:hermes', label: 'xibalba.hermes', desc: 'Hermes executive orchestrator' },
  { id: 'agent:shield.local', label: 'shield.local', desc: 'Device telemetry & eBPF containment' },
  { id: 'agent:shield.cloud', label: 'shield.cloud', desc: 'Cloud reasoning & fleet defense' },
];

export function CortexMemoryPage() {
  const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
  const cortexStudioUrl = import.meta.env.VITE_CORTEX_URL || (isRender ? 'https://cortex-managed-pilot.onrender.com' : 'http://127.0.0.1:4174');
  const cortexStudioEndpoint = cortexStudioUrl.replace(/^https?:\/\//, '');

  const [selectedScope, setSelectedScope] = useState<string>('shared');
  const [stats, setStats] = useState<GraphMemoryStats | null>(null);
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, statusRes] = await Promise.allSettled([
        graphMemory.stats(),
        graphMemory.status(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (statusRes.status === 'fulfilled') {
        setStatus(statusRes.value);
      }

      // Query memories for the scope or search query
      const query = searchQuery.trim() || (selectedScope === 'shared' ? 'architecture decision rule' : selectedScope);
      try {
        const results = await graphMemory.search(query, 25);
        setMemories(results);
      } catch {
        // Fallback: graph search may return empty without failure
        setMemories([]);
      }
    } catch (err) {
      console.warn('Cortex memory fetch error:', err);
      setError(err instanceof Error ? err.message : 'Super-Cortex backend offline or loading.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedScope]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadData();
  };

  return (
    <div className="cortex-memory-page" style={{ padding: '2rem', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: 0,
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
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                padding: '0.2rem 0.65rem',
                borderRadius: 0,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Super-Cortex Cognitive Fabric
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {cortexStudioEndpoint} · AIS Merkle Ledger · Zero-Inference Enclave
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Cognitive Neural Memory & Provenance
            </h1>
            <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0.5rem 0 0 0', maxWidth: '820px', lineHeight: 1.6 }}>
              Deterministic cross-harness memory fabric spanning Antigravity, Claude Code, Hermes, and Shield. Anchored by cryptographic hash chains and 3D topological knowledge graphs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={cortexStudioUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: 0,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
              }}
            >
              <Brain size={16} /> Open 3D Neural Studio <ExternalLink size={14} />
            </a>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Sync
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Service Endpoint</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: 0, background: (status?.status === 'ok' || !error) ? '#34d399' : '#f87171' }} />
              <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>{cortexStudioEndpoint}</strong>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Graph Nodes & Relations</span>
            <div style={{ marginTop: '0.2rem' }}>
              <strong style={{ color: '#c084fc', fontSize: '0.92rem' }}>
                {stats ? `${stats.memories ?? 0} memories · ${stats.entities ?? 0} entities` : 'Connecting…'}
              </strong>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Merkle Provenance</span>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>Sha256 Hash Chained</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Storage Subsystem</span>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>SQLite WAL + Supermemory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Enclaves Switcher */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#c084fc" /> Active Memory Scope Enclaves
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Select an isolated agent scope or the shared global knowledge enclave.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '0.25rem 0.6rem', borderRadius: 0 }}>
            {SCOPES.length} Scopes Configured
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {SCOPES.map(scope => {
            const isSelected = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => setSelectedScope(scope.id)}
                style={{
                  background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 0,
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(168, 85, 247, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#e9d5ff' : '#f8fafc' }}>
                    {scope.label}
                  </span>
                  {isSelected && <CheckCircle2 size={15} color="#c084fc" />}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {scope.desc}
                </span>
                <code style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {scope.id}
                </code>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Query Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search memories in ${selectedScope} (e.g. telemetry, decision, policy, PID, containment)…`}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.8rem',
              borderRadius: 0,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.4rem',
            borderRadius: 0,
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Semantic Query
        </button>
      </form>

      {/* Memory Propositions Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={16} color="#c084fc" /> Live Memory Propositions ({memories.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Scope: <code style={{ color: '#c084fc' }}>{selectedScope}</code>
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 0, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '0.75rem', color: '#c084fc' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Retrieving anchored memories from Super-Cortex…</p>
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 0, color: '#fca5a5', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <AlertCircle size={20} />
            <div>
              <strong>Super-Cortex Connection:</strong> {error}
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Ensure service is reachable at <code>{cortexStudioUrl}</code> with SQLite provenance database at <code>~/.super-cortex/provenance.db</code>.
              </p>
            </div>
          </div>
        ) : memories.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 0, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Brain size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>No memory propositions matched the active scope filter.</p>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Memories are committed when agents execute decisions or ingest telemetry via MCP <code>memory_remember</code>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {memories.map((mem) => {
              const memAny = mem as any;
              const epistemicClass = memAny.epistemic_class || mem.evidence_class || 'FACT';
              const memScope = memAny.scope || mem.source?.metadata?.scope || mem.source?.role;
              const memCreatedAt = memAny.created_at || (mem.source?.metadata?.created_at as string | undefined);

              return (
                <div
                  key={mem.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 0,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: epistemicClass === 'rule'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : epistemicClass === 'decision'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: epistemicClass === 'rule'
                          ? '#f87171'
                          : epistemicClass === 'decision'
                          ? '#38bdf8'
                          : '#34d399',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 0,
                        letterSpacing: '0.04em'
                      }}>
                        {epistemicClass}
                      </span>
                      <code style={{ fontSize: '0.8rem', color: '#c084fc', fontFamily: 'monospace' }}>
                        {mem.id}
                      </code>
                      {memScope && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.4rem', borderRadius: 0 }}>
                          {memScope}
                        </span>
                      )}
                    </div>

                    {mem.content_hash && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748b' }}>
                        <Hash size={12} />
                        <code style={{ fontFamily: 'monospace' }}>
                          {mem.content_hash.slice(0, 16)}…
                        </code>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {mem.content}
                  </p>

                  {memCreatedAt && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'flex-end' }}>
                      Recorded: {new Date(memCreatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default CortexMemoryPage;
