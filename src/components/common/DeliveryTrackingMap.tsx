import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types';
import { theme, SPACING, RADIUS, useAppColors } from '../../theme';

interface Props {
  order: Order;
}

// Simulate agent movement around delivery address
function getAgentPosition(order: Order, tick: number) {
  const dest = { lat: order.addressSnapshot.latitude, lng: order.addressSnapshot.longitude };
  if (order.status === 'out_for_delivery') {
    // Simulate agent closing in over ticks
    const spread = Math.max(0.002, 0.015 - tick * 0.001);
    return {
      latitude: dest.lat + (Math.sin(tick * 0.3) * spread),
      longitude: dest.lng + (Math.cos(tick * 0.2) * spread),
    };
  }
  if (order.status === 'shipped') {
    return { latitude: dest.lat + 0.025, longitude: dest.lng + 0.018 };
  }
  return null;
}

// Warehouse origin (Buy warehouse in Ktm Core)
const WAREHOUSE = { latitude: 27.7089, longitude: 85.3145 };

export default function DeliveryTrackingMap({ order }: Props) {
  const mapRef = useRef<MapView>(null);
  const [tick, setTick] = useState(0);
  const c = useAppColors();

  const dest = {
    latitude: order.addressSnapshot.latitude,
    longitude: order.addressSnapshot.longitude,
  };

  const agent = getAgentPosition(order, tick);

  const showMap = ['shipped', 'out_for_delivery'].includes(order.status);

  useEffect(() => {
    if (!showMap) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let appStateStatus: AppStateStatus = AppState.currentState;

    function startTicking() {
      if (!interval) {
        interval = setInterval(() => setTick(t => t + 1), 3000);
      }
    }

    function stopTicking() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    // Only tick when app is in foreground
    if (appStateStatus === 'active') startTicking();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      appStateStatus = nextState;
      if (nextState === 'active') {
        startTicking();
      } else {
        // App backgrounded or inactive — pause the interval to save resources
        stopTicking();
      }
    });

    return () => {
      stopTicking();
      sub.remove();
    };
  }, [showMap]);

  if (!showMap) return null;

  const midLat = agent ? (agent.latitude + dest.latitude) / 2 : dest.latitude;
  const midLng = agent ? (agent.longitude + dest.longitude) / 2 : dest.longitude;

  return (
    <Surface style={[s.container, { backgroundColor: c.cardBg }]} elevation={1}>
      <View style={s.titleRow}>
        <Ionicons name={order.status === 'out_for_delivery' ? 'bicycle' : 'car'} size={18} color={theme.colors.primary} />
        <Text variant="titleSmall" style={[s.title, { color: c.text }]}>
          {order.status === 'out_for_delivery' ? 'Agent is on the way' : 'Order in transit'}
        </Text>
        <View style={s.liveDot} />
        <Text variant="labelSmall" style={s.liveText}>LIVE</Text>
      </View>

      <MapView
        ref={mapRef}
        style={s.map}
        region={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* Delivery destination */}
        <Marker coordinate={dest} title="Your location" pinColor={theme.colors.primary} />

        {/* Warehouse origin */}
        <Marker coordinate={WAREHOUSE} title="Buy Warehouse">
          <View style={s.warehousePin}>
            <Ionicons name="business" size={16} color="#fff" />
          </View>
        </Marker>

        {/* Delivery agent */}
        {agent && (
          <Marker coordinate={agent} title="Delivery Agent">
            <View style={s.agentPin}>
              <Ionicons name={order.status === 'out_for_delivery' ? 'bicycle' : 'car'} size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route line */}
        {agent && (
          <Polyline
            coordinates={[WAREHOUSE, agent, dest]}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      <Text variant="labelSmall" style={[s.note, { color: c.textMuted }]}>
        {order.status === 'out_for_delivery'
          ? 'Simulated live tracking — your agent is nearby'
          : 'Order is on its way from our warehouse'}
      </Text>
    </Surface>
  );
}

const s = StyleSheet.create({
  container: {
    margin: SPACING.md, marginTop: 0,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    // backgroundColor injected dynamically via useAppColors()
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    padding: SPACING.md,
  },
  title: { flex: 1, fontWeight: '700' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveText: { color: '#E53935', fontWeight: '700' },
  map: { width: '100%', height: 220 },
  warehousePin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
  },
  agentPin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  note: { textAlign: 'center', padding: SPACING.sm },
});
