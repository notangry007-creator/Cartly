import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme, SPACING, RADIUS } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');

// Kathmandu default center
const KTM_DEFAULT: Region = {
  latitude: 27.7172,
  longitude: 85.3240,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

interface Props {
  visible: boolean;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function MapPinPicker({ visible, initialLat, initialLng, onConfirm, onClose }: Props) {
  const [pin, setPin] = useState({
    latitude: initialLat ?? KTM_DEFAULT.latitude,
    longitude: initialLng ?? KTM_DEFAULT.longitude,
  });
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  async function goToMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newPin = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(newPin);
      mapRef.current?.animateToRegion({ ...newPin, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
    } finally {
      setLocating(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={s.headerTitle}>Pin Your Location</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Instruction */}
        <Surface style={s.hint} elevation={2}>
          <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
          <Text variant="labelSmall" style={s.hintTxt}>Drag the map or tap to move the pin to your exact delivery location</Text>
        </Surface>

        {/* Map */}
        <View style={s.mapWrap}>
          <MapView
            ref={mapRef}
            style={s.map}
            initialRegion={{
              latitude: pin.latitude,
              longitude: pin.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            onPress={e => setPin(e.nativeEvent.coordinate)}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={e => setPin(e.nativeEvent.coordinate)}
              pinColor={theme.colors.primary}
            />
          </MapView>

          {/* My Location Button */}
          <TouchableOpacity style={s.myLocBtn} onPress={goToMyLocation} disabled={locating}>
            <Ionicons name={locating ? 'hourglass' : 'locate'} size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Coordinates display */}
        <View style={s.coordRow}>
          <Ionicons name="location" size={14} color={theme.colors.primary} />
          <Text variant="labelSmall" style={s.coordTxt}>
            {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
          </Text>
        </View>

        {/* Confirm */}
        <View style={s.footer}>
          <Button mode="outlined" onPress={onClose} style={s.footerBtn}>Cancel</Button>
          <Button
            mode="contained"
            onPress={() => onConfirm(pin.latitude, pin.longitude)}
            style={s.footerBtn}
            icon="check"
          >
            Confirm Pin
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  closeBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', color: '#222' },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    marginHorizontal: SPACING.md, marginVertical: SPACING.sm,
    padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: '#FFF5F5',
  },
  hintTxt: { flex: 1, color: '#666', lineHeight: 16 },
  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  myLocBtn: {
    position: 'absolute', bottom: SPACING.lg, right: SPACING.lg,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
    elevation: 4,
  },
  coordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: '#fafafa', borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  coordTxt: { color: '#888' },
  footer: {
    flexDirection: 'row', gap: SPACING.md,
    padding: SPACING.md, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  footerBtn: { flex: 1 },
});
