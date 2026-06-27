import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

export default function NotificationsScreen() {
  const { 
    notifications, 
    markAllNotificationsRead, 
    clearNotifications,
    unreadCount 
  } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return { name: 'warning', color: '#E53935', bg: 'rgba(229, 57, 53, 0.1)' };
      case 'success':
        return { name: 'checkmark-circle', color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' };
      case 'warning':
        return { name: 'alert-circle', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
      default:
        return { name: 'information-circle', color: '#007AFF', bg: 'rgba(0, 122, 255, 0.1)' };
    }
  };

  const renderNotifItem = ({ item }) => {
    const iconConfig = getIcon(item.type);
    
    return (
      <GlassCard style={[styles.notifCard, !item.read && styles.notifUnread]}>
        <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.titleRow}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMsg}>{item.message}</Text>
          <Text style={styles.notifTime}>
            {new Date(item.timestamp).toLocaleString('en-IN', { hour12: false })}
          </Text>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Action Header bar */}
      <View style={styles.actionBar}>
        <Text style={styles.countText}>
          {unreadCount > 0 ? `${unreadCount} Unread Alerts` : 'All Alerts Acknowledged'}
        </Text>
        <View style={styles.btnRow}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={markAllNotificationsRead}>
              <Text style={styles.actionBtnText}>Ack All</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={clearNotifications}>
              <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Clear Log</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>Dispatch log is currently empty</Text>
          <Text style={styles.emptySubtext}>Any emergency alerts or traffic priority logs will appear here in real-time.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotifItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  countText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearBtn: {
    borderColor: 'rgba(255, 59, 48, 0.15)',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notifCard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  notifUnread: {
    borderColor: 'rgba(229, 57, 53, 0.15)',
    backgroundColor: 'rgba(229, 57, 53, 0.02)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
  },
  notifMsg: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  notifTime: {
    color: '#8E8E93',
    fontSize: 9,
    marginTop: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
