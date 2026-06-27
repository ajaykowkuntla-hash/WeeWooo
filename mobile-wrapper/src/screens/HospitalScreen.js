import React, { useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HospitalScreen() {
  const { hospitals, currentLocation, selectedHospital, selectHospital, isEmergency } = useApp();

  // Process and rank hospitals
  const hospitalList = useMemo(() => {
    return Object.values(hospitals).map((hospital) => {
      let distanceKm = 999;
      let etaMins = 999;

      if (currentLocation && hospital.location) {
        distanceKm = getDistanceKm(
          currentLocation.lat,
          currentLocation.lng,
          hospital.location.lat,
          hospital.location.lng
        );
        etaMins = Math.ceil((distanceKm / 45) * 60); // 45 km/h avg speed
      }

      const availableBeds = hospital.resources?.availableBeds ?? 0;
      const icuBeds = hospital.resources?.icuBeds ?? 0;
      
      // Recommendation algorithm score
      // Ineligible if 0 beds available
      const score = availableBeds > 0 ? (availableBeds * 1.2) - (distanceKm * 1.5) : -9999;

      return {
        ...hospital,
        distanceKm: Number(distanceKm.toFixed(1)),
        etaMins,
        score,
        eligible: availableBeds > 0,
      };
    }).sort((a, b) => b.score - a.score);
  }, [hospitals, currentLocation]);

  const recommendedHospitalId = useMemo(() => {
    if (hospitalList.length === 0) return null;
    const top = hospitalList[0];
    return top.score > -9999 ? top.id : null;
  }, [hospitalList]);

  const renderHospitalItem = ({ item }) => {
    const isSelected = selectedHospital?.id === item.id;
    const isRecommended = item.id === recommendedHospitalId;
    const resources = item.resources || {};

    return (
      <GlassCard 
        style={[
          styles.hospitalCard,
          isSelected && styles.cardSelected,
          isRecommended && !isSelected && styles.cardRecommended
        ]}
      >
        {/* Badges */}
        <View style={styles.badgeRow}>
          {isRecommended && (
            <View style={styles.recommendBadge}>
              <Ionicons name="sparkles" size={10} color="#0D0D0D" />
              <Text style={styles.recommendBadgeText}>RECOMMENDED</Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" />
              <Text style={styles.selectedBadgeText}>ASSIGNED</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.distanceText}>{item.distanceKm !== 999 ? `${item.distanceKm} km` : '—'}</Text>
            <Text style={styles.etaText}>{item.etaMins !== 999 ? `~${item.etaMins} mins` : '—'}</Text>
          </View>
        </View>

        {/* Resources Metrics Grid */}
        <View style={styles.resourcesGrid}>
          <View style={styles.resourceBadge}>
            <Text style={styles.resourceLabel}>Beds</Text>
            <Text style={[styles.resourceVal, resources.availableBeds === 0 && { color: '#FF3B30' }]}>
              {resources.availableBeds ?? 0}
            </Text>
          </View>
          <View style={styles.resourceBadge}>
            <Text style={styles.resourceLabel}>ICU</Text>
            <Text style={styles.resourceVal}>{resources.icuBeds ?? 0}</Text>
          </View>
          <View style={styles.resourceBadge}>
            <Text style={styles.resourceLabel}>Doctors</Text>
            <Text style={styles.resourceVal}>{resources.doctorsAvailable ?? 0}</Text>
          </View>
          <View style={styles.resourceBadge}>
            <Text style={styles.resourceLabel}>Ventilator</Text>
            <Text style={styles.resourceVal}>{resources.ventilators ?? 0}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.selectBtn,
            isSelected ? styles.selectBtnActive : styles.selectBtnNormal,
            !item.eligible && styles.selectBtnDisabled
          ]}
          disabled={isSelected || !item.eligible}
          onPress={() => selectHospital(item.id)}
        >
          <Text style={[styles.selectBtnText, isSelected && { color: '#FFFFFF' }]}>
            {isSelected ? 'Ambulance Routing Active' : item.eligible ? 'Assign Destination' : 'No Beds Available'}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      {hospitalList.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Fetching live hospital telemetry...</Text>
        </View>
      ) : (
        <FlatList
          data={hospitalList}
          renderItem={renderHospitalItem}
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
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 12,
  },
  hospitalCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardSelected: {
    borderColor: '#E53935',
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
  },
  cardRecommended: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.03)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
  },
  recommendBadgeText: {
    color: '#0D0D0D',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  address: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
  distanceText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  etaText: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
  resourcesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  resourceBadge: {
    alignItems: 'center',
    flex: 1,
  },
  resourceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  resourceVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  selectBtn: {
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectBtnActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  selectBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'transparent',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
