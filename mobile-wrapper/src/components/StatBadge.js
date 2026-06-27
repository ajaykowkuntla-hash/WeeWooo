import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatBadge({ label, value, subtext, color = '#FFFFFF', style }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 2,
  },
});
