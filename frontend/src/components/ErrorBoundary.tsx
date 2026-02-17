import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0E27',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            {/* Animated ring */}
            <div
              style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                margin: '0 auto 28px',
              }}
            >
              <svg viewBox="0 0 88 88" style={{ width: '100%', height: '100%' }}>
                <circle
                  cx="44" cy="44" r="38"
                  fill="none"
                  stroke="rgba(239,68,68,0.15)"
                  strokeWidth="3"
                />
                <circle
                  cx="44" cy="44" r="38"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="60 180"
                  style={{
                    animation: 'errSpin 3s linear infinite',
                    transformOrigin: '44px 44px',
                  }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                <svg
                  width="28" height="28" viewBox="0 0 24 24"
                  fill="none" stroke="#ef4444" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>

            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '0 0 10px',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                margin: '0 0 8px',
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. This is usually temporary.
            </p>
            {this.state.error && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: '0 0 28px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00B892, #00D4AA)',
                  color: '#0A0E27',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,212,170,0.25)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,170,0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,212,170,0.25)';
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  padding: '10px 28px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)';
                  e.currentTarget.style.color = '#00D4AA';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                Go Home
              </button>
            </div>

            <style>{`
              @keyframes errSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
