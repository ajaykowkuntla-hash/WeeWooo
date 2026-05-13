// src/app/api/eta/route.js
// Updated to use OSRM public API to avoid 503 errors and stop console spam
import { NextResponse } from 'next/server';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(request) {
  try {
    const { origin, destination } = await request.json();

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json({ error: 'Missing or invalid coordinates', distanceKm: 0, etaMinutes: 0, durationSeconds: 0 }, { status: 400 });
    }

    // Use OSRM public routing API (longitude,latitude format)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

    const res = await fetch(url, { 
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000) // 5s timeout to prevent hanging
    });
    
    if (!res.ok) {
      throw new Error(`OSRM API HTTP ${res.status}`);
    }

    const json = await res.json();
    
    if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
      throw new Error(`OSRM routing failed: ${json.code}`);
    }

    const route = json.routes[0];
    const distanceKm = route.distance / 1000;
    const durationSeconds = route.duration;
    const etaMinutes = Math.ceil(durationSeconds / 60);

    return NextResponse.json({
      distanceKm: Number(distanceKm.toFixed(2)),
      etaMinutes,
      durationSeconds,
      source: 'osrm'
    });
    
  } catch (err) {
    console.error('ETA API Error:', err.message);
    
    // Fallback: Haversine distance with assumed 40km/h speed
    try {
      const { origin, destination } = await request.json().catch(() => ({}));
      if (origin && destination) {
        const distKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
        const etaMins = Math.ceil((distKm / 40) * 60); // 40 km/h average
        return NextResponse.json({
          distanceKm: Number(distKm.toFixed(2)),
          etaMinutes: etaMins,
          durationSeconds: etaMins * 60,
          source: 'fallback_haversine',
          error: err.message
        }, { status: 200 }); // Always 200 to avoid frontend 503 spam
      }
    } catch (e) {}

    return NextResponse.json({
      error: err.message,
      distanceKm: 0,
      etaMinutes: 0,
      durationSeconds: 0,
      source: 'error'
    }, { status: 200 }); // Graceful failure to stop 503 spam
  }
}

