'use client';
import { useMemo } from 'react';
import LiveMap from '../../map/LiveMap';
import { LineChartComponent, BarChartComponent } from '../../charts';
import { generateResourceTrend } from '../../../utils/trendData';

function SectionHeader({ title, sub }) {
  return (
    <div className="section-header">
      <div className="section-header-line" />
      <span className="section-header-title">{title}</span>
      {sub && <span className="section-header-sub">{sub}</span>}
    </div>
  );
}

function StatCard({ icon, title, value, sub, color = 'blue', onClick, delay = 0 }) {
  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${delay}ms`, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function OverviewPage({ hospital, hospitalId, ambulance, distanceKm, etaMinutes, isAlertMode, hosLoading, onNavigate }) {
  const res = hospital?.resources ?? {};

  // Generate chart data
  // Bug 13 fix: watch ALL resource fields, not just availableBeds
  const trendData = useMemo(() => generateResourceTrend(res),
    [res.availableBeds, res.icuBeds, res.ventilators, res.doctorsAvailable]); // eslint-disable-line react-hooks/exhaustive-deps
  const barData   = useMemo(() => [{
    name: 'Current',
    Beds: res.availableBeds ?? 0,
    ICU: res.icuBeds ?? 0,
    Ventilators: res.ventilators ?? 0,
    Doctors: res.doctorsAvailable ?? 0,
  }], [res]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <h1>{hospital?.name ?? 'Hospital Dashboard'}</h1>
        <p>Real-time emergency management · {hospital?.address ?? hospitalId}</p>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <StatCard delay={0}   icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h8M2 12h10"/></svg>} title="Available Beds"   value={hosLoading ? '…' : (res.availableBeds ?? '—')}    sub="General ward"   color="blue"  onClick={() => onNavigate('resources')} />
        <StatCard delay={60}  icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10"/></svg>}            title="ICU Beds"         value={hosLoading ? '…' : (res.icuBeds ?? '—')}          sub="Critical care"  color="red"   onClick={() => onNavigate('resources')} />
        <StatCard delay={120} icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8h8M4 5h5M4 11h6"/></svg>}      title="Ventilators"      value={hosLoading ? '…' : (res.ventilators ?? '—')}       sub="Active units"   color="amber" onClick={() => onNavigate('resources')} />
        <StatCard delay={180} icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>} title="Doctors On Duty" value={hosLoading ? '…' : (res.doctorsAvailable ?? '—')} sub="Available now"  color="green" onClick={() => onNavigate('resources')} />
      </div>

      {/* Ambulance + Hospital info */}
      <div className="grid-2">
        <div className="card" style={{ animationDelay: '100ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>Active Ambulance</span>
            <span className={`badge ${isAlertMode ? 'badge-red' : 'badge-green'}`}>
              <span className="dot" />
              {isAlertMode ? 'ALERT' : (ambulance?.status?.replace('_', ' ')?.toUpperCase() ?? 'EN ROUTE')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Distance', value: `${distanceKm.toFixed(2)} km`, alert: isAlertMode },
              { label: 'ETA',      value: etaMinutes < 1 ? '< 1 min' : `${Math.round(etaMinutes)} min`, alert: isAlertMode },
              { label: 'Speed',    value: `${ambulance?.speed ?? 60} km/h`, alert: false },
              { label: 'Driver',   value: ambulance?.driver ?? 'Ravi Kumar', alert: false },
            ].map(({ label, value, alert }) => (
              <div key={label} style={{ background: 'var(--bg3)', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: alert ? 'var(--red)' : 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('ambulance')}>
            Full Tracker →
          </button>
        </div>

        <div className="card" style={{ animationDelay: '160ms' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 16, letterSpacing: '-0.01em' }}>Hospital Info</div>
          {[
            { label: 'Name',    value: hospital?.name },
            { label: 'Address', value: hospital?.address },
            { label: 'ID',      value: hospitalId },
            { label: 'Lat/Lng', value: hospital?.location ? `${hospital.location.lat?.toFixed(4)}, ${hospital.location.lng?.toFixed(4)}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value ?? '—'}</span>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => onNavigate('map')}>
            Open Map →
          </button>
        </div>
      </div>

      {/* Map */}
      <LiveMap
        hospitalLocation={hospital?.location ?? { lat: 17.385, lng: 78.4867 }}
        ambulanceLocation={ambulance?.location ?? { lat: 17.391, lng: 78.495 }}
        distanceKm={distanceKm}
        eta={etaMinutes}
        isAlertMode={isAlertMode}
      />

      {/* ── Insights ─────────────────────────────────────────── */}
      <SectionHeader title="Insights" sub="Resource availability trends over the last 2 hours" />
      <div className="grid-2">
        <LineChartComponent
          title="Resource Availability Trend"
          subtitle="Beds · ICU · Ventilators · Doctors (last 2h)"
          data={trendData}
          loading={hosLoading}
          lines={[
            { key: 'Beds',        color: '#6C8EF5' },
            { key: 'ICU',         color: '#F87171' },
            { key: 'Ventilators', color: '#FBBF24' },
            { key: 'Doctors',     color: '#34D399' },
          ]}
          height={230}
        />
        <BarChartComponent
          title="Current Resource Distribution"
          subtitle="Snapshot of all active resources"
          data={barData}
          loading={hosLoading}
          bars={[
            { key: 'Beds',        color: '#6C8EF5' },
            { key: 'ICU',         color: '#F87171' },
            { key: 'Ventilators', color: '#FBBF24' },
            { key: 'Doctors',     color: '#34D399' },
          ]}
          height={230}
        />
      </div>
    </div>
  );
}
