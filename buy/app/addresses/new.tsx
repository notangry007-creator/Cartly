import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
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
import {
  getProvinceNames,
  getDistrictsForProvince,
  getMunicipalitiesForDistrict,
} from '../../src/data/nepal-admin';

const schema = z.object({
  label: z.string().min(1, 'Label required'),
  province: z.string().min(1, 'Province required'),
  district: z.string().min(1, 'District required'),
  municipality: z.string().min(1, 'Municipality required'),
  ward: z.coerce.number().min(1, 'Ward required').max(35, 'Ward number must be between 1 and 35'),
  landmark: z.string().min(3, 'Landmark required (min 3 chars)'),
  street: z.string().optional(),
});
type F = z.infer<typeof schema>;

type PickerField = 'province' | 'district' | 'municipality' | null;

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
  const [activePicker, setActivePicker] = useState<PickerField>(null);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: 'Home',
      province: '',
      district: '',
      municipality: '',
      ward: 1,
      landmark: '',
      street: '',
    },
  });

  const selectedProvince = watch('province');
  const selectedDistrict = watch('district');

  const provinces = getProvinceNames();
  const districts = selectedProvince ? getDistrictsForProvince(selectedProvince) : [];
  const municipalities = (selectedProvince && selectedDistrict)
    ? getMunicipalitiesForDistrict(selectedProvince, selectedDistrict)
    : [];

  const onSubmit = async (data: F) => {
    if (!user) return;
    await createAddr({
      userId: user.id,
      label: data.label,
      province: data.province,
      district: data.district,
      municipality: data.municipality,
      ward: data.ward,
      landmark: data.landmark,
      street: data.street,
      latitude: pin.lat,
      longitude: pin.lng,
      isPickupPointFallback: isPickup,
      isDefault,
    });
    router.back();
  };

  function DropdownField({
    name,
    label,
    options,
    disabled,
    required,
  }: {
    name: keyof F;
    label: string;
    options: string[];
    disabled?: boolean;
    required?: boolean;
  }) {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => (
          <TouchableOpacity
            onPress={() => !disabled && setActivePicker(name as PickerField)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Surface
              style={[
                s.dropdownBtn,
                errors[name] && s.dropdownBtnError,
                disabled && s.dropdownBtnDisabled,
              ]}
              elevation={0}
            >
              <Text
                variant="bodyMedium"
                style={[s.dropdownTxt, !value && s.dropdownPlaceholder, disabled && s.dropdownDisabledTxt]}
              >
                {value || `Select ${label}${required ? ' *' : ''}`}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={disabled ? '#ccc' : '#666'}
              />
            </Surface>
          </TouchableOpacity>
        )}
      />
    );
  }

  const pickerOptions: string[] = activePicker === 'province'
    ? provinces
    : activePicker === 'district'
    ? districts
    : activePicker === 'municipality'
    ? municipalities
    : [];

  const pickerTitle = activePicker === 'province'
    ? 'Select Province'
    : activePicker === 'district'
    ? 'Select District'
    : 'Select Municipality';

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
                <TouchableOpacity
                  style={[s.labelChip, value === l && s.labelChipSel]}
                  onPress={() => onChange(l)}
                >
                  <Text style={[s.labelChipTxt, value === l && s.labelChipTxtSel]}>{l}</Text>
                </TouchableOpacity>
              )} />
            ))}
          </View>

          {/* Province dropdown */}
          <Text variant="titleSmall" style={s.secTitle}>Location Details</Text>
          <Text variant="labelSmall" style={s.fieldLabel}>Province *</Text>
          <DropdownField name="province" label="Province" options={provinces} required />
          {errors.province && <HelperText type="error">{errors.province.message}</HelperText>}

          {/* District dropdown */}
          <Text variant="labelSmall" style={s.fieldLabel}>District *</Text>
          <DropdownField
            name="district"
            label="District"
            options={districts}
            disabled={!selectedProvince}
            required
          />
          {errors.district && <HelperText type="error">{errors.district.message}</HelperText>}
          {!selectedProvince && (
            <Text variant="labelSmall" style={s.hintTxt}>Select province first</Text>
          )}

          {/* Municipality dropdown */}
          <Text variant="labelSmall" style={s.fieldLabel}>Municipality / VDC *</Text>
          <DropdownField
            name="municipality"
            label="Municipality"
            options={municipalities}
            disabled={!selectedDistrict}
            required
          />
          {errors.municipality && <HelperText type="error">{errors.municipality.message}</HelperText>}
          {!selectedDistrict && (
            <Text variant="labelSmall" style={s.hintTxt}>Select district first</Text>
          )}

          {/* Ward number */}
          <Text variant="labelSmall" style={s.fieldLabel}>Ward Number *</Text>
          <Controller
            control={control}
            name="ward"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Ward Number *"
                value={String(value ?? '')}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="number-pad"
                error={!!errors.ward}
              />
            )}
          />
          {errors.ward && <HelperText type="error">{errors.ward.message}</HelperText>}

          {/* Address Details */}
          <Text variant="titleSmall" style={s.secTitle}>Address Details</Text>
          <Controller
            control={control}
            name="landmark"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Landmark (e.g. near XYZ school) *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                error={!!errors.landmark}
              />
            )}
          />
          {errors.landmark && <HelperText type="error">{errors.landmark.message}</HelperText>}

          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Street / Tole (optional)"
                value={value}
                onChangeText={onChange}
                mode="outlined"
              />
            )}
          />

          {/* Map Pin Section */}
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
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              thumbColor={isDefault ? theme.colors.primary : '#f4f3f4'}
              trackColor={{ false: '#e0e0e0', true: theme.colors.primaryContainer }}
            />
          </View>
          <View style={s.switchRow}>
            <View>
              <Text variant="bodyMedium" style={s.switchLabel}>Pickup Point Fallback</Text>
              <Text variant="labelSmall" style={s.switchSub}>Enable if delivery is weak in this area</Text>
            </View>
            <Switch
              value={isPickup}
              onValueChange={setIsPickup}
              thumbColor={isPickup ? theme.colors.primary : '#f4f3f4'}
              trackColor={{ false: '#e0e0e0', true: theme.colors.primaryContainer }}
            />
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

      {/* Province/District/Municipality Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={s.pickerOverlay}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHeader}>
              <Text variant="titleMedium" style={s.pickerTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.pickerList}>
              {pickerOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={s.pickerItem}
                  onPress={() => {
                    if (activePicker === 'province') {
                      setValue('province', option);
                      setValue('district', '');
                      setValue('municipality', '');
                    } else if (activePicker === 'district') {
                      setValue('district', option);
                      setValue('municipality', '');
                    } else if (activePicker === 'municipality') {
                      setValue('municipality', option);
                    }
                    setActivePicker(null);
                  }}
                >
                  <Text variant="bodyMedium" style={s.pickerItemTxt}>{option}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </TouchableOpacity>
              ))}
              {pickerOptions.length === 0 && (
                <View style={s.pickerEmpty}>
                  <Text variant="bodySmall" style={{ color: '#888' }}>No options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md },
  secTitle: { fontWeight: '700', color: '#222' },
  fieldLabel: { color: '#555', marginBottom: -SPACING.xs },
  hintTxt: { color: '#aaa', fontSize: 11, marginTop: -SPACING.xs },
  labelRow: { flexDirection: 'row', gap: SPACING.sm },
  labelChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 999, borderWidth: 1.5, borderColor: '#e0e0e0' },
  labelChipSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  labelChipTxt: { color: '#555' },
  labelChipTxtSel: { color: theme.colors.primary, fontWeight: '700' },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  dropdownBtnError: { borderColor: theme.colors.error },
  dropdownBtnDisabled: { backgroundColor: '#f8f8f8', borderColor: '#f0f0f0' },
  dropdownTxt: { color: '#222', flex: 1 },
  dropdownPlaceholder: { color: '#aaa' },
  dropdownDisabledTxt: { color: '#ccc' },
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
  // Picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerTitle: { fontWeight: '700', color: '#222' },
  pickerList: { padding: SPACING.sm },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: RADIUS.md },
  pickerItemTxt: { color: '#333', flex: 1 },
  pickerEmpty: { padding: SPACING.xl, alignItems: 'center' },
});
