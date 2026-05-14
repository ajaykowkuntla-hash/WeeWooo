// src/hooks/useFirebaseData.js
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ── Firebase lazy loader ──────────────────────────────────────
let _db = null;
let _rtdb = null;

async function getFirebaseModules() {
  if (_db && _rtdb) return { db: _db, rtdb: _rtdb };
  const { db }    = await import('../lib/firebase');
  const rtdb      = await import('firebase/database');
  _db   = db;
  _rtdb = rtdb;
  return { db, rtdb };
}

// ── Connection status ─────────────────────────────────────────
export function useFirebaseConnected() {
  const [connected, setConnected] = useState(null); // null = unknown

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const { db, rtdb } = await getFirebaseModules();
        const connRef = rtdb.ref(db, '.info/connected');
        unsub = rtdb.onValue(connRef, (snap) => setConnected(snap.val() === true));
      } catch {
        setConnected(false);
      }
    })();
    return () => unsub?.();
  }, []);

  return connected;
}

// ── Generic listener ──────────────────────────────────────────
export function useFirebaseListener(path, fallback = null) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const unsubRef    = useRef(null);
  // Bug 6 fix: stabilize fallback in a ref so changing object references
  // don't cause unnecessary re-subscriptions or stale closure values
  const fallbackRef = useRef(fallback);
  useEffect(() => { fallbackRef.current = fallback; });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      try {
        const { db, rtdb } = await getFirebaseModules();
        const nodeRef = rtdb.ref(db, path);

        unsubRef.current = rtdb.onValue(
          nodeRef,
          (snapshot) => {
            if (cancelled) return;
            const val = snapshot.val();
            setData(val !== null ? val : fallbackRef.current);
            setLoading(false);
            setError(null);
          },
          (err) => {
            if (cancelled) return;
            console.warn(`[Firebase] listener error at "${path}":`, err.message);
            setData(fallbackRef.current);
            setLoading(false);
            setError(err.message);
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.warn(`[Firebase] init error at "${path}":`, err.message);
        setData(fallbackRef.current);
        setLoading(false);
        setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, [path]); // path is the only real dependency; fallback is handled via ref

  return { data, loading, error };
}

// ── Write helpers ─────────────────────────────────────────────
export function useFirebaseWrite() {
  const write = useCallback(async (path, value) => {
    try {
      const { db, rtdb } = await getFirebaseModules();
      await rtdb.set(rtdb.ref(db, path), value);
      return { ok: true };
    } catch (err) {
      console.error('[Firebase] write error:', err);
      return { ok: false, error: err.message };
    }
  }, []);

  const merge = useCallback(async (path, value) => {
    try {
      const { db, rtdb } = await getFirebaseModules();
      await rtdb.update(rtdb.ref(db, path), value);
      return { ok: true };
    } catch (err) {
      console.error('[Firebase] update error:', err);
      return { ok: false, error: err.message };
    }
  }, []);

  return { write, merge };
}

// ── Data seeder — runs once to populate DB if empty ──────────
export async function seedFirebaseIfEmpty(hospitalId, hospitalData, ambulanceData, trafficData) {
  try {
    const { db, rtdb } = await getFirebaseModules();

    const hospSnap = await rtdb.get(rtdb.ref(db, '/hospitals'));
    if (!hospSnap.exists() || Object.keys(hospSnap.val() || {}).length < 2) {
      // Import HOSPITAL_DATA here to seed all of them
      const { HOSPITAL_DATA } = await import('../lib/mockData');
      await rtdb.set(rtdb.ref(db, '/hospitals'), HOSPITAL_DATA);
      console.log('[Firebase] Seeded all hospitals');
    }

    const ambSnap = await rtdb.get(rtdb.ref(db, '/ambulance/location'));
    if (!ambSnap.exists()) {
      await rtdb.set(rtdb.ref(db, '/ambulance/location'), ambulanceData);
      console.log('[Firebase] Seeded ambulance');
    }

    const trafficSnap = await rtdb.get(rtdb.ref(db, '/Traffic'));
    if (!trafficSnap.exists()) {
      // Convert trafficData: remove non-serialisable Date.now() values
      const seed = { ...trafficData, lastUpdated: Date.now() };
      await rtdb.set(rtdb.ref(db, '/Traffic'), seed);
      console.log('[Firebase] Seeded traffic');
    }
  } catch (err) {
    console.warn('[Firebase] Seed failed (check RTDB is enabled):', err.message);
  }
}
