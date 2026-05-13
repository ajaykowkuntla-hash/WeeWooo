'use client';
import { useEffect, useRef } from 'react';

export default function AmbulanceAlertModal({ distanceKm, etaMinutes, ambulanceId, onClose, onAcknowledge }) {
  const eta = etaMinutes < 1 ? 'Less than 1 minute' : `${Math.round(etaMinutes)} min`;
  const ackBtnRef = useRef(null);

  // Bug 15 fix: Escape key closes modal + focus trap on open
  useEffect(() => {
    const prev = document.activeElement;
    ackBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // Basic focus trap: keep Tab inside modal
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll('.alert-modal button, .alert-modal [tabindex]');
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus(); // restore focus on close
    };
  }, [onClose]);

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal alert-modal">

        {/* Pulsing alert indicator */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(227,25,55,0.12)', border: '2px solid rgba(227,25,55,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', animation: 'borderPulse 1s ease infinite',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E31937" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
        </div>

        <h2
          id="alert-modal-title"
          style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, color: 'var(--red)', marginBottom: 6 }}
        >
          Ambulance Approaching!
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 20, fontSize: '0.88rem' }}>
          {ambulanceId} is <strong style={{ color: 'var(--text)' }}>{distanceKm.toFixed(2)} km</strong> away
        </p>

        <div style={{
          background: 'rgba(227,25,55,0.06)', border: '1px solid rgba(227,25,55,0.2)',
          borderRadius: 'var(--radius-sm)', padding: 20, textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>ETA</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>{eta}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            ref={ackBtnRef}
            className="btn btn-danger"
            style={{ justifyContent: 'center', padding: 11 }}
            onClick={onAcknowledge}
          >
            Acknowledge
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', padding: 11 }}
            onClick={onClose}
          >
            Dismiss
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.65rem', color: 'var(--muted)' }}>
          Press <kbd style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border)' }}>Esc</kbd> to dismiss
        </div>
      </div>
    </div>
  );
}
