import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, ScrollView,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneStore } from '@/src/stores/zoneStore';
import { useRecentlyViewedStore } from '@/src/stores/recentlyViewedStore';
import { useWishlistStore } from '@/src/stores/wishlistStore';
import { useProducts, useCategories } from '@/src/hooks/useProducts';
import { PRODUCTS } from '@/src/data/seed';
import { BANNERS } from '@/src/data/seed';
import { ZONES } from '@/src/data/zones';
import { IMG } from '@/src/data/images';
import { requestNotificationPermission } from '@/src/utils/pushNotifications';
import CachedImage from '@/src/components/common/CachedImage';
import SectionHeader from '@/src/components/common/SectionHeader';
import HorizontalProductList from '@/src/components/common/HorizontalProductList';
import ZonePicker from '@/src/components/common/ZonePicker';
import { BannerSkeleton } from '@/src/components/common/SkeletonLoader';
import { theme, SPACING, RADIUS, useAppColors } from '@/src/theme';
import { ZoneId } from '@/src/types';

const { width: W } = Dimensions.get('window');

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { zoneId, setZone } = useZoneStore();
  const c = useAppColors();
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  // Request notification permission once on first home mount
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  // Auto-advance banners every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx(prev => {
        const next = (prev + 1) % BANNERS.length;
        bannerScrollRef.current?.scrollTo({ x: next * (W - SPACING.lg * 2), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: fastProducts, isLoading: loadingFast } = useProducts({ zoneId, isFastDelivery: true, inStock: true });
  const { data: verifiedProducts, isLoading: loadingVerified } = useProducts({ zoneId, isAuthenticated: true, inStock: true });
  const { data: dealProducts, isLoading: loadingDeals } = useProducts({ sortBy: 'price_asc', inStock: true });
  const { products: recentProducts } = useRecentlyViewedStore();
  const { productIds: wishlistIds } = useWishlistStore();
  const wishlistProducts = PRODUCTS.filter(p => wishlistIds.includes(p.id));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['categories'] }),
      qc.invalidateQueries({ queryKey: ['banners'] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const curZone = ZONES.find(z => z.id === zoneId);

  // Build page sections as FlatList data
  type Section =
    | { type: 'banners' }
    | { type: 'categories' }
    | { type: 'fast' }
    | { type: 'verified' }
    | { type: 'deals' }
    | { type: 'recent' }
    | { type: 'wishlist' };

  const sections: Section[] = [
    { type: 'banners' },
    { type: 'categories' },
    ...(recentProducts.length > 0 ? [{ type: 'recent' as const }] : []),
    ...(wishlistProducts.length > 0 ? [{ type: 'wishlist' as const }] : []),
    ...(zoneId === 'ktm_core' || zoneId === 'ktm_outer' ? [{ type: 'fast' as const }] : []),
    { type: 'verified' },
    { type: 'deals' },
  ];

  function renderSection({ item }: { item: Section }) {
    switch (item.type) {
      case 'banners':
        return (
          <>
            <ScrollView
              ref={bannerScrollRef}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              style={{ marginTop: SPACING.sm }}
              onScroll={e => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (W - SPACING.lg * 2)))}
              scrollEventThrottle={16}
            >
              {BANNERS.map(b => {
                const imgData = (IMG.banners as Record<string, { uri: string; blurhash: string }>)[b.id];
                return (
                  <TouchableOpacity
                    key={b.id} activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.title}${b.subtitle ? ': ' + b.subtitle : ''}`}
                    onPress={() => {
                      if (b.targetType === 'category' && b.targetId) router.push(`/category/${b.targetId}`);
                      else if (b.targetType === 'search') router.push({ pathname: '/search', params: { q: b.targetQuery } });
                    }}
                  >
                    <View style={s.banner}>
                      <CachedImage uri={imgData?.uri ?? b.imageUrl} blurhash={imgData?.blurhash} style={s.bannerImg} />
                      <View style={s.bannerOvl}>
                        <Text style={s.bannerTitle}>{b.title}</Text>
                        {b.subtitle && <Text style={s.bannerSub}>{b.subtitle}</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={s.dots}>
              {BANNERS.map((_, i) => <View key={i} style={[s.dot, i === bannerIdx && s.dotA]} />)}
            </View>
          </>
        );

      case 'categories':
        return (
          <>
            <SectionHeader title="Categories" onSeeAll={() => router.push('/(tabs)/categories')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {loadingCats
                ? Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={s.catItem}>
                      <View style={[s.catImgWrap, { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0e0e0' }]} />
                    </View>
                  ))
                : (categories ?? []).map(cat => {
                    const imgData = (IMG.categories as Record<string, { uri: string; blurhash: string }>)[cat.id];
                    return (
                      <TouchableOpacity key={cat.id} style={s.catItem} onPress={() => router.push(`/category/${cat.id}`)}>
                        <Surface style={s.catImgWrap} elevation={1}>
                          <CachedImage uri={imgData?.uri ?? cat.imageUrl} blurhash={imgData?.blurhash} style={s.catImg} />
                        </Surface>
                         <Text variant="labelSmall" style={[s.catLabel, { color: c.textSecondary }]} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })
              }
            </ScrollView>
          </>
        );

      case 'recent':
        return (
          <>
            <SectionHeader title="🕐 Recently Viewed" />
            <HorizontalProductList data={recentProducts} zoneId={zoneId} isLoading={false} />
          </>
        );

      case 'wishlist':
        return (
          <>
            <SectionHeader title="❤️ Your Wishlist" onSeeAll={() => router.push('/wishlist')} />
            <HorizontalProductList data={wishlistProducts} zoneId={zoneId} isLoading={false} />
          </>
        );

      case 'fast':
        return (
          <>
            <SectionHeader title="⚡ Fast Delivery" onSeeAll={() => router.push({ pathname: '/search', params: { fastDelivery: '1' } })} />
            <HorizontalProductList data={fastProducts} zoneId={zoneId} isLoading={loadingFast} />
          </>
        );

      case 'verified':
        return (
          <>
            <SectionHeader title="✅ Verified Sellers" onSeeAll={() => router.push({ pathname: '/search', params: { verified: '1' } })} />
            <HorizontalProductList data={verifiedProducts} zoneId={zoneId} isLoading={loadingVerified} />
          </>
        );

      case 'deals':
        return (
          <>
            <SectionHeader title="🔥 Top Deals" onSeeAll={() => router.push({ pathname: '/search', params: { sort: 'price_asc' } })} />
            <HorizontalProductList data={dealProducts} zoneId={zoneId} isLoading={loadingDeals} />
            <View style={{ height: SPACING.xl }} />
          </>
        );

      default:
        return null;
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: c.screenBg }]}>
      {/* Sticky top bar */}
      <View style={[s.topBar, { backgroundColor: c.cardBg }]}>
        <TouchableOpacity
          style={s.zoneBtn}
          onPress={() => setShowZonePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current delivery zone: ${curZone?.name ?? 'Select Zone'}. Tap to change`}
        >
          <Ionicons name="location" size={16} color={theme.colors.primary} accessibilityElementsHidden />
          <Text variant="labelMedium" style={[s.zoneName, { color: c.textSecondary }]} numberOfLines={1}>{curZone?.name ?? 'Select Zone'}</Text>
          <Ionicons name="chevron-down" size={14} color={c.textMuted} accessibilityElementsHidden />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={c.text} accessibilityElementsHidden />
        </TouchableOpacity>
      </View>

      {/* Search bar tap target */}
      <TouchableOpacity
        onPress={() => router.push('/search')}
        style={[s.searchWrap, { backgroundColor: c.cardBg }]}
        activeOpacity={0.85}
        accessibilityRole="search"
        accessibilityLabel="Search products"
        accessibilityHint="Tap to open search"
      >
        <View style={[s.searchFake, { backgroundColor: c.screenBg }]}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <Text style={[s.searchPlaceholder, { color: c.textMuted }]}>Search products...</Text>
        </View>
      </TouchableOpacity>

      {/* Main scrollable content — single FlatList, no nested VirtualizedList */}
      <FlatList
        data={sections}
        keyExtractor={item => item.type}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        removeClippedSubviews={false}
      />

      {/* Zone picker overlay */}
      {showZonePicker && (
        <ZonePicker
          currentZoneId={zoneId}
          onSelect={setZone}
          onDismiss={() => setShowZonePicker(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  zoneBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  zoneName: { fontWeight: '600', flex: 1 },
  searchWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, paddingBottom: SPACING.sm },
  searchFake: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  searchPlaceholder: { fontSize: 15, flex: 1 },
  banner: { width: W - SPACING.lg * 2, height: 160, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%' },
  bannerOvl: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: SPACING.md },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginVertical: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd' },
  dotA: { backgroundColor: theme.colors.primary, width: 14 },
  catRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  catItem: { alignItems: 'center', width: 70 },
  catImgWrap: { borderRadius: 999, overflow: 'hidden', marginBottom: 4 },
  catImg: { width: 56, height: 56, borderRadius: 999 },
  catLabel: { textAlign: 'center', lineHeight: 14 },
});
