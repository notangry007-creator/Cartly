import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { RADIUS } from '../../theme';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = RADIUS.sm, style }: Props) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.9], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[
        s.box,
        { width: width as any, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
}

// Pre-built product card skeleton
export function ProductCardSkeleton() {
  return (
    <View style={s.cardWrap}>
      <SkeletonBox width="100%" height={140} borderRadius={RADIUS.md} />
      <View style={s.cardInfo}>
        <SkeletonBox width="90%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonBox width="60%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonBox width="40%" height={16} />
      </View>
    </View>
  );
}

// Grid of skeletons for loading state
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.gridItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

// Horizontal list skeleton
export function ProductRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={s.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.rowItem}>
          <SkeletonBox width={160} height={140} borderRadius={RADIUS.md} />
          <View style={{ padding: 8 }}>
            <SkeletonBox width={130} height={11} style={{ marginBottom: 5 }} />
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Banner skeleton
export function BannerSkeleton() {
  return <SkeletonBox width="100%" height={160} borderRadius={RADIUS.lg} style={{ marginHorizontal: 16 }} />;
}

// Cart item skeleton
export function CartItemSkeleton() {
  return (
    <View style={s.cartItem}>
      <SkeletonBox width={80} height={80} borderRadius={RADIUS.sm} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="85%" height={12} />
        <SkeletonBox width="50%" height={11} />
        <SkeletonBox width="40%" height={16} />
        <SkeletonBox width={90} height={28} borderRadius={RADIUS.sm} />
      </View>
    </View>
  );
}

// Order card skeleton
export function OrderCardSkeleton() {
  return (
    <View style={s.orderCard}>
      <View style={s.orderCardRow}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={70} height={22} borderRadius={RADIUS.full} />
      </View>
      <View style={s.orderCardBody}>
        <SkeletonBox width={60} height={60} borderRadius={RADIUS.sm} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width="80%" height={12} />
          <SkeletonBox width="50%" height={11} />
          <SkeletonBox width="35%" height={11} />
        </View>
        <SkeletonBox width={60} height={18} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: '#E0E0E0' },
  cardWrap: { borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#fff', margin: 4 },
  cardInfo: { padding: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  gridItem: { width: '50%', padding: 4 },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  rowItem: { width: 160, backgroundColor: '#fff', borderRadius: RADIUS.md, overflow: 'hidden' },
  cartItem: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
  orderCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 14, marginBottom: 8, gap: 10 },
  orderCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCardBody: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
