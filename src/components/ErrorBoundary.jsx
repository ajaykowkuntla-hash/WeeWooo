'use client';
// src/components/ErrorBoundary.jsx
// Bug 25 fix: catches any component crash and shows a recovery UI
// instead of a full white-screen death in an emergency dashboard

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, fallback, inline } = { ...this.props, error: this.state.error };

    // Custom fallback
    if (fallback) return fallback;

    // Inline variant — for panels/cards that shouldn't kill the whole page
    if (inline) {
      return (
        <div style={{
          background: 'var(--bg3, #111)',
          border: '1px solid rgba(227,25,55,0.3)',
          borderRadius: 8,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E31937" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11v1"/>
          </svg>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E31937' }}>Component Error</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted, #6E7380)', marginTop: 2, fontFamily: 'monospace' }}>
              {this.state.error?.message ?? 'Unknown error'}
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted, #6E7380)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Retry
          </button>
        </div>
      );
    }

    // Full-page variant — last resort
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#000', gap: 16, padding: 32,
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#E31937" strokeWidth="2" strokeLinecap="round">
          <circle cx="20" cy="20" r="18"/>
          <path d="M20 12v10M20 28v1"/>
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            System Error
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6E7380', maxWidth: 360, fontFamily: 'monospace', wordBreak: 'break-word' }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </div>
        </div>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          style={{
            marginTop: 8, padding: '9px 22px', background: '#E31937', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.05em',
          }}
        >
          Reload Dashboard
        </button>
      </div>
    );
  }
}
