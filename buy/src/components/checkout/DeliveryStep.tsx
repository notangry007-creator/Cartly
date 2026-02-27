import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, RadioButton, Surface } from 'react-native-paper';
import { DeliveryOption, ZoneId } from '../../types';
import { DELIVERY_FEE_MAP } from '../../data/zones';
import { formatNPR } from '../../utils/helpers';
import { SPACING, RADIUS, useAppColors, useAppTheme } from '../../theme';

const LABELS: Record<DeliveryOption, string> = {
  same_day: '⚡ Same Day',
  next_day: '🚲 Next Day',
  standard: '📦 Standard',
  pickup: '🏪 Pickup',
};

const ETA: Record<DeliveryOption, string> = {
  same_day: 'Delivered today',
  next_day: 'Delivered tomorrow',
  standard: '3–5 business days',
  pickup: 'Pick up from nearest point',
};

interface Props {
  options: DeliveryOption[];
  zoneId: ZoneId;
  selected: DeliveryOption;
  onSelect: (opt: DeliveryOption) => void;
}

export default function DeliveryStep({ options, zoneId, selected, onSelect }: Props) {
  const c = useAppColors();
  const t = useAppTheme();

  return (
    <View style={s.container}>
      <Text variant="titleMedium" style={[s.title, { color: c.text }]}>
        Choose Delivery
      </Text>

      {options.map(opt => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity key={opt} onPress={() => onSelect(opt)} activeOpacity={0.8}>
            <Surface
              style={[
                s.card,
                { borderColor: isSelected ? t.colors.primary : 'transparent', backgroundColor: c.cardBg },
                isSelected && { backgroundColor: t.colors.primaryContainer },
              ]}
              elevation={1}
            >
              <RadioButton.Android
                value={opt}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => onSelect(opt)}
                color={t.colors.primary}
              />
              <View style={s.info}>
                <Text variant="titleSmall" style={[s.optLabel, { color: c.text }]}>
                  {LABELS[opt]}
                </Text>
                <Text variant="bodySmall" style={{ color: c.textMuted, marginTop: 2 }}>
                  {ETA[opt]}
                </Text>
              </View>
              <Text variant="titleSmall" style={{ color: t.colors.primary, fontWeight: '700' }}>
                {formatNPR(DELIVERY_FEE_MAP[zoneId]?.[opt] ?? 0)}
              </Text>
            </Surface>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  title: { fontWeight: '700', marginBottom: SPACING.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  info: { flex: 1 },
  optLabel: { fontWeight: '600' },
});
