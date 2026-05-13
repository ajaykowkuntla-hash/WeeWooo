// src/services/etaService.js

export async function fetchETA(origin, destination) {
  try {
    const res = await fetch('/api/eta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
    
    // Server now guarantees 200 OK even on fallback/error to prevent 503 spam
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("ETA Fetch failed:", error);
    return {
      error: error.message,
      distanceKm: 0,
      etaMinutes: 0,
      durationSeconds: 0,
      source: 'error'
    };
  }
}
