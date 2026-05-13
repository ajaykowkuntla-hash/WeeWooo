'use client';
// pages: MapPage, ResourcesPage, AmbulancePage, AlertsPage, TrafficPage, NotifPage
import { useMemo } from 'react';
import LiveMap from '../../map/LiveMap';
import ResourceManager from '../../resources/ResourceManager';
import TrafficDashboard from '../../traffic/TrafficDashboard';
import { LineChartComponent, AreaChartComponent, BarChartComponent, PieChartComponent } from '../../charts';
import ETAStatusCard from '../../ETAStatusCard';
import { formatDistanceToNow } from 'date-fns';
import {
  generateSpeedTrend, generateDistanceTrend,
  generateAlertTimeline, generateAlertCategories,
  generateJunctionPie, generateDensityBar,
} from '../../../utils/trendData';

function SectionHeader({ title, sub }) {
  return (
    <div className="section-header">
      <div className="section-header-line" />
      <span className="section-header-title">{title}</span>
      {sub && <span className="section-header-sub">{sub}</span>}
    </div>
  );
}


/* ──────────────── MAP PAGE ──────────────── */
export function MapPage({ hospital, ambulance, distanceKm, etaMinutes, isAlertMode, hospitals }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <h1>Live Ambulance Map</h1>
        <p>Real-time location tracking with Leaflet + OpenStreetMap</p>
      </div>
      <LiveMap
        hospitalLocation={hospital?.location ?? { lat: 17.385, lng: 78.4867 }}
        ambulanceLocation={ambulance?.location ?? { lat: 17.391, lng: 78.495 }}
        distanceKm={distanceKm}
        eta={etaMinutes}
        isAlertMode={isAlertMode}
        hospitals={hospitals}
      />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-icon red" style={{fontSize:'0.6rem',fontWeight:800}}>AM</div><div className="card-title">Ambulance Position</div></div>
          {[
            { label: 'Speed',     value: `${ambulance?.speed ?? 60} km/h`     },
            { label: 'Last Seen', value: ambulance?.lastUpdated ? formatDistanceToNow(new Date(ambulance.lastUpdated), { addSuffix: true }) : 'Now' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value ?? '—'}</span>
            </div>
          ))}
        </div>
        <ETAStatusCard etaData={null} distanceKm={distanceKm} isAlertMode={isAlertMode} />
      </div>
    </div>
  );
}

/* ──────────────── RESOURCES PAGE ──────────────── */
export function ResourcesPage({ hospital, hospitalId, hosLoading }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="page-header">
        <h1>Resource Management</h1>
        <p>Edit and update hospital capacity — changes sync live to the ambulance driver app</p>
      </div>
      <ResourceManager hospitalId={hospitalId} resources={hospital?.resources} loading={hosLoading} />
    </div>
  );
}

/* ──────────────── AMBULANCE PAGE ──────────────── */
export function AmbulancePage({ ambulance, distanceKm, etaMinutes, isAlertMode, ambLoading }) {
  const statusColors = { en_route:'badge-amber', idle:'badge-green', arrived:'badge-blue', returning:'badge-green' };
  const speedData = useMemo(() => generateSpeedTrend(ambulance?.speed ?? 60), [ambulance?.speed]);
  const distData  = useMemo(() => generateDistanceTrend(distanceKm), [distanceKm]);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="page-header">
        <h1>Ambulance Tracker</h1>
        <p>Live tracking of ambulance telemetry.</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon red" style={{fontSize:'0.6rem',fontWeight:800}}>AM</div>
            <div><div className="card-title">Vehicle Details</div></div>
            <span className={`badge ${statusColors[ambulance?.status] ?? 'badge-blue'} `} style={{marginLeft:'auto'}}>
              <span className="dot"/>{ambulance?.status?.replace('_',' ')?.toUpperCase() ?? 'UNKNOWN'}
            </span>
          </div>
          {[
            {label:'Unit ID',      value: ambulance?.id},
            {label:'Vehicle No.',  value: ambulance?.vehicleNumber},
            {label:'Driver',       value: ambulance?.driver},
            {label:'Phone',        value: ambulance?.phone},
            {label:'Speed',        value: `${ambulance?.speed ?? 60} km/h`},
          ].map(({label,value})=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:'0.82rem',color:'var(--muted)'}}>{label}</span>
              <span style={{fontWeight:600,fontSize:'0.85rem'}}>{value ?? '—'}</span>
            </div>
          ))}
        </div>
        <ETAStatusCard etaData={{ etaMinutes, distanceKm: distanceKm }} distanceKm={distanceKm} isAlertMode={isAlertMode} />
      </div>

      {/* Trends */}
      <SectionHeader title="Trends" sub="Speed and distance analytics" />
      <div className="grid-2">
        <LineChartComponent
          title="Ambulance Speed Over Time"
          subtitle="km/h · last 16 minutes"
          data={speedData}
          loading={ambLoading}
          lines={[{ key: 'Speed', color: '#F87171' }]}
          height={220}
        />
        <AreaChartComponent
          title="Distance to Hospital (Live)"
          subtitle="km · approaching trend"
          data={distData}
          loading={ambLoading}
          areas={[{ key: 'Distance', color: '#6C8EF5' }]}
          height={220}
        />
      </div>
    </div>
  );
}

