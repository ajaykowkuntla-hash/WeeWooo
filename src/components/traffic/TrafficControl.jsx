'use client';
// src/components/traffic/TrafficControl.jsx

import { formatDistanceToNow } from 'date-fns';

// M5 fix: CSS dots replacing emoji color indicators
const STATUS_CONFIG = {
  green:  { label: 'CLEAR',    cls: 'signal-green',  badge: 'badge-green', color: 'var(--green)' },
  red:    { label: 'BLOCKED',  cls: 'signal-red',    badge: 'badge-red',   color: 'var(--red)'   },
  amber:  { label: 'CAUTION',  cls: 'signal-amber',  badge: 'badge-amber', color: 'var(--amber)' },
};

export default function TrafficControl({ trafficData, loading }) {
  if (loading) return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon amber">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="5" y="1" width="6" height="14" rx="2"/>
            <circle cx="8" cy="4.5" r="1" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        <div className="card-title">Traffic Control</div>
      </div>
      {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8 }} />)}
    </div>
  );

  const { activeSignals = [], activeLane, estimatedClearance, lastUpdated } = trafficData ?? {};

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon amber">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="5" y="1" width="6" height="14" rx="2"/>
            <circle cx="8" cy="4.5" r="1" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        <div>
          <div className="card-title">Traffic Control</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
            {lastUpdated ? `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}` : 'Live data'}
          </div>
        </div>
      </div>

      {/* Active corridor */}
      {activeLane && (
        <div style={{
          background: 'rgba(119,182,234,.1)', border: '1px solid var(--blue)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Active Emergency Corridor</div>
            <div style={{ fontWeight: 700, color: 'var(--blue)' }}>{activeLane}</div>
            {estimatedClearance && <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: 2 }}>Clearance: {estimatedClearance}</div>}
          </div>
        </div>
      )}

      {/* Signal list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeSignals.map((sig) => {
          const cfg = STATUS_CONFIG[sig.status] ?? STATUS_CONFIG.amber;
          return (
            <div key={sig.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', border: '1px solid var(--border)',
            }}>
              <div className={`traffic-signal ${cfg.cls}`}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sig.intersection}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: 2 }}>
                  ID: {sig.id} {sig.clearanceTime ? `• ${sig.clearanceTime}s clearance` : ''}
                </div>
              </div>
              <span className={`badge ${cfg.badge}`}>
                <span className="dot" />
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
