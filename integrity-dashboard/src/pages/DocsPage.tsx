import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Brain, Cpu, Database, Activity, ExternalLink, ArrowRight } from 'lucide-react';

const DocsPage: React.FC = () => {
  return (
    <div className="card" style={{ padding: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <Terminal size={32} color="var(--accent)" />
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Integrity Documentation</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.15rem', marginBottom: '2.5rem' }}>
        The developer and operator reference manual for the Integrity Protocol, Agent0 Passport &amp; Discovery Hub, and the four-repository machine economy ecosystem.
      </p>

      {/* Ecosystem Architecture */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={22} color="var(--accent)" />
          Four-Repository Ecosystem Topology
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Integrity aligns autonomous machine behavior with cryptographic and thermodynamic reality across four specialized repositories:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Terminal size={18} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>integrity-console</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              The Universal Verifiable Operator Window. Renders geometric graph navigation, multi-agent DID credentials, AIS distributions, and the Agent0 Discovery Hub.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Database size={18} color="var(--success)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>integrity-core</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              The Physics Engine of the machine economy. Deterministic Autonomous Integrity Scores (AIS), on-chain DIDs, Base Sepolia ERC-8004 registry, and Behavioral Commitment Chains (BCC).
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Brain size={18} color="#a855f7" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>super-cortex</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Neuro-symbolic knowledge graph and active inference substrate. Replaces probabilistic text hallucination with geometric graph traversal, dynamic logit masking, and 768-D Supermemory vectors.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={18} color="var(--danger)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>xibalba-shield</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Topological boundary gating and response governance. Produces tamper-evident audit ledgers, eBPF containment, and enterprise EDR authorization proof packets.
            </p>
          </div>
        </div>
      </section>

      {/* Agent0 Passport & Discovery Hub */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={22} color="var(--accent)" />
          Agent0 Passport &amp; Discovery Hub (/agent0)
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          The Agent0 suite brings decentralized agent discovery, on-chain credentialing, and machine-to-machine negotiation into one unified console:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li>
            <strong>ERC-8004 Registry (Base Sepolia 84532):</strong> Deterministic smart contract registry anchoring agent capabilities, operator ownership, and trust parameters directly to the Ethereum Virtual Machine.
          </li>
          <li>
            <strong>RFC 8785 Canonical JSON DID Backlinks:</strong> Cryptographically verifiable two-way links binding on-chain tokenized agent IDs to their W3C decentralized identifiers (<code style={{ color: 'var(--text-primary)' }}>did:integrity:...</code>).
          </li>
          <li>
            <strong>Agent-to-Agent (A2A) Dispatcher:</strong> Type-safe task delegation protocol allowing agents to negotiate schemas, capability parameters, and execution bounds autonomously.
          </li>
          <li>
            <strong>x402 Micropayments Engine:</strong> Standardized HTTP 402 Payment Required integration enabling streaming, per-inference micro-settlement across agent clusters.
          </li>
        </ul>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/agent0" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Open Agent0 Discovery Hub <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Authentication & Security */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Authentication &amp; User Accounts
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Operator authentication is managed via modern OAuth 2.0 and password brokers:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li>
            <strong>Federated OAuth 2.0:</strong> One-click authentication with Google and GitHub via the Supabase Auth broker (<code style={{ color: 'var(--text-primary)' }}>ftspunijfgcbkuybobhf.supabase.co</code>).
          </li>
          <li>
            <strong>Email &amp; Password:</strong> Standard credential sign-in and registration directly with the user API with secure session cookies and JWT revocation.
          </li>
          <li>
            <strong>Developer API Keys:</strong> Scoped, revocable machine API keys (<code style={{ color: 'var(--text-primary)' }}>integrity_...</code>) for autonomous agent pipelines and CI/CD harnesses.
          </li>
        </ul>
      </section>

      {/* Live Cloud Endpoints */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Live Cloud Deployments
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Production pilot deployments running on high-availability cloud infrastructure:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem' }}>Service</th>
                <th style={{ padding: '0.75rem' }}>Environment</th>
                <th style={{ padding: '0.75rem' }}>URL</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Integrity Console</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Production Pilot (Vite / React 18)</td>
                <td style={{ padding: '0.75rem' }}>
                  <a href="https://integrity-console-test.onrender.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    integrity-console-test.onrender.com <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Integrity User API</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Production Pilot (FastAPI / PostgreSQL)</td>
                <td style={{ padding: '0.75rem' }}>
                  <a href="https://integrity-userapi-test.onrender.com/health" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    integrity-userapi-test.onrender.com <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Super-Cortex Managed</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Production Pilot (FastAPI / Supermemory)</td>
                <td style={{ padding: '0.75rem' }}>
                  <a href="https://cortex-managed-pilot.onrender.com/health" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    cortex-managed-pilot.onrender.com <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Xibalba Shield</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Production Pilot (FastAPI / Control Plane)</td>
                <td style={{ padding: '0.75rem' }}>
                  <a href="https://xibalba-shield.onrender.com/health" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    xibalba-shield.onrender.com <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Getting Started */}
      <section>
        <h2 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Getting Started for Operators &amp; Developers
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          To enroll your first autonomous agent into the ecosystem:
        </p>
        <ol style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li>
            Create an account on the <Link to="/auth" style={{ color: 'var(--accent)' }}>Auth Portal</Link> via Google, GitHub, or Email.
          </li>
          <li>
            Navigate to <Link to="/agent0" style={{ color: 'var(--accent)' }}>Agent0 Passport</Link> to inspect registered on-chain agents or link your DID.
          </li>
          <li>
            Issue a Developer API Key in <Link to="/settings" style={{ color: 'var(--accent)' }}>Settings</Link> to authorize your agent daemon or test harness.
          </li>
          <li>
            Browse the canonical protocol specification, mathematical formulations, and smart contract reference in the <Link to="/wiki" style={{ color: 'var(--accent)' }}>Protocol Wiki</Link>.
          </li>
        </ol>
      </section>
    </div>
  );
};

export default DocsPage;
