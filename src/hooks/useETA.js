// src/hooks/useETA.js
import { useState, useEffect, useRef } from 'react';
import { fetchETA } from '../services/etaService';

export function useETA(origin, destination) {
  const [etaData, setEtaData] = useState({
    distanceKm: 0,
    etaMinutes: 0,
    durationSeconds: 0,
    source: null,
    loading: true,
    error: null,
  });

  const lastFetchRef = useRef(0);
  const cacheRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const pollETA = async () => {
      if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        if (isMounted) setEtaData(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check cache (if coordinates haven't changed much, we could skip, but let's just use time throttling)
      const now = Date.now();
      if (now - lastFetchRef.current < 15000 && cacheRef.current) {
        // It's been less than 15 seconds, don't spam the API
        timeoutId = setTimeout(pollETA, 15000 - (now - lastFetchRef.current));
        return;
      }

      try {
        lastFetchRef.current = Date.now();
        const data = await fetchETA(origin, destination);
        
        if (isMounted) {
          const newData = {
            distanceKm: data.distanceKm || 0,
            etaMinutes: data.etaMinutes || 0,
            durationSeconds: data.durationSeconds || 0,
            source: data.source,
            loading: false,
            error: data.error || null,
          };
          setEtaData(newData);
          cacheRef.current = newData;
        }
      } catch (err) {
        if (isMounted) {
          setEtaData(prev => ({ ...prev, error: err.message, loading: false }));
        }
      }

      // Schedule next poll in 20 seconds
      if (isMounted) {
        timeoutId = setTimeout(pollETA, 20000);
      }
    };

    pollETA();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return etaData;
}
