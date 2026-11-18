import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorBoundary } from './ErrorBoundary';

const GoodChild = () => <div>Operational Surface</div>;

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(html).toContain('Operational Surface');
  });

  it('updates state via getDerivedStateFromError', () => {
    const error = new Error('Simulated render error');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });

  it('renders fallback banner when state has error', () => {
    const boundary = new ErrorBoundary({ fallbackTitle: 'Custom Error Fallback', children: <GoodChild /> });
    boundary.state = { hasError: true, error: new Error('Simulated crash') };
    const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

    expect(html).toContain('Custom Error Fallback');
    expect(html).toContain('Simulated crash');
    expect(html).toContain('Reload Console');
  });
});
