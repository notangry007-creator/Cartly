import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, ScrollView,
} from 'react-native';
import { Text, Searchbar, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneStore } from '../../src/stores/zoneStore';
import { useRecentlyViewedStore } from '../../src/stores/recentlyViewedStore';
import { useWishlistStore } from '../../src/stores/wishlistStore';
import { useProducts, useCategories } from '../../src/hooks/useProducts';
import { PRODUCTS, CATEGORIES, FLASH_SALES, FlashSale } from '../../src/data/seed';
import { ZONES } from '../../src/data/zones';
import { BANNERS } from '../../src/data/seed';
import { IMG } from '../../src/data/images';
import { requestNotificationPermission } from '../../src/utils/pushNotifications';
import * as Haptics from 'expo-haptics';
import ProductCard from '../../src/components/common/ProductCard';
import CachedImage from '../../src/components/common/CachedImage';
import { BannerSkeleton, ProductRowSkeleton } from '../../src/components/common/SkeletonLoader';
import { theme, SPACING, RADIUS } from '../../src/theme';
import { ZoneId, Product } from '../../src/types';

const { width: W } = Dimensions.get('window');

// ─── Flash Sale Countdown ────────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = React.useState(0);
  React.useEffect(() => {
    function calc() { setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())); }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  return { h, m, sec, expired: remaining === 0 };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={cd.unit}>
      <Text style={cd.num}>{String(value).padStart(2, '0')}</Text>
      <Text style={cd.label}>{label}</Text>
    </View>
  );
}
const cd = StyleSheet.create({
  unit: { alignItems: 'center', minWidth: 36 },
  num: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 24 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600' },
});

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <Text variant="titleMedium" style={sh.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
          <Text variant="labelMedium" style={sh.all}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  title: { fontWeight: '700', color: '#222' },
  all: { color: theme.colors.primary },
});

