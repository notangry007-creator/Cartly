import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText, Switch } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAddresses, useUpdateAddress } from '../../../src/hooks/useAddresses';
import ScreenHeader from '../../../src/components/common/ScreenHeader';
import MapPinPicker from '../../../src/components/common/MapPinPicker';
import { useToast } from '../../../src/context/ToastContext';
import { SPACING, RADIUS, theme } from '../../../src/theme';

const schema = z.object({
  label: z.string().min(1, 'Required'),
  province: z.string().min(1, 'Required'),
  district: z.string().min(1, 'Required'),
  municipality: z.string().min(1, 'Required'),
  ward: z.coerce.number().min(1, 'Required'),
  landmark: z.string().min(3, 'Min 3 characters'),
  street: z.string().optional(),
});
type F = z.infer<typeof schema>;

export default function EditAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: addressId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: addresses = [] } = useAddresses(user?.id ?? '');
  const { mutateAsync: updateAddress, isPending } = useUpdateAddress();
  const { showSuccess, showError } = useToast();

  const address = addresses.find(a => a.id === addressId);
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);
  const [isPickup, setIsPickup] = useState(address?.isPickupPointFallback ?? false);
  const [showMap, setShowMap] = useState(false);
  const [pin, setPin] = useState({ lat: address?.latitude ?? 27.7172, lng: address?.longitude ?? 85.3240 });
  const [pinSet, setPinSet] = useState(true);

  const { control, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: address?.label ?? 'Home',
      province: address?.province ?? 'Bagmati',
      district: address?.district ?? 'Kathmandu',
      municipality: address?.municipality ?? 'Kathmandu',
      ward: address?.ward ?? 1,
      landmark: address?.landmark ?? '',
      street: address?.street ?? '',
    },
  });

  const onSubmit = async (data: F) => {
    if (!user || !address) return;
    try {
      await updateAddress({
        ...address,
        label: data.label, province: data.province, district: data.district,
        municipality: data.municipality, ward: data.ward, landmark: data.landmark,
        street: data.street, latitude: pin.lat, longitude: pin.lng,
        isDefault, isPickupPointFallback: isPickup,
      });
      showSuccess('Address updated');
      router.back();
    } catch {
      showError('Failed to update address');
    }
  };

  if (!address) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Edit Address" />
        <View style={s.notFound}><Text>Address not found</Text></View>
      </View>
    );
  }

  const FI = ({ name, label, kbType }: { name: keyof F; label: string; kbType?: any }) => (
    <Controller control={control} name={name} render={({ field: { onChange, value } }) => (
      <TextInput label={label} value={String(value ?? '')} onChangeText={onChange} mode="outlined" keyboardType={kbType} error={!!errors[name]} />
    )} />
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Edit Address" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Text variant="titleSmall" style={s.secTitle}>Address Label</Text>
          <View style={s.labelRow}>
            {['Home', 'Office', 'Other'].map(l => (
              <Controller key={l} control={control} name="label" render={({ field: { onChange, value } }) => (
                <TouchableOpacity style={[s.chip, value === l && s.chipSel]} onPress={() => onChange(l)}>
                  <Text style={[s.chipTxt, value === l && s.chipTxtSel]}>{l}</Text>
                </TouchableOpacity>
              )} />
            ))}
          </View>

          <FI name="province" label="Province *" />
          {errors.province && <HelperText type="error">{errors.province.message}</HelperText>}
          <FI name="district" label="District *" />
          {errors.district && <HelperText type="error">{errors.district.message}</HelperText>}
          <FI name="municipality" label="Municipality / VDC *" />
          {errors.municipality && <HelperText type="error">{errors.municipality.message}</HelperText>}
          <FI name="ward" label="Ward Number *" kbType="number-pad" />
          {errors.ward && <HelperText type="error">{errors.ward.message}</HelperText>}
          <FI name="landmark" label="Landmark *" />
          {errors.landmark && <HelperText type="error">{errors.landmark.message}</HelperText>}
          <FI name="street" label="Street / Tole (optional)" />

          <TouchableOpacity onPress={() => setShowMap(true)} activeOpacity={0.8}>
            <View style={s.mapBtn}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)} — Tap to change
              </Text>
            </View>
          </TouchableOpacity>

          <View style={s.switchRow}>
            <View><Text variant="bodyMedium" style={s.switchLabel}>Set as Default</Text></View>
            <Switch value={isDefault} onValueChange={setIsDefault} color={theme.colors.primary} />
          </View>
          <View style={s.switchRow}>
            <View><Text variant="bodyMedium" style={s.switchLabel}>Pickup Point Fallback</Text></View>
            <Switch value={isPickup} onValueChange={setIsPickup} color={theme.colors.primary} />
          </View>

          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isPending} contentStyle={{ paddingVertical: SPACING.xs }}>
            Save Changes
          </Button>
        </View>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      <MapPinPicker
        visible={showMap}
        initialLat={pin.lat}
        initialLng={pin.lng}
        onConfirm={(lat, lng) => { setPin({ lat, lng }); setShowMap(false); }}
        onClose={() => setShowMap(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.lg, gap: SPACING.md },
  secTitle: { fontWeight: '700', color: '#222' },
  labelRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 999, borderWidth: 1.5, borderColor: '#e0e0e0' },
  chipSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  chipTxt: { color: '#555' },
  chipTxtSel: { color: theme.colors.primary, fontWeight: '700' },
  mapBtn: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: theme.colors.primary, backgroundColor: '#FFF5F5' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: '#fafafa', borderRadius: RADIUS.md },
  switchLabel: { fontWeight: '500', color: '#222' },
});
