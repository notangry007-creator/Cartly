import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.grey300 },
});

export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonLoader width={80} height={80} borderRadius={BorderRadius.sm} />
      <View style={skeletonStyles.info}>
        <SkeletonLoader height={16} width="70%" />
        <SkeletonLoader height={12} width="40%" style={{ marginTop: 8 }} />
        <SkeletonLoader height={14} width="50%" style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={skeletonStyles.orderTop}>
        <SkeletonLoader height={14} width="30%" />
        <SkeletonLoader height={20} width={80} borderRadius={BorderRadius.full} />
      </View>
      <SkeletonLoader height={16} width="60%" style={{ marginTop: 8 }} />
      <SkeletonLoader height={12} width="80%" style={{ marginTop: 6 }} />
      <View style={skeletonStyles.orderBottom}>
        <SkeletonLoader height={16} width="25%" />
        <SkeletonLoader height={12} width="35%" />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.md, marginBottom: 8 },
  info: { flex: 1, marginLeft: 12, gap: 0 },
  orderCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 16, marginBottom: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
