function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchRouteAndETA(origin, destination) {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return { distanceKm: 0, etaMinutes: 0, routeCoords: [] };
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    
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
    
    // Parse route coordinates for MapView
    const routeCoords = route.geometry.coordinates.map((c) => ({
      latitude: c[1],
      longitude: c[0],
    }));

    return {
      distanceKm: Number(distanceKm.toFixed(2)),
      etaMinutes,
      routeCoords,
      source: 'osrm',
    };
  } catch (err) {
    console.warn('OSRM Route fetch failed, using fallback calculations:', err.message);
    const distKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const etaMins = Math.ceil((distKm / 45) * 60); // Assumes 45 km/h avg speed

    // Generate straight line route as fallback
    const routeCoords = [
      { latitude: origin.lat, longitude: origin.lng },
      { latitude: destination.lat, longitude: destination.lng },
    ];

    return {
      distanceKm: Number(distKm.toFixed(2)),
      etaMinutes: etaMins,
      routeCoords,
      source: 'fallback_haversine',
    };
  }
}
