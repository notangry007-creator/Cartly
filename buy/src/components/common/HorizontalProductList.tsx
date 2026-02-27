import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Product, ZoneId } from '../../types';
import ProductCard from './ProductCard';
import { ProductRowSkeleton } from './SkeletonLoader';
import { SPACING } from '../../theme';

interface Props {
  data?: Product[];
  zoneId: ZoneId;
  isLoading: boolean;
  /** Maximum number of items to display. Defaults to 8. */
  maxItems?: number;
}

/**
 * A horizontally scrolling row of ProductCards with a built-in loading skeleton.
 * Extracted from home.tsx where it was defined inline and duplicated across
 * the category and seller screens.
 */
export default function HorizontalProductList({
  data,
  zoneId,
  isLoading,
  maxItems = 8,
}: Props) {
  const router = useRouter();

  if (isLoading) return <ProductRowSkeleton count={3} />;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SPACING.md }}
    >
      {(data ?? []).slice(0, maxItems).map(item => (
        <View key={item.id} style={{ width: 160 }}>
          <ProductCard
            product={item}
            zoneId={zoneId}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        </View>
      ))}
    </ScrollView>
  );
}
