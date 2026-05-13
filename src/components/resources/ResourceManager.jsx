'use client';
// src/components/resources/ResourceManager.jsx

import { useState } from 'react';
import { useFirebaseWrite } from '../../hooks/useFirebaseData';

const FIELDS = [
  { key: 'availableBeds',    label: 'Available Beds',   color: 'blue',  max: 200 },
  { key: 'icuBeds',          label: 'ICU Beds',          color: 'red',   max: 50  },
  { key: 'ventilators',      label: 'Ventilators',       color: 'amber', max: 30  },
  { key: 'doctorsAvailable', label: 'Doctors Available', color: 'green', max: 100 },
];

export default function ResourceManager({ hospitalId, resources, loading }) {
  const [local, setLocal]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const { merge } = useFirebaseWrite();

  const values = local ?? resources ?? {};

  const handleChange = (key, val) => {
    setLocal((prev) => ({ ...values, ...prev, [key]: Math.max(0, Number(val)) }));
    setSaved(false);
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    const result = await merge(`/hospitals/${hospitalId}/resources`, local ?? values);
    setSaving(false);
    // Bug 12 fix: removed `|| true` — now correctly shows error if Firebase write fails
    if (result?.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError(result?.error ?? 'Save failed');
    }
  };

  const hasChanges = local !== null && JSON.stringify(local) !== JSON.stringify(resources);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon blue">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
        </div>
        <div>
          <div className="card-title">Resource Management</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Update hospital capacity in real time</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span className="badge badge-green">Saved</span>}
          {saveError && <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>{saveError}</span>}
          {hasChanges && (
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{width:12,height:12,borderWidth:1.5}}/> Saving</> : 'Save'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {FIELDS.map((f) => {
            const val = values[f.key] ?? 0;
            const pct = Math.min(100, (val / f.max) * 100);
            return (
              <div key={f.key} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: 16,
                transition: 'border-color var(--transition)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {f.label}
                  </div>
                </div>
                <input
                  id={`res-${f.key}`}
                  type="number"
                  className="form-input"
                  value={val}
                  min={0}
                  max={f.max}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  style={{ fontSize: '1.4rem', fontWeight: 800, padding: '4px 8px', marginBottom: 8 }}
                />
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${f.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: 4 }}>
                  {pct.toFixed(0)}% of {f.max} max
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
