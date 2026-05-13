// src/components/ETAStatusCard.jsx
import React from 'react';

export default function ETAStatusCard({ etaData, distanceKm, isAlertMode }) {
  const isHealthy = etaData?.source === 'osrm' || etaData?.source === 'google';
  const isFallback = etaData?.source === 'fallback_haversine' || etaData?.source === 'fallback';
  const isError = etaData?.source === 'error' || (!isHealthy && !isFallback);

  const statusColor = isHealthy ? 'var(--green)' : isFallback ? 'var(--amber)' : 'var(--red)';
  const statusText = isHealthy ? 'API Active' : isFallback ? 'Offline - Using Fallback' : 'API Unavailable';

  // Extract from passed etaData or use fallbacks
  const dist = etaData?.distanceKm ?? distanceKm ?? 0;
  const mins = etaData?.etaMinutes ?? (etaData?.duration ? Math.round(etaData.duration / 60) : 0);

  return (
    <div className="card" style={{ border: isAlertMode ? '1px solid rgba(227,25,55,0.4)' : '1px solid var(--border)' }}>
      <div className="card-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`card-icon ${isHealthy ? 'blue' : 'amber'}`} style={{ fontSize: '0.6rem', fontWeight: 800 }}>ETA</div>
          <div className="card-title">Live Route Status</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            display: 'inline-block', 
            width: 8, height: 8, 
            borderRadius: '50%', 
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}` 
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {statusText}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Route Distance</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: isAlertMode ? 'var(--red)' : 'var(--accent)' }}>
            {dist.toFixed(2)} km
          </div>
        </div>
        
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Estimated Arrival</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: isAlertMode ? 'var(--red)' : 'var(--green)' }}>
            {mins < 1 ? '<1 min' : `${mins} min`}
          </div>
        </div>
      </div>
      
      {isAlertMode && (
        <div style={{ marginTop: 12, background: 'rgba(227,25,55,0.06)', borderRadius: 6, padding: '8px', textAlign: 'center', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          CRITICAL PROXIMITY ALERT
        </div>
      )}
    </div>
  );
}
