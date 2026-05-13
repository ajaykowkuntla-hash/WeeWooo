'use client';
// src/hooks/useAmbulanceLocation.js
// Real GPS hook — listens to /ambulances/{id} or /ambulance/location
// Detects stale signal (>5s without update)

import { useState, useEffect, useRef, useCallback } from 'react';
import { AMBULANCE_DATA } from '../lib/mockData';

const STALE_THRESHOLD_MS = 5000;

/**
 * @param {string} ambulanceId  'default' → /ambulance/location, else /ambulances/{id}
 * @returns {{ location, ambulance, signalLost, lastUpdated, isLoading }}
 */
export function useAmbulanceLocation(ambulanceId = 'default') {
  const [ambulance,    setAmbulance]    = useState(AMBULANCE_DATA);
  const [location,     setLocation]     = useState(AMBULANCE_DATA.location);
  const [signalLost,   setSignalLost]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(Date.now());
  const [isLoading,    setIsLoading]    = useState(true);

  const prevLocRef  = useRef(AMBULANCE_DATA.location);
  const staleTimer  = useRef(null);
  const unsubRef    = useRef(null);
  const demoCleanup = useRef(null); // Bug 3 fix: store demo interval cleanup

  const resetStaleTimer = useCallback(() => {
    setSignalLost(false);
    clearTimeout(staleTimer.current);
    staleTimer.current = setTimeout(() => {
      console.warn('[useAmbulanceLocation] Signal lost for', ambulanceId);
      setSignalLost(true);
    }, STALE_THRESHOLD_MS);
  }, [ambulanceId]);

  useEffect(() => {
    let cancelled = false;

    const path = ambulanceId === 'default'
      ? '/ambulance/location'
      : `/ambulances/${ambulanceId}`;

    (async () => {
      try {
        const { db }   = await import('../lib/firebase');
        const { ref, onValue, off } = await import('firebase/database');

        const dbRef = ref(db, path);

        const handle = onValue(dbRef, (snap) => {
          if (cancelled) return;
          setIsLoading(false);

          const raw = snap.val();
          if (!raw) return;

          // Normalize: /ambulance/location stores flat object or nested
          const ambData  = raw.location ? raw : { ...AMBULANCE_DATA, ...raw };
          const newLoc   = raw.location ?? { lat: raw.lat, lng: raw.lng };

          if (!newLoc?.lat || !newLoc?.lng) return;

          // Smooth interpolation (lerp 70% toward new position per update)
          const smoothed = {
            lat: prevLocRef.current.lat + (newLoc.lat - prevLocRef.current.lat) * 0.7,
            lng: prevLocRef.current.lng + (newLoc.lng - prevLocRef.current.lng) * 0.7,
          };
          prevLocRef.current = smoothed;

          setLocation(smoothed);
          setAmbulance({ ...ambData, location: smoothed });
          setLastUpdated(raw.timestamp ?? Date.now());
          resetStaleTimer();

          console.log('[useAmbulanceLocation] Update:', ambulanceId, smoothed);
        }, (err) => {
          console.error('[useAmbulanceLocation] Firebase error:', err.message);
          setIsLoading(false);
          setSignalLost(true);
        });

        unsubRef.current = () => off(dbRef, 'value', handle);
        // Bug 4 fix: start stale timer ONLY after Firebase successfully connects
        resetStaleTimer();
      } catch (err) {
        console.error('[useAmbulanceLocation] Init error:', err.message);
        setIsLoading(false);
        setSignalLost(true);
        // Bug 3 fix: store cleanup fn so it gets called on unmount
        demoCleanup.current = startDemoMovement(prevLocRef, setLocation, setAmbulance, resetStaleTimer);
      }
    })();

    // Bug 4 fix: removed resetStaleTimer() from here — was firing before Firebase connected

    return () => {
      cancelled = true;
      unsubRef.current?.();
      demoCleanup.current?.(); // Bug 3 fix: clean up demo interval
      clearTimeout(staleTimer.current);
    };
  }, [ambulanceId, resetStaleTimer]);

  return { location, ambulance, signalLost, lastUpdated, isLoading };
}

// ── Multi-ambulance hook ──────────────────────────────────────────────────────
/**
 * Listen to ALL ambulances at /ambulances/*
 * @returns {{ ambulances: Record<string, object>, isLoading: boolean }}
 */
export function useAllAmbulances() {
  const [ambulances, setAmbulances] = useState({ 'default': AMBULANCE_DATA });
  const [isLoading,  setIsLoading]  = useState(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { db }   = await import('../lib/firebase');
        const { ref, onValue, off } = await import('firebase/database');

        const dbRef = ref(db, '/ambulances');
        const handle = onValue(dbRef, (snap) => {
          if (cancelled) return;
          setIsLoading(false);
          const val = snap.val();
          if (val) setAmbulances(val);
        });

        unsubRef.current = () => off(dbRef, 'value', handle);
      } catch (err) {
        console.error('[useAllAmbulances]', err.message);
        setIsLoading(false);
      }
    })();

    return () => { cancelled = true; unsubRef.current?.(); };
  }, []);

  return { ambulances, isLoading };
}

// ── Demo movement fallback ────────────────────────────────────────────────────
function startDemoMovement(prevLocRef, setLocation, setAmbulance, resetStaleTimer) {
  console.log('[useAmbulanceLocation] Starting demo GPS movement');
  const t = setInterval(() => {
    const next = {
      lat: prevLocRef.current.lat - 0.0008,
      lng: prevLocRef.current.lng - 0.002,
    };
    prevLocRef.current = next;
    setLocation(next);
    setAmbulance((prev) => ({ ...prev, location: next }));
    resetStaleTimer();
  }, 4000);
  return () => clearInterval(t);
}
