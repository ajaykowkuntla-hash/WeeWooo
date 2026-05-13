'use client';
import { useEffect, useRef } from 'react';

export default function LiveMap({ hospitalLocation, ambulanceLocation, distanceKm, eta, isAlertMode, hospitals }) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);      // Leaflet map instance
  const ambMarker = useRef(null);
  const routeLine = useRef(null);

  // C6+C7+M12 fix:
  // - C6: removed unpkg.com CDN dependency for marker images (use divIcon SVG instead)
  // - C7: local `map` variable captured in closure, set to null on cleanup — prevents remount blank map
  // - M12: guard ambulanceLocation null on init (GPS may not be ready yet)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let map = null; // C7: local ref so cleanup always targets THIS instance

    import('leaflet').then((L) => {
      // C7 fix: if container already has a Leaflet instance (strict mode double-run), skip
      if (!mapRef.current || mapRef.current._leaflet_id) return;

      const makeIcon = (svg, color) => L.default.divIcon({
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.15);box-shadow:0 0 14px ${color}88">${svg}</div>`,
        className: '', iconSize: [32, 32], iconAnchor: [16, 16],
      });
      const hospitalSVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>`;
      const ambSVG      = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="5" width="14" height="8" rx="2"/><path d="M4 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M8 8v4M6 10h4"/></svg>`;

      const center = hospitalLocation
        ? [hospitalLocation.lat, hospitalLocation.lng]
        : [17.385, 78.4867]; // Hyderabad fallback

      map = L.default.map(mapRef.current, { center, zoom: 12, zoomControl: true }); // slightly zoomed out to see all hospitals
      mapObj.current = map;

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OSM ©CartoDB', subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);

      if (hospitals) {
        Object.values(hospitals).forEach(h => {
          if (!h.location) return;
          const isTarget = h.location.lat === hospitalLocation?.lat && h.location.lng === hospitalLocation?.lng;
          const color = isTarget ? '#6C8EF5' : '#4B5563'; // Blue for target, gray for others
          L.default.marker([h.location.lat, h.location.lng], { icon: makeIcon(hospitalSVG, color) })
            .bindPopup(`<b>${h.name}</b><br>${isTarget ? 'Emergency receiving target' : 'Other facility'}`).addTo(map);

          if (isTarget) {
            L.default.circle([h.location.lat, h.location.lng], {
              radius: 1000, color: '#6C8EF5', fillColor: '#6C8EF5', fillOpacity: 0.05, weight: 1, dashArray: '4 4',
            }).addTo(map).bindTooltip('1 km alert zone');
          }
        });
      } else if (hospitalLocation) {
        L.default.marker([hospitalLocation.lat, hospitalLocation.lng], { icon: makeIcon(hospitalSVG, '#6C8EF5') })
          .bindPopup('<b>Hospital</b><br>Emergency receiving').addTo(map);

        L.default.circle([hospitalLocation.lat, hospitalLocation.lng], {
          radius: 1000, color: '#6C8EF5', fillColor: '#6C8EF5', fillOpacity: 0.05, weight: 1, dashArray: '4 4',
        }).addTo(map).bindTooltip('1 km alert zone');
      }

      // M12 fix: only add ambulance marker if location is available
      if (ambulanceLocation?.lat && ambulanceLocation?.lng) {
        ambMarker.current = L.default.marker([ambulanceLocation.lat, ambulanceLocation.lng], { icon: makeIcon(ambSVG, '#E31937') })
          .bindPopup('<b>Ambulance En Route</b>').addTo(map);

        if (hospitalLocation) {
          routeLine.current = L.default.polyline(
            [[ambulanceLocation.lat, ambulanceLocation.lng], [hospitalLocation.lat, hospitalLocation.lng]],
            { color: '#F87171', weight: 2, dashArray: '6 5', opacity: 0.7 }
          ).addTo(map);
        }
      }
    });

    // C7 fix: cleanup uses local `map` — always removes THIS instance, not a stale ref
    return () => {
      if (map) { map.remove(); }
      mapObj.current  = null;
      ambMarker.current = null;
      routeLine.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once per mount

  // Update ambulance position live
  useEffect(() => {
    if (!mapObj.current || !ambulanceLocation?.lat) return;

    if (!ambMarker.current) {
      // Marker didn't exist on init (GPS was null then) — create it now
      import('leaflet').then((L) => {
        if (!mapObj.current) return;
        const makeIcon = (svg, color) => L.default.divIcon({
          html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.15);box-shadow:0 0 14px ${color}88">${svg}</div>`,
          className: '', iconSize: [32, 32], iconAnchor: [16, 16],
        });
        const ambSVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="5" width="14" height="8" rx="2"/><path d="M4 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M8 8v4M6 10h4"/></svg>`;
        ambMarker.current = L.default.marker([ambulanceLocation.lat, ambulanceLocation.lng], { icon: makeIcon(ambSVG, '#E31937') })
          .bindPopup('<b>Ambulance En Route</b>').addTo(mapObj.current);
        if (hospitalLocation && !routeLine.current) {
          routeLine.current = L.default.polyline(
            [[ambulanceLocation.lat, ambulanceLocation.lng], [hospitalLocation.lat, hospitalLocation.lng]],
            { color: '#F87171', weight: 2, dashArray: '6 5', opacity: 0.7 }
          ).addTo(mapObj.current);
        }
      });
      return;
    }

    ambMarker.current.setLatLng([ambulanceLocation.lat, ambulanceLocation.lng]);
    routeLine.current?.setLatLngs([
      [ambulanceLocation.lat, ambulanceLocation.lng],
      [hospitalLocation.lat, hospitalLocation.lng],
    ]);
  }, [ambulanceLocation, hospitalLocation]);

  return (
    <div className="map-wrap" style={{ overflow: 'hidden' }}>
      <div className="map-topbar">
        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Live Map</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Distance', value: `${distanceKm.toFixed(2)} km`, alert: isAlertMode },
            { label: 'ETA',      value: eta < 1 ? '< 1 min' : `${Math.round(eta)} min`, alert: isAlertMode },
          ].map(({ label, value, alert }) => (
            <div key={label} className="map-metric">
              <div className="map-metric-label">{label}</div>
              <div className="map-metric-value" style={{ color: alert ? 'var(--red)' : 'var(--accent)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Leaflet CSS loaded via link tag in layout.js */}
      <div ref={mapRef} style={{ height: 380, width: '100%' }} id="leaflet-map" />
    </div>
  );
}