/* ──────────────── ALERTS PAGE ──────────────── */
export function AlertsPage({ isAlertMode, distanceKm, etaMinutes, notifications }) {
  const alertNotifs = notifications.filter((n) => n.type === 'alert');
  // Bug 14 fix: use full array as dep — .length misses mutations (read-state changes)
  const timelineData = useMemo(() => generateAlertTimeline(notifications), [notifications]);
  const donutData    = useMemo(() => generateAlertCategories(notifications), [notifications]);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="page-header">
        <h1>Alert Center</h1>
        <p>Ambulance proximity alerts and emergency notifications</p>
      </div>
      <div className="card" style={{ border: isAlertMode ? '1px solid rgba(248,113,113,0.4)' : '1px solid var(--border)' }}>
        <div className="card-header">
          <div className={`card-icon ${isAlertMode?'red':'green'}`} style={{fontSize:'0.6rem',fontWeight:800}}>{isAlertMode?'AL':'OK'}</div>
          <div><div className="card-title">Current Status</div></div>
        </div>
        <div style={{textAlign:'center',padding:'24px 0'}}>
          <div style={{width:48,height:48,borderRadius:'50%',margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',background:isAlertMode?'rgba(227,25,55,0.1)':'rgba(0,200,150,0.1)',border:`1px solid ${isAlertMode?'rgba(227,25,55,0.3)':'rgba(0,200,150,0.3)'}`}}>
            <div style={{width:16,height:16,borderRadius:'50%',background:isAlertMode?'var(--red)':'var(--green)'}}/>
          </div>
          <div style={{fontSize:'1.5rem',fontWeight:800,color:isAlertMode?'var(--red)':'var(--green)',marginBottom:8}}>
            {isAlertMode ? 'ALERT MODE ACTIVE' : 'System Normal'}
          </div>
          <div style={{color:'var(--muted)',fontSize:'0.9rem'}}>
            Ambulance is <strong style={{color:'var(--text)'}}>{distanceKm.toFixed(2)} km</strong> away — ETA <strong style={{color:'var(--text)'}}>{etaMinutes<1?'<1':Math.round(etaMinutes)} min</strong>
          </div>
          <div style={{marginTop:12,fontSize:'0.82rem',color:'var(--muted)'}}>
            Alert threshold: <strong>1.0 km</strong>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-icon red" style={{fontSize:'0.6rem',fontWeight:800}}>HX</div><div className="card-title">Alert History ({alertNotifs.length})</div></div>
        {alertNotifs.length === 0 ? (
          <div style={{textAlign:'center',padding:'32px',color:'var(--muted)'}}>No alerts triggered yet</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {alertNotifs.map((n)=>(
              <div key={n.id} style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,padding:'12px 16px'}}>
                <div style={{fontWeight:700,fontSize:'0.875rem',color:'var(--red)',marginBottom:4}}>{n.title}</div>
                <div style={{fontSize:'0.82rem',color:'var(--muted)'}}>{n.message}</div>
                <div style={{fontSize:'0.72rem',color:'var(--muted)',marginTop:6}}>{new Date(n.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis */}
      <SectionHeader title="Analysis" sub="Alert frequency and category breakdown" />
      <div className="grid-2">
        <LineChartComponent
          title="Alert Timeline"
          subtitle="Alerts triggered per 30-minute window"
          data={timelineData}
          lines={[{ key: 'Alerts', color: '#F87171' }]}
          height={220}
        />
        <PieChartComponent
          title="Alert Categories"
          subtitle="Distribution by severity"
          data={donutData}
          donut
          height={220}
        />
      </div>
    </div>
  );
}

/* ──────────────── TRAFFIC PAGE ──────────────── */
export function TrafficPage({ trafficData, trafficLoading, ambulance, hospital, distanceKm, etaMinutes }) {
  return (
    <TrafficDashboard
      trafficData={trafficData}
      loading={trafficLoading}
      ambulance={ambulance}
      hospital={hospital}
      distanceKm={distanceKm}
      etaMinutes={etaMinutes}
    />
  );
}

/* ──────────────── NOTIFICATIONS PAGE ──────────────── */
export function NotifPage({ notifications, markRead, clearAll }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>{unread} unread · {notifications.length} total</p>
      </div>
      <div className="card" style={{padding:0}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1a5 5 0 0 1 5 5c0 5-2 7-2 7H3s-2-2-2-7a5 5 0 0 1 5-5z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>
            All Notifications
          </span>
          {notifications.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all</button>}
        </div>
        <div style={{padding:16,display:'flex',flexDirection:'column',gap:8}}>
          {notifications.length===0 ? (
            <div style={{textAlign:'center',padding:'48px',color:'var(--muted)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{margin:'0 auto 8px',display:'block'}}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0M3.5 3.5l17 17"/>
            </svg>
            No notifications
          </div>
          ) : notifications.map((n)=>(
            <div key={n.id}
              onClick={()=>markRead(n.id)}
              style={{
                background: n.read ? 'var(--bg3)' : 'rgba(108,142,245,0.06)',
                border: `1px solid ${n.read ? 'var(--border)' : n.type==='alert' ? 'rgba(248,113,113,0.3)' : 'rgba(108,142,245,0.25)'}`,
                borderLeft: `3px solid ${n.type==='alert'?'var(--red)':n.type==='success'?'var(--green)':n.type==='warning'?'var(--amber)':'var(--accent)'}`,
                borderRadius:8,padding:'12px 16px',cursor:'pointer',
                transition:'all 0.2s',
              }}
            >
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:'0.875rem',color:'var(--text)',marginBottom:4}}>{n.title}</div>
                  <div style={{fontSize:'0.82rem',color:'var(--muted)'}}>{n.message}</div>
                </div>
                {!n.read && <span className="badge badge-blue" style={{fontSize:'0.68rem',padding:'2px 8px',flexShrink:0}}>NEW</span>}
              </div>
              <div style={{fontSize:'0.72rem',color:'var(--muted)',marginTop:8}}>{new Date(n.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
