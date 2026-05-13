'use client';

/* Inline SVG icons — no emojis */
const Icon = ({ name, size = 15 }) => {
  const icons = {
    overview: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
    map: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8 1C5.8 1 4 2.8 4 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/>
        <circle cx="8" cy="5" r="1.2"/>
      </svg>
    ),
    resources: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M2 13V8M6 13V5M10 13V7M14 13V3"/>
      </svg>
    ),
    ambulance: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8 3v10M3 8h10"/>
      </svg>
    ),
    alerts: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11.5v.5"/>
      </svg>
    ),
    traffic: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <rect x="5" y="1" width="6" height="14" rx="2"/>
        <circle cx="8" cy="4.5" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="11.5" r="1"/>
      </svg>
    ),
    notifications: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8 1a5 5 0 0 1 5 5c0 5-2 7-2 7H3s-2-2-2-7a5 5 0 0 1 5-5z"/>
        <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
      </svg>
    ),
    cross: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M7 1v12M1 7h12"/>
      </svg>
    ),
  };
  return icons[name] ?? null;
};

const NAV = [
  { id: 'overview',      icon: 'overview',      label: 'Overview',      section: 'MAIN' },
  { id: 'map',           icon: 'map',            label: 'Live Map',      section: 'MAIN' },
  { id: 'resources',     icon: 'resources',      label: 'Resources',     section: 'MAIN' },
  { id: 'ambulance',     icon: 'ambulance',      label: 'Ambulance',     section: 'TRACKING' },
  { id: 'alerts',        icon: 'alerts',         label: 'Alert Center',  section: 'TRACKING' },
  { id: 'traffic',       icon: 'traffic',        label: 'Traffic',       section: 'TRACKING' },
  { id: 'notifications', icon: 'notifications',  label: 'Notifications', section: 'SYSTEM' },
];

export default function Sidebar({ activePage, onNavigate, user, onLogout, unreadCount, mobileOpen, onClose }) {
  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icon name="cross" />
        </div>
        <div>
          <div className="sidebar-logo-text">SmartER</div>
          <div className="sidebar-logo-sub">Emergency System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {NAV.filter(n => n.section === section).map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { onNavigate(item.id); onClose?.(); }}
              >
                <span style={{ color: activePage === item.id ? 'var(--accent)' : 'var(--muted)', transition: 'color 0.18s', flexShrink: 0 }}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="hospital-chip">
          <div className="hospital-chip-name">{user?.hospitalName ?? 'Hospital'}</div>
          <div className="hospital-chip-role">{user?.role?.toUpperCase()} · {user?.email}</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
