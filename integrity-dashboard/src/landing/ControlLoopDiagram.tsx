import React from 'react';

/**
 * The Integrity control loop, drawn as a block diagram.
 *
 * This is deliberately a *real* control diagram rather than a decorative graphic: the
 * blocks and the arrow directions are the ones in integrity-core's own `docs/SPEC.md`
 * §2 flowchart, relabelled with their control-systems names. Specifically:
 *
 *   SPEC.md §2                                    control name
 *   -------------------------------------------   ---------------------------
 *   Pack (signed constraint vector C)             reference / setpoint
 *   Hook (Enforce) - evaluates C on post-state    controller + comparator
 *   Account / agent                               plant
 *   Shield "senses - contains - emits spans"      sensor
 *   Cortex hash-chained memory                    sensor (recorder)
 *   Oracle (Record) - verify sig/leaf -> anchor   state estimator
 *   AIS (Learn) - "finite bounds only"            bounded adaptive gain
 *   Chain (StateAnchor)                           settlement / flight recorder
 *
 * The two dashed semantics also come straight from the spec's own diagram:
 * AIS may "widen finite bound only", and MUST NOT turn a deny into an allow.
 *
 * Rendered inline (not an <img>) so it inherits the CSS custom properties and stays
 * legible under every theme the SettingsContext offers. `aria-hidden` on the SVG plus
 * a visually-hidden ordered list in the parent gives assistive tech the real sequence
 * instead of a flat alt string.
 */

const BOX_H = 66;

interface BlockProps {
  x: number;
  y?: number;
  w: number;
  title: string;
  sub?: string;
  accent?: string;
}

const Block: React.FC<BlockProps> = ({ x, y = 90, w, title, sub, accent }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={BOX_H}
      rx={8}
      fill="var(--surface-color)"
      stroke={accent ?? 'var(--border-color)'}
      strokeWidth={accent ? 1.75 : 1}
    />
    <text
      x={x + w / 2}
      y={sub ? y + 27 : y + 38}
      textAnchor="middle"
      fill="var(--text-primary)"
      fontSize={13}
      fontWeight={650}
    >
      {title}
    </text>
    {sub && (
      <text x={x + w / 2} y={y + 45} textAnchor="middle" fill="var(--text-secondary)" fontSize={10.5}>
        {sub}
      </text>
    )}
  </g>
);

const WireLabel: React.FC<{ x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end' }> = ({
  x,
  y,
  children,
  anchor = 'middle',
}) => (
  <text x={x} y={y} textAnchor={anchor} fill="var(--text-secondary)" fontSize={10.5} fontStyle="italic">
    {children}
  </text>
);

export const CONTROL_LOOP_STEPS: readonly string[] = [
  'Setpoint: a signed policy pack declares the constraint vector C — the trajectory the agent is committed to. It is signed, so the setpoint itself cannot drift unnoticed.',
  'Comparator: the hook compares the agent’s proposed post-state against C.',
  'Controller: the hook evaluates C on the post-state and reverts on violation. Deny is fail-closed.',
  'Plant: the agent executes only what the hook admitted.',
  'Sensors: Shield senses and contains locally, emitting signed spans; Cortex keeps hash-chained memory and session Merkle roots.',
  'State estimator: the oracle verifies signatures and leaves, closes epochs, and anchors roots on chain — a tamper-evident flight recorder.',
  'Bounded adaptive gain: AIS is derived from verified evidence and may widen a finite bound only. It can never turn a deny into an allow, and never grants a permission.',
  'Settlement: the chain holds the anchored commitments and the enclosed account.',
];

