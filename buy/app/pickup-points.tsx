import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useZoneStore } from '../src/stores/zoneStore';
import { PICKUP_POINTS } from '../src/data/pickup-points';
import { ZoneId } from '../src/types';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

const ZONE_LABELS: Record<ZoneId, string> = {
  ktm_core: 'KTM Core',
  ktm_outer: 'KTM Outer',
  major_city: 'Major Cities',
  rest_nepal: 'Rest of Nepal',
};

export default function PickupPointsScreen() {
  const insets = useSafeAreaInsets();
  const { zoneId } = useZoneStore();
  const [selectedZone, setSelectedZone] = useState<ZoneId | 'all'>('all');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const filtered = selectedZone === 'all'
    ? PICKUP_POINTS
    : PICKUP_POINTS.filter(p => p.zoneId === selectedZone);

  const selected = PICKUP_POINTS.find(p => p.id === selectedPoint);

  // Map center: average of all filtered points
  const centerLat = filtered.reduce((s, p) => s + p.latitude, 0) / (filtered.length || 1);
  const centerLng = filtered.reduce((s, p) => s + p.longitude, 0) / (filtered.length || 1);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Pickup Points" />

      {/* Zone filter */}
      <View style={s.filters}>
        <Chip
          selected={selectedZone === 'all'}
          onPress={() => setSelectedZone('all')}
          style={[s.chip, selectedZone === 'all' && s.chipA]}
          compact
        >
          All
        </Chip>
        {(['ktm_core', 'ktm_outer', 'major_city'] as ZoneId[]).map(z => (
          <Chip
            key={z}
            selected={selectedZone === z}
            onPress={() => setSelectedZone(z)}
            style={[s.chip, selectedZone === z && s.chipA]}
            compact
          >
            {ZONE_LABELS[z]}
          </Chip>
        ))}
      </View>

      {/* Map */}
      <MapView
        style={s.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={{
          latitude: centerLat || 27.7172,
          longitude: centerLng || 85.3240,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {filtered.map(point => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={point.address}
            pinColor={selectedPoint === point.id ? theme.colors.primary : '#FF8F00'}
            onPress={() => setSelectedPoint(point.id)}
          />
        ))}
      </MapView>

      {/* Selected point detail */}
      {selected && (
        <Surface style={s.selectedCard} elevation={3}>
          <View style={s.selectedHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={s.selectedName}>{selected.name}</Text>
              <Text variant="bodySmall" style={s.selectedAddr}>{selected.address}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPoint(null)}>
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>
          <View style={s.selectedInfo}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text variant="labelSmall" style={{ color: '#666' }}>{selected.openHours}</Text>
          </View>
          <View style={s.selectedActions}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Linking.openURL('tel:' + selected.phone)}
            >
              <Ionicons name="call" size={16} color={theme.colors.primary} />
              <Text style={s.actionTxt}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Linking.openURL(
                `https://maps.google.com/?q=${selected.latitude},${selected.longitude}`
              )}
            >
              <Ionicons name="navigate" size={16} color="#1565C0" />
              <Text style={[s.actionTxt, { color: '#1565C0' }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      )}

      {/* List */}
      {!selected && (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedPoint(item.id)} activeOpacity={0.8}>
              <Surface style={s.pointCard} elevation={1}>
                <View style={s.pointIcon}>
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                </View>
                <View style={s.pointInfo}>
                  <Text variant="labelMedium" style={s.pointName}>{item.name}</Text>
                  <Text variant="bodySmall" style={s.pointAddr}>{item.address}</Text>
                  <Text variant="labelSmall" style={s.pointHours}>{item.openHours}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </Surface>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  filters: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: '#fff', flexWrap: 'wrap' },
  chip: { backgroundColor: '#f0f0f0' },
  chipA: { backgroundColor: theme.colors.primaryContainer },
  map: { height: 220, width: '100%' },
  selectedCard: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: '#fff',
    gap: SPACING.sm,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  selectedName: { fontWeight: '700', color: '#222' },
  selectedAddr: { color: '#666' },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  selectedActions: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e0e0e0' },
  actionTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  list: { padding: SPACING.md, gap: SPACING.sm },
  pointCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  pointIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  pointInfo: { flex: 1 },
  pointName: { fontWeight: '700', color: '#222' },
  pointAddr: { color: '#666' },
  pointHours: { color: '#888', marginTop: 2 },
});
