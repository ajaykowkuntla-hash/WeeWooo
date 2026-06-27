import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useApp } from '../context/AppContext';
import { fetchRouteAndETA } from '../services/TrafficService';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121212" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

export default function NavigationScreen() {
  const appContext = useApp();
  const { currentLocation, selectedHospital, trafficData, isEmergency } = appContext;
  
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, etaMinutes: 0, routeCoords: [] });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [voiceNavigationReady] = useState(true);
  const [navigationStarted, setNavigationStarted] = useState(false);

  const mapRef = useRef(null);

  // Default region: Hyderabad center or current location
  const initialRegion = {
    latitude: currentLocation?.lat || 17.38504,
    longitude: currentLocation?.lng || 78.48667,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Fetch route when location or hospital changes
  useEffect(() => {
    if (!currentLocation || !selectedHospital) return;

    const getRoute = async () => {
      setLoadingRoute(true);
      const origin = { lat: currentLocation.lat, lng: currentLocation.lng };
      const destination = { lat: selectedHospital.location.lat, lng: selectedHospital.location.lng };
      const info = await fetchRouteAndETA(origin, destination);
      setRouteInfo(info);
      setLoadingRoute(false);

      // Auto-focus map to fit both markers
      if (mapRef.current && info.routeCoords.length > 0) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: destination.lat, longitude: destination.lng }
          ],
          {
            edgePadding: { top: 80, right: 60, bottom: 120, left: 60 },
            animated: true
          }
        );
      }
    };

    getRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation?.lat, currentLocation?.lng, selectedHospital?.id]);

  const handleStartNavigation = () => {
    if (!selectedHospital) {
      Alert.alert('Error', 'Please select a hospital first.');
      return;
    }
    setNavigationStarted(!navigationStarted);
    appContext.addNotification({
      type: 'info',
      title: navigationStarted ? 'Navigation Stopped' : 'Navigation Started',
      message: navigationStarted ? 'Turn-by-turn navigation closed.' : `Navigating to ${selectedHospital.name}. Voice Guidance enabled.`,
    });
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Ambulance Marker */}
        {currentLocation && (
          <Marker
            coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
            title="Your Location"
            description="Ambulance Telemetry Point"
          >
            <View style={[
              styles.ambulanceMarker,
              { 
                backgroundColor: isEmergency ? '#E53935' : '#34C759',
                shadowColor: isEmergency ? '#E53935' : '#34C759'
              }
            ]}>
              <View style={styles.ambulanceInnerDot} />
            </View>
          </Marker>
        )}

        {/* Hospital Marker */}
        {selectedHospital && (
          <Marker
            coordinate={{ 
              latitude: selectedHospital.location.lat, 
              longitude: selectedHospital.location.lng 
            }}
            title={selectedHospital.name}
            description={selectedHospital.address}
          >
            <View style={styles.hospitalMarker}>
              <Text style={styles.hospitalMarkerText}>+</Text>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeInfo.routeCoords.length > 0 && (
          <Polyline
            coordinates={routeInfo.routeCoords}
            strokeColor={isEmergency ? '#E53935' : '#8E8E93'}
            strokeWidth={4}
            lineDashPattern={isEmergency ? undefined : [5, 10]}
          />
        )}

        {/* Junction Markers */}
        {trafficData.junctions && trafficData.junctions.map((j) => {
          if (!j.lat || !j.lng) return null;
          const isJunctionGreen = j.status === 'GREEN' || j.status === 'CLEARING';
          return (
            <Marker
              key={j.id}
              coordinate={{ latitude: j.lat, longitude: j.lng }}
              title={j.name}
              description={`Status: ${j.status}`}
            >
              <View style={[
                styles.junctionMarker,
                { backgroundColor: isJunctionGreen ? '#34C759' : '#FF9500' }
              ]} />
            </Marker>
          );
        })}
      </MapView>

      {/* Top Header Card */}
      {!selectedHospital ? (
        <GlassCard style={styles.topCard}>
          <Text style={styles.warningText}>No Destination Assigned</Text>
          <Text style={styles.subWarningText}>Choose a hospital from the Hospitals tab to begin navigation routing.</Text>
        </GlassCard>
      ) : (
        <GlassCard style={styles.topCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hospitalName} numberOfLines={1}>{selectedHospital.name}</Text>
              <Text style={styles.hospitalAddress} numberOfLines={1}>{selectedHospital.address}</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{routeInfo.etaMinutes} MIN</Text>
              <Text style={styles.distText}>{routeInfo.distanceKm} KM</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {loadingRoute && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      )}

      {/* Navigation Controls Card */}
      <GlassCard style={styles.bottomCard}>
        <View style={styles.controlRow}>
          <View style={styles.voiceIndicator}>
            <Ionicons 
              name={voiceNavigationReady ? 'volume-high' : 'volume-mute'} 
              size={20} 
              color={voiceNavigationReady ? '#34C759' : '#8E8E93'} 
            />
            <Text style={styles.voiceText}>
              {voiceNavigationReady ? 'Voice Guidance Ready' : 'Voice Muted'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.navBtn, 
              navigationStarted ? styles.navBtnActive : styles.navBtnNormal
            ]}
            onPress={handleStartNavigation}
          >
            <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
            <Text style={styles.navBtnText}>
              {navigationStarted ? 'End Navigation' : 'Start Navigation'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  map: {
    flex: 1,
  },
  topCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hospitalName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  hospitalAddress: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  etaBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  etaText: {
    color: '#E53935',
    fontWeight: '800',
    fontSize: 14,
  },
  distText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  warningText: {
    color: '#E53935',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  subWarningText: {
    color: '#8E8E93',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 100,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  navBtnNormal: {
    backgroundColor: '#E53935',
  },
  navBtnActive: {
    backgroundColor: '#34C759',
  },
  navBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  ambulanceMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  ambulanceInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  hospitalMarker: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  hospitalMarkerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: Platform.OS === 'ios' ? 16 : 18,
  },
  junctionMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});
