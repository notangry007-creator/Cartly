import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuthStore } from '../src/stores/authStore';
import { useAddresses } from '../src/hooks/useAddresses';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

// Simulated pickup points across Nepal
const PICKUP_POINTS = [
  { id: 'pp1', name: 'Buy Hub — Thamel', address: 'Thamel, Kathmandu', lat: 27.7154, lng: 85.3123, hours: '8am–8pm', phone: '+977-9801234567' },
  { id: 'pp2', name: 'Buy Hub — New Road', address: 'New Road, Kathmandu', lat: 27.7041, lng: 85.3145, hours: '9am–7pm', phone: '+977-9801234568' },
  { id: 'pp3', name: 'Buy Hub — Patan', address: 'Kupondol, Lalitpur', lat: 27.6837, lng: 85.3169, hours: '9am–6pm', phone: '+977-9801234569' },
  { id: 'pp4', name: 'Buy Hub — Bhaktapur', address: 'Suryabinayak, Bhaktapur', lat: 27.6710, lng: 85.4298, hours: '9am–6pm', phone: '+977-9801234570' },
  { id: 'pp5', name: 'Buy Hub — Pokhara', address: 'Lakeside, Pokhara', lat: 28.2096, lng: 83.9856, hours: '9am–7pm', phone: '+977-9801234571' },
  { id: 'pp6', name: 'Buy Hub — Biratnagar', address: 'Traffic Chowk, Biratnagar', lat: 26.4525, lng: 87.2718, hours: '9am–6pm', phone: '+977-9801234572' },
];

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
  phone: string;
}

export default function PickupPointsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: addresses = [] } = useAddresses(user?.id ?? '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<PickupPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    // Try to use default address location
    const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0];
    if (defaultAddr) {
      setUserLocation({ lat: defaultAddr.latitude, lng: defaultAddr.longitude });
    }
  }, [addresses]);

  async function goToMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } finally {
      setLocating(false);
    }
  }

  function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const sortedPoints = userLocation
    ? [...PICKUP_POINTS].sort((a, b) =>
        getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : PICKUP_POINTS;

  const mapCenter = userLocation ?? { lat: 27.7172, lng: 85.3240 };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Pickup Points"
        right={
          <TouchableOpacity onPress={() => setShowList(!showList)} hitSlop={8}>
            <Ionicons name={showList ? 'map-outline' : 'list-outline'} size={22} color="#333" />
          </TouchableOpacity>
        }
      />

      {showList ? (
        <FlatList
          data={sortedPoints}
          keyExtractor={p => p.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <TouchableOpacity style={s.locateBtn} onPress={goToMyLocation} disabled={locating}>
              {locating ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name="locate" size={16} color={theme.colors.primary} />}
              <Text style={s.locateTxt}>{locating ? 'Locating...' : 'Use My Location'}</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const dist = userLocation
              ? getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng)
              : null;
            const isSelected = selected?.id === item.id;
            return (
              <TouchableOpacity onPress={() => setSelected(item)}>
                <Surface style={[s.card, isSelected && s.cardSelected]} elevation={1}>
                  <View style={s.cardIcon}>
                    <Ionicons name="location" size={22} color={isSelected ? '#fff' : theme.colors.primary} />
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={[s.cardName, isSelected && s.cardNameSel]}>{item.name}</Text>
                    <Text style={s.cardAddr}>{item.address}</Text>
                    <Text style={s.cardHours}>🕐 {item.hours}</Text>
                    {dist !== null && (
                      <Text style={s.cardDist}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} away</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={isSelected ? '#fff' : '#ccc'} />
                </Surface>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={s.mapWrap}>
          <MapView
            style={s.map}
            region={{
              latitude: mapCenter.lat,
              longitude: mapCenter.lng,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
            showsUserLocation
          >
            {PICKUP_POINTS.map(pp => (
              <Marker
                key={pp.id}
                coordinate={{ latitude: pp.lat, longitude: pp.lng }}
                onPress={() => setSelected(pp)}
              >
                <View style={[s.pin, selected?.id === pp.id && s.pinSelected]}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
                <Callout>
                  <View style={s.callout}>
                    <Text style={s.calloutName}>{pp.name}</Text>
                    <Text style={s.calloutAddr}>{pp.address}</Text>
                    <Text style={s.calloutHours}>{pp.hours}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* My location button */}
          <TouchableOpacity style={s.myLocBtn} onPress={goToMyLocation} disabled={locating}>
            <Ionicons name={locating ? 'hourglass' : 'locate'} size={22} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Selected point detail */}
          {selected && (
            <Surface style={s.detailCard} elevation={3}>
              <View style={s.detailHeader}>
                <View style={s.detailIcon}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
                <View style={s.detailInfo}>
                  <Text style={s.detailName}>{selected.name}</Text>
                  <Text style={s.detailAddr}>{selected.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
              </View>
              <View style={s.detailRow}>
                <Ionicons name="time-outline" size={14} color="#888" />
                <Text style={s.detailMeta}>{selected.hours}</Text>
              </View>
              <View style={s.detailRow}>
                <Ionicons name="call-outline" size={14} color="#888" />
                <Text style={s.detailMeta}>{selected.phone}</Text>
              </View>
            </Surface>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  pin: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  pinSelected: { backgroundColor: '#E53935', width: 44, height: 44, borderRadius: 22 },
  callout: { padding: SPACING.sm, minWidth: 160 },
  calloutName: { fontWeight: '700', color: '#222', fontSize: 13 },
  calloutAddr: { color: '#666', fontSize: 12, marginTop: 2 },
  calloutHours: { color: '#888', fontSize: 11, marginTop: 2 },
  myLocBtn: { position: 'absolute', bottom: 200, right: SPACING.lg, width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4 },
  detailCard: { position: 'absolute', bottom: SPACING.lg, left: SPACING.md, right: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: '#fff', gap: SPACING.xs },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailName: { fontWeight: '700', color: '#222', fontSize: 14 },
  detailAddr: { color: '#666', fontSize: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailMeta: { color: '#888', fontSize: 12 },
  list: { padding: SPACING.md, gap: SPACING.sm },
  locateBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, backgroundColor: theme.colors.primaryContainer, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  locateTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  cardSelected: { backgroundColor: theme.colors.primary },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: '700', color: '#222', fontSize: 14 },
  cardNameSel: { color: '#fff' },
  cardAddr: { color: '#666', fontSize: 12, marginTop: 2 },
  cardHours: { color: '#888', fontSize: 11, marginTop: 2 },
  cardDist: { color: theme.colors.primary, fontSize: 11, fontWeight: '600', marginTop: 2 },
});
