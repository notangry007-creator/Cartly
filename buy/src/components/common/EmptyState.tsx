import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { SPACING, RADIUS, theme } from '../../theme';

// Preset configs for common empty states
const PRESETS: Record<string, { icon: string; color: string; bgColor: string }> = {
  cart:          { icon: 'bag-outline',         color: theme.colors.primary,  bgColor: theme.colors.primaryContainer },
  orders:        { icon: 'receipt-outline',      color: '#1565C0',             bgColor: '#E3F2FD' },
  wishlist:      { icon: 'heart-outline',        color: '#C62828',             bgColor: '#FFEBEE' },
  search:        { icon: 'search-outline',       color: '#555',                bgColor: '#F5F5F5' },
  notifications: { icon: 'notifications-outline',color: '#FF8F00',             bgColor: '#FFF8E1' },
  returns:       { icon: 'return-up-back-outline',color: '#2E7D32',            bgColor: '#E8F5E9' },
  addresses:     { icon: 'location-outline',     color: theme.colors.primary,  bgColor: theme.colors.primaryContainer },
  default:       { icon: 'cube-outline',         color: '#888',                bgColor: '#F5F5F5' },
};

interface Props {
  icon?: string;
  preset?: keyof typeof PRESETS;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  secondaryLabel?: string;
  onAction?: () => void;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon,
  preset = 'default',
  title,
  subtitle,
  actionLabel,
  secondaryLabel,
  onAction,
  onSecondary,
}: Props) {
  const p = PRESETS[preset] ?? PRESETS.default;
  const finalIcon = icon ?? p.icon;

  // Entrance animation
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withDelay(100, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={s.container}>
      <Animated.View style={[s.iconArea, animStyle]}>
        {/* Decorative rings */}
        <View style={[s.ringOuter, { borderColor: p.bgColor }]} />
        <View style={[s.ringInner, { borderColor: p.bgColor, backgroundColor: p.bgColor }]} />
        <Ionicons name={finalIcon as any} size={52} color={p.color} />
      </Animated.View>

      <Text variant="titleMedium" style={s.title}>{title}</Text>
      {subtitle && <Text variant="bodySmall" style={s.sub}>{subtitle}</Text>}

      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={s.btn} contentStyle={s.btnContent}>
          {actionLabel}
        </Button>
      )}
      {secondaryLabel && onSecondary && (
        <Button mode="outlined" onPress={onSecondary} style={s.secondaryBtn}>
          {secondaryLabel}
        </Button>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
    minHeight: 280,
  },
  iconArea: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  ringOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    opacity: 0.4,
  },
  ringInner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    opacity: 0.6,
  },
  title: { color: '#444', fontWeight: '700', textAlign: 'center' },
  sub: { color: '#999', textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: SPACING.xs },
  btnContent: { paddingHorizontal: SPACING.lg },
  secondaryBtn: { marginTop: SPACING.xs - 4 },
});
