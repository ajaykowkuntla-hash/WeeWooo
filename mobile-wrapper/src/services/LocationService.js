import * as Location from 'expo-location';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';

let positionSubscription = null;

export async function requestLocationPermissions() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Error requesting location permission:', err);
    return false;
  }
}

export async function startLocationTracking(appContext, user) {
  if (!user) return;

  const hasPermission = await requestLocationPermissions();
  appContext.updateSettings({ locationPermission: hasPermission });

  if (!hasPermission) {
    appContext.setGpsStatus('lost');
    appContext.addNotification({
      type: 'warning',
      title: 'GPS Warning',
      message: 'Location permissions denied. Real GPS tracking disabled.',
    });
    return;
  }

  appContext.setGpsStatus('searching');

  // Cancel existing subscription if any
  if (positionSubscription) {
    positionSubscription.remove();
  }

  try {
    positionSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000, // Update every 2 seconds
        distanceInterval: 2, // Or every 2 meters
      },
      async (location) => {
        const { latitude, longitude, speed, heading } = location.coords;
        const speedKmh = Math.max(0, Math.round((speed || 0) * 3.6)); // m/s to km/h
        const direction = Math.round(heading || 0);

        appContext.setGpsStatus('active');
        appContext.setCurrentLocation({
          lat: latitude,
          lng: longitude,
          speed: speedKmh,
          heading: direction,
        });

        // Telemetry payload
        const telemetry = {
          lat: latitude,
          lng: longitude,
          speed: speedKmh,
          heading: direction,
          timestamp: Date.now(),
          driver: user.driverName,
          phone: user.phone,
          id: user.driverId,
          vehicleNumber: user.vehicleNumber,
          vehicleType: user.vehicleType,
          status: appContext.isEmergency ? 'en_route' : 'idle',
        };

        if (appContext.selectedHospital) {
          telemetry.assignedHospital = appContext.selectedHospital.id;
        }

        // Send to Firebase
        if (appContext.internetStatus) {
          try {
            const path = '/ambulance/location';
            await update(ref(db, path), telemetry);
            
            // Sync to list of named ambulances too
            const listPath = `/ambulances/${user.driverId}/location`;
            await update(ref(db, listPath), {
              lat: latitude,
              lng: longitude,
              timestamp: Date.now(),
            });
            await update(ref(db, `/ambulances/${user.driverId}`), {
              id: user.driverId,
              driver: user.driverName,
              phone: user.phone,
              vehicleNumber: user.vehicleNumber,
              vehicleType: user.vehicleType,
              status: appContext.isEmergency ? 'en_route' : 'idle',
              speed: speedKmh,
              assignedHospital: appContext.selectedHospital?.id || '',
            });

            // If we have queue items, flush them
            if (appContext.offlineQueue.current.length > 0) {
              appContext.addNotification({
                type: 'info',
                title: 'Sync Complete',
                message: `Flushed ${appContext.offlineQueue.current.length} offline GPS updates.`,
              });
              appContext.offlineQueue.current = [];
            }
          } catch (err) {
            console.error('Firebase telemetry write failed, caching:', err.message);
            cacheLocation(appContext, telemetry);
          }
        } else {
          // Cache location offline
          cacheLocation(appContext, telemetry);
        }
      }
    );
  } catch (err) {
    console.error('Error starting location tracking:', err);
    appContext.setGpsStatus('lost');
  }
}

export function stopLocationTracking() {
  if (positionSubscription) {
    positionSubscription.remove();
    positionSubscription = null;
  }
}

function cacheLocation(appContext, telemetry) {
  appContext.offlineQueue.current.push(telemetry);
  if (appContext.offlineQueue.current.length === 1) {
    appContext.addNotification({
      type: 'warning',
      title: 'Offline Mode',
      message: 'Internet disconnected. Telemetry updates are being queued.',
    });
  }
}
