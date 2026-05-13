// src/utils/maps.js
// Updated to use OSRM routing and proper error handling to stop 503 spam
import { fetchETA } from '../services/etaService';
import { getDistanceKm, getETAMinutes } from '../lib/mockData';

// Simple in-memory cache to prevent spamming the API
const etaCache = {
  lastFetch: 0,
  data: null,
  lastOrigin: null,
};

export async function getETA(origin, destination) {
  if (!origin || !destination) {
    return fallback(origin, destination, 'missing coords');
  }

  const now = Date.now();
  // Rate limit: only fetch every 15 seconds minimum, unless location changed significantly
  if (now - etaCache.lastFetch < 15000 && etaCache.data) {
    return etaCache.data;
  }

  try {
    etaCache.lastFetch = now;
    const res = await fetchETA(origin, destination);
    
    // Convert new API response to the format expected by DashboardShell
    const formatted = {
      distance: (res.distanceKm || 0) * 1000,
      duration: res.durationSeconds || 0,
      source: res.source || 'osrm',
      distanceText: `${res.distanceKm?.toFixed(2) || '0.00'} km`,
      durationText: `${res.etaMinutes || 0} min`,
    };
    
    etaCache.data = formatted;
    return formatted;
  } catch (err) {
    console.warn('[maps] ETA Service failed:', err.message, '— falling back');
    return fallback(origin, destination, err.message);
  }
}

function fallback(origin, destination, reason) {
  if (!origin || !destination) {
    return { distance: 0, duration: 0, source: 'fallback', reason };
  }
  const km  = getDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const sec = getETAMinutes(km, 60) * 60;
  return {
    distance: Math.round(km * 1000),
    duration: Math.round(sec),
    source:   'fallback',
    reason,
    distanceText: `${km.toFixed(2)} km`,
    durationText: `${Math.round(sec / 60)} min`,
  };
}
