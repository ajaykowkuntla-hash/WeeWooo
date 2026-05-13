'use client';
// src/components/debug/DebugPanel.jsx

import { useState, useEffect } from 'react';

import { formatDistanceToNow } from 'date-fns';

const StatusDot = ({ ok }) => (
  <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: ok ? 'var(--green)' : 'var(--red)',
    marginRight: 5, flexShrink: 0,
    boxShadow: ok ? '0 0 4px var(--green)' : '0 0 4px var(--red)',
  }} />
);

// Bug 22 fix: live clock that actually ticks
function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t.toLocaleTimeString('en-IN', { hour12: false });
}

export default function DebugPanel({
  ambulance, selectedHospital, eta,
  activeJunctions, alertState, signalLost,
  firebaseConnected, trafficData,
}) {
  const [open, setOpen] = useState(false);
  const clock = useClock(); // Bug 22 fix: live ticking clock

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open System Telemetry"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          background: 'var(--bg2)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-sm)',
          padding: '7px 13px',
          color: 'var(--muted)',
          fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-mid)';
          e.currentTarget.style.color = 'var(--muted)';
        }}
      >
        {/* Terminal / telemetry icon */}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="1" y="2" width="14" height="12" rx="2"/>
          <path d="M4 6l3 2-3 2M9 10h3"/>
        </svg>
        Telemetry
      </button>
    );
  }

  const loc = ambulance?.location;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      width: 320, maxHeight: '78vh', overflowY: 'auto',
      background: 'var(--bg2)',
      border: '1px solid var(--border-mid)',
      borderRadius: 'var(--radius)',
      fontFamily: 'monospace', fontSize: '0.72rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="2" width="14" height="12" rx="2"/>
            <path d="M4 6l3 2-3 2M9 10h3"/>
          </svg>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            System Telemetry
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', background: 'none', border: 'none', fontSize: '1rem', lineHeight: 1, padding: '2px 4px' }}
        >
          &#x2715;
        </button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* System status */}
        <Section title="System Status">
          <Row label="Firebase"    value={<><StatusDot ok={firebaseConnected} />{firebaseConnected ? 'Connected' : 'Disconnected'}</>}   color={firebaseConnected ? 'var(--green)' : 'var(--red)'} />
          <Row label="GPS Signal"  value={<><StatusDot ok={!signalLost} />{signalLost ? 'Lost' : 'Active'}</>}                           color={signalLost ? 'var(--red)' : 'var(--green)'} />
          <Row label="Alert Mode"  value={<><StatusDot ok={!alertState?.active} />{alertState?.active ? 'Active' : 'Normal'}</>}         color={alertState?.active ? 'var(--red)' : 'var(--green)'} />
          <Row label="Traffic Mode" value={trafficData?.mode ?? '—'} />
        </Section>

        {/* Ambulance */}
        <Section title="Ambulance">
          <Row label="ID"       value={ambulance?.id ?? '—'} />
          <Row label="Lat"      value={loc?.lat?.toFixed(6) ?? '—'} />
          <Row label="Lng"      value={loc?.lng?.toFixed(6) ?? '—'} />
          <Row label="Speed"    value={`${ambulance?.speed ?? '—'} km/h`} />
          <Row label="Status"   value={ambulance?.status ?? '—'} />
          <Row label="Updated"  value={ambulance?.lastUpdated ? formatDistanceToNow(new Date(ambulance.lastUpdated), { addSuffix: true }) : '—'} />
        </Section>

        {/* ETA */}
        <Section title="ETA">
          <Row label="Distance" value={eta?.distanceText ?? `${((eta?.distance ?? 0) / 1000).toFixed(2)} km`} />
          <Row label="Duration" value={eta?.durationText ?? `${Math.round((eta?.duration ?? 0) / 60)} min`} />
          <Row label="Source"   value={eta?.source ?? '—'} color={eta?.source === 'google' ? 'var(--green)' : 'var(--amber)'} />
          {eta?.reason && <Row label="Fallback" value={eta.reason} color="var(--amber)" />}
        </Section>

        {/* Best hospital */}
        <Section title="Selected Hospital">
          <Row label="Name"  value={selectedHospital?.hospital?.name ?? '—'} />
          <Row label="ID"    value={selectedHospital?.hospital?.id ?? '—'} />
          <Row label="Beds"  value={selectedHospital?.hospital?.resources?.availableBeds ?? '—'} />
          <Row label="ETA"   value={selectedHospital?.eta?.durationText ?? '—'} />
        </Section>

        {/* Active junctions */}
        <Section title={`Junctions (${activeJunctions?.length ?? 0} active)`}>
          {(activeJunctions?.length ?? 0) === 0
            ? <span style={{ color: 'var(--muted)' }}>None nearby</span>
            : activeJunctions.map((j) => (
              <Row key={j.id} label={j.id} value={`${j.name} — ${j.status}`} />
            ))
          }
        </Section>

        {/* Alert state */}
        <Section title="Alert State">
          <Row label="Triggered"    value={alertState?.active ? 'Yes' : 'No'} />
          <Row label="Distance"     value={alertState?.distM ? `${(alertState.distM / 1000).toFixed(2)} km` : '—'} />
          <Row label="ETA"          value={alertState?.durSec ? `${Math.round(alertState.durSec)}s` : '—'} />
          <Row label="Acknowledged" value={alertState?.acked ? 'Yes' : 'No'} />
        </Section>

        <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textAlign: 'center', marginTop: 4, letterSpacing: '0.04em' }}>
          Refreshed {clock}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{
        color: 'var(--muted)', fontWeight: 700, marginBottom: 6,
        fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div style={{
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: color ?? 'var(--text)', textAlign: 'right', wordBreak: 'break-all', display: 'flex', alignItems: 'center' }}>{value ?? '—'}</span>
    </div>
  );
}
