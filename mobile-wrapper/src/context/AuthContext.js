import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we have remembered email/password
    const loadRememberedUser = async () => {
      try {
        const remembered = await AsyncStorage.getItem('@driver_remembered');
        if (remembered) {
          const { email, password } = JSON.parse(remembered);
          // Auto-login with mock credentials
          const mockProfile = getMockProfile(email);
          setUser(mockProfile);
        }
      } catch (err) {
        console.warn('Remember Me auto-login failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRememberedUser();
  }, []);

  const getMockProfile = (email) => {
    const isApollo = email.toLowerCase().includes('apollo');
    
    if (isApollo) {
      return {
        uid: 'drv-apollo-mock',
        email: email,
        driverName: 'Suresh Nair',
        driverId: 'DRV-APOLLO-02',
        hospitalId: 'hospital-002', // Apollo Emergency Centre
        vehicleNumber: 'TS-09-CD-5678',
        vehicleType: 'Cardiac Care Unit',
        licenseNumber: 'DL-88202498765',
        phone: '+91-9988776655',
      };
    } else {
      // Default / City Hospital
      return {
        uid: 'drv-city-mock',
        email: email,
        driverName: 'Ravi Kumar',
        driverId: 'DRV-CITY-01',
        hospitalId: 'hospital-001', // City General Hospital
        vehicleNumber: 'TS-09-AB-1234',
        vehicleType: 'ICU Ambulance',
        licenseNumber: 'DL-99202412345',
        phone: '+91-9876543210',
      };
    }
  };

  const login = async (email, password, rememberMe) => {
    setError(null);
    setLoading(true);
    
    // Simulate minor delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const mockProfile = getMockProfile(email);
      setUser(mockProfile);

      if (rememberMe) {
        await AsyncStorage.setItem('@driver_remembered', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('@driver_remembered');
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      setError('Login failed. Please check credentials.');
      setLoading(false);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('@driver_remembered');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
