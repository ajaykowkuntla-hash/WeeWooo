// src/lib/mockData.js

export const HOSPITAL_DATA = {
  'hospital-001': {
    id: 'hospital-001',
    name: 'Apollo Hospitals',
    location: { lat: 17.4239, lng: 78.4738 },
    address: 'Jubilee Hills, Hyderabad',
    phone: '+91-40-23607777',
    resources: { availableBeds: 48, icuBeds: 12, ventilators: 8, doctorsAvailable: 22 },
  },
  'hospital-002': {
    id: 'hospital-002',
    name: 'KIMS Hospital',
    location: { lat: 17.4400, lng: 78.4983 },
    address: 'Secunderabad, Hyderabad',
    phone: '+91-40-44885000',
    resources: { availableBeds: 32, icuBeds: 7, ventilators: 5, doctorsAvailable: 15 },
  },
  'hospital-003': {
    id: 'hospital-003',
    name: 'Yashoda Hospitals',
    location: { lat: 17.4282, lng: 78.4556 },
    address: 'Somajiguda, Hyderabad',
    phone: '+91-40-45674567',
    resources: { availableBeds: 0, icuBeds: 0, ventilators: 2, doctorsAvailable: 8 },
  },
  'hospital-004': {
    id: 'hospital-004',
    name: 'Care Hospitals',
    location: { lat: 17.4156, lng: 78.4504 },
    address: 'Banjara Hills, Hyderabad',
    phone: '+91-40-30418888',
    resources: { availableBeds: 15, icuBeds: 3, ventilators: 2, doctorsAvailable: 12 },
  },
  'hospital-005': {
    id: 'hospital-005',
    name: 'AIG Hospitals',
    location: { lat: 17.4435, lng: 78.3644 },
    address: 'Gachibowli, Hyderabad',
    phone: '+91-40-42444222',
    resources: { availableBeds: 120, icuBeds: 45, ventilators: 30, doctorsAvailable: 50 },
  },
  'hospital-006': {
    id: 'hospital-006',
    name: 'Medicover Hospitals',
    location: { lat: 17.4485, lng: 78.3908 },
    address: 'Madhapur, Hyderabad',
    phone: '+91-40-68334455',
    resources: { availableBeds: 25, icuBeds: 5, ventilators: 4, doctorsAvailable: 18 },
  },
};

export const AMBULANCE_DATA = {
  id: 'AMB-2024-01',
  vehicleNumber: 'TS-09-AB-1234',
  driver: 'Ravi Kumar',
  phone: '+91-9876543210',
  status: 'en_route',
  speed: 60,
  location: { lat: 17.391, lng: 78.495 },
  lastUpdated: Date.now(),
};

export const TRAFFIC_DATA = {
  mode: 'AMBULANCE',          // NORMAL | AMBULANCE | EMERGENCY
  activeLane: 'Corridor Alpha — MG Road → Tank Bund → Nampally',
  lastUpdated: Date.now(),
  density: 'MEDIUM',          // LOW | MEDIUM | HIGH | CRITICAL
  vehicleCount: 143,
  clearedCount: 38,
  junctions: [
    { id: 'J-01', name: 'MG Road & Tank Bund',          status: 'CLEARING', lat: 17.390, lng: 78.492, clearanceTime: 8,  density: 'HIGH',   onRoute: true  },
    { id: 'J-02', name: 'Nampally Station Road',         status: 'GREEN',    lat: 17.388, lng: 78.489, clearanceTime: 0,  density: 'LOW',    onRoute: true  },
    { id: 'J-03', name: 'Lakdi-Ka-Pool Junction',        status: 'PENDING',  lat: 17.386, lng: 78.487, clearanceTime: 22, density: 'MEDIUM', onRoute: true  },
    { id: 'J-04', name: 'Abids Circle',                  status: 'NORMAL',   lat: 17.392, lng: 78.494, clearanceTime: 0,  density: 'LOW',    onRoute: false },
    { id: 'J-05', name: 'Basheerbagh Junction',          status: 'PENDING',  lat: 17.384, lng: 78.485, clearanceTime: 45, density: 'HIGH',   onRoute: true  },
    { id: 'J-06', name: 'Koti Bus Stand',                status: 'NORMAL',   lat: 17.393, lng: 78.497, clearanceTime: 0,  density: 'MEDIUM', onRoute: false },
  ],
  route: [
    { lat: 17.391, lng: 78.495, label: 'Ambulance Start' },
    { lat: 17.390, lng: 78.492, label: 'J-01'            },
    { lat: 17.388, lng: 78.489, label: 'J-02'            },
    { lat: 17.386, lng: 78.487, label: 'J-03'            },
    { lat: 17.385, lng: 78.487, label: 'J-05'            },
    { lat: 17.385, lng: 78.4867,label: 'Hospital'        },
  ],
  esp32: {
    connected: true,
    lastPing: Date.now() - 2000,
    firmwareVersion: 'v2.4.1',
    sensors: {
      gps:        { active: true,  accuracy: 2.4  },
      ir:         { active: true,  detections: 12 },
      ultrasonic: { active: true,  range: 4.2     },
      rfid:       { active: false, lastRead: null  },
    },
    signalStrength: -62,   // dBm
    uptime: 86400,         // seconds
  },
};

export const NOTIFICATIONS_MOCK = [
  { id: 'n1', type: 'alert',   title: 'Ambulance Approaching', message: 'AMB-2024-01 is 0.8 km away — ETA ~1 min', timestamp: Date.now() - 60000,  read: false },
  { id: 'n2', type: 'info',    title: 'Bed Capacity Updated',  message: 'Available beds updated from 50 to 48',      timestamp: Date.now() - 300000, read: true  },
  { id: 'n3', type: 'success', title: 'J-02 Cleared',          message: 'Nampally Station Road — all lanes clear',   timestamp: Date.now() - 120000, read: false },
];

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function getETAMinutes(distKm, speedKmh = 60) {
  return (distKm / speedKmh) * 60;
}
