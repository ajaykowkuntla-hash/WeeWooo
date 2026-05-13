'use client';
// src/components/notifications/NotificationPanel.jsx

import { formatDistanceToNow } from 'date-fns';

const TYPE_COLOR = {
  alert:   'var(--red)',
  info:    'var(--blue)',
  success: 'var(--green)',
  warning: 'var(--amber)',
};

// M3 fix: SVG icons replacing cross-platform-inconsistent emoji
const TYPE_ICON = {
  alert: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11.5v.5"/>
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/><path d="M8 11V8M8 5.5v.5"/>
    </svg>
  ),
  success: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4"/>
    </svg>
  ),
  warning: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 11.5v.5"/>
    </svg>
  ),
};

export default function NotificationPanel({ open, notifications, onClose, onMarkRead, onClearAll }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <aside className={`notif-panel ${open ? 'open' : ''}`} aria-label="Notification panel">
      <div className="notif-header">
        <div>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
            <path d="M8 1a5 5 0 0 1 5 5c0 5-2 7-2 7H3s-2-2-2-7a5 5 0 0 1 5-5z"/>
            <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
          </svg>
          Notifications
        </div>
          {unread > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: 2 }}>{unread} unread</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifications.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onClearAll}>Clear all</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-sub)', padding: '48px 0' }}>
          <div style={{ marginBottom: 12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0M3.5 3.5l17 17"/>
            </svg>
          </div>
          <div>No notifications</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? 'unread' : ''} ${n.type === 'alert' ? 'alert-type' : ''}`}
              onClick={() => onMarkRead(n.id)}
            >
              <div className="notif-type" style={{ color: TYPE_COLOR[n.type] ?? 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {TYPE_ICON[n.type]} {n.type?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', margin: '4px 0 2px' }}>{n.title}</div>
              <div className="notif-msg">{n.message}</div>
              <div className="notif-time">
                {/* L3 fix: guard invalid Date from null/undefined timestamp */}
                {n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : 'just now'}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
