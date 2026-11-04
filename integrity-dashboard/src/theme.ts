/**
 * The canonical palette as JavaScript values.
 *
 * CSS should use the custom properties in src/index.css. This module exists for
 * the places that genuinely cannot: a canvas 2D context, a WebGL material, and
 * chart libraries that write colours into SVG presentation attributes, none of
 * which resolve `var(--token)`. Keep these in step with :root -- they are the
 * same colours, not a second palette.
 */
export const palette = {
  ground: '#08111b',
  surface: '#0d1824',
  surfaceRaised: '#111f2d',
  surfaceSunken: '#0a1520',
  line: '#213246',
  lineStrong: '#2d4361',

  ink: '#eef5fb',
  inkMuted: '#8ea1b4',
  inkDim: '#536b83',

  accent: '#36a7ff',
  accentHover: '#5cb8ff',
  accentPress: '#1b8cd4',

  /** State, never decoration. */
  success: '#42d68b',
  warning: '#f0b429',
  danger: '#ff6b7a',
} as const;

/**
 * Categorical series in fixed order -- slot 1 is always the first series, so a
 * filter that removes a series never repaints the survivors. Deliberately free
 * of the status hues. See the note in src/index.css for the validation run.
 */
export const series = ['#3987e5', '#199e70', '#9085e9', '#d55181'] as const;

/** The four AIS components, in the order the oracle derives them. */
export const aisSeries = {
  entropy: series[0],
  grounding: series[1],
  sacrifice: series[2],
  compliance: series[3],
} as const;
