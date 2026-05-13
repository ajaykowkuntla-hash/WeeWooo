'use client';
// src/components/traffic/JunctionPanel.jsx — Emergency override + route prediction

// M4 fix: SVG/CSS dots replace cross-platform-inconsistent emoji
const STATUS_CFG = {
  GREEN:    { label: 'CLEARED',  color: 'var(--green)', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  CLEARING: { label: 'CLEARING', color: 'var(--amber)', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
  PENDING:  { label: 'PENDING',  color: 'var(--muted)', bg: 'rgba(107,114,128,0.08)', border: 'var(--border)'          },
  NORMAL:   { label: 'NORMAL',   color: 'var(--muted)', bg: 'transparent',            border: 'var(--border)'          },
};

// Small colored dot helper (replaces 🟢 🟡 ⚫)
const Dot = ({ color }) => (
  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
);

const DENSITY_COLOR = {
  LOW:      'var(--green)',
  MEDIUM:   'var(--amber)',
  HIGH:     'var(--red)',
  CRITICAL: 'var(--red)',
};

export default function JunctionPanel({ junctions = [], mode, loading }) {
  if (loading) return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 14 }}>🔀 Junction Status</div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8 }} />)}
    </div>
  );

  const onRoute = junctions.filter(j => j.onRoute);
  const offRoute = junctions.filter(j => !j.onRoute);
  const isEmergency = mode === 'AMBULANCE' || mode === 'EMERGENCY';

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4l5 4-5 4M9 12h6"/>
        </svg>
        Junction Override Status
      </div>
        {isEmergency && (
          <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>
            <span className="dot" />EMERGENCY ACTIVE
          </span>
        )}
      </div>

      {/* Route prediction header */}
      {isEmergency && (
        <div style={{ background: 'rgba(108,142,245,0.08)', border: '1px solid rgba(108,142,245,0.2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 1C5.8 1 4 2.8 4 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="5" r="1.2"/>
          </svg>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>Predicted Clearance Sequence</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
              {onRoute.map(j => j.id).join(' → ')} → [H]
            </div>
          </div>
        </div>
      )}

      {/* On-route junctions */}
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, marginBottom: 8 }}>
        On Emergency Route ({onRoute.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {onRoute.map((j, idx) => {
          const cfg = STATUS_CFG[j.status] ?? STATUS_CFG.NORMAL;
          return (
            <div key={j.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s', animationDelay: `${idx * 60}ms` }}>
              {/* Step indicator */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: cfg.color }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text)', marginBottom: 2 }}>{j.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{j.id}</span>
                  <span style={{ fontSize: '0.7rem', color: DENSITY_COLOR[j.density] }}>● {j.density}</span>
                  {j.clearanceTime > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--amber)' }}>⏱ {j.clearanceTime}s to clear</span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: '3px 9px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Dot color={cfg.color} /> {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Off-route junctions */}
      {offRoute.length > 0 && (
        <>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, marginBottom: 8 }}>
            Off Route ({offRoute.length})
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {offRoute.map(j => (
              <div key={j.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                {j.id} — {j.name.split(' ')[0]}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
