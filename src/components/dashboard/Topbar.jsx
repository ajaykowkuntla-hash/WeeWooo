'use client';
// Bug 19 fix: useState/useEffect used inside LiveClock only — importing from within is cleaner
import { useState, useEffect } from 'react';
import { useFirebaseConnected } from '../../hooks/useFirebaseData';

export default function Topbar({ title, onMenuToggle, onNotifToggle, unreadCount, isAlertMode, signalLost, user }) {
  const connected = useFirebaseConnected();

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-sm" onClick={onMenuToggle} style={{ padding: '7px 9px' }} aria-label="Menu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 3h14M1 8h14M1 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <span className="topbar-title">{title}</span>

      {isAlertMode && (
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '0.06em' }}>
          ⚠ ALERT
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        {/* Firebase status */}
        <div className="firebase-bar">
          <div className={`fb-dot ${connected === null ? 'unknown' : connected ? 'connected' : 'disconnected'}`} />
          <span style={{ color: connected ? 'var(--green)' : connected === null ? 'var(--amber)' : 'var(--red)' }}>
            {connected === null ? 'Connecting…' : connected ? 'Firebase Live' : 'Offline'}
          </span>
        </div>

        <LiveClock />

        <button
          id="notif-btn"
          className="btn btn-ghost btn-sm"
          onClick={onNotifToggle}
          style={{ position: 'relative', padding: '7px 9px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, background: 'var(--red)', color: '#fff', fontSize: '0.58rem', fontWeight: 700, minWidth: 14, height: 14, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
              {unreadCount}
            </span>
          )}
        </button>

        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {user?.email?.[0]?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString('en-IN', { hour12: false })}
    </span>
  );
}
