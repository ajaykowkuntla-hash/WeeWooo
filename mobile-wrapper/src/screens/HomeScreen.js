import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { startLocationTracking, stopLocationTracking } from '../services/LocationService';
import GlassCard from '../components/GlassCard';
import StatBadge from '../components/StatBadge';
import PulseAnimation from '../components/PulseAnimation';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const appContext = useApp();
  
  const { 
    isEmergency, 
    selectedHospital, 
    trafficData, 
    currentLocation, 
    internetStatus, 
    gpsStatus, 
    notifications,
    startEmergency,
    stopEmergency,
  } = appContext;

  const [time, setTime] = useState(new Date());

  // Ticking clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize GPS Location tracking
  useEffect(() => {
    if (user) {
      startLocationTracking(appContext, user);
    }
    return () => {
      stopLocationTracking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSOS = () => {
    Alert.alert(
      '⚠️ ALERT SOS',
      'This will broadcast an immediate critical hazard distress alert to City Dispatch. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'CONFIRM SOS', 
          style: 'destructive',
          onPress: () => {
            appContext.addNotification({
              type: 'alert',
              title: 'CRITICAL SOS ACTIVATED',
              message: 'SOS distress beacon broadcasted to dispatch.',
            });
            Alert.alert('SOS Broadcasted', 'Dispatch has been notified. Keep GPS active.');
          }
        }
      ]
    );
  };

  const formattedTime = time.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.driverName?.split(' ').map(n => n[0]).join('') || 'DR'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.driverName}>{user?.driverName || 'Loading Driver...'}</Text>
            <Text style={styles.driverId}>{user?.driverId || 'DRV-MOCK'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notifBell}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {appContext.unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{appContext.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>

      {/* Emergency Status Banner */}
      <View style={[
        styles.statusBanner, 
        isEmergency ? styles.statusBannerAlert : styles.statusBannerNormal
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PulseAnimation active={isEmergency} color={isEmergency ? '#E53935' : '#34C759'} size={12} />
          <Text style={styles.statusBannerText}>
            {isEmergency ? 'EMERGENCY MODE ACTIVE' : 'NORMAL PATROL STATUS'}
          </Text>
        </View>
        <Text style={styles.statusBannerSub}>
          {isEmergency ? 'Priority corridor signal clearance active' : 'GPS telemetry streaming in idle'}
        </Text>
      </View>

      {/* Telemetry Status Card */}
      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Live Telemetry Console</Text>
        
        <View style={styles.statGrid}>
          <View style={styles.statItem}>
            <StatBadge 
              label="Console Status" 
              value={gpsStatus === 'active' ? 'ONLINE' : 'OFFLINE'} 
              color={gpsStatus === 'active' ? '#34C759' : '#FF9500'} 
            />
          </View>
          <View style={styles.statItem}>
            <StatBadge 
              label="GPS Signal" 
              value={gpsStatus.toUpperCase()} 
              color={gpsStatus === 'active' ? '#34C759' : gpsStatus === 'searching' ? '#FF9500' : '#FF3B30'} 
            />
          </View>
          <View style={styles.statItem}>
            <StatBadge 
              label="Network" 
              value={internetStatus ? 'CONNECTED' : 'DISCONNECTED'} 
              color={internetStatus ? '#34C759' : '#FF3B30'} 
            />
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Speed</Text>
            <Text style={styles.detailValue}>{currentLocation?.speed ?? 0} km/h</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Coordinates</Text>
            <Text style={styles.detailValue}>
              {currentLocation ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'Waiting for GPS...'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Heading Direction</Text>
            <Text style={styles.detailValue}>{currentLocation?.heading ?? 0}°</Text>
          </View>
        </View>
      </GlassCard>

      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, isEmergency ? styles.btnDangerActive : styles.btnDanger]}
          onPress={isEmergency ? stopEmergency : startEmergency}
        >
          <Ionicons name={isEmergency ? 'stop-circle' : 'flame'} size={24} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>
            {isEmergency ? 'STOP EMERGENCY' : 'START EMERGENCY'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.btnOutline]}
          onPress={() => navigation.navigate('Navigation')}
        >
          <Ionicons name="navigate" size={24} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>NAVIGATE</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Card */}
      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Emergency Metrics</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Hospital Assigned</Text>
            <Text style={styles.metricValueText}>{selectedHospital?.name || 'NOT ASSIGNED'}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Traffic Signals Priority</Text>
            <Text style={[styles.metricValueText, { color: isEmergency ? '#E53935' : '#8E8E93' }]}>
              {isEmergency ? `${trafficData.junctions.filter(j => j.onRoute).length} ACTIVE` : 'INACTIVE'}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Quick Actions List */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Hospitals')}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
            <Ionicons name="business" size={22} color="#FF9500" />
          </View>
          <Text style={styles.menuText}>Hospital List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSOS}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Ionicons name="alert-circle" size={22} color="#FF3B30" />
          </View>
          <Text style={styles.menuText}>SOS Distress</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="person" size={22} color="#007AFF" />
          </View>
          <Text style={styles.menuText}>My Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Timeline */}
      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Live Dispatch Log</Text>
        {notifications.slice(0, 3).map((notif) => (
          <View key={notif.id} style={styles.logItem}>
            <View style={[styles.logIndicator, { 
              backgroundColor: notif.type === 'alert' ? '#E53935' : notif.type === 'success' ? '#34C759' : '#8E8E93' 
            }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.logTitle}>{notif.title}</Text>
              <Text style={styles.logMsg}>{notif.message}</Text>
            </View>
            <Text style={styles.logTime}>
              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </GlassCard>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  driverId: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  notifBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBanner: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusBannerNormal: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  statusBannerAlert: {
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderColor: 'rgba(229, 57, 53, 0.2)',
  },
  statusBannerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  statusBannerSub: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 20,
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: (width - 64) / 3,
  },
  detailGrid: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 52,
    flex: 0.48,
    gap: 8,
  },
  btnDanger: {
    backgroundColor: '#E53935',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDangerActive: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  btnOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  metricDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: (width - 48) / 3,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logMsg: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  logTime: {
    color: '#8E8E93',
    fontSize: 10,
  },
});
