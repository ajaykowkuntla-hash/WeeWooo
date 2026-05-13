'use client';
// src/app/page.js — Single useAuth() source of truth

import { useAuth } from '../hooks/useAuth';
import LoginPage from '../components/auth/LoginPage';
import DashboardShell from '../components/dashboard/DashboardShell';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const { user, loading, error, login, logout } = useAuth();

  // Only show spinner when a login action is in progress (not on initial load)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',   // hardcoded — CSS vars don't resolve in inline styles during SSR
        gap: 14,
      }}>
        <div style={{
          width: 24, height: 24,
          border: '1.5px solid rgba(255,255,255,0.08)',
          borderTopColor: '#E31937',
          borderRadius: '50%',
          animation: 'spin 0.65s linear infinite',
        }} />
        <span style={{ fontSize: '0.7rem', color: '#6E7380', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Signing in
        </span>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage login={login} error={error} loading={loading} />
      </ErrorBoundary>
    );
  }

  // Authenticated
  return (
    <ErrorBoundary>
      <DashboardShell user={user} onLogout={logout} />
    </ErrorBoundary>
  );
}
