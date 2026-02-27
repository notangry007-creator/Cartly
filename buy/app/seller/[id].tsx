import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSeller, useProducts } from '@/src/hooks/useProducts';
import { useZoneStore } from '@/src/stores/zoneStore';
import ProductCard from '@/src/components/common/ProductCard';
import { ProductGridSkeleton } from '@/src/components/common/SkeletonLoader';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import { formatNPR } from '@/src/utils/helpers';
import { theme, SPACING, RADIUS } from '@/src/theme';

export default function SellerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { zoneId } = useZoneStore();
  const { data: seller, isLoading: loadingSeller } = useSeller(id);
  const { data: products = [], isLoading: loadingProducts, refetch } = useProducts({
    // In production this would filter by sellerId via API
    // For now show all products since seed has sellerId
    inStock: true,
  });

  const sellerProducts = products.filter(p => p.sellerId === id);

  if (loadingSeller) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Seller" />
        <View style={s.notFound}>
          <Text>Seller not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={seller.name} />
      <FlatList
        data={sellerProducts}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.col}
        refreshControl={<RefreshControl refreshing={loadingProducts} onRefresh={refetch} colors={[theme.colors.primary]} />}
        ListHeaderComponent={() => (
          <View>
            {/* Seller header card */}
            <Surface style={s.sellerCard} elevation={2}>
              <View style={s.sellerTop}>
                <Image source={{ uri: seller.logoUrl }} style={s.logo} contentFit="cover" />
                <View style={s.sellerInfo}>
                  <View style={s.nameRow}>
                    <Text variant="titleLarge" style={s.name}>{seller.name}</Text>
                    {seller.isVerified && (
                      <View style={s.verBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#1565C0" />
                        <Text style={s.verTxt}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFA000" />
                    <Text variant="titleSmall" style={s.rating}>{seller.rating}</Text>
                    <Text variant="bodySmall" style={s.ratingCnt}>({seller.totalReviews} ratings)</Text>
                  </View>
                  <Chip
                    style={[s.fulfillChip, { backgroundColor: seller.fulfillmentType === 'buy_fulfilled' ? '#E8F5E9' : '#E3F2FD' }]}
                    textStyle={{ fontSize: 11, color: seller.fulfillmentType === 'buy_fulfilled' ? '#2E7D32' : '#1565C0' }}
                    compact
                  >
                    {seller.fulfillmentType === 'buy_fulfilled' ? '✅ Buy Fulfilled' : '📦 Seller Fulfilled'}
                  </Chip>
                </View>
              </View>

              {/* Return policy */}
              <View style={s.policyBox}>
                <Ionicons name="refresh-circle" size={16} color="#FF8F00" />
                <Text variant="bodySmall" style={s.policyTxt}>{seller.returnPolicy}</Text>
              </View>

              {/* Contact actions */}
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL('tel:' + seller.phone)}>
                  <Ionicons name="call" size={18} color={theme.colors.primary} />
                  <Text style={s.actionTxt}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL('https://wa.me/977' + seller.whatsapp)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={s.actionTxt}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </Surface>

            {/* Stats row */}
            <View style={s.statsRow}>
              {[
                { label: 'Products', value: String(sellerProducts.length) },
                { label: 'Rating', value: String(seller.rating) },
                { label: 'Reviews', value: String(seller.totalReviews) },
              ].map(stat => (
                <Surface key={stat.label} style={s.stat} elevation={1}>
                  <Text variant="headlineSmall" style={s.statVal}>{stat.value}</Text>
                  <Text variant="labelSmall" style={s.statLabel}>{stat.label}</Text>
                </Surface>
              ))}
            </View>

            <Text variant="titleMedium" style={s.productsTitle}>
              All Products ({sellerProducts.length})
            </Text>

            {loadingProducts && <ProductGridSkeleton count={4} />}
          </View>
        )}
        ListEmptyComponent={
          !loadingProducts ? (
            <View style={s.empty}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text variant="bodyMedium" style={{ color: '#888' }}>No products from this seller</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard product={item} zoneId={zoneId} onPress={() => router.push(`/product/${item.id}`)} />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sellerCard: { margin: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.lg, backgroundColor: '#fff', gap: SPACING.md },
  sellerTop: { flexDirection: 'row', gap: SPACING.md },
  logo: { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: '#f0f0f0' },
  sellerInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  name: { fontWeight: '800', color: '#222' },
  verBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verTxt: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontWeight: '700', color: '#333' },
  ratingCnt: { color: '#888' },
  fulfillChip: { alignSelf: 'flex-start' },
  policyBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: '#FFF8E1', padding: SPACING.sm, borderRadius: RADIUS.md },
  policyTxt: { flex: 1, color: '#555', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e0e0e0' },
  actionTxt: { fontWeight: '600', color: '#444' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  stat: { flex: 1, alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: '#fff' },
  statVal: { fontWeight: '800', color: theme.colors.primary },
  statLabel: { color: '#888' },
  productsTitle: { fontWeight: '700', color: '#222', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  grid: { paddingHorizontal: SPACING.sm, paddingBottom: SPACING.xl },
  col: { gap: 0 },
  empty: { justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl },
});
