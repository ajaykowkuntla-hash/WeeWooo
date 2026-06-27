import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { ref, onValue, set, update, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const AppContext = createContext({});

export function AppProvider({ children }) {
  const { user } = useAuth();
  
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitals, setHospitals] = useState({});
  const [trafficData, setTrafficData] = useState({ mode: 'NORMAL', activeLane: '', junctions: [] });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [internetStatus, setInternetStatus] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('searching');
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'info', title: 'System Initialized', message: 'Welcome to Smart Ambulance Console', timestamp: Date.now(), read: false }
  ]);
  const [settings, setSettings] = useState({
    darkMode: true,
    locationPermission: false,
    notificationPermission: false,
    sound: true,
    vibration: true,
    language: 'English',
  });

  const offlineQueue = useRef([]);

  // Load settings on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem('@app_settings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Save settings helper
  const updateSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('@app_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  // Firebase listeners
  useEffect(() => {
    if (!user) return;

    // 1. Listen to Hospitals
    const hospitalsRef = ref(db, '/hospitals');
    const unsubscribeHospitals = onValue(hospitalsRef, (snap) => {
      const val = snap.val();
      if (val) {
        setHospitals(val);
      }
    }, (err) => {
      console.error('Firebase hospitals listener error:', err.message);
    });

    // 2. Listen to Traffic Status
    const trafficRef = ref(db, '/Traffic');
    const unsubscribeTraffic = onValue(trafficRef, (snap) => {
      const val = snap.val();
      if (val) {
        // Convert junctions object to array if needed
        const rawJunctions = val.junctions ?? {};
        const junctions = Array.isArray(rawJunctions) 
          ? rawJunctions 
          : Object.values(rawJunctions);
        setTrafficData({
          ...val,
          junctions,
        });
      }
    }, (err) => {
      console.error('Firebase traffic listener error:', err.message);
    });

    // 3. Listen to Ambulance status to sync if changed remotely
    const ambRef = ref(db, '/ambulance/status');
    const unsubscribeAmb = onValue(ambRef, (snap) => {
      const val = snap.val();
      if (val) {
        setIsEmergency(val === 'en_route' || val === 'ACTIVE');
      }
    });

    // 4. Listen to Assigned/Selected Hospital
    const assignedHospitalRef = ref(db, '/ambulance/location/assignedHospital');
    const unsubscribeAssigned = onValue(assignedHospitalRef, (snap) => {
      const hospitalId = snap.val();
      if (hospitalId && hospitals[hospitalId]) {
        setSelectedHospital(hospitals[hospitalId]);
      }
    });

    return () => {
      unsubscribeHospitals();
      unsubscribeTraffic();
      unsubscribeAmb();
      unsubscribeAssigned();
    };
  }, [user, hospitals]);

  // Sync selected hospital to firebase
  const selectHospital = async (hospitalId) => {
    if (!user) return;
    try {
      const path = '/ambulance/location';
      await update(ref(db, path), {
        assignedHospital: hospitalId,
        assignedAt: Date.now(),
      });
      if (hospitals[hospitalId]) {
        setSelectedHospital(hospitals[hospitalId]);
        addNotification({
          type: 'success',
          title: 'Hospital Selected',
          message: `Ambulance assigned to ${hospitals[hospitalId].name}`,
        });
      }
    } catch (err) {
      console.error('Failed to select hospital:', err);
    }
  };

  // Trigger Emergency Mode
  const startEmergency = async () => {
    if (!user) return;
    try {
      setIsEmergency(true);
      
      // Update ambulance status to en_route
      const path = '/ambulance';
      await update(ref(db, path), {
        status: 'en_route',
      });
      
      // Update traffic mode to AMBULANCE
      await update(ref(db, '/Traffic'), {
        mode: 'AMBULANCE',
        lastUpdated: Date.now(),
      });

      addNotification({
        type: 'alert',
        title: 'Emergency Started',
        message: 'Ambulance status set to ACTIVE. Traffic Priority requested.',
      });
    } catch (err) {
      console.error('Failed to start emergency:', err);
    }
  };

  // Stop Emergency Mode
  const stopEmergency = async () => {
    if (!user) return;
    try {
      setIsEmergency(false);
      
      const path = '/ambulance';
      await update(ref(db, path), {
        status: 'idle',
      });
      
      await update(ref(db, '/Traffic'), {
        mode: 'NORMAL',
        lastUpdated: Date.now(),
      });

      addNotification({
        type: 'info',
        title: 'Emergency Ended',
        message: 'Ambulance status set to IDLE. Traffic Mode normalized.',
      });
    } catch (err) {
      console.error('Failed to stop emergency:', err);
    }
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        isEmergency,
        selectedHospital,
        hospitals,
        trafficData,
        currentLocation,
        setCurrentLocation,
        internetStatus,
        setInternetStatus,
        gpsStatus,
        setGpsStatus,
        notifications,
        addNotification,
        markAllNotificationsRead,
        clearNotifications,
        unreadCount,
        selectHospital,
        startEmergency,
        stopEmergency,
        settings,
        updateSettings,
        offlineQueue,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
