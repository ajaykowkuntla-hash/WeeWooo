'use client';
// src/components/traffic/TrafficMap.jsx
// SVG-based live coordination view — ambulance + junctions + route

import { useEffect, useRef, useState, useMemo } from 'react';

// Map lat/lng → SVG pixel coords
function project(lat, lng, bounds, W, H) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W;
  const y = H - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * H;
  return { x, y };
}

const JUNCTION_COLORS = {
  GREEN:    '#34D399',
  CLEARING: '#FBBF24',
  PENDING:  '#6B7280',
  NORMAL:   '#374151',
};

const JUNCTION_GLOW = {
  GREEN:    'rgba(52,211,153,0.5)',
  CLEARING: 'rgba(251,191,36,0.5)',
  PENDING:  'rgba(107,114,128,0.3)',
  NORMAL:   'rgba(55,65,81,0.2)',
};

export default function TrafficMap({ trafficData, ambulanceLocation, hospitalLocation }) {
  const W = 700, H = 420;
  const [tick, setTick] = useState(0);
  const [ambPos, setAmbPos] = useState(null);

  // Bug 18/16 fix: normalize Firebase object {0:{...}} to array
  const junctions   = useMemo(() => {
    const raw = trafficData?.junctions ?? [];
    return Array.isArray(raw) ? raw : Object.values(raw);
  }, [trafficData?.junctions]);
  const route       = trafficData?.route ?? [];
  const isEmergency = trafficData?.mode !== 'NORMAL';

  // Bug 20 fix: memoize bounds so it doesn't change reference every render
  const bounds = useMemo(() => {
    const allLats = [...junctions.map(j => j.lat), ambulanceLocation?.lat, hospitalLocation?.lat, ...route.map(r => r.lat)].filter(Boolean);
    const allLngs = [...junctions.map(j => j.lng), ambulanceLocation?.lng, hospitalLocation?.lng, ...route.map(r => r.lng)].filter(Boolean);
    if (!allLats.length) return { minLat: 17.38, maxLat: 17.44, minLng: 78.48, maxLng: 78.50 };
    const pad = 0.003;
    return {
      minLat: Math.min(...allLats) - pad,
      maxLat: Math.max(...allLats) + pad,
      minLng: Math.min(...allLngs) - pad,
      maxLng: Math.max(...allLngs) + pad,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambulanceLocation?.lat, ambulanceLocation?.lng, hospitalLocation?.lat, hospitalLocation?.lng, junctions.length]);

  // Animate tick for pulsing
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 800);
    return () => clearInterval(t);
  }, []);

  // Bug 20 fix: bounds now in dep array (was stale before because bounds was recreated every render)
  useEffect(() => {
    if (!ambulanceLocation) return;
    setAmbPos(project(ambulanceLocation.lat, ambulanceLocation.lng, bounds, W, H));
  }, [ambulanceLocation, bounds]);

  const ambPx  = ambPos ?? (ambulanceLocation ? project(ambulanceLocation.lat, ambulanceLocation.lng, bounds, W, H) : null);
  const hospPx = hospitalLocation ? project(hospitalLocation.lat, hospitalLocation.lng, bounds, W, H) : null;
  const routePx = route.map(r => project(r.lat, r.lng, bounds, W, H));

  return (
    <div style={{ position: 'relative', background: 'var(--bg3)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'rgba(16,19,26,0.9)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
        {[
          { color: '#34D399', label: 'Cleared' },
          { color: '#FBBF24', label: 'Clearing' },
          { color: '#6B7280', label: 'Pending' },
          { color: '#6C8EF5', label: 'Route' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.7rem', color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Mode badge */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
        <span className={`badge ${isEmergency ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
          <span className="dot" />
          {trafficData?.mode ?? 'NORMAL'} MODE
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Background grid */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(H/8)*i} x2={W} y2={(H/8)*i} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={(W/12)*i} y1={0} x2={(W/12)*i} y2={H} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        {/* Route path */}
        {routePx.length > 1 && (
          <>
            <polyline
              points={routePx.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgba(108,142,245,0.2)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={routePx.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#6C8EF5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 5"
              opacity="0.8"
            />
          </>
        )}

        {/* Direct ambulance → hospital line */}
        {ambPx && hospPx && (
          <line
            x1={ambPx.x} y1={ambPx.y} x2={hospPx.x} y2={hospPx.y}
            stroke="rgba(248,113,113,0.3)" strokeWidth="1.5" strokeDasharray="4 4"
          />
        )}

        {/* Junctions */}
        {junctions.map((j) => {
          const px = project(j.lat, j.lng, bounds, W, H);
          const color = JUNCTION_COLORS[j.status] ?? '#374151';
          const glow  = JUNCTION_GLOW[j.status]  ?? 'transparent';
          const pulse = (j.status === 'CLEARING' || j.status === 'GREEN') && tick % 2 === 0;
          const r = j.onRoute ? 16 : 11;

          return (
            <g key={j.id}>
              {/* Glow ring */}
              {j.onRoute && (
                <circle cx={px.x} cy={px.y} r={pulse ? r + 10 : r + 6} fill={glow} opacity={pulse ? 0.8 : 0.4}>
                  <animate attributeName="r" values={`${r+4};${r+14};${r+4}`} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Junction circle */}
              <circle cx={px.x} cy={px.y} r={r} fill={color} fillOpacity={j.onRoute ? 0.9 : 0.5} stroke={j.onRoute ? color : 'rgba(255,255,255,0.1)'} strokeWidth={j.onRoute ? 2 : 1} />
              {/* Junction ID */}
              <text x={px.x} y={px.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={j.onRoute ? 9 : 7} fontWeight="700" fontFamily="Inter,sans-serif">
                {j.id.replace('J-', '')}
              </text>
              {/* Label */}
              {j.onRoute && (
                <text x={px.x} y={px.y + r + 12} textAnchor="middle" fill={color} fontSize="8" fontFamily="Inter,sans-serif" fontWeight="600" opacity="0.9">
                  {j.clearanceTime > 0 ? `${j.clearanceTime}s` : '✓'}
                </text>
              )}
            </g>
          );
        })}

        {/* Hospital marker */}
        {hospPx && (
          <g>
            <circle cx={hospPx.x} cy={hospPx.y} r={20} fill="rgba(108,142,245,0.15)" stroke="#6C8EF5" strokeWidth="2" />
            <text x={hospPx.x} y={hospPx.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#6C8EF5" fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">H</text>
            <text x={hospPx.x} y={hospPx.y + 28} textAnchor="middle" fill="#6C8EF5" fontSize="8" fontFamily="Inter,sans-serif" fontWeight="700">HOSPITAL</text>
          </g>
        )}

        {/* Ambulance marker */}
        {ambPx && (
          <g>
            {/* L4 fix: removed static r={22} — animate drives r exclusively to avoid conflict */}
            <circle cx={ambPx.x} cy={ambPx.y} fill="rgba(248,113,113,0.15)" stroke="#F87171" strokeWidth="2">
              <animate attributeName="r" values="18;26;18" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={ambPx.x} cy={ambPx.y} r={18} fill="rgba(227,25,55,0.2)" stroke="#E31937" strokeWidth="1.5" />
            <text x={ambPx.x} y={ambPx.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="Inter,sans-serif">AMB</text>
            <text x={ambPx.x} y={ambPx.y - 26} textAnchor="middle" fill="#E31937" fontSize="8" fontFamily="Inter,sans-serif" fontWeight="700">EN ROUTE</text>
          </g>
        )}
      </svg>
    </div>
  );
}
