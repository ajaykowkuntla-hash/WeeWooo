import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useApp();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of the Driver Console?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const renderInfoItem = (icon, label, value) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color="#E53935" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

  const renderSettingToggle = (icon, label, value, onToggle) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconBox}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#3a3a3c', true: 'rgba(229, 57, 53, 0.4)' }}
        thumbColor={value ? '#E53935' : '#8e8e93'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Profile Card */}
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user?.driverName?.split(' ').map(n => n[0]).join('') || 'DR'}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.driverName || 'Driver Name'}</Text>
        <Text style={styles.profileId}>{user?.driverId || 'DRV-ID'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </GlassCard>

      {/* Vehicle details */}
      <Text style={styles.sectionHeader}>Ambulance Telemetry Config</Text>
      <GlassCard style={styles.card}>
        {renderInfoItem('car-outline', 'Vehicle Number Plate', user?.vehicleNumber)}
        {renderInfoItem('construct-outline', 'Medical Rig Level', user?.vehicleType)}
        {renderInfoItem('card-outline', 'Permit License', user?.licenseNumber)}
        {renderInfoItem('call-outline', 'Hotline Dispatch Number', user?.phone)}
      </GlassCard>

      {/* Settings */}
      <Text style={styles.sectionHeader}>Console Settings</Text>
      <GlassCard style={styles.card}>
        {renderSettingToggle('moon-outline', 'Console Dark UI Theme', settings.darkMode, (v) => updateSettings({ darkMode: v }))}
        {renderSettingToggle('volume-high-outline', 'Audible Dispatch Alerts', settings.sound, (v) => updateSettings({ sound: v }))}
        {renderSettingToggle('phone-portrait-outline', 'Haptics Feedback', settings.vibration, (v) => updateSettings({ vibration: v }))}
        
        {/* Read only status settings */}
        <View style={styles.statusSettingRow}>
          <Ionicons name="location-outline" size={18} color="#8E8E93" />
          <Text style={styles.statusSettingLabel}>Location Permissions</Text>
          <Text style={[styles.statusSettingVal, { color: settings.locationPermission ? '#34C759' : '#FF3B30' }]}>
            {settings.locationPermission ? 'GRANTED' : 'DENIED'}
          </Text>
        </View>
      </GlassCard>

      {/* Logout button */}
      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutBtnText}>Sign Out Console</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>WeeWooo Emergency Client v2.4.1</Text>
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  profileId: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  profileEmail: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  statusSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  statusSettingLabel: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
    marginLeft: 12,
  },
  statusSettingVal: {
    fontWeight: '700',
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 12,
    height: 50,
    gap: 8,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: '#3a3a3c',
    fontSize: 10,
    fontWeight: '500',
  },
});
