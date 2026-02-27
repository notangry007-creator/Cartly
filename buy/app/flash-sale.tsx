import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useZoneStore } from '../src/stores/zoneStore';
import { getActiveFlashSales } from '../src/data/flash-sales';
import { PRODUCTS } from '../src/data/seed';
import ProductCard from '../src/components/common/ProductCard';
import FlashSaleCountdown from '../src/components/common/FlashSaleCountdown';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

export default function FlashSaleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { zoneId } = useZoneStore();
  const activeSales = getActiveFlashSales();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="⚡ Flash Sales" />
      <FlatList
        data={activeSales}
        keyExtractor={fs => fs.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text variant="titleMedium" style={{ color: '#555' }}>No active flash sales</Text>
            <Text variant="bodySmall" style={{ color: '#888', textAlign: 'center' }}>
              Check back soon for limited-time deals!
            </Text>
          </View>
        }
        renderItem={({ item: sale }) => {
          const saleProducts = PRODUCTS.filter(p => sale.productIds.includes(p.id) && p.inStock);
          return (
            <View style={s.saleSection}>
              {/* Sale header */}
              <Surface style={[s.saleHeader, { backgroundColor: sale.badgeColor }]} elevation={2}>
                <View style={s.saleHeaderLeft}>
                  <Text style={s.saleTitle}>{sale.title}</Text>
                  <Text style={s.saleSubtitle}>{sale.subtitle}</Text>
                </View>
                <FlashSaleCountdown endsAt={sale.endsAt} />
              </Surface>

              {/* Sale products */}
              <FlatList
                horizontal
                data={saleProducts}
                keyExtractor={p => p.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.productsRow}
                renderItem={({ item: product }) => (
                  <View style={s.productWrap}>
                    <ProductCard
                      product={product}
                      zoneId={zoneId}
                      onPress={() => router.push('/product/' + product.id)}
                    />
                    {/* Flash sale discount badge */}
                    <View style={[s.flashBadge, { backgroundColor: sale.badgeColor }]}>
                      <Text style={s.flashBadgeTxt}>{sale.discountPercent}% OFF</Text>
                    </View>
                  </View>
                )}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: SPACING.md, gap: SPACING.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 300 },
  saleSection: { gap: SPACING.sm },
  saleHeader: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleHeaderLeft: { flex: 1, gap: 2 },
  saleTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  saleSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  productsRow: { paddingHorizontal: SPACING.xs, gap: SPACING.sm },
  productWrap: { width: 160, position: 'relative' },
  flashBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    zIndex: 1,
  },
  flashBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
