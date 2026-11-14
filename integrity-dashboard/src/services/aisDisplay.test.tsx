import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ComponentValue, formatComponent, radarValue, NOT_OBSERVED } from './aisDisplay';

describe('null compliance rendering', () => {
  it('formats null as an em dash, never 0', () => {
    expect(formatComponent(null)).toBe('—');
    expect(formatComponent(undefined)).toBe('—');
    expect(formatComponent(0)).toBe('0');
    expect(formatComponent(812.4)).toBe('812');
  });

  it('radar value is null (omitted) for null, 0 stays 0', () => {
    expect(radarValue(null)).toBeNull();
    expect(radarValue(0)).toBe(0);
    expect(radarValue(1000)).toBe(100);
  });

  it('renders Not observed without throwing for null', () => {
    const html = renderToStaticMarkup(<ComponentValue value={null} />);
    expect(html).toContain(NOT_OBSERVED);
    expect(html).toContain('—');
    expect(html).not.toMatch(/>0</);
  });

  it('renders a real zero as 0', () => {
    expect(renderToStaticMarkup(<ComponentValue value={0} />)).toContain('>0<');
  });
});
