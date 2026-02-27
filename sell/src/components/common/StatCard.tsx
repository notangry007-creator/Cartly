import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../theme';

interface Props {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  change?: number;
}

export default function StatCard({ label, value, icon, iconColor = Colors.primary, change }: Props) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {change !== undefined && (
        <View style={styles.changeRow}>
          <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={14} color={isPositive ? Colors.success : Colors.danger} />
          <Text style={[styles.changeText, { color: isPositive ? Colors.success : Colors.danger }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, gap: 3 },
  changeText: { fontSize: FontSize.xs, fontWeight: '600' },
});
