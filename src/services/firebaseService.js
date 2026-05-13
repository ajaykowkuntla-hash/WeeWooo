// src/services/firebaseService.js — Centralized, scoped Firebase writes
// ALL Firebase writes in the app go through this file.

let _db = null;
let _rtdb = null;

async function getModules() {
  if (_db && _rtdb) return { db: _db, rtdb: _rtdb };
  const [firebaseMod, rtdbMod] = await Promise.all([
    import('../lib/firebase'),
    import('firebase/database'),
  ]);
  _db   = firebaseMod.db;
  _rtdb = rtdbMod;
  return { db: _db, rtdb: _rtdb };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildRef(db, rtdb, path) {
  return rtdb.ref(db, path);
}

// ── Hospital ─────────────────────────────────────────────────────────────────

/** Update individual resource fields for a hospital */
export async function writeHospitalResources(hospitalId, resources) {
  try {
    const { db, rtdb } = await getModules();
    await rtdb.update(buildRef(db, rtdb, `/hospitals/${hospitalId}/resources`), resources);
    console.log('[FirebaseService] writeHospitalResources OK', hospitalId);
  } catch (err) {
    console.error('[FirebaseService] writeHospitalResources FAILED', err.message);
    throw err;
  }
}

/** Set selected hospital for an ambulance */
export async function writeSelectedHospital(ambulanceId, hospitalId) {
  try {
    const { db, rtdb } = await getModules();
    await rtdb.update(buildRef(db, rtdb, `/ambulances/${ambulanceId}`), {
      assignedHospital: hospitalId,
      assignedAt: Date.now(),
    });
    console.log('[FirebaseService] writeSelectedHospital', ambulanceId, '->', hospitalId);
  } catch (err) {
    console.error('[FirebaseService] writeSelectedHospital FAILED', err.message);
  }
}

// ── Ambulance ─────────────────────────────────────────────────────────────────

/** Write ambulance location (used by ESP32 simulator / GPS) */
export async function writeAmbulanceLocation(ambulanceId, location, extras = {}) {
  try {
    const { db, rtdb } = await getModules();
    const path = ambulanceId === 'default'
      ? '/ambulance/location'
      : `/ambulances/${ambulanceId}/location`;
    await rtdb.set(buildRef(db, rtdb, path), {
      lat: location.lat,
      lng: location.lng,
      speed: extras.speed ?? 60,
      timestamp: Date.now(),
      ...extras,
    });
  } catch (err) {
    console.error('[FirebaseService] writeAmbulanceLocation FAILED', err.message);
  }
}

/** Update ambulance status */
export async function writeAmbulanceStatus(ambulanceId, status) {
  try {
    const { db, rtdb } = await getModules();
    // C3 fix: was '/ambulance/location/status' which corrupted the location node
    // Status lives at /ambulance/status (or /ambulances/{id}/status for named)
    const path = ambulanceId === 'default'
      ? '/ambulance/status'
      : `/ambulances/${ambulanceId}/status`;
    await rtdb.set(buildRef(db, rtdb, path), status);
  } catch (err) {
    console.error('[FirebaseService] writeAmbulanceStatus FAILED', err.message);
  }
}

// ── Traffic ─────────────────────────────────────────────────────────────────

/** Update traffic mode + active lane */
export async function writeTrafficMode(mode, activeLane) {
  try {
    const { db, rtdb } = await getModules();
    // L7 note: '/Traffic' (capital T) — Firebase paths are case-sensitive.
    // ALL writes in this file must use capital T to match the listener in useFirebaseData.
    await rtdb.update(buildRef(db, rtdb, '/Traffic'), {
      mode,
      activeLane: activeLane ?? '',
      lastUpdated: Date.now(),
    });
    console.log('[FirebaseService] writeTrafficMode', mode);
  } catch (err) {
    console.error('[FirebaseService] writeTrafficMode FAILED', err.message);
  }
}

/** Update a specific junction's status */
export async function writeJunctionStatus(junctionId, status) {
  try {
    const { db, rtdb } = await getModules();
    await rtdb.update(buildRef(db, rtdb, `/Traffic/junctions/${junctionId}`), {
      status,
      updatedAt: Date.now(),
    });
    console.log('[FirebaseService] writeJunctionStatus', junctionId, status);
  } catch (err) {
    console.error('[FirebaseService] writeJunctionStatus FAILED', err.message);
  }
}

/** Reset all junctions to NORMAL (failsafe) */
export async function resetAllJunctions() {
  try {
    const { db, rtdb } = await getModules();
    const snap = await rtdb.get(buildRef(db, rtdb, '/Traffic/junctions'));
    if (!snap.exists()) return;
    const updates = {};
    Object.keys(snap.val()).forEach((id) => {
      updates[`/Traffic/junctions/${id}/status`] = 'NORMAL';
    });
    await rtdb.update(buildRef(db, rtdb, '/'), updates);
    await writeTrafficMode('NORMAL', '');
    console.log('[FirebaseService] resetAllJunctions done');
  } catch (err) {
    console.error('[FirebaseService] resetAllJunctions FAILED', err.message);
  }
}

// ── Alerts ─────────────────────────────────────────────────────────────────

/** Push an alert record to Firebase */
export async function writeAlert(alert) {
  try {
    const { db, rtdb } = await getModules();
    const ref = rtdb.push(buildRef(db, rtdb, '/alerts'));
    await rtdb.set(ref, { ...alert, createdAt: Date.now() });
    console.log('[FirebaseService] writeAlert', alert.type);
  } catch (err) {
    console.error('[FirebaseService] writeAlert FAILED', err.message);
  }
}
