'use client';
import { useState } from 'react';

const DEMOS = [
  { email: 'admin@cityhospital.com', password: 'admin123', label: 'City General Hospital' },
  { email: 'admin@apollo.com',       password: 'apollo123', label: 'Apollo Emergency Centre' },
];

/* Props come from page.js which owns the single useAuth() instance */
export default function LoginPage({ login, error, loading }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    await login(email, password);
  };

  const handleDemo = async (d) => {
    setEmail(d.email);
    setPassword(d.password);
    await login(d.email, d.password);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <h1>Smart Emergency</h1>
          <p>Hospital Dashboard — Secure Access</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11.5v.5"/>
            </svg>
            {error}
          </div>
        )}

        <div role="group" aria-label="Sign in form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-pw">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-pw"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', padding: 0 }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Bug 24 fix: onClick instead of form onSubmit — prevents native form submit before hydration */}
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || !email || !password}
            onClick={handleSubmit}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.88rem', marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 1.5 }} /> Signing in…</>
              : 'Sign In →'}
          </button>
        </div>

        <div className="demo-box">
          <p>Quick Access — click to sign in instantly</p>
          {DEMOS.map((d) => (
            <button
              key={d.email}
              className="demo-btn"
              type="button"
              disabled={loading}
              onClick={() => handleDemo(d)}
            >
              <strong>{d.label}</strong>
              <span style={{ float: 'right', opacity: 0.55, fontSize: '0.72rem' }}>{d.email}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