const ControlLoopDiagram: React.FC = () => (
  <svg
    viewBox="0 0 960 470"
    role="img"
    aria-label="Block diagram of the Integrity control loop: a signed policy pack sets the trajectory, the hook compares and constrains the agent, Shield and Cortex sense what actually happened, the oracle verifies and anchors it, and AIS feeds back with authority bounded to widening a finite bound."
    style={{ width: '100%', height: 'auto', display: 'block' }}
  >
    <defs>
      <marker id="loop-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
      </marker>
      <marker id="loop-arrow-accent" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--theme-accent)" />
      </marker>
    </defs>

    {/* ---- forward path: setpoint -> comparator -> controller -> plant -> settle ---- */}
    <Block x={20} w={170} title="Signed pack" sub="setpoint · constraint vector C" accent="var(--theme-accent)" />

    <circle cx={250} cy={123} r={24} fill="var(--surface-color)" stroke="var(--border-color)" />
    <text x={250} y={129} textAnchor="middle" fill="var(--text-primary)" fontSize={17} fontWeight={700}>
      &#8721;
    </text>

    <Block x={310} w={190} title="Hook" sub="evaluates C on post-state" accent="var(--theme-accent)" />
    <Block x={560} w={150} title="Agent" sub="the plant" />
    <Block x={780} w={160} title="Chain" sub="anchors · settlement" />

    <line x1={190} y1={123} x2={222} y2={123} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <line x1={274} y1={123} x2={306} y2={123} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <line x1={500} y1={123} x2={556} y2={123} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <line x1={710} y1={123} x2={776} y2={123} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />

    {/* Clear of the box band (y=90..156): the 60px gap between Hook and Agent is narrower
        than these labels, so they sit above and below the row rather than inside it. */}
    <WireLabel x={530} y={78}>admit / revert</WireLabel>
    <WireLabel x={745} y={78}>settle</WireLabel>
    <text x={530} y={178} textAnchor="middle" fill="var(--danger)" fontSize={10} fontWeight={600}>
      fail-closed
    </text>

    {/* ---- plant output down into the sensors ---- */}
    <path d="M 635 156 L 635 310" fill="none" stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <WireLabel x={648} y={240} anchor="start">what actually happened</WireLabel>

    {/* ---- feedback path, right to left ---- */}
    <Block x={540} w={250} y={310} title="Shield · Cortex" sub="signed spans · hash-chained memory" />
    <Block x={250} w={230} y={310} title="Oracle" sub="verify · epoch · anchor" />
    <Block x={20} w={170} y={310} title="AIS" sub="bounded gain" accent="var(--theme-accent)" />

    <line x1={540} y1={343} x2={484} y2={343} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <WireLabel x={512} y={332}>evidence</WireLabel>

    <line x1={250} y1={343} x2={194} y2={343} stroke="var(--text-secondary)" markerEnd="url(#loop-arrow)" />
    <WireLabel x={222} y={332}>verified</WireLabel>

    {/* oracle -> comparator: the measured state estimate closing the loop */}
    <path
      d="M 365 310 L 365 240 L 250 240 L 250 151"
      fill="none"
      stroke="var(--text-secondary)"
      markerEnd="url(#loop-arrow)"
    />
    <WireLabel x={376} y={230} anchor="start">verified state estimate</WireLabel>

    {/* oracle -> chain: the anchored flight recorder */}
    {/* Routed *below* the feedback row. The direct line at y=332 ran straight through the
        Shield-Cortex block, which read as a connection to it rather than past it. */}
    <path
      d="M 365 376 L 365 400 L 880 400 L 880 160"
      fill="none"
      stroke="var(--text-secondary)"
      strokeDasharray="2 3"
      markerEnd="url(#loop-arrow)"
    />
    <WireLabel x={640} y={393} anchor="middle">anchorRoot</WireLabel>

    {/* AIS -> pack: the bounded adaptation, dashed because its authority is limited */}
    <path
      d="M 105 310 L 105 160"
      fill="none"
      stroke="var(--theme-accent)"
      strokeDasharray="5 4"
      markerEnd="url(#loop-arrow-accent)"
    />
    <text x={118} y={226} fill="var(--theme-accent)" fontSize={10.5} fontWeight={600}>
      widen a finite
    </text>
    <text x={118} y={240} fill="var(--theme-accent)" fontSize={10.5} fontWeight={600}>
      bound only
    </text>

    {/* ---- the forbidden path. Drawn, because what the loop refuses is the design ---- */}
    {/* Rises through the clear gap between the AIS and Oracle blocks (x=190..250) and
        heads for the comparator, so the blocked edge reads as "AIS -> the decision".
        An earlier riser at x=405 sat inside the Oracle block and wrongly implied the
        forbidden edge was AIS -> Oracle. */}
    <path
      d="M 105 404 L 105 440 L 215 440 L 215 210"
      fill="none"
      stroke="var(--danger)"
      strokeDasharray="4 4"
      opacity={0.75}
    />
    <line x1={203} y1={210} x2={227} y2={186} stroke="var(--danger)" strokeWidth={2} />
    <line x1={203} y1={186} x2={227} y2={210} stroke="var(--danger)" strokeWidth={2} />
    <text x={420} y={444} textAnchor="middle" fill="var(--danger)" fontSize={10.5} fontWeight={600}>
      never turns a deny into an allow
    </text>
  </svg>
);

export default ControlLoopDiagram;
