'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseListener, useFirebaseConnected } from '../../hooks/useFirebaseData'; // L1 fix: merged double import
import { useAmbulanceLocation,
         useAllAmbulances }           from '../../hooks/useAmbulanceLocation';
import { seedFirebaseIfEmpty }        from '../../hooks/useFirebaseData';
import { processEmergencyLogic,
         getNearbyJunctions }         from '../../services/decisionEngine';
import { resetAllJunctions }          from '../../services/firebaseService';
import { calculateETA }               from '../../services/decisionEngine';
import {
  HOSPITAL_DATA, AMBULANCE_DATA, TRAFFIC_DATA, NOTIFICATIONS_MOCK,
  getDistanceKm,
} from '../../lib/mockData';

import Sidebar            from './Sidebar';
import Topbar             from './Topbar';
import OverviewPage       from './pages/OverviewPage';
import { MapPage, ResourcesPage, AmbulancePage,
         AlertsPage, TrafficPage, NotifPage }  from './pages/AllPages';
import NotificationPanel  from '../notifications/NotificationPanel';
import AmbulanceAlertModal from '../alerts/AmbulanceAlertModal';

const PAGE_TITLES = {
  overview: 'Overview', map: 'Live Map', resources: 'Resource Management',
  ambulance: 'Ambulance Tracker', alerts: 'Alert Center',
  traffic: 'Traffic Control', notifications: 'Notifications',
};

// ── Constants ────────────────────────────────────────────────────────────────
const ALERT_KM         = 1.0;
const ENGINE_INTERVAL  = 8000; // run decision engine every 8s
const ALERT_COOLDOWN   = 30000; // don't re-alert within 30s

