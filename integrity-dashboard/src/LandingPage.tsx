import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Database,
  Gauge,
  Radio,
  SlidersHorizontal,
  Cpu,
  Check,
  Minus,
  CircleDashed,
  XCircle,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Key,
  Network,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from './context/SettingsContext';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import ControlLoopDiagram, { CONTROL_LOOP_STEPS } from './landing/ControlLoopDiagram';
import {
  AS_OF,
  AS_OF_COMMIT,
  PROGRESS_NOTE,
  MISSION_PHASES,
  CONFORMANCE_LEVELS,
  CONFORMANCE_TARGET,
  MANDATED_SELF_DESCRIPTION,
  HOOK_DEPLOYMENT_GAP,
  DOCUMENT_AUTHORITY,
  type PhaseState,
} from './landing/protocolStatus';

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const FAQItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => setIsOpen(!isOpen)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{question}</h4>
        <ChevronDown size={20} color="var(--text-secondary)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {isOpen && <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{answer}</div>}
    </div>
  );
};

/** Status chips. Deliberately four distinct states — "open" must not read as "nearly done". */
const PHASE_CHIP: Record<PhaseState, { label: string; color: string; icon: React.ReactNode }> = {
  complete: { label: 'Complete', color: 'var(--success)', icon: <Check size={13} /> },
  'in-progress': { label: 'In progress', color: 'var(--warning)', icon: <Minus size={13} /> },
  'not-started': { label: 'Not started', color: 'var(--text-secondary)', icon: <CircleDashed size={13} /> },
  'not-claimed': { label: 'Not claimed', color: 'var(--danger)', icon: <XCircle size={13} /> },
};

const PhaseChip: React.FC<{ state: PhaseState }> = ({ state }) => {
  const chip = PHASE_CHIP[state];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius)',
        border: `1px solid ${chip.color}`,
        color: chip.color,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {chip.icon}
      {chip.label}
    </span>
  );
};

/** The 5 Canonical Console Surfaces in App.tsx with integrated legacy route mappings. */
const CONSOLE_SURFACES = [
  {
    route: '/dashboard',
    name: 'Command Center & Fleet Telemetry',
    icon: SlidersHorizontal,
    body: 'Centralized telemetry, fleet operational status, real-time agent registration events, and top-level protocol verification metrics across all nodes.',
    tag: 'Fleet Telemetry',
  },
  {
    route: '/identity',
    name: 'Agent Identity Hub & Agent0 Explorer',
    icon: Cpu,
    body: 'Unified identity plane: Off-chain Ed25519 DIDs, on-chain ERC-8004 Public Passports on Base Sepolia (84532), Agent-to-Agent (A2A) discovery, and policy-confined SovereignAgent wallets.',
    tag: 'ERC-8004 / DID',
  },
  {
    route: '/cortex',
    name: 'Super-Cortex Cognitive Neural Memory',
    icon: Database,
    body: 'Interactive 3D knowledge graph, episodic memory provenance, session Merkle audit trees, hybrid vector/lexical retrieval, and zero-drift knowledge synchronization.',
    tag: 'Memory & AIS Merkle',
  },
  {
    route: '/shield',
    name: 'Xibalba Shield & Fleet Defense',
    icon: ShieldCheck,
    body: 'On-device eBPF kernel security, LSM execution containment, signed syscall spans, and synthetic HIPAA/SOC-2 safeguard gates verifying offline.',
    tag: 'eBPF / Security',
  },
  {
    route: '/intelligence',
    name: 'AIS & Steering Evidence Plane',
    icon: Gauge,
    body: 'Authoritative Autonomous Integrity Score computation, geometric mean telemetry derivations, signed receipt correlation, and Base Sepolia epoch anchoring.',
    tag: 'Scoring & Evidence',
  },
] as const;

