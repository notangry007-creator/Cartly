import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SPACING, useAppColors, useAppTheme } from '../../theme';

interface Props {
  title: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: Props) {
  const c = useAppColors();
  const t = useAppTheme();

  return (
    <View style={s.row}>
      <Text variant="titleMedium" style={[s.title, { color: c.text }]}>
        {title}
      </Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={8} accessibilityRole="button" accessibilityLabel={`See all ${title}`}>
          <Text variant="labelMedium" style={{ color: t.colors.primary }}>
            See All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  title: { fontWeight: '700' },
});
