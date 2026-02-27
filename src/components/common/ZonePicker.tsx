import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ZONES } from '../../data/zones';
import { ZoneId } from '../../types';
import { SPACING, RADIUS, useAppColors, useAppTheme } from '../../theme';

interface Props {
  /** Currently selected zone id. */
  currentZoneId: ZoneId;
  /** Called when the user taps a zone option. */
  onSelect: (zoneId: ZoneId) => Promise<void>;
  /** Called when the user taps the backdrop to dismiss. */
  onDismiss: () => void;
}

/**
 * Full-screen backdrop with a bottom-sheet zone selection panel.
 * Extracted from home.tsx where it was rendered as an inline overlay.
 * Reusable on any screen that needs zone selection.
 */
export default function ZonePicker({ currentZoneId, onSelect, onDismiss }: Props) {
  const c = useAppColors();
  const t = useAppTheme();

  return (
    <TouchableOpacity
      style={s.overlay}
      activeOpacity={1}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Close zone picker"
    >
      <TouchableOpacity
        style={[s.sheet, { backgroundColor: c.cardBg }]}
        activeOpacity={1}
        onPress={e => e.stopPropagation()}
      >
        <Text variant="titleMedium" style={[s.sheetTitle, { color: c.text }]}>
          Select Delivery Zone
        </Text>

        {ZONES.map(zone => {
          const selected = currentZoneId === zone.id;
          return (
            <TouchableOpacity
              key={zone.id}
              style={[
                s.option,
                { borderColor: c.border },
                selected && { borderColor: t.colors.primary, backgroundColor: t.colors.primaryContainer },
              ]}
              onPress={async () => {
                await onSelect(zone.id as ZoneId);
                onDismiss();
                Haptics.selectionAsync();
              }}
              accessibilityRole="radio"
              accessibilityLabel={`${zone.name}, ${zone.codAvailable ? 'COD available' : 'Prepaid only'}`}
              accessibilityState={{ checked: selected }}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selected ? t.colors.primary : c.textDisabled}
              />
              <View style={{ marginLeft: SPACING.sm }}>
                <Text variant="bodyMedium" style={[s.optionName, { color: c.text }]}>
                  {zone.name}
                </Text>
                <Text variant="labelSmall" style={{ color: c.textMuted }}>
                  {zone.codAvailable ? 'COD available' : 'Prepaid only'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  sheetTitle: { fontWeight: '700', marginBottom: SPACING.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  optionName: { fontWeight: '600' },
});