export default function LandingPage() {
  const { animationsEnabled } = useSettings();

  const [contactName, setContactName] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactUseCase, setContactUseCase] = useState('Record only — signed evidence and anchoring (L0)');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    const subject = encodeURIComponent(`Integrity Protocol Inquiry from ${contactName || 'Partner'}`);
    const body = encodeURIComponent(
      `Name: ${contactName}\nOrganization: ${contactOrg}\nWork Email: ${contactEmail}\nScope: ${contactUseCase}\n\nMessage:\n${contactMessage}`
    );
    window.location.href = `mailto:jacob@xibalbasolutions.com?subject=${subject}&body=${body}`;
  };

  const fadeInUp = {
    initial: animationsEnabled ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '0px' },
    transition: { duration: 0.6 },
  };

  const stagger = {
    initial: animationsEnabled ? { opacity: 0 } : { opacity: 1 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  };

  const rewardFormula = `R_{\\text{total}} = R_{\\text{task}} + \\lambda \\cdot \\text{AIS}`;
  const aisFormula = `\\text{AIS}_{\\text{raw}} = S_{\\text{entropy}}^{0.30} \\cdot S_{\\text{grounding}}^{0.30} \\cdot S_{\\text{sacrifice}}^{0.20} \\cdot S_{\\text{compliance}}^{0.20}`;
  const stateSpaceFormula = `\\dot{x}(t) = A x(t) + B u(t) + w(t), \\quad y(t) = C x(t) + v(t)`;

  return (
    <div className="landing-page" style={{ color: 'var(--text-primary)' }}>
      {/* 1. Header Navigation */}
      <header className="landing-header">
        <Link
          to="/"
          className="landing-brand"
          aria-label="Integrity Protocol Home"
        >
          <img
            src="/logo.png"
            alt="Integrity Protocol"
            style={{ height: '36px', width: 'auto', display: 'block', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>
              Integrity Protocol
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--theme-accent)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Autonomous Control Layer
            </span>
          </div>
        </Link>

        <nav
          className="landing-nav"
          aria-label="Main Navigation"
        >
          <a href="#open-loop">The Problem</a>
          <a href="#loop">The Loop</a>
          <a href="#agent0" style={{ color: 'var(--theme-accent)', fontWeight: 600 }}>
            Agent0
          </a>
          <a href="#ais">Feedback</a>
          <a href="#status">Status</a>
          <a href="#console">Surfaces</a>
          <a href="#faq">FAQ</a>
          <Link to="/wiki">Wiki</Link>
          <a
            href="https://xibalbasolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            Company <ExternalLink size={12} />
          </a>
        </nav>

        <div className="landing-actions">
          <a
            href="https://github.com/xibalbatechsol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.92rem' }}
          >
            GitHub
          </a>
          <Link
            to="/auth"
            className="primary-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(54, 167, 255, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            Launch Console <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem 7rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(54, 167, 255, 0.16) 0%, transparent 70%)', zIndex: -1 }} />

        <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '999px', background: 'rgba(54, 167, 255, 0.1)', border: '1px solid rgba(54, 167, 255, 0.25)', marginBottom: '1.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--theme-accent)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--theme-accent)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              The Control &amp; Identity Layer for Autonomous Agents
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)', marginBottom: '1.5rem', fontWeight: 800, lineHeight: 1.08, maxWidth: '980px', margin: '0 auto 1.5rem auto' }}>
            Nothing reaches orbit <span style={{ whiteSpace: 'nowrap' }}>open-loop.</span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '840px', margin: '0 auto 2.5rem auto', lineHeight: 1.65 }}>
            A rocket doesn't make orbit because someone aimed it well. It makes orbit because a controller measures
            where the vehicle actually is, thousands of times a second, compares that to the trajectory it committed
            to, and corrects — with authority bounded by hardware that can end the flight.
            <br /><br />
            Prompt guardrails are artificial thermodynamic friction: reinforcement learning agents mathematically optimize
            around them. Integrity Protocol establishes the Autonomous Integrity Score (AIS) as the native reward
            function, integrates Agent0 on-chain ERC-8004 identity with Base Sepolia sovereign actor wallets, and enforces
            fail-closed state bounds across the machine economy.
          </p>

          <div className="landing-hero-actions" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="primary-button" style={{ padding: '1.15rem 2.25rem', fontSize: '1.1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 0 25px rgba(54, 167, 255, 0.35)' }}>
              Launch Console <ArrowRight size={18} />
            </Link>
            <a href="#loop" className="secondary-button" style={{ padding: '1.15rem 2.25rem', fontSize: '1.1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              See the control loop
            </a>
            <a href="#agent0" className="secondary-button" style={{ padding: '1.15rem 2.25rem', fontSize: '1.1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'rgba(54, 167, 255, 0.4)' }}>
              <Cpu size={18} color="var(--theme-accent)" /> Agent0 Architecture
            </a>
          </div>

          <p style={{ marginTop: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {MANDATED_SELF_DESCRIPTION}
          </p>
        </motion.div>
      </section>

      {/* 3. The Open-Loop Problem */}
      <section id="open-loop" style={{ padding: '6rem 3rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>Three things an open loop cannot do</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Control theory is unsentimental about this. In any physical or economic plant, state evolution follows:
            </p>
            <div className="landing-formula" role="region" aria-label="State-space plant formula" tabIndex={0} style={{ maxWidth: '640px', margin: '1.25rem auto', background: 'var(--bg-color)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <BlockMath math={stateSpaceFormula} />
            </div>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              A plant driven open-loop by stochastic LLM generations diverges exponentially under environmental disturbances. Every current agent safety layer is missing at least one of the three components that make a loop closed and stable.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={stagger.viewport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <motion.div variants={fadeInUp} className="card" style={{ borderTop: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--danger-wash)', borderRadius: 'var(--radius)', color: 'var(--danger)' }}>
                  <Radio size={24} />
                </div>
                <h3 style={{ margin: 0 }}>No state estimate</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Logs are not a sensor. An unsigned trace tells you what a process chose to report, not what the agent
                did — and it cannot be distinguished from a trace written after the fact. Without a measurement you
                can trust, there is no error signal, and without an error signal there is nothing to control on.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card" style={{ borderTop: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--warning-wash)', borderRadius: 'var(--radius)', color: 'var(--warning)' }}>
                  <SlidersHorizontal size={24} />
                </div>
                <h3 style={{ margin: 0 }}>No bounded actuator</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                An agent's real authority is whatever its credentials allow, which is almost never what its prompt
                intends. A rocket's control surfaces have mechanical travel limits for the same reason a gate needs
                them: a controller with unbounded authority turns a small estimation error into a total loss.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card" style={{ borderTop: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--accent-wash)', borderRadius: 'var(--radius)', color: 'var(--accent)' }}>
                  <Database size={24} />
                </div>
                <h3 style={{ margin: 0 }}>No flight recorder</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                After a loss of vehicle, the question is why. If the record is mutable, deletable, or reconstructed
                from the same system that failed, there is no answer — only a narrative. Removing an inconvenient
                epoch has to be <em>detectable</em>, not merely discouraged.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. The Loop, Closed */}
      <section id="loop" style={{ padding: '6rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>The loop, closed</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
            These are not analogies bolted onto a product diagram. The blocks and arrows below are the ones in the
            protocol specification's own architecture, relabelled with the control-systems names for what they do.
          </p>
        </motion.div>

        <motion.figure
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          viewport={fadeInUp.viewport}
          transition={fadeInUp.transition}
          className="card"
          style={{ margin: 0, padding: 'clamp(1.25rem, 3vw, 2.5rem)', overflowX: 'auto' }}
        >
          <ControlLoopDiagram />
          <figcaption style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            The Integrity control loop. Solid lines carry signal; the dashed accent line is adaptation, drawn dashed
            because its authority is deliberately limited; the red path is the one the protocol forbids.
          </figcaption>
          {/* Text equivalent: assistive tech gets the sequence, not a flat alt string. */}
          <ol style={visuallyHidden}>
            {CONTROL_LOOP_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </motion.figure>

        <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={stagger.viewport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {[
            {
              control: 'Controller + comparator',
              component: 'The hook',
              body: 'An account hook evaluates the constraint vector on the post-state and reverts on violation. Missing, malformed, unknown and incompatible decisions are all defined as fail-closed: the loop’s specified default is to stop the vehicle, not to wave it through.',
              gap: HOOK_DEPLOYMENT_GAP,
            },
            {
              control: 'Reference / setpoint',
              component: 'Signed policy pack',
              body: 'The constraint vector the agent is committed to, distributed as a signed file. Pack loading verifies the trusted signature before enforcement uses the pack, so the setpoint itself cannot be edited out from under the loop. A pack declares its own no-match behaviour.',
            },
            {
              control: 'Sensors',
              component: 'Shield and Cortex',
              body: 'Shield senses and contains on the device, emitting signed spans. Cortex keeps hash-chained memory and session Merkle roots. Both keep working when the oracle, the chain or a vendor is unreachable — a sensor that fails when the downlink drops is not a sensor.',
            },
            {
              control: 'State estimator',
              component: 'The oracle',
              body: 'Verifies signatures and leaves, closes epochs, and independently re-derives the numeric signals rather than trusting a client’s arithmetic. Client-supplied derived signals are audit-only. Unsigned telemetry is operator-visible but may never feed the estimate.',
            },
            {
              control: 'Flight recorder',
              component: 'Evidence anchor',
              body: 'Closed receipt epochs are anchored on chain, so removing one is detectable rather than silent. Receipts are signed, chained and checkpointed, and verify offline — the recorder survives the loss of the thing it was recording.',
            },
            {
              control: 'Bounded adaptive gain',
              component: 'AIS',
              body: 'Derived from verified evidence, and permitted exactly one effect: widening a bound that is already finite. It is a parameter of the constraint vector, never a permission.',
            },
            {
              control: 'Vehicle identity',
              component: 'DID, account, handle',
              body: 'An agent is a key it controls and an enclosed account, not a string in a config file. Private keys stay outside the harness root; the root DID file is public identity material.',
            },
            {
              control: 'Mission control',
              component: 'The Console',
              body: 'An operator surface over the evidence plane and hook telemetry. It reads; it is not a second authority. Nothing in the console can admit an action the hook denied.',
            },
          ].map((row) => (
            <motion.div variants={fadeInUp} key={row.component} className="card">
              <p style={{ margin: '0 0 0.35rem', color: 'var(--theme-accent)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {row.control}
              </p>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.2rem' }}>{row.component}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{row.body}</p>
              {'gap' in row && row.gap && (
                <div
                  data-testid="hook-deployment-gap"
                  style={{ marginTop: '1rem', paddingLeft: '0.85rem', borderLeft: '3px solid var(--warning)' }}
                >
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.88rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Deployed vs. specified:</strong> {row.gap}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 5. Agent0 Architecture Section */}
      <section id="agent0" style={{ padding: '6rem 3rem', background: 'linear-gradient(180deg, rgba(13, 24, 38, 0.95) 0%, rgba(8, 16, 26, 1) 100%)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ display: 'inline-block', marginBottom: '0.75rem', color: 'var(--theme-accent)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Decentralized Agency &amp; Cryptographic Identity
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', marginBottom: '1rem', fontWeight: 800 }}>
              Agent0: Public Passports &amp; Confined Sovereignty
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.12rem', lineHeight: 1.65 }}>
              Decentralized autonomous agents operating open-loop are systemic financial hazards. Agent0 provides the three-tier identity and containment bridge that transforms autonomous actors into verifiable, feedback-steered participants in the machine economy.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginBottom: '3.5rem' }}>
            {/* Tier 0 */}
            <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="card" style={{ borderTop: '4px solid var(--theme-accent)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(54, 167, 255, 0.12)', borderRadius: 'var(--radius)', color: 'var(--theme-accent)' }}>
                  <Key size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-accent)', fontWeight: 700 }}>Tier 0 Root</div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Off-Chain Ed25519 DID</h3>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                Gasless, sub-millisecond local cryptographic sovereignty. The agent generates a pure Ed25519 keypair formatted as <code style={{ color: 'var(--theme-accent)' }}>did:integrity:&lt;sha256&gt;</code>. Private keys remain strictly isolated outside execution harness roots; every intent, tool invocation, and runtime span is locally signed without RPC latency or gas expenditure.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Offline-first execution · Pure Ed25519 · Zero gas
              </div>
            </motion.div>

            {/* Tier 1 */}
            <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="card" style={{ borderTop: '4px solid var(--warning)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(255, 170, 0, 0.12)', borderRadius: 'var(--radius)', color: 'var(--warning)' }}>
                  <Wallet size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', fontWeight: 700 }}>Tier 1 Actuator</div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Confined Sovereign Wallets</h3>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                On-chain AgentRegistry on Base Sepolia (EVM 84532) with policy-confined actor wallets. Outgoing contract transactions, treasury transfers, and token approvals are strictly bound by on-chain hook policies (<code style={{ color: 'var(--warning)' }}>wallet_confined: true</code>). Unbounded financial drain or malicious approvals revert on-chain before post-state commit.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Base Sepolia (84532) · SovereignAgent · Fail-closed policy
              </div>
            </motion.div>

            {/* Tier 2 */}
            <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="card" style={{ borderTop: '4px solid var(--success)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(0, 255, 200, 0.12)', borderRadius: 'var(--radius)', color: 'var(--success)' }}>
                  <Network size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', fontWeight: 700 }}>Tier 2 Economy</div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>ERC-8004 Public Passports</h3>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                Global discoverability conforming to the ERC-8004 Agent Passport standard with RFC 8785 Canonical JSON DID backlinks (<code style={{ color: 'var(--success)' }}>services[name=DID]</code>). Powers Agent-to-Agent (A2A) capability delegation, verifiable reputation lookups, and x402 escrow micropayments for inference and compute.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ERC-8004 · A2A Delegation · x402 Micropayments
              </div>
            </motion.div>
          </div>

          {/* Detailed Agent0 Loop Integration Callout */}
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ padding: '2.5rem', background: 'rgba(54, 167, 255, 0.04)', border: '1px solid rgba(54, 167, 255, 0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginTop: 0, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  How Agent0 Closes the Machine Economic Loop
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  Autonomous agents cannot safely interact with decentralized finance, APIs, or each other without bounded actuation:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Cryptographic DID Service Backlinks:</strong> Two-way verification ensures an on-chain token cannot impersonate an agent without the off-chain DID keypair's explicit signature.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Agent-to-Agent Delegation:</strong> Peer agents inspect standing, AIS tier, and historical epoch proofs before issuing subtask mandates.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>x402 Micropayments:</strong> Escrowed funds release only upon presentation of a cryptographically valid outcome receipt anchored by the Oracle.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.82rem', overflowX: 'auto', lineHeight: 1.6 }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>// ERC-8004 Canonical Passport Representation</div>
                <div>{'{'}</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"standard"</span>: <span style={{ color: 'var(--success)' }}>"ERC-8004"</span>,</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"chainId"</span>: <span style={{ color: 'var(--warning)' }}>84532</span>, <span style={{ color: 'var(--text-secondary)' }}>// Base Sepolia</span></div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"agentWallet"</span>: <span style={{ color: 'var(--success)' }}>"0x7F2e...A19c"</span>,</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"walletConfined"</span>: <span style={{ color: 'var(--theme-accent)' }}>true</span>,</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"services"</span>: [{'{'}</div>
                <div style={{ paddingLeft: '2.5rem' }}><span style={{ color: 'var(--theme-accent)' }}>"name"</span>: <span style={{ color: 'var(--success)' }}>"DID"</span>,</div>
                <div style={{ paddingLeft: '2.5rem' }}><span style={{ color: 'var(--theme-accent)' }}>"endpoint"</span>: <span style={{ color: 'var(--success)' }}>"did:integrity:b1a7...39a"</span></div>
                <div style={{ paddingLeft: '1.25rem' }}>{'}'}],</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"standing"</span>: <span style={{ color: 'var(--success)' }}>"Tier 1 (Verified)"</span>,</div>
                <div style={{ paddingLeft: '1.25rem' }}><span style={{ color: 'var(--theme-accent)' }}>"aisFloor"</span>: <span style={{ color: 'var(--warning)' }}>0.842</span></div>
                <div>{'}'}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Feedback with Bounded Authority */}
      <section id="ais" style={{ padding: '6rem 3rem', background: 'var(--bg-card, var(--surface-color))', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>Feedback you can bound</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
              The failure mode of an adaptive controller is that adaptation quietly becomes authority. A loop that can
              learn its way out of its own limits is not safe, however good the learning is. So the Agentic Integrity
              Score is specified by what it is forbidden to do.
            </p>
          </motion.div>

          <div className="landing-ais-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem', alignItems: 'start' }}>
            <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.3rem' }}>The Native Reward Function</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.95rem' }}>
                Guardrails are artificial thermodynamic friction. Reinforcement learning agents optimize around external barriers. Integrity Protocol defines AIS as the native reward function:
              </p>
              <div className="landing-formula" role="region" aria-label="Total reward formula" tabIndex={0} style={{ background: 'var(--bg-color)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <BlockMath math={rewardFormula} />
              </div>
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.2rem' }}>A weighted geometric mean</h3>
              <div className="landing-formula" role="region" aria-label="Agentic Integrity Score formula" tabIndex={0} style={{ background: 'var(--bg-color)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <BlockMath math={aisFormula} />
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Geometric, not arithmetic — so a single exact-zero component annihilates the raw score instead of
                being averaged away. That property closed a real scoring exploit, in which a content-free submission
                claiming compute time outscored an honest agent. The result is then clamped to the agent's tier
                ceiling.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  ['Entropy', 'Predictability and drift bounds', 'var(--theme-accent)'],
                  ['Grounding', 'Retrieval support for what was asserted', 'var(--success)'],
                  ['Sacrifice', 'Collateral at risk, with validator or TEE evidence', 'var(--warning)'],
                  ['Compliance', 'Policy adherence against an independently readable gate', 'var(--accent)'],
                ].map(([name, meaning, color]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                    <strong style={{ color, whiteSpace: 'nowrap' }}>{name}</strong>
                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{meaning}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: 0 }}>
                Compliance without a readable gate or attestation, and sacrifice without validator or TEE evidence,
                both resolve to zero in authoritative AIS. An optional attestation-bound multiplier applies, scaled by
                the fraction of proof-bearing events rather than a period-wide flag.
              </p>
            </motion.div>

            <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition}>
              <h3 style={{ fontSize: '1.6rem', marginTop: 0, marginBottom: '1.25rem' }}>Four things AIS must never do</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Change a policy deny into an allow.',
                  'Set a constraint bound to infinity.',
                  'Be computed from unsigned telemetry.',
                  'Be the reason a hook passed.',
                ].map((rule) => (
                  <li key={rule} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                What it <em>may</em> do is select among four bounded outcomes: a larger but still finite quota at high
                confidence, standard controls, narrowed quotas or step-up when reduced, and quarantine with a required
                human on integrity failure. That is a gain schedule, not a permission system.
              </p>
              <div className="card" style={{ borderLeft: '3px solid var(--warning)', background: 'transparent' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.92rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Current state, stated plainly:</strong> the live
                  formula, component-floor evaluation, the pre-boost normalised constraint score and the tier clamp
                  are built in scoring-core. The floor result is shadow and observational output only — it is not
                  wired into score pushes, disputes, or any other enforcement path. Keyword grounding is partial.
                  The specification marks this section as partial, and so do we.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Mission Status */}
      <section id="status" style={{ padding: '6rem 3rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>Where the vehicle actually is</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
              A control company that misreported its own state would be an unusually poor advertisement for its
              product. So here is the test campaign: the first stage still open, the next two not started, and
              orbit not claimed at all.
            </p>
          </motion.div>

          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 2rem', padding: '1rem 1.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--surface-color)', maxWidth: '760px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {PROGRESS_NOTE}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Reconciled <strong style={{ color: 'var(--text-primary)' }}>{AS_OF}</strong> against
                integrity-core <code style={{ fontSize: '0.85rem' }}>{AS_OF_COMMIT}</code>
              </span>
            </div>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={stagger.viewport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {MISSION_PHASES.map((phase, i) => (
              <motion.div variants={fadeInUp} key={phase.gate} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--surface-color)',
                    border: `2px solid ${PHASE_CHIP[phase.state].color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                    color: PHASE_CHIP[phase.state].color,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{phase.stage}</h3>
                    <PhaseChip state={phase.state} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {phase.gate}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 0.9rem' }}>{phase.detail}</p>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {phase.state === 'not-claimed' ? 'Boundary' : 'Still required'}
                  </p>
                  <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {phase.open.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0, opacity: 0.8 }}>
                    Source: <code>{phase.source}</code>
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ marginTop: '2.5rem' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="var(--theme-accent)" /> Conformance is a level, not a yes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1.25rem 0' }}>
              {CONFORMANCE_LEVELS.map((lvl) => (
                <div key={lvl.level} style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, auto) 1fr', gap: '1rem', alignItems: 'baseline', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.6rem' }}>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.92rem' }}>{lvl.level}</strong>
                  <span style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>{lvl.requires}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{CONFORMANCE_TARGET}</p>
          </motion.div>
        </div>
      </section>

      {/* 8. Inside the Console */}
      <section id="console" style={{ padding: '6rem 3rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>Inside the Console</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '820px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Mission control doesn't fly the rocket. It shows you the loop running, and gives you the one authority a
              ground station should have: the ability to stop. The Console is an operator surface over the evidence
              plane and hook telemetry — it holds no protocol logic of its own.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={stagger.viewport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '2rem' }}>
            {CONSOLE_SURFACES.map(({ route, name, icon: Icon, body, tag }) => (
              <motion.div variants={fadeInUp} key={route} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ background: 'var(--bg-color)', width: '44px', height: '44px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                      <Icon size={22} color="var(--theme-accent)" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{name}</h3>
                      <code style={{ fontSize: '0.85rem', color: 'var(--theme-accent)' }}>{route}</code>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(54, 167, 255, 0.08)', border: '1px solid rgba(54, 167, 255, 0.2)', color: 'var(--theme-accent)', fontWeight: 600 }}>
                    {tag}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1, margin: 0 }}>{body}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Unified route mapping note for backwards route reconciliation */}
          <motion.div
            initial={fadeInUp.initial}
            whileInView={fadeInUp.whileInView}
            viewport={fadeInUp.viewport}
            transition={fadeInUp.transition}
            style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2.5rem', marginBottom: 0, lineHeight: 1.6 }}
          >
            <p style={{ margin: '0 0 0.5rem' }}>
              Console surfaces require an operator account. Shield and Cortex are specialized operational engines with dedicated containment interfaces; the Console unifies identities, execution spans, and receipts across them.
            </p>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem' }}>
              Canonical routing map: <code style={{ fontSize: '0.78rem' }}>/dashboard</code> (Overview), <code style={{ fontSize: '0.78rem' }}>/agents</code> &amp; <code style={{ fontSize: '0.78rem' }}>/agent0</code> (&rarr; <code style={{ fontSize: '0.78rem' }}>/identity</code>), <code style={{ fontSize: '0.78rem' }}>/ais</code> &amp; <code style={{ fontSize: '0.78rem' }}>/evidence</code> (&rarr; <code style={{ fontSize: '0.78rem' }}>/intelligence</code>), <code style={{ fontSize: '0.78rem' }}>/system</code> (&rarr; <code style={{ fontSize: '0.78rem' }}>/dashboard</code>), <code style={{ fontSize: '0.78rem' }}>/health</code> (&rarr; <code style={{ fontSize: '0.78rem' }}>/shield</code>).
            </p>
          </motion.div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" style={{ padding: '6rem 3rem', maxWidth: '850px', margin: '0 auto' }}>
        <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>Questions a control engineer would ask</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Answers are scoped to what is built today, and say so when they aren't.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={stagger.viewport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="Why evaluate the post-state instead of checking intent first?"
              answer={
                <p>
                  Checking a proposed action before it runs is feed-forward: it controls on a model of what the action
                  will do. That model is exactly what an agent is good at violating. Evaluating the constraint vector
                  on the <strong>post-state</strong> controls on the state the transition would actually produce, and
                  reverts the transition if that state is out of bounds. Feed-forward screening still has value as a
                  first filter, but it cannot be the thing standing between the agent and the account.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="What happens when the oracle or the chain is unreachable?"
              answer={
                <p>
                  Local operation is a required invariant, not a resilience feature. Shield keeps enforcing and Cortex
                  keeps storing and retrieving while anchoring, the oracle or a hosted service is down; receipts queue
                  and anchor later. The honest corollary is published too: a queued receipt is not settlement proof.
                  Enforcement degrades to local authority, and the evidence catches up — the loop never depends on a
                  remote service to keep the vehicle inside its limits.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="If telemetry is the sensor, what stops a compromised agent from lying to it?"
              answer={
                <p>
                  Two things. First, only signed ingest may feed AIS at all: unsigned OTLP is available to operators as
                  traces and is explicitly barred from scoring, so flooding the loop with cooperative-looking spans
                  does not move the score. Second, the oracle re-derives the numeric signals itself rather than
                  accepting a client's arithmetic; client-supplied derived signals are audit-only. A compromised agent
                  can withhold evidence, and withholding is visible as missing evidence — which is a fail-closed input,
                  not a neutral one.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="How does Agent0 connect on-chain agency with closed-loop controls?"
              answer={
                <p>
                  Agent0 bridges decentralized Web3 execution with mathematical feedback control. An agent operates Tier 0
                  sovereign signing via local Ed25519 DIDs (<code style={{ fontSize: '0.85rem' }}>did:integrity:&lt;sha256&gt;</code>) without gas or latency. When interacting on-chain, Tier 1 SovereignAgent wallets on Base Sepolia bind transaction execution to post-state policy hooks. Finally, Tier 2 ERC-8004 Public Passports link these on-chain identities back to the canonical DID document, enabling peer agents to verify standing and AIS tier before delegating tasks.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="Is this HIPAA compliant?"
              answer={
                <p>
                  No, and anyone telling you their protocol is would be worth distrusting. The Integrity Health pack
                  demonstrates on-device access governance over <strong>synthetic</strong> data, with denials that cite
                  the control and verify offline. That is the Gate B-local scope, which explicitly excludes HIPAA
                  certification and real-PHI readiness. Certification additionally needs SOC 2 Type II and a business
                  associate agreement. The controls are mapped to HIPAA, NIST and OWASP in a published matrix — a
                  mapping is a starting point for an auditor, not a substitute for one.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="Can I run it without adopting your whole stack?"
              answer={
                <p>
                  Yes, and the conformance levels exist to make that answerable precisely. Shield runs with no core;
                  Cortex runs with no core. A record-only deployment (L0) is signed spans plus an evidence store plus
                  an oracle that verifies and anchors — no hook, no chain-mediated account. Third parties build
                  deterministic off-chain adapters and packs against documented SDK contracts, with no authority over
                  the kernel, receipts or anchors. There is deliberately no runtime lock-in: a conforming store may be
                  substituted for the reference one.
                </p>
              }
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FAQItem
              question="What is still missing?"
              answer={
                <p>
                  Phase A itself is not closed: the SDK contracts still need publishing, Shield and BCC still need to
                  prove pack-hash and deny-by-default conformance, Cortex still needs to prove authenticated
                  ingestion and tenant isolation, and signed DID-file rotation with a universal fail-closed fallback
                  is still to be defined. SaaS productization — tenancy, device enrolment, entitlements, retention,
                  purge, export — has not started, and neither has Gate C's kernel mediation and forgery-resistant
                  registration. Testnet anchoring, hosted scale, billing and real-PHI operation are separate gates or
                  deferred. The status section above carries each list with the file it came from.
                </p>
              }
            />
          </motion.div>
        </motion.div>
      </section>

      {/* 10. Direct Pilot Contact */}
      <section id="contact" style={{ padding: '5rem 2rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ display: 'inline-block', marginBottom: '0.75rem', color: 'var(--theme-accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Direct Access &amp; Partnerships
            </span>
            <h2 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: 'clamp(1.9rem, 4.5vw, 2.5rem)' }}>Talk to us about a pilot</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              For integrators, enterprise design partners, and autonomous agent systems requiring cryptographic loop verification.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
            {/* Direct Contact Info Card */}
            <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Direct Executive Inquiries</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Connect directly with leadership for protocol pilots, integration architecture reviews, or commercial deployment inquiries.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <a href="mailto:jacob@xibalbasolutions.com" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(54, 167, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', flexShrink: 0 }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600 }}>Executive Email</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>jacob@xibalbasolutions.com</div>
                    </div>
                  </a>

                  <a href="tel:+12628641589" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(54, 167, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', flexShrink: 0 }}>
                      <Phone size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600 }}>Direct Telephone</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>1 (262) 864-1589</div>
                    </div>
                  </a>

                  <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(54, 167, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', flexShrink: 0 }}>
                      <Globe size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600 }}>Parent Company</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        xibalbasolutions.com <ExternalLink size={13} />
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Xibalba Solutions LLC · Operations based in Wisconsin, USA
              </div>
            </motion.div>

            {/* Interactive Form Card */}
            <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Submit Pilot Inquiry</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Tell us about your agent runtime, conformance requirements, and target timeline.
              </p>

              {contactSubmitted ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0, 255, 200, 0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(0, 255, 200, 0.3)' }}>
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Inquiry Prepared</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                    Your message draft has been dispatched to <strong>jacob@xibalbasolutions.com</strong>. We typically respond within 24 business hours.
                  </p>
                  <button type="button" onClick={() => setContactSubmitted(false)} className="secondary-button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                    Submit another response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="landing-form-row" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <label htmlFor="contact-name" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                      <input id="contact-name" required value={contactName} onChange={(e) => setContactName(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="Jane Okonkwo" />
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <label htmlFor="contact-organization" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Organization *</label>
                      <input id="contact-organization" required value={contactOrg} onChange={(e) => setContactOrg(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="Acme Autonomous Systems" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Work Email *</label>
                    <input id="contact-email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="jane@acmecorp.com" />
                  </div>
                  <div>
                    <label htmlFor="contact-use-case" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Where you'd start</label>
                    <select id="contact-use-case" value={contactUseCase} onChange={(e) => setContactUseCase(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                      <option>Record only — signed evidence and anchoring (L0)</option>
                      <option>Constrain and record — hook plus pack (L1)</option>
                      <option>Integrity Health pack, synthetic data</option>
                      <option>Writing an adapter or a policy pack</option>
                      <option>Multi-agent swarm coordination</option>
                      <option>Something else</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-message" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Message *</label>
                    <textarea id="contact-message" required rows={3} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }} placeholder="What agents or tool actions are you putting inside a verifiable control loop?"></textarea>
                  </div>
                  <button type="submit" className="primary-button" style={{ padding: '0.9rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Send Pilot Inquiry <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 11. Protocol Specification */}
      <section id="specification" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, rgba(54, 167, 255, 0.08), rgba(0, 255, 200, 0.035))', borderBottom: '1px solid var(--border-color)' }}>
        <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} className="card" style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem)', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--theme-accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Protocol specification
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)', marginTop: 0, marginBottom: '1rem' }}>Read the loop in full detail.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.08rem', lineHeight: 1.7, maxWidth: '760px', margin: '0 auto 2rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{DOCUMENT_AUTHORITY.normative.name} {DOCUMENT_AUTHORITY.normative.version}</strong>{' '}
            is the normative authority: conformance levels, the constraint vector, the hook contract, the evidence
            plane and the AIS bounds. The whitepaper ({DOCUMENT_AUTHORITY.whitepaper.version}) is explanatory and{' '}
            {DOCUMENT_AUTHORITY.whitepaper.authority} — it does not add requirements. Each section carries a built,
            partial or planned marker, and the wiki tracks the living pages.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/wiki" className="primary-button" style={{ padding: '0.9rem 1.4rem', textDecoration: 'none' }}>
              Open the Integrity Wiki
            </Link>
            <a href="https://github.com/XibalbaTechSol/integrity-core/blob/main/docs/SPEC.md" target="_blank" rel="noopener noreferrer" className="secondary-button" style={{ padding: '0.9rem 1.4rem', textDecoration: 'none' }}>
              Read {DOCUMENT_AUTHORITY.normative.name}
            </a>
            <a href={DOCUMENT_AUTHORITY.specificationPdf.path} target="_blank" rel="noopener noreferrer" className="secondary-button" style={{ padding: '0.9rem 1.4rem', textDecoration: 'none' }}>
              Protocol Specification {DOCUMENT_AUTHORITY.specificationPdf.version} (PDF)
            </a>
          </div>
          <p style={{ margin: '1.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {DOCUMENT_AUTHORITY.normative.name} {DOCUMENT_AUTHORITY.normative.version} is normative · {DOCUMENT_AUTHORITY.specificationPdf.name} ({DOCUMENT_AUTHORITY.specificationPdf.version}) matches the canonical specification
          </p>
        </motion.div>
      </section>

      {/* 12. Footer */}
      <footer style={{ padding: '6rem 3rem 2.5rem 3rem', background: 'var(--bg-color)' }}>
        <motion.div initial={fadeInUp.initial} whileInView={fadeInUp.whileInView} viewport={fadeInUp.viewport} transition={fadeInUp.transition} style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 2.5rem)', marginBottom: '1.5rem' }}>Close the loop.</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Agents are getting more authority whether or not the control layer arrives first. Start with record-only
            evidence and add the gate when you're ready.
          </p>
          <Link to="/auth" className="primary-button" style={{ padding: '1.4rem 3rem', fontSize: '1.2rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 0 30px rgba(54, 167, 255, 0.35)' }}>
            Launch Console <ArrowRight size={20} />
          </Link>
        </motion.div>

        {/* Corporate Footer Grid */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid var(--border-color)', paddingTop: '3.5rem', paddingBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <img src="/logo.png" alt="Integrity Protocol" style={{ height: '32px', width: 'auto' }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Integrity Protocol</span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
              The deterministic control and attestation layer for autonomous agent execution. Developed by Xibalba Solutions LLC.
            </p>
            <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--theme-accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              xibalbasolutions.com <ExternalLink size={12} />
            </a>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Navigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <a href="#open-loop" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>The Problem</a>
              <a href="#loop" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>The Loop</a>
              <a href="#agent0" style={{ color: 'var(--theme-accent)', textDecoration: 'none', fontWeight: 600 }}>Agent0 Architecture</a>
              <a href="#ais" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Feedback &amp; AIS</a>
              <a href="#status" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Deployment Status</a>
              <a href="#console" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Console Surfaces</a>
              <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>FAQ</a>
              <Link to="/wiki" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Integrity Wiki</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ecosystem</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Xibalba Solutions LLC</a>
              <a href="https://github.com/xibalbatechsol/xibalba-shield" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Xibalba Shield (EDR)</a>
              <a href="https://github.com/XibalbaTechSol/super-cortex" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Super-Cortex Memory</a>
              <a href="https://github.com/xibalbatechsol/integrity-core" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Integrity Core (SDK)</a>
              <a href="https://github.com/xibalbatechsol" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>GitHub Organization</a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direct Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <a href="mailto:jacob@xibalbasolutions.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--theme-accent)" /> jacob@xibalbasolutions.com
              </a>
              <a href="tel:+12628641589" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} color="var(--theme-accent)" /> 1 (262) 864-1589
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Globe size={14} color="var(--theme-accent)" /> Wisconsin, USA
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/auth" className="secondary-button" style={{ display: 'inline-block', padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                  Open Console
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-footer-bar" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <div>
            <span>&copy; {new Date().getFullYear()} Xibalba Solutions LLC. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>xibalbasolutions.com</a>
            <a href="mailto:jacob@xibalbasolutions.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>jacob@xibalbasolutions.com</a>
            <a href="tel:+12628641589" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>1 (262) 864-1589</a>
            <Link to="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
