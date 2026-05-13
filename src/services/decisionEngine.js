// src/services/decisionEngine.js — Frontend-safe backend decision logic
import { getETA } from '../utils/maps';
import { getDistanceKm } from '../lib/mockData';
import {
  writeTrafficMode,
  writeJunctionStatus,
  writeSelectedHospital,
  writeAlert,
  resetAllJunctions,
} from './firebaseService';

const JUNCTION_CLEAR_RADIUS_M = 500;
const ALERT_DISTANCE_M = 1000;
const ALERT_ETA_SEC = 180;

// ── 1. Calculate ETA between two coordinates ──────────────────────────────────
export async function calculateETA(origin, destination) {
  return await getETA(origin, destination);
}

// ── 2. Select best hospital for ambulance ─────────────────────────────────────
export async function selectBestHospital(ambulanceLocation, hospitals) {
  if (!ambulanceLocation || !hospitals) return null;

  const candidates = Object.values(hospitals).filter(
    (h) => (h?.resources?.availableBeds ?? 0) > 0 && h?.location
  );

  if (candidates.length === 0) {
    console.warn('[DecisionEngine] No hospitals with available beds');
    return null;
  }

  // Compute ETA to each candidate in parallel
  const results = await Promise.all(
    candidates.map(async (h) => {
      const eta = await calculateETA(ambulanceLocation, h.location);
      return { hospital: h, eta };
    })
  );

  // M2 fix: guard undefined eta.duration — NaN from (undefined - undefined) breaks sort order
  results.sort((a, b) => (a.eta?.duration ?? Infinity) - (b.eta?.duration ?? Infinity));
  const best = results[0];
  console.log('[DecisionEngine] Best hospital:', best.hospital.name, '—', best.eta.durationText);
  return { hospital: best.hospital, eta: best.eta };
}

// ── 3. Get junctions within radius of ambulance ───────────────────────────────
export function getNearbyJunctions(ambulanceLocation, junctions = []) {
  if (!ambulanceLocation) return [];
  return junctions.filter((j) => {
    const distM = getDistanceKm(
      ambulanceLocation.lat, ambulanceLocation.lng,
      j.lat, j.lng
    ) * 1000;
    return distM <= JUNCTION_CLEAR_RADIUS_M;
  });
}

// ── 4. Main emergency processing cycle ───────────────────────────────────────
/**
 * Called on every ambulance location update.
 * @param {object} opts
 * @param {object} opts.ambulance        Full ambulance data
 * @param {object} opts.hospitals        Map of hospitalId → hospitalData
 * @param {Array}  opts.junctions        Array of junction objects
 * @param {object} opts.hospitalLocation Target hospital location
 * @param {Function} opts.onAlert        Callback when alert conditions met
 * @param {Function} opts.onBestHospital Callback with selected hospital
 * @param {string}  opts.ambulanceId     ID of ambulance
 */
export async function processEmergencyLogic({
  ambulance,
  hospitals,
  junctions,
  hospitalLocation,
  onAlert,
  onBestHospital,
  ambulanceId = 'default',
}) {
  try {
    const ambLoc = ambulance?.location;
    if (!ambLoc) { console.warn('[DecisionEngine] No ambulance location'); return; }

    // ── A. Select best hospital ────────────────────────────────
    if (hospitals && Object.keys(hospitals).length > 0) {
      const result = await selectBestHospital(ambLoc, hospitals);
      if (result) {
        onBestHospital?.(result);
        await writeSelectedHospital(ambulanceId, result.hospital.id);
      }
    }

    // ── B. Get ETA to target hospital ─────────────────────────
    let eta = null;
    if (hospitalLocation) {
      eta = await calculateETA(ambLoc, hospitalLocation);
      console.log('[DecisionEngine] ETA to hospital:', eta.durationText, eta.distanceText);
    }

    // ── C. Process nearby junctions ───────────────────────────
    const nearby = getNearbyJunctions(ambLoc, junctions);
    if (nearby.length > 0) {
      await writeTrafficMode('AMBULANCE', 'Emergency Corridor Active');
      for (const j of nearby) {
        await writeJunctionStatus(j.id, 'CLEARING');
        console.log('[DecisionEngine] Clearing junction:', j.id, j.name);
      }
    }

    // ── D. Alert conditions ───────────────────────────────────
    const distM   = hospitalLocation
      ? getDistanceKm(ambLoc.lat, ambLoc.lng, hospitalLocation.lat, hospitalLocation.lng) * 1000
      : Infinity;
    const durSec  = eta?.duration ?? Infinity;
    const alertNow = distM < ALERT_DISTANCE_M || durSec < ALERT_ETA_SEC;

    if (alertNow) {
      onAlert?.({ distM, durSec, eta });
      await writeAlert({
        type: 'AMBULANCE_PROXIMITY',
        distanceM: Math.round(distM),
        etaSec: Math.round(durSec),
        ambulanceId,
        location: ambLoc,
      });
    }

    // ── E. Failsafe: no nearby junctions → check reset ───────
    if (nearby.length === 0 && distM > 2000) {
      await resetAllJunctions();
    }
  } catch (err) {
    console.error('[DecisionEngine] processEmergencyLogic FAILED:', err.message);
  }
}
