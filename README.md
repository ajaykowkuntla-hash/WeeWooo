# 🏥 Smart Emergency Hospital Dashboard

A full-stack, real-time hospital emergency management system built with **Next.js 14** and **Firebase Realtime Database**.

---

## 🚀 Quick Start

```bash
cd smart-emergency-dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### Demo Login Credentials
| Hospital | Email | Password |
|---|---|---|
| City General Hospital | `admin@cityhospital.com` | `admin123` |
| Apollo Emergency Centre | `admin@apollo.com` | `apollo123` |

---

## ⚙️ Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Realtime Database** and **Authentication (Email/Password)**
3. Copy `.env.example` → `.env.local` and fill in your credentials
4. Set up Realtime Database rules:

```json
{
  "rules": {
    "hospitals": {
      "$hospitalId": {
        ".read": "auth != null && auth.token.hospitalId === $hospitalId",
        ".write": "auth != null && auth.token.hospitalId === $hospitalId"
      }
    },
    "ambulance": { ".read": "auth != null", ".write": "auth != null" },
    "Traffic":   { ".read": "auth != null", ".write": "auth != null" }
  }
}
```

5. Seed initial data structure:

```json
{
  "hospitals": {
    "hospital-001": {
      "name": "City General Hospital",
      "location": { "lat": 17.385, "lng": 78.4867 },
      "address": "12 MG Road, Hyderabad",
      "resources": {
        "availableBeds": 48,
        "icuBeds": 12,
        "ventilators": 8,
        "doctorsAvailable": 22
      }
    }
  },
  "ambulance": {
    "location": {
      "id": "AMB-2024-01",
      "vehicleNumber": "TS-09-AB-1234",
      "driver": "Ravi Kumar",
      "phone": "+91-9876543210",
      "status": "en_route",
      "speed": 60,
      "location": { "lat": 17.391, "lng": 78.495 },
      "lastUpdated": 0
    }
  },
  "Traffic": {
    "activeSignals": [
      { "id": "SIG-01", "intersection": "MG Road & Tank Bund", "status": "green", "clearanceTime": 45 }
    ],
    "activeLane": "Emergency Corridor Alpha",
    "estimatedClearance": "2 min 30 sec"
  }
}
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.js          # Root layout + metadata
│   └── page.js            # Entry point (auth routing)
├── components/
│   ├── auth/
│   │   └── LoginPage.jsx  # Login form + demo accounts
│   ├── dashboard/
│   │   ├── DashboardShell.jsx   # Main shell (state, routing, alerts)
│   │   ├── Sidebar.jsx          # Left navigation
│   │   ├── Topbar.jsx           # Header with clock + notifications
│   │   └── pages/
│   │       ├── OverviewPage.jsx # KPIs + map preview
│   │       └── AllPages.jsx     # Map, Resources, Ambulance, Alerts, Traffic, Notifs
│   ├── map/
│   │   └── LiveMap.jsx    # Leaflet dark map + animated markers
│   ├── resources/
│   │   └── ResourceManager.jsx  # Editable bed/ICU/ventilator fields
│   ├── alerts/
│   │   └── AmbulanceAlertModal.jsx  # Alert popup
│   ├── traffic/
│   │   └── TrafficControl.jsx       # Signal status view
│   └── notifications/
│       └── NotificationPanel.jsx    # Slide-in panel
├── hooks/
│   ├── useAuth.js          # Auth with Firebase + demo fallback
│   └── useFirebaseData.js  # RTDB listeners + write hooks
├── lib/
│   ├── firebase.js         # Firebase singleton
│   └── mockData.js         # Demo data + utils (haversine, ETA)
└── styles/
    └── globals.css         # Design system (tokens, components)
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Hospital-scoped login; Admin role; demo mode |
| 🗺️ Live Map | Leaflet + dark CartoDB tiles; animated ambulance marker; 1km alert zone |
| 🛏️ Resources | Editable beds, ICU, ventilators, doctors — Firebase write |
| 🚑 Tracking | Real-time ambulance position; haversine distance; ETA |
| 🚨 Alerts | Auto popup + red alert mode when ambulance < 1km |
| 🚦 Traffic | Signal status, emergency corridor, clearance times |
| 🔔 Notifications | Slide-in panel, unread badge, alert sound |
| 📱 Responsive | Mobile sidebar, adaptive grids |
| 🌑 Dark Mode | Full dark theme with blue (#77B6EA) accent |
| ⚡ Real-time | Firebase `onValue` listeners; no polling |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Blue | `#77B6EA` |
| Background | `#0d1117` |
| Card | `rgba(33,38,45,0.85)` |
| Alert Red | `#f85149` |
| Success Green | `#3fb950` |
| Warning Amber | `#d29922` |
| Font | Inter (Google Fonts) |

---

## 🔄 Firebase Database Paths

| Path | Purpose |
|---|---|
| `/hospitals/{hospitalId}` | Hospital info + resources |
| `/hospitals/{hospitalId}/resources` | Editable capacity fields |
| `/ambulance/location` | Live ambulance telemetry |
| `/Traffic` | Signal status + active lane |
