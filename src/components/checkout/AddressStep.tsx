import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, RadioButton, Surface, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Address } from '../../types';
import { SPACING, RADIUS, useAppColors, useAppTheme } from '../../theme';

interface Props {
  addresses: Address[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function AddressStep({ addresses, isLoading, selectedId, onSelect }: Props) {
  const router = useRouter();
  const c = useAppColors();
  const t = useAppTheme();

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text variant="titleMedium" style={[s.title, { color: c.text }]}>
        Select Delivery Address
      </Text>

      {addresses.length === 0 ? (
        <View style={s.empty}>
          <Text variant="bodyMedium" style={{ color: c.textSecondary }}>No saved addresses.</Text>
          <Button mode="contained" onPress={() => router.push('/addresses/new')}>
            Add Address
          </Button>
        </View>
      ) : (
        addresses.map(addr => {
          const isSelected = selectedId === addr.id || (!selectedId && addr.isDefault);
          return (
            <TouchableOpacity key={addr.id} onPress={() => onSelect(addr.id)} activeOpacity={0.8}>
              <Surface
                style={[
                  s.card,
                  { borderColor: isSelected ? t.colors.primary : 'transparent', backgroundColor: c.cardBg },
                  isSelected && { backgroundColor: t.colors.primaryContainer },
                ]}
                elevation={1}
              >
                <RadioButton.Android
                  value={addr.id}
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => onSelect(addr.id)}
                  color={t.colors.primary}
                />
                <View style={s.addrInfo}>
                  <Text variant="labelMedium" style={[s.addrLabel, { color: c.text }]}>
                    {addr.label}
                  </Text>
                  <Text variant="bodySmall" style={{ color: c.textSecondary, lineHeight: 18 }}>
                    {addr.landmark}, Ward {addr.ward}, {addr.municipality}, {addr.district}
                  </Text>
                  {addr.isPickupPointFallback && (
                    <View style={s.pickupRow}>
                      <Ionicons name="location" size={12} color="#FF8F00" />
                      <Text style={s.pickupTxt}>Pickup point fallback</Text>
                    </View>
                  )}
                </View>
              </Surface>
            </TouchableOpacity>
          );
        })
      )}

      <Button
        mode="outlined"
        icon="plus"
        onPress={() => router.push('/addresses/new')}
        style={{ marginTop: SPACING.sm }}
      >
        Add New Address
      </Button>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  centered: { padding: SPACING.xl, alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: SPACING.sm },
  empty: { alignItems: 'center', gap: SPACING.md, padding: SPACING.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  addrInfo: { flex: 1 },
  addrLabel: { fontWeight: '700', marginBottom: 2 },
  pickupRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  pickupTxt: { color: '#FF8F00', fontSize: 11 },
});
