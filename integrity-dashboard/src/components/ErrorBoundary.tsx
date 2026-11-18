import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              marginBottom: '1rem',
            }}
          >
            <AlertTriangle size={36} color="var(--danger, #ef4444)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {this.props.fallbackTitle || 'A component error occurred'}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary, #94a3b8)',
              maxWidth: '480px',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred while rendering this surface.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="primary-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
            Reload Console
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