// ─── Horizontal product row ──────────────────────────────────────────────────
function HorizontalProducts({ data, zoneId, isLoading }: { data?: Product[]; zoneId: ZoneId; isLoading: boolean }) {
  const router = useRouter();
  if (isLoading) return <ProductRowSkeleton count={3} />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md }}>
      {(data ?? []).slice(0, 8).map(item => (
        <View key={item.id} style={{ width: 160 }}>
          <ProductCard product={item} zoneId={zoneId} onPress={() => router.push(`/product/${item.id}`)} />
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Flash Sale Section ───────────────────────────────────────────────────────
function FlashSaleSection({ sale, products, zoneId, router }: { sale: FlashSale; products: Product[]; zoneId: ZoneId; router: any }) {
  const { h, m, sec, expired } = useCountdown(sale.endsAt);
  if (expired) return null;
  return (
    <View style={fs.container}>
      <View style={fs.header}>
        <View style={fs.titleWrap}>
          <Text style={fs.title}>{sale.title}</Text>
          <Text style={fs.subtitle}>{sale.subtitle}</Text>
        </View>
        <View style={fs.countdown}>
          <CountdownUnit value={h} label="HRS" />
          <Text style={fs.colon}>:</Text>
          <CountdownUnit value={m} label="MIN" />
          <Text style={fs.colon}>:</Text>
          <CountdownUnit value={sec} label="SEC" />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.sm }}>
        {products.slice(0, 8).map(item => (
          <View key={item.id} style={{ width: 160 }}>
            <ProductCard product={item} zoneId={zoneId} onPress={() => router.push(`/product/${item.id}`)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const fs = StyleSheet.create({
  container: { marginTop: SPACING.md, backgroundColor: '#1a1a2e', borderRadius: RADIUS.lg, marginHorizontal: SPACING.md, overflow: 'hidden', paddingBottom: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  titleWrap: { flex: 1 },
  title: { color: '#FFD700', fontSize: 16, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colon: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
});

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { zoneId, setZone } = useZoneStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerScrollRef = useRef<any>(null);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

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

  // Active flash sales (not expired)
  const activeFlashSales = FLASH_SALES.filter(fs => new Date(fs.endsAt) > new Date());

  // Build page sections as FlatList data
  type Section =
    | { type: 'banners' }
    | { type: 'categories' }
    | { type: 'flash_sale'; saleId: string }
    | { type: 'fast' }
    | { type: 'verified' }
    | { type: 'deals' }
    | { type: 'recent' }
    | { type: 'wishlist' };

  const sections: Section[] = [
    { type: 'banners' },
    { type: 'categories' },
    ...activeFlashSales.map(fs => ({ type: 'flash_sale' as const, saleId: fs.id })),
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

      case 'categories': {
        const subcats = expandedCatId
          ? CATEGORIES.filter(c => c.parentId === expandedCatId)
          : [];
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
                    const isExpanded = expandedCatId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={s.catItem}
                        onPress={() => {
                          const hasSubs = CATEGORIES.some(c => c.parentId === cat.id);
                          if (hasSubs) {
                            setExpandedCatId(isExpanded ? null : cat.id);
                            Haptics.selectionAsync();
                          } else {
                            router.push(`/category/${cat.id}`);
                          }
                        }}
                      >
                        <Surface style={[s.catImgWrap, isExpanded && s.catImgWrapSel]} elevation={1}>
                          <CachedImage uri={imgData?.uri ?? cat.imageUrl} blurhash={imgData?.blurhash} style={s.catImg} />
                        </Surface>
                        <Text variant="labelSmall" style={[s.catLabel, isExpanded && s.catLabelSel]} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })
              }
            </ScrollView>
            {/* Subcategory drill-down row */}
            {subcats.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.subcatRow}>
                {subcats.map(sub => (
                  <TouchableOpacity
                    key={sub.id}
                    style={s.subcatChip}
                    onPress={() => { router.push(`/category/${sub.id}`); setExpandedCatId(null); }}
                  >
                    <Text style={s.subcatChipTxt}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[s.subcatChip, s.subcatChipAll]}
                  onPress={() => { router.push(`/category/${expandedCatId}`); setExpandedCatId(null); }}
                >
                  <Text style={[s.subcatChipTxt, { color: theme.colors.primary }]}>See All →</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </>
        );
      }

      case 'recent':
        return (
          <>
            <SectionHeader title="🕐 Recently Viewed" />
            <HorizontalProducts data={recentProducts.slice(0, 8)} zoneId={zoneId} isLoading={false} />
          </>
        );

      case 'wishlist':
        return (
          <>
            <SectionHeader title="❤️ Your Wishlist" onSeeAll={() => router.push('/wishlist')} />
            <HorizontalProducts data={wishlistProducts.slice(0, 8)} zoneId={zoneId} isLoading={false} />
          </>
        );

      case 'fast':
        return (
          <>
            <SectionHeader title="⚡ Fast Delivery" onSeeAll={() => router.push({ pathname: '/search', params: { fastDelivery: '1' } })} />
            <HorizontalProducts data={fastProducts} zoneId={zoneId} isLoading={loadingFast} />
          </>
        );

      case 'verified':
        return (
          <>
            <SectionHeader title="✅ Verified Sellers" onSeeAll={() => router.push({ pathname: '/search', params: { verified: '1' } })} />
            <HorizontalProducts data={verifiedProducts} zoneId={zoneId} isLoading={loadingVerified} />
          </>
        );

      case 'flash_sale': {
        const sale = FLASH_SALES.find(fs => fs.id === item.saleId);
        if (!sale) return null;
        const saleProducts = PRODUCTS.filter(p => sale.productIds.includes(p.id));
        return <FlashSaleSection key={sale.id} sale={sale} products={saleProducts} zoneId={zoneId} router={router} />;
      }

      case 'deals':
        return (
          <>
            <SectionHeader title="🔥 Top Deals" onSeeAll={() => router.push({ pathname: '/search', params: { sort: 'price_asc' } })} />
            <HorizontalProducts data={dealProducts} zoneId={zoneId} isLoading={loadingDeals} />
            <View style={{ height: SPACING.xl }} />
          </>
        );

      default:
        return null;
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Sticky top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.zoneBtn}
          onPress={() => setShowZonePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current delivery zone: ${curZone?.name ?? 'Select Zone'}. Tap to change`}
        >
          <Ionicons name="location" size={16} color={theme.colors.primary} accessibilityElementsHidden />
          <Text variant="labelMedium" style={s.zoneName} numberOfLines={1}>{curZone?.name ?? 'Select Zone'}</Text>
          <Ionicons name="chevron-down" size={14} color="#666" accessibilityElementsHidden />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#333" accessibilityElementsHidden />
        </TouchableOpacity>
      </View>

      {/* Search bar tap target */}
      <TouchableOpacity
        onPress={() => router.push('/search')}
        style={s.searchWrap}
        activeOpacity={0.85}
        accessibilityRole="search"
        accessibilityLabel="Search products"
        accessibilityHint="Tap to open search"
      >
        <View style={s.searchFake}>
          <Ionicons name="search" size={18} color="#999" />
          <Text style={s.searchPlaceholder}>Search products...</Text>
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
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowZonePicker(false)}>
          <TouchableOpacity style={s.zoneModal} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <Text variant="titleMedium" style={s.zoneModalTitle}>Select Delivery Zone</Text>
            {ZONES.map(zone => (
              <TouchableOpacity
                key={zone.id}
                style={[s.zoneOpt, zoneId === zone.id && s.zoneOptA]}
                onPress={async () => { await setZone(zone.id as ZoneId); setShowZonePicker(false); Haptics.selectionAsync(); }}
                accessibilityRole="radio"
                accessibilityLabel={`${zone.name}, ${zone.codAvailable ? 'COD available' : 'Prepaid only'}`}
                accessibilityState={{ checked: zoneId === zone.id }}
              >
                <Ionicons name={zoneId === zone.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={zoneId === zone.id ? theme.colors.primary : '#ccc'} />
                <View style={{ marginLeft: SPACING.sm }}>
                  <Text variant="bodyMedium" style={s.zoneOptName}>{zone.name}</Text>
                  <Text variant="labelSmall" style={s.zoneOptSub}>{zone.codAvailable ? 'COD available' : 'Prepaid only'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: '#fff' },
  zoneBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  zoneName: { color: '#333', fontWeight: '600', flex: 1 },
  searchWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: '#fff', paddingBottom: SPACING.sm },
  searchFake: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#f5f5f5', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  searchPlaceholder: { color: '#999', fontSize: 15, flex: 1 },
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
  catImgWrapSel: { borderWidth: 2, borderColor: theme.colors.primary },
  catImg: { width: 56, height: 56, borderRadius: 999 },
  catLabel: { color: '#444', textAlign: 'center', lineHeight: 14 },
  catLabelSel: { color: theme.colors.primary, fontWeight: '700' },
  subcatRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  subcatChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e0e0e0' },
  subcatChipAll: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
  subcatChipTxt: { fontSize: 12, color: '#444', fontWeight: '600' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  zoneModal: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, gap: SPACING.sm },
  zoneModalTitle: { fontWeight: '700', marginBottom: SPACING.sm },
  zoneOpt: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0' },
  zoneOptA: { borderColor: theme.colors.primary, backgroundColor: '#FFF5F5' },
  zoneOptName: { fontWeight: '600', color: '#222' },
  zoneOptSub: { color: '#888' },
});
