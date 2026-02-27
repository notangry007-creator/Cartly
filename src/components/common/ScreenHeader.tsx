import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SPACING, useAppColors } from '../../theme';

interface Props {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, showBack = true, right }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useAppColors();

  return (
    <View
      style={[
        s.container,
        {
          paddingTop: insets.top + SPACING.sm,
          backgroundColor: c.cardBg,
          borderBottomColor: c.divider,
        },
      ]}
    >
      <View style={s.inner}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.btn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={c.text} />
          </TouchableOpacity>
        ) : (
          <View style={s.btn} />
        )}
        <Text variant="titleMedium" style={[s.title, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.right}>{right ?? <View style={s.btn} />}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingBottom: SPACING.sm, borderBottomWidth: 1 },
  inner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md },
  btn: { width: 36, height: 36, justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontWeight: '600' },
  right: { width: 36, alignItems: 'flex-end' },
});
