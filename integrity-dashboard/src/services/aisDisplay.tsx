import { createElement } from 'react';

export const NOT_OBSERVED = 'Not observed';

/** Format an AIS component; null/undefined means the Oracle observed nothing, never 0. */
export function formatComponent(value: number | null | undefined, digits = 0): string {
  return value == null ? '—' : value.toFixed(digits);
}

/** Scale a 0-1000 component to the radar's 0-100 axis; null stays null (axis omitted). */
export function radarValue(value: number | null | undefined): number | null {
  return value == null ? null : Math.round(value / 10);
}

/** Value, or an em dash tagged "Not observed" (title + screen-reader text) when unobserved. */
export function ComponentValue({ value, digits = 0 }: { value: number | null | undefined; digits?: number }) {
  if (value == null) {
    return createElement(
      'strong',
      { title: NOT_OBSERVED, 'aria-label': NOT_OBSERVED },
      '—',
      createElement('span', { className: 'sr-only' }, NOT_OBSERVED),
    );
  }
  return createElement('strong', null, formatComponent(value, digits));
}
