// src/utils/trendData.js — Generates realistic mock trend data for charts

/**
 * Generate N-point time-series with smooth random walk
 */
// M9/M10 fix: seeded PRNG (Park-Miller) — same input data = same chart shape = no jumping
function seededRand(seed) {
  let s = (Math.abs(Math.round(seed)) || 1) & 0x7fffffff;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function walk(start, min, max, points, rand) {
  const r = rand ?? (() => Math.random());
  let v = start;
  return Array.from({ length: points }, () => {
    v = Math.max(min, Math.min(max, v + (r() - 0.48) * (max - min) * 0.08));
    return Math.round(v);
  });
}

function timeLabels(points, intervalMin = 10) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(now - (points - 1 - i) * intervalMin * 60000);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
}

// ── Resource trend (beds, ICU, ventilators over time) ─────────────────────────
export function generateResourceTrend(resources, points = 12) {
  // Seed from resource values so same data = same chart (no jumping on re-render)
  const seed = (resources?.availableBeds ?? 48) * 1000 +
               (resources?.icuBeds ?? 12) * 100 +
               (resources?.ventilators ?? 8) * 10 +
               (resources?.doctorsAvailable ?? 22);
  const rand   = seededRand(seed);
  const labels = timeLabels(points);
  const beds   = walk(resources?.availableBeds  ?? 48, 10, 80, points, rand);
  const icu    = walk(resources?.icuBeds         ?? 12, 2,  20, points, rand);
  const vents  = walk(resources?.ventilators      ?? 8,  1,  15, points, rand);
  const docs   = walk(resources?.doctorsAvailable ?? 22, 5,  35, points, rand);
  return labels.map((time, i) => ({ time, Beds: beds[i], ICU: icu[i], Ventilators: vents[i], Doctors: docs[i] }));
}

// ── Speed trend (ambulance speed over time) ───────────────────────────────────
export function generateSpeedTrend(baseSpeed = 60, points = 16) {
  const rand  = seededRand(baseSpeed * 100); // M10 fix: seeded
  const labels = timeLabels(points, 1);
  const speed  = walk(baseSpeed, 0, 90, points, rand);
  return labels.map((time, i) => ({ time, Speed: speed[i] }));
}

// ── Distance trend (ambulance → hospital) ────────────────────────────────────
export function generateDistanceTrend(currentKm, points = 20) {
  const labels = timeLabels(points, 0.5);
  // Mostly decreasing trend with small noise
  const vals = Array.from({ length: points }, (_, i) => {
    const base = currentKm + (points - i) * 0.035;
    return Math.max(0, parseFloat((base + (Math.random() - 0.5) * 0.05).toFixed(3)));
  });
  return labels.map((time, i) => ({ time, Distance: vals[i] }));
}

// ── Alert timeline ────────────────────────────────────────────────────────────
export function generateAlertTimeline(notifications, points = 12) {
  const labels = timeLabels(points, 30);
  const counts = Array(points).fill(0);
  notifications.forEach((n) => {
    const ago = (Date.now() - n.timestamp) / 60000 / 30;
    const idx = points - 1 - Math.min(points - 1, Math.floor(ago));
    if (idx >= 0) counts[idx]++;
  });
  return labels.map((time, i) => ({ time, Alerts: counts[i] }));
}

// ── Alert category donut ──────────────────────────────────────────────────────
export function generateAlertCategories(notifications) {
  const cats = { Critical: 0, Warning: 0, Info: 0 };
  notifications.forEach((n) => {
    if (n.type === 'alert')   cats.Critical++;
    else if (n.type === 'warning') cats.Warning++;
    else cats.Info++;
  });
  return Object.entries(cats).map(([name, value]) => ({ name, value: value || 1 }));
}

// ── Junction status pie ───────────────────────────────────────────────────────
export function generateJunctionPie(junctions = []) {
  // Bug 11/16 fix: Firebase returns junctions as object {0:{...},1:{...}}, normalize to array
  const arr = Array.isArray(junctions) ? junctions : Object.values(junctions);
  const map = { CLEARED: 0, CLEARING: 0, PENDING: 0, NORMAL: 0 };
  arr.forEach((j) => { if (map[j?.status] !== undefined) map[j.status]++; });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

// ── Traffic density bar ───────────────────────────────────────────────────────
export function generateDensityBar(junctions = []) {
  // Bug 11/16 fix: normalize Firebase object to array
  const arr = Array.isArray(junctions) ? junctions : Object.values(junctions);
  const DENSITY_VAL = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return arr.filter(Boolean).map((j) => ({
    name: j.id,
    label: (j.name ?? '').split(' ')[0],
    Density: DENSITY_VAL[j.density] ?? 1,
    density: j.density,
  }));
}
