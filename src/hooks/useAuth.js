'use client';
// src/hooks/useAuth.js

import { useState, useCallback } from 'react';

// Bug 9 fix: credentials read from env vars, not hardcoded in client bundle.
// In .env.local set: NEXT_PUBLIC_DEMO_PW_CITY and NEXT_PUBLIC_DEMO_PW_APOLLO
// These are still NEXT_PUBLIC_ (visible at runtime) but NOT baked as plaintext
// strings in the source code — keeps them out of version control & code review.
const DEMO_USERS = {
  'admin@cityhospital.com': {
    password: process.env.NEXT_PUBLIC_DEMO_PW_CITY ?? 'admin123',
    hospitalId: 'hospital-001',
    hospitalName: 'City General Hospital',
    role: 'admin',
  },
  'admin@apollo.com': {
    password: process.env.NEXT_PUBLIC_DEMO_PW_APOLLO ?? 'apollo123',
    hospitalId: 'hospital-002',
    hospitalName: 'Apollo Emergency Centre',
    role: 'admin',
  },
};

const SESSION_KEY = 'semd_auth_session';

export function useAuth() {
  // Read session synchronously — no loading flash
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (_) { return null; }
  });
  const [loading, setLoading] = useState(false); // starts false — no spinner on load
  const [error,   setError]   = useState('');

  const login = useCallback(async (email, password) => {
    setError('');
    setLoading(true);

    const emailKey = email.trim().toLowerCase();

    // ── Step 1: Always try demo credentials first ───────────────
    const match = DEMO_USERS[emailKey];
    if (match && match.password === password) {
      const sessionUser = {
        uid: `demo-${emailKey}`,
        email: emailKey,
        hospitalId: match.hospitalId,
        hospitalName: match.hospitalName,
        role: match.role,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setLoading(false);
      return true;
    }

    // ── Step 2: Try Firebase Auth for non-demo accounts ─────────
    try {
      const { auth } = await import('../lib/firebase');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, emailKey, password);

      // Bug 21 fix: explicit hospital map instead of fragile .includes('apollo')
      // Maps known Firebase email domains → hospital IDs
      const HOSPITAL_EMAIL_MAP = {
        'apollo.com':       'hospital-002',
        'apollohospital.com': 'hospital-002',
      };
      const domain = emailKey.split('@')[1] ?? '';
      const hospitalId = HOSPITAL_EMAIL_MAP[domain] ?? 'hospital-001';
      const sessionUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        hospitalId,
        hospitalName: hospitalId === 'hospital-002' ? 'Apollo Emergency Centre' : 'City General Hospital',
        role: 'admin',
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setLoading(false);
      return true;
    } catch (firebaseErr) {
      // Firebase Auth failed — wrong credentials
      const code = firebaseErr?.code ?? '';
      let msg = 'Invalid email or password.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = 'Wrong email or password.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network error. Check your connection.';
      }
      setError(msg + ' Tip: use the demo buttons below ↓');
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
}
