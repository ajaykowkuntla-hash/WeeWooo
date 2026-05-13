'use client';
// src/components/traffic/TrafficDashboard.jsx

import { useState, useEffect, useMemo } from 'react';
import TrafficMap    from './TrafficMap';
import JunctionPanel from './JunctionPanel';
import ESP32Status   from './ESP32Status';
import { PieChartComponent, BarChartComponent } from '../charts';
import { generateJunctionPie, generateDensityBar } from '../../utils/trendData';
import { formatDistanceToNow } from 'date-fns';

const MODE_CFG = {
  NORMAL:    { color: 'var(--green)', bg: 'rgba(0,200,150,0.08)',    border: 'rgba(0,200,150,0.2)',    label: 'NORMAL' },
  AMBULANCE: { color: 'var(--amber)', bg: 'rgba(245,166,35,0.08)',   border: 'rgba(245,166,35,0.2)',   label: 'AMBULANCE' },
  EMERGENCY: { color: 'var(--red)',   bg: 'rgba(227,25,55,0.08)',    border: 'rgba(227,25,55,0.2)',    label: 'EMERGENCY' },
};

const DENSITY_CFG = {
  LOW:      { color: 'var(--green)', width: '25%'  },
  MEDIUM:   { color: 'var(--amber)', width: '55%'  },
  HIGH:     { color: 'var(--red)',   width: '80%'  },
  CRITICAL: { color: 'var(--red)',   width: '100%' },
};

export default function TrafficDashboard({ trafficData, loading, ambulance, hospital, distanceKm, etaMinutes }) {
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTicker(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const td         = trafficData ?? {};
  const mode       = td.mode ?? 'NORMAL';
  const modeCfg    = MODE_CFG[mode] ?? MODE_CFG.NORMAL;
  const density    = td.density ?? 'MEDIUM';
  const densityCfg = DENSITY_CFG[density] ?? DENSITY_CFG.MEDIUM;
  // C1 fix: normalize Firebase object to array before .filter()
  const raw        = td.junctions ?? [];
  const junctions  = Array.isArray(raw) ? raw : Object.values(raw);
  const cleared    = junctions.filter(j => j.status === 'GREEN').length;
  const clearing   = junctions.filter(j => j.status === 'CLEARING').length;

  const pieData     = useMemo(() => generateJunctionPie(junctions), [junctions]);
  const densityData = useMemo(() => generateDensityBar(junctions), [junctions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <h1>Traffic Control</h1>
        <p>
          Emergency corridor management · Firebase <code style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4, fontSize: '0.82em' }}>/Traffic</code>
          {td.lastUpdated && <span style={{ marginLeft: 8, color: 'var(--muted)' }}>· Updated {formatDistanceToNow(new Date(td.lastUpdated), { addSuffix: true })}</span>}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <div className="stat-card" style={{ border: `1px solid ${modeCfg.border}`, background: modeCfg.bg, animationDelay: '0ms' }}>
          <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: modeCfg.bg, border: `1px solid ${modeCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 14 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={modeCfg.color} strokeWidth="1.5" strokeLinecap="round">
              <rect x="5" y="1" width="6" height="14" rx="2"/>
              <circle cx="8" cy="4.5" r="1" fill={modeCfg.color} stroke="none"/>
              <circle cx="8" cy="8" r="1" fill={modeCfg.color} stroke="none"/>
              <circle cx="8" cy="11.5" r="1" fill={modeCfg.color} stroke="none"/>
            </svg>
          </div>
          <div className="stat-title">Traffic Mode</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: modeCfg.color }}>{modeCfg.label}</div>
          <div className="stat-sub">System state</div>
        </div>
        <div className="stat-card" style={{ animationDelay: '60ms' }}>
          <div className="stat-icon green">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4"/></svg>
          </div>
          <div className="stat-title">Junctions Cleared</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{cleared}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/{junctions.filter(j=>j.onRoute).length}</span></div>
          <div className="stat-sub">{clearing} clearing now</div>
        </div>
        <div className="stat-card" style={{ animationDelay: '120ms' }}>
          <div className="stat-icon blue">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5h10a2 2 0 0 1 0 4H2"/><path d="M12 12H2"/><circle cx="4" cy="12" r="1.5"/><circle cx="10" cy="12" r="1.5"/></svg>
          </div>
          <div className="stat-title">Vehicles Cleared</div>
          <div className="stat-value">{td.clearedCount ?? 0}</div>
          <div className="stat-sub">of {td.vehicleCount ?? 0} on route</div>
        </div>
        <div className="stat-card" style={{ animationDelay: '180ms' }}>
          <div className="stat-icon red">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
          </div>
          <div className="stat-title">Ambulance ETA</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{etaMinutes < 1 ? '<1' : Math.round(etaMinutes)}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}> min</span></div>
          <div className="stat-sub">{distanceKm.toFixed(2)} km away</div>
        </div>
      </div>

      {td.activeLane && (
        <div style={{ background: 'rgba(108,142,245,0.06)', border: '1px solid rgba(108,142,245,0.2)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'rgba(90,141,238,0.08)', border: '1px solid rgba(90,141,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>Active Emergency Corridor</div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem', marginTop: 2 }}>{td.activeLane}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Traffic Density</div>
            <div style={{ fontWeight: 700, color: densityCfg.color, fontSize: '0.9rem' }}>{density}</div>
            <div className="progress-bar" style={{ width: 80, marginLeft: 'auto' }}>
              <div className="progress-fill" style={{ width: densityCfg.width, background: densityCfg.color }} />
            </div>
          </div>
        </div>
      )}

      {/* Live Map */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Live Coordination View</div>
        <TrafficMap trafficData={td} ambulanceLocation={ambulance?.location} hospitalLocation={hospital?.location} />
      </div>

      {/* Junction + ESP32 */}
      <div className="grid-2">
        <JunctionPanel junctions={junctions} mode={mode} loading={loading} />
        <ESP32Status   esp32={td.esp32}          loading={loading} />
      </div>

      {/* Telemetry strip */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, letterSpacing: '-0.01em' }}>Ambulance Telemetry</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { label: 'Unit ID',  value: ambulance?.id ?? 'AMB-2024-01' },
            { label: 'Vehicle',  value: ambulance?.vehicleNumber ?? 'TS-09-AB-1234' },
            { label: 'Speed',    value: `${ambulance?.speed ?? 60} km/h` },
            { label: 'Driver',   value: ambulance?.driver ?? 'Ravi Kumar' },
            { label: 'Distance', value: `${distanceKm.toFixed(3)} km` },
            { label: 'ETA',      value: etaMinutes < 1 ? '<1 min' : `${Math.round(etaMinutes)} min` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Analysis ────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '4px 0 -4px' }}>
        <span style={{ width: 20, height: 20, borderRadius: 3, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, color: 'var(--muted)' }}>TR</span>
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>Analysis</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 8 }}>Junction status distribution and density</span>
        </div>
      </div>
      <div className="grid-2">
        <PieChartComponent
          title="Junction Clearance Status"
          subtitle="Breakdown of all junctions by state"
          data={pieData}
          height={230}
        />
        <BarChartComponent
          title="Traffic Density per Junction"
          subtitle="1 Low · 2 Medium · 3 High · 4 Critical"
          data={densityData}
          xKey="label"
          bars={[{ key: 'Density', color: '#6C8EF5' }]}
          height={230}
        />
      </div>
    </div>
  );
}
