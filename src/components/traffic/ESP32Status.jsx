'use client';
// src/components/traffic/ESP32Status.jsx

import { formatDistanceToNow } from 'date-fns';

function SensorRow({ name, icon, active, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '1rem', width: 22, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{name}</div>
        {detail && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 1 }}>{detail}</div>}
      </div>
      <span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>
        <span className="dot" />{active ? 'ACTIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}

export default function ESP32Status({ esp32, loading }) {
  if (loading) return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L6 9h4l-3 5 7-7h-4l3-5z"/></svg>
        ESP32 System Status
      </div>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />)}
    </div>
  );

  const e = esp32 ?? {};
  const sensors = e.sensors ?? {};
  const connected = e.connected ?? false;
  const pingAgo = e.lastPing ? formatDistanceToNow(new Date(e.lastPing), { addSuffix: true }) : 'unknown';
  const uptimeH = e.uptime ? Math.floor(e.uptime / 3600) : 0;
  const uptimeM = e.uptime ? Math.floor((e.uptime % 3600) / 60) : 0;
  const rssi = e.signalStrength ?? -99;
  const signalPct = Math.max(0, Math.min(100, ((rssi + 100) / 60) * 100));
  const signalColor = rssi > -70 ? 'var(--green)' : rssi > -85 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L6 9h4l-3 5 7-7h-4l3-5z"/></svg>
          ESP32 System Status
        </div>
        <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
          <span className="dot" />{connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      {/* System metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Firmware',   value: e.firmwareVersion ?? '—'    },
          { label: 'Uptime',     value: `${uptimeH}h ${uptimeM}m`  },
          { label: 'Last Ping',  value: pingAgo                     },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Signal strength */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 6a9 9 0 0 1 14 0M4 9a5 5 0 0 1 8 0M7 12a2 2 0 0 1 2 0"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/></svg>
            WiFi Signal
          </span>
          <span style={{ fontSize: '0.75rem', color: signalColor, fontWeight: 700 }}>{rssi} dBm</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${signalPct}%`, background: `linear-gradient(90deg, ${signalColor}88, ${signalColor})` }} />
        </div>
      </div>

      {/* Sensors */}
      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Sensors</div>
      <SensorRow name="GPS Module"    icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>} active={sensors.gps?.active}        detail={sensors.gps?.active ? `Accuracy: ${sensors.gps.accuracy}m` : 'No signal'} />
      <SensorRow name="Ultrasonic"    icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 6a9 9 0 0 1 14 0M4 9a5 5 0 0 1 8 0"/></svg>} active={sensors.ultrasonic?.active} detail={sensors.ultrasonic?.active ? `Range: ${sensors.ultrasonic.range}m` : 'Inactive'} />
    </div>
  );
}