export default function DashboardShell({ user, onLogout }) {
  const firebaseConnected = useFirebaseConnected();

  const [activePage,     setActivePage]     = useState('overview');
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [alertModal,     setAlertModal]     = useState(false);
  const [alertAcked,     setAlertAcked]     = useState(false);
  const [notifications,  setNotifications]  = useState(NOTIFICATIONS_MOCK);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [activeJunctions,  setActiveJunctions]  = useState([]);
  const [etaData,        setEtaData]        = useState(null);
  const [activeAmbId,    setActiveAmbId]    = useState('default');

  const audioRef      = useRef(null);
  const lastAlertRef  = useRef(0);
  const engineRunning = useRef(false);

  // ── Firebase listeners ────────────────────────────────────────────────────
  const fallbackHospital = HOSPITAL_DATA[user.hospitalId] ?? HOSPITAL_DATA['hospital-001'];
  const { data: hospitalData, loading: hosLoading } = useFirebaseListener(
    `/hospitals/${user.hospitalId}`, fallbackHospital
  );
  const { data: trafficData, loading: trafficLoading } = useFirebaseListener(
    '/Traffic', TRAFFIC_DATA
  );

  // ── Real GPS hook ─────────────────────────────────────────────────────────
  const {
    location: ambLocation,
    ambulance: ambData,
    signalLost,
    lastUpdated: ambLastUpdated,
    isLoading: ambLoading,
  } = useAmbulanceLocation(activeAmbId);

  // ── Multi-ambulance ───────────────────────────────────────────────────────
  const { ambulances: allAmbulances } = useAllAmbulances();

  // ── Derived ───────────────────────────────────────────────────────────────
  const hospital    = hospitalData ?? fallbackHospital;
  const hospLoc     = hospital?.location ?? { lat: 17.385, lng: 78.4867 };
  const ambulance   = { ...(ambData ?? AMBULANCE_DATA), location: ambLocation };
  // Base straight-line distance
  const straightLineKm  = ambLocation
    ? getDistanceKm(ambLocation.lat, ambLocation.lng, hospLoc.lat, hospLoc.lng)
    : 999;
    
  // Prioritize real road distance from OSRM, fallback to straight line
  const distanceKm = etaData?.distance ? (etaData.distance / 1000) : straightLineKm;

  // Calculate ETA using API duration if available
  const ambSpeed    = ambulance?.speed ?? 60; // km/h
  const etaMinutes  = etaData?.duration ? etaData.duration / 60 : (distanceKm / ambSpeed) * 60;
  const isAlertMode = straightLineKm < ALERT_KM && !signalLost; // Alerts trigger on physical proximity

  // ── Seed Firebase on first load ───────────────────────────────────────────
  useEffect(() => {
    // M8 fix: only seed if the hospital's own data exists in HOSPITAL_DATA
    // Prevents Apollo users getting City General data seeded under their ID
    const ownData = HOSPITAL_DATA[user.hospitalId];
    if (ownData) {
      seedFirebaseIfEmpty(user.hospitalId, ownData, AMBULANCE_DATA, TRAFFIC_DATA);
    }
  }, [user.hospitalId]);

  // ── Alert trigger (once per cooldown) ────────────────────────────────────
  const triggerAlert = useCallback(({ distM, durSec }) => {
    const now = Date.now();
    if (now - lastAlertRef.current < ALERT_COOLDOWN) return;
    lastAlertRef.current = now;

    if (!alertAcked) setAlertModal(true);

    const id = `alert-${now}`;
    setNotifications((prev) => [
      {
        id, type: 'alert',
        title: 'Ambulance Approaching',
        message: `${(distM / 1000).toFixed(2)} km · ETA ${Math.round(durSec / 60)} min`,
        timestamp: now, read: false,
      },
      ...prev,
    ]);

    // Bug 7 fixed: use Web Audio API beep instead of unreliable third-party URL
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }, [alertAcked]);

  // ── Reset alert ack when ambulance moves away ─────────────────────────────
  useEffect(() => {
    if (!isAlertMode) setAlertAcked(false);
  }, [isAlertMode]);

  // ── Decision engine loop ──────────────────────────────────────────────────
  // Bug 17 fix: separate interval from reactive deps.
  // Store latest values in refs so the interval reads current data
  // without needing to be re-registered on every location update.
  const ambLocationRef  = useRef(ambLocation);
  const trafficDataRef  = useRef(trafficData);
  const ambulanceRef    = useRef(ambulance);
  const activeAmbIdRef  = useRef(activeAmbId);
  useEffect(() => { ambLocationRef.current  = ambLocation;  }, [ambLocation]);
  useEffect(() => { trafficDataRef.current  = trafficData;  }, [trafficData]);
  useEffect(() => { ambulanceRef.current    = ambulance;    }, [ambulance]);
  useEffect(() => { activeAmbIdRef.current  = activeAmbId;  }, [activeAmbId]);

  useEffect(() => {
    const run = async () => {
      if (engineRunning.current) return;
      engineRunning.current = true;

      // Read from refs — always current, never stale
      const loc     = ambLocationRef.current;
      const td      = trafficDataRef.current;
      const amb     = ambulanceRef.current;
      const ambId   = activeAmbIdRef.current;

      try {
        // Bug 2 fixed: Firebase returns junctions as object (key-value map), convert to array
        const rawJunctions = td?.junctions ?? {};
        const junctions = Array.isArray(rawJunctions)
          ? rawJunctions
          : Object.values(rawJunctions);

        // C4 fix: skip ETA calculation when GPS not yet received
        if (loc) {
          const eta = await calculateETA(loc, hospLoc);
          setEtaData(eta);
        }

        // Detect nearby junctions
        const nearby = getNearbyJunctions(loc, junctions);
        setActiveJunctions(nearby);

        // Full decision pass
        await processEmergencyLogic({
          ambulance: amb,
          hospitals: HOSPITAL_DATA,
          junctions,
          hospitalLocation: hospLoc,
          ambulanceId: activeAmbIdRef.current, // M1 fix: read from ref, not stale closure
          onAlert: triggerAlert,
          onBestHospital: (result) => {
            setSelectedHospital(result);
            console.log('[Shell] Best hospital set:', result.hospital.name);
          },
        });
      } catch (err) {
        console.error('[Shell] Decision engine error:', err.message);
      } finally {
        engineRunning.current = false;
      }
    };

    const interval = setInterval(run, ENGINE_INTERVAL);
    run(); // run once immediately on mount
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bug 17: empty deps — interval mounts once; live data read via refs above

  // ── Failsafe: no active ambulance → reset junctions ──────────────────────
  useEffect(() => {
    if (signalLost && trafficData?.mode === 'AMBULANCE') {
      console.warn('[Shell] Signal lost — resetting junctions');
      resetAllJunctions().catch(() => {});
      setNotifications((prev) => [{
        id: `sig-${Date.now()}`, type: 'warning',
        title: 'GPS Signal Lost',
        message: 'Ambulance GPS has not updated for 5+ seconds.',
        timestamp: Date.now(), read: false,
      }, ...prev]);
    }
  }, [signalLost, trafficData?.mode]);

  // ── Notification helpers ──────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead    = useCallback((id) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const clearAll    = useCallback(() => setNotifications([]), []);

  // ── Alert state object (for DebugPanel) ──────────────────────────────────
  const alertState = {
    active: isAlertMode,
    distM:  distanceKm * 1000,
    durSec: etaMinutes * 60,
    acked:  alertAcked,
  };

  // ── Page props ────────────────────────────────────────────────────────────
  const pageProps = {
    user, hospital, hospitalId: user.hospitalId, hospitals: HOSPITAL_DATA,
    ambulance: { ...ambulance, location: ambLocation },
    allAmbulances, activeAmbId, onSelectAmb: setActiveAmbId,
    distanceKm, etaMinutes, etaData,
    isAlertMode, signalLost,
    trafficData: trafficData ?? TRAFFIC_DATA,
    selectedHospital, activeJunctions,
    notifications, markRead, clearAll,
    hosLoading, ambLoading, trafficLoading,
    onNavigate: setActivePage,
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':      return <OverviewPage  {...pageProps} />;
      case 'map':           return <MapPage        {...pageProps} />;
      case 'resources':     return <ResourcesPage  {...pageProps} />;
      case 'ambulance':     return <AmbulancePage  {...pageProps} />;
      case 'alerts':        return <AlertsPage     {...pageProps} />;
      case 'traffic':       return <TrafficPage    {...pageProps} />;
      case 'notifications': return <NotifPage      {...pageProps} />;
      default:              return <OverviewPage   {...pageProps} />;
    }
  };

  return (
    <div className={`app-shell ${isAlertMode ? 'alert-mode' : ''}`}>
      <Sidebar
        activePage={activePage} onNavigate={setActivePage}
        user={user} onLogout={onLogout}
        unreadCount={unreadCount}
        mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Topbar
          title={PAGE_TITLES[activePage]}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
          onNotifToggle={() => setNotifOpen((p) => !p)}
          unreadCount={unreadCount}
          isAlertMode={isAlertMode}
          signalLost={signalLost}
          user={user}
        />

        {isAlertMode && (
          <div className="alert-banner">
            <span style={{ marginRight: 8, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1s ease infinite' }} />
            AMBULANCE ALERT — {distanceKm.toFixed(2)} km · ETA {Math.round(etaMinutes)} min · PREPARE RECEIVING TEAM
          </div>
        )}

        {signalLost && !isAlertMode && (
          <div style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.25)', color: 'var(--amber)', textAlign: 'center', padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
            GPS Signal Lost — Last known position displayed
          </div>
        )}

        <main className="page-content">{renderPage()}</main>
      </div>

      <NotificationPanel
        open={notifOpen} notifications={notifications}
        onClose={() => setNotifOpen(false)}
        onMarkRead={markRead} onClearAll={clearAll}
      />

      {alertModal && (
        <AmbulanceAlertModal
          distanceKm={distanceKm}
          etaMinutes={etaMinutes}
          ambulanceId={ambulance?.id ?? 'AMB-2024-01'}
          onClose={() => setAlertModal(false)}
          onAcknowledge={() => { setAlertModal(false); setAlertAcked(true); }}
        />
      )}

    </div>
  );
}
