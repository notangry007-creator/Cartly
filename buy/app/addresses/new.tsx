import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText, Switch, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../src/stores/authStore';
import { useCreateAddress } from '../../src/hooks/useAddresses';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import MapPinPicker from '../../src/components/common/MapPinPicker';
import { SPACING, RADIUS, theme } from '../../src/theme';

const schema = z.object({
  label: z.string().min(1, 'Label required'),
  province: z.string().min(1, 'Province required'),
  district: z.string().min(1, 'District required'),
  municipality: z.string().min(1, 'Municipality required'),
  ward: z.coerce.number().min(1, 'Ward required'),
  landmark: z.string().min(3, 'Landmark required (min 3 chars)'),
  street: z.string().optional(),
});
type F = z.infer<typeof schema>;

export default function NewAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { mutateAsync: createAddr, isPending } = useCreateAddress();
  const [isDefault, setIsDefault] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [pin, setPin] = useState({ lat: 27.7172, lng: 85.3240 });
  const [pinSet, setPinSet] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { label: 'Home', province: 'Bagmati', district: 'Kathmandu', municipality: 'Kathmandu', ward: 1, landmark: '', street: '' },
  });

  const onSubmit = async (data: F) => {
    if (!user) return;
    await createAddr({
      userId: user.id, label: data.label, province: data.province,
      district: data.district, municipality: data.municipality,
      ward: data.ward, landmark: data.landmark, street: data.street,
      latitude: pin.lat, longitude: pin.lng,
      isPickupPointFallback: isPickup, isDefault,
    });
    router.back();
  };

  const FI = ({ name, label, keyboardType, required }: { name: keyof F; label: string; keyboardType?: any; required?: boolean }) => (
    <Controller control={control} name={name} render={({ field: { onChange, value } }) => (
      <TextInput label={label + (required ? ' *' : '')} value={String(value ?? '')} onChangeText={onChange} mode="outlined" keyboardType={keyboardType} error={!!errors[name]} />
    )} />
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Add New Address" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Label */}
          <Text variant="titleSmall" style={s.secTitle}>Address Label</Text>
          <View style={s.labelRow}>
            {['Home', 'Office', 'Other'].map(l => (
              <Controller key={l} control={control} name="label" render={({ field: { onChange, value } }) => (
                <TouchableOpacity style={[s.labelChip, value === l && s.labelChipSel]} onPress={() => onChange(l)}>
                  <Text style={[s.labelChipTxt, value === l && s.labelChipTxtSel]}>{l}</Text>
                </TouchableOpacity>
              )} />
            ))}
          </View>

          {/* Location Details */}
          <Text variant="titleSmall" style={s.secTitle}>Location Details</Text>
          <FI name="province" label="Province" required />
          {errors.province && <HelperText type="error">{errors.province.message}</HelperText>}
          <FI name="district" label="District" required />
          {errors.district && <HelperText type="error">{errors.district.message}</HelperText>}
          <FI name="municipality" label="Municipality / VDC" required />
          {errors.municipality && <HelperText type="error">{errors.municipality.message}</HelperText>}
          <FI name="ward" label="Ward Number" keyboardType="number-pad" required />
          {errors.ward && <HelperText type="error">{errors.ward.message}</HelperText>}

          {/* Address Details */}
          <Text variant="titleSmall" style={s.secTitle}>Address Details</Text>
          <FI name="landmark" label="Landmark (e.g. near XYZ school)" required />
          {errors.landmark && <HelperText type="error">{errors.landmark.message}</HelperText>}
          <FI name="street" label="Street / Tole (optional)" />

          {/* ── MAP PIN SECTION ── */}
          <Text variant="titleSmall" style={s.secTitle}>Map Pin *</Text>
          <TouchableOpacity onPress={() => setShowMap(true)} activeOpacity={0.8}>
            <Surface style={[s.mapBtn, pinSet && s.mapBtnSet]} elevation={1}>
              <Ionicons name={pinSet ? 'location' : 'map'} size={24} color={pinSet ? theme.colors.primary : '#888'} />
              <View style={s.mapBtnInfo}>
                <Text variant="labelMedium" style={[s.mapBtnLabel, pinSet && s.mapBtnLabelSet]}>
                  {pinSet ? 'Pin Set' : 'Tap to set map pin'}
                </Text>
                <Text variant="labelSmall" style={s.mapBtnSub}>
                  {pinSet
                    ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                    : 'Required — helps delivery agents find you'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={pinSet ? theme.colors.primary : '#ccc'} />
            </Surface>
          </TouchableOpacity>
          {!pinSet && (
            <Text style={s.pinWarning}>⚠ Map pin is required for accurate delivery</Text>
          )}

          {/* Toggles */}
          <View style={s.switchRow}>
            <View>
              <Text variant="bodyMedium" style={s.switchLabel}>Set as Default</Text>
              <Text variant="labelSmall" style={s.switchSub}>Use this address by default</Text>
            </View>
            <Switch value={isDefault} onValueChange={setIsDefault} thumbColor={isDefault ? theme.colors.primary : "#f4f3f4"} trackColor={{ false: "#e0e0e0", true: theme.colors.primaryContainer }} />
          </View>
          <View style={s.switchRow}>
            <View>
              <Text variant="bodyMedium" style={s.switchLabel}>Pickup Point Fallback</Text>
              <Text variant="labelSmall" style={s.switchSub}>Enable if delivery is weak in this area</Text>
            </View>
            <Switch value={isPickup} onValueChange={setIsPickup} thumbColor={isPickup ? theme.colors.primary : "#f4f3f4"} trackColor={{ false: "#e0e0e0", true: theme.colors.primaryContainer }} />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={!pinSet}
            style={s.btn}
            contentStyle={{ paddingVertical: SPACING.xs }}
          >
            Save Address
          </Button>
        </View>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Map Pin Picker Modal */}
      <MapPinPicker
        visible={showMap}
        initialLat={pin.lat}
        initialLng={pin.lng}
        onConfirm={(lat, lng) => {
          setPin({ lat, lng });
          setPinSet(true);
          setShowMap(false);
        }}
        onClose={() => setShowMap(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md },
  secTitle: { fontWeight: '700', color: '#222' },
  labelRow: { flexDirection: 'row', gap: SPACING.sm },
  labelChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 999, borderWidth: 1.5, borderColor: '#e0e0e0' },
  labelChipSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  labelChipTxt: { color: '#555' },
  labelChipTxtSel: { color: theme.colors.primary, fontWeight: '700' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: '#fafafa',
    borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  mapBtnSet: { borderColor: theme.colors.primary, backgroundColor: '#FFF5F5' },
  mapBtnInfo: { flex: 1 },
  mapBtnLabel: { fontWeight: '600', color: '#555' },
  mapBtnLabelSet: { color: theme.colors.primary },
  mapBtnSub: { color: '#888', marginTop: 2 },
  pinWarning: { color: '#FF8F00', fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: '#fafafa', borderRadius: RADIUS.md },
  switchLabel: { fontWeight: '500', color: '#222' },
  switchSub: { color: '#888' },
  btn: { marginTop: SPACING.md },
});
