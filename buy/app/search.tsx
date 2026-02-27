import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, ActivityIndicator,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteProducts, getAllBrands, PAGE_SIZE } from '../src/hooks/useProducts';
import { useZoneStore } from '../src/stores/zoneStore';
import { getItem, setItem, STORAGE_KEYS } from '../src/utils/storage';
import { PRODUCTS, SELLERS } from '../src/data/seed';
import ProductCard from '../src/components/common/ProductCard';
import { ProductGridSkeleton } from '../src/components/common/SkeletonLoader';
import { theme, SPACING, RADIUS } from '../src/theme';

type Sort = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'fastest';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; fastDelivery?: string; verified?: string; sort?: string }>();
  const { zoneId } = useZoneStore();

  const [query, setQuery] = useState(params.q ?? '');
  const [debQ, setDebQ] = useState(params.q ?? '');
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [codOnly, setCodOnly] = useState(false);
  const [fast, setFast] = useState(params.fastDelivery === '1');
  const [verified, setVerified] = useState(params.verified === '1');
  const [inStock, setInStock] = useState(true);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<Sort>((params.sort as Sort) ?? 'relevance');

  // Brand filter
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const allBrands = getAllBrands();

  // Seller filter
  const [selectedSellerId, setSelectedSellerId] = useState<string | undefined>();
  const [showSellerPicker, setShowSellerPicker] = useState(false);

  // Free-form price range
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [priceMode, setPriceMode] = useState<'preset' | 'custom'>('preset');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [customMinStr, setCustomMinStr] = useState('');
  const [customMaxStr, setCustomMaxStr] = useState('');

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebQ(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Load recent searches
  useEffect(() => {
    getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES).then(r => setRecent(r ?? []));
  }, []);

  // Live suggestions: product titles matching query (before debounce)
  const liveSuggestions = query.trim().length >= 2
    ? [...new Set(
        PRODUCTS
          .filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.brand?.toLowerCase().includes(query.toLowerCase()))
          .map(p => p.title)
      )].slice(0, 5)
    : [];

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts({
    search: debQ || undefined,
    zoneId,
    isFastDelivery: fast || undefined,
    isAuthenticated: verified || undefined,
    inStock: inStock || undefined,
    minRating,
    codAvailable: codOnly || undefined,
    sortBy,
    minPrice,
    maxPrice,
    brand: selectedBrand,
    sellerId: selectedSellerId,
  });

  const products = data?.pages.flatMap(p => p.items) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  async function doSearch(q: string) {
    setQuery(q);
    setDebQ(q);
    if (q.trim()) {
      const qLower = q.toLowerCase();
      const deduped = recent.filter(r => r.toLowerCase() !== qLower);
      const u = [q, ...deduped].slice(0, 8);
      setRecent(u);
      await setItem(STORAGE_KEYS.RECENT_SEARCHES, u);
    }
  }

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const SORTS: { v: Sort; l: string }[] = [
    { v: 'relevance', l: 'Relevance' },
    { v: 'price_asc', l: 'Price Low-High' },
    { v: 'price_desc', l: 'Price High-Low' },
    { v: 'rating', l: 'Top Rated' },
    { v: 'fastest', l: 'Fastest' },
  ];

  // Fix: only show suggestions when there's no debounced query OR when actively typing with live suggestions
  const showSuggestions = !debQ.trim() || (query.trim().length >= 2 && liveSuggestions.length > 0 && query !== debQ);

  const hasActiveFilters = codOnly || fast || verified || !inStock || minRating !== undefined || minPrice !== undefined || maxPrice !== undefined || selectedBrand !== undefined || selectedSellerId !== undefined;

  function applyCustomPriceRange() {
    const min = customMinStr ? Number(customMinStr) : undefined;
    const max = customMaxStr ? Number(customMaxStr) : undefined;
    setMinPrice(min);
    setMaxPrice(max);
    setShowPriceFilter(false);
  }

  function clearPriceFilter() {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setCustomMinStr('');
    setCustomMaxStr('');
    setShowPriceFilter(false);
  }

  const priceLabel = minPrice !== undefined || maxPrice !== undefined
    ? `NPR ${minPrice ?? 0}–${maxPrice ?? '∞'}`
    : 'Price';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Search header */}
      <View style={s.searchHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Searchbar
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch(query)}
          style={s.searchBar}
          autoFocus
          onClearIconPress={() => { setQuery(''); setDebQ(''); }}
        />
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[s.filterBtn, hasActiveFilters && s.filterBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
          accessibilityState={{ expanded: showFilters }}
        >
          <Ionicons name="options" size={22} color={showFilters || hasActiveFilters ? theme.colors.primary : '#333'} />
          {hasActiveFilters && <View style={s.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={s.filtersPanel}>
          {/* Quick filters row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fScroll}>
            <Chip selected={codOnly} onPress={() => setCodOnly(!codOnly)} style={[s.fc, codOnly && s.fcA]} compact icon="cash">COD Only</Chip>
            <Chip selected={fast} onPress={() => setFast(!fast)} style={[s.fc, fast && s.fcA]} compact icon="flash">Fast</Chip>
            <Chip selected={verified} onPress={() => setVerified(!verified)} style={[s.fc, verified && s.fcA]} compact icon="shield-checkmark">Verified</Chip>
            <Chip selected={inStock} onPress={() => setInStock(!inStock)} style={[s.fc, inStock && s.fcA]} compact>In Stock</Chip>
            {[4, 3].map(r => (
              <Chip key={r} selected={minRating === r} onPress={() => setMinRating(minRating === r ? undefined : r)} style={[s.fc, minRating === r && s.fcA]} compact>{r}★+</Chip>
            ))}
            <Chip
              selected={!!(minPrice !== undefined || maxPrice !== undefined)}
              onPress={() => setShowPriceFilter(true)}
              style={[s.fc, (minPrice !== undefined || maxPrice !== undefined) && s.fcA]}
              compact
              icon="pricetag"
            >
              {priceLabel}
            </Chip>
            <Chip
              selected={!!selectedBrand}
              onPress={() => setShowBrandPicker(true)}
              style={[s.fc, !!selectedBrand && s.fcA]}
              compact
              icon="business"
            >
              {selectedBrand ?? 'Brand'}
            </Chip>
            <Chip
              selected={!!selectedSellerId}
              onPress={() => setShowSellerPicker(true)}
              style={[s.fc, !!selectedSellerId && s.fcA]}
              compact
              icon="storefront"
            >
              {selectedSellerId ? (SELLERS.find(s => s.id === selectedSellerId)?.name ?? 'Seller') : 'Seller'}
            </Chip>
          </ScrollView>

          {/* Sort row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fScroll}>
            {SORTS.map(opt => (
              <Chip key={opt.v} selected={sortBy === opt.v} onPress={() => setSortBy(opt.v)} style={[s.fc, sortBy === opt.v && s.fcA]} compact>{opt.l}</Chip>
            ))}
          </ScrollView>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={s.clearAll}
              onPress={() => {
                setCodOnly(false); setFast(false); setVerified(false); setInStock(true);
                setMinRating(undefined); setMinPrice(undefined); setMaxPrice(undefined);
                setCustomMinStr(''); setCustomMaxStr('');
                setSelectedBrand(undefined); setSelectedSellerId(undefined);
              }}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.error }}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Suggestions panel — only shown when no debounced query or actively typing */}
      {showSuggestions ? (
        <ScrollView style={s.suggestions}>
          {recent.length > 0 && (
            <>
              <View style={s.sugHeader}>
                <Text variant="labelMedium" style={s.sugTitle}>Recent</Text>
                <TouchableOpacity onPress={async () => { setRecent([]); await setItem(STORAGE_KEYS.RECENT_SEARCHES, []); }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recent.map(r => (
                <TouchableOpacity key={r} style={s.sugItem} onPress={() => doSearch(r)}>
                  <Ionicons name="time-outline" size={16} color="#999" />
                  <Text variant="bodyMedium" style={s.sugTxt}>{r}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Live suggestions while typing */}
          {liveSuggestions.length > 0 && (
            <>
              <View style={s.sugHeader}><Text variant="labelMedium" style={s.sugTitle}>Suggestions</Text></View>
              {liveSuggestions.map(s2 => (
                <TouchableOpacity key={s2} style={s.sugItem} onPress={() => doSearch(s2)}>
                  <Ionicons name="search" size={16} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={s.sugTxt}>{s2}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {!query.trim() && (
            <>
              <View style={s.sugHeader}><Text variant="labelMedium" style={s.sugTitle}>Popular</Text></View>
              {['Samsung phone', 'Sony headphones', 'Organic honey', 'iPhone 15', 'Yoga mat', 'Pashmina shawl', 'Trekking poles', 'Whey protein', 'Lego', 'Omron monitor'].map(p => (
                <TouchableOpacity key={p} style={s.sugItem} onPress={() => doSearch(p)}>
                  <Ionicons name="trending-up" size={16} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={s.sugTxt}>{p}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      ) : isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text variant="titleMedium" style={s.emptyTxt}>No results for "{debQ}"</Text>
          <Text variant="bodySmall" style={{ color: '#888', textAlign: 'center' }}>
            Try different keywords or remove some filters
          </Text>
        </View>
      ) : (
        <>
          <View style={s.resHeader}>
            <Text variant="labelMedium" style={{ color: '#888' }}>{totalCount} results</Text>
          </View>
          <FlatList
            data={products}
            keyExtractor={i => i.id}
            numColumns={2}
            contentContainerStyle={s.grid}
            columnWrapperStyle={s.row}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={s.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="labelSmall" style={{ color: '#888', marginTop: 4 }}>Loading more...</Text>
                </View>
              ) : hasNextPage ? null : products.length > PAGE_SIZE ? (
                <Text variant="labelSmall" style={s.endText}>All {totalCount} results shown</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <ProductCard product={item} zoneId={zoneId} onPress={() => router.push('/product/' + item.id)} />
            )}
          />
        </>
      )}

      {/* Price filter modal */}
      {showPriceFilter && (
        <View style={s.modal}>
          <View style={s.modalCard}>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#222', marginBottom: SPACING.md }}>Price Range</Text>

            {/* Mode toggle */}
            <View style={s.modeRow}>
              <TouchableOpacity
                style={[s.modeBtn, priceMode === 'preset' && s.modeBtnActive]}
                onPress={() => setPriceMode('preset')}
              >
                <Text style={[s.modeTxt, priceMode === 'preset' && s.modeTxtActive]}>Preset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modeBtn, priceMode === 'custom' && s.modeBtnActive]}
                onPress={() => setPriceMode('custom')}
              >
                <Text style={[s.modeTxt, priceMode === 'custom' && s.modeTxtActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {priceMode === 'preset' ? (
              <>
                {[
                  { label: 'Under NPR 1,000', min: undefined, max: 1000 },
                  { label: 'NPR 1,000–5,000', min: 1000, max: 5000 },
                  { label: 'NPR 5,000–20,000', min: 5000, max: 20000 },
                  { label: 'NPR 20,000–100,000', min: 20000, max: 100000 },
                  { label: 'Above NPR 100,000', min: 100000, max: undefined },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[s.priceOpt, minPrice === opt.min && maxPrice === opt.max && s.priceOptSel]}
                    onPress={() => { setMinPrice(opt.min); setMaxPrice(opt.max); setShowPriceFilter(false); }}
                  >
                    <Text style={{ color: minPrice === opt.min && maxPrice === opt.max ? theme.colors.primary : '#333', fontWeight: minPrice === opt.min && maxPrice === opt.max ? '700' : '400' }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={s.customRange}>
                <View style={s.customRangeRow}>
                  <View style={s.customRangeInput}>
                    <Text variant="labelSmall" style={{ color: '#888', marginBottom: 4 }}>Min (NPR)</Text>
                    <RNTextInput
                      style={s.rangeInput}
                      value={customMinStr}
                      onChangeText={setCustomMinStr}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                  <Text style={{ color: '#888', marginTop: 20 }}>—</Text>
                  <View style={s.customRangeInput}>
                    <Text variant="labelSmall" style={{ color: '#888', marginBottom: 4 }}>Max (NPR)</Text>
                    <RNTextInput
                      style={s.rangeInput}
                      value={customMaxStr}
                      onChangeText={setCustomMaxStr}
                      keyboardType="number-pad"
                      placeholder="Any"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                </View>
                <TouchableOpacity style={s.applyBtn} onPress={applyCustomPriceRange}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Apply Range</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={clearPriceFilter} style={{ marginTop: SPACING.sm }}>
              <Text style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPriceFilter(false)} style={{ marginTop: SPACING.sm }}>
              <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Brand picker modal */}
      {showBrandPicker && (
        <View style={s.modal}>
          <View style={s.modalCard}>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#222', marginBottom: SPACING.md }}>Select Brand</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[s.priceOpt, !selectedBrand && s.priceOptSel]}
                onPress={() => { setSelectedBrand(undefined); setShowBrandPicker(false); }}
              >
                <Text style={{ color: !selectedBrand ? theme.colors.primary : '#333', fontWeight: !selectedBrand ? '700' : '400' }}>All Brands</Text>
              </TouchableOpacity>
              {allBrands.map(brand => (
                <TouchableOpacity
                  key={brand}
                  style={[s.priceOpt, selectedBrand === brand && s.priceOptSel]}
                  onPress={() => { setSelectedBrand(brand); setShowBrandPicker(false); }}
                >
                  <Text style={{ color: selectedBrand === brand ? theme.colors.primary : '#333', fontWeight: selectedBrand === brand ? '700' : '400' }}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowBrandPicker(false)} style={{ marginTop: SPACING.sm }}>
              <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Seller picker modal */}
      {showSellerPicker && (
        <View style={s.modal}>
          <View style={s.modalCard}>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#222', marginBottom: SPACING.md }}>Select Seller</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[s.priceOpt, !selectedSellerId && s.priceOptSel]}
                onPress={() => { setSelectedSellerId(undefined); setShowSellerPicker(false); }}
              >
                <Text style={{ color: !selectedSellerId ? theme.colors.primary : '#333', fontWeight: !selectedSellerId ? '700' : '400' }}>All Sellers</Text>
              </TouchableOpacity>
              {SELLERS.map(seller => (
                <TouchableOpacity
                  key={seller.id}
                  style={[s.priceOpt, selectedSellerId === seller.id && s.priceOptSel]}
                  onPress={() => { setSelectedSellerId(seller.id); setShowSellerPicker(false); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Text style={{ color: selectedSellerId === seller.id ? theme.colors.primary : '#333', fontWeight: selectedSellerId === seller.id ? '700' : '400', flex: 1 }}>
                      {seller.name}
                    </Text>
                    {seller.isVerified && <Ionicons name="checkmark-circle" size={14} color="#1565C0" />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSellerPicker(false)} style={{ marginTop: SPACING.sm }}>
              <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, gap: SPACING.xs, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { padding: SPACING.xs },
  searchBar: { flex: 1, elevation: 0, backgroundColor: '#f5f5f5', height: 44 },
  filterBtn: { padding: SPACING.xs, position: 'relative' },
  filterBtnActive: {},
  filterDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  filtersPanel: { backgroundColor: '#fff', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  fScroll: { paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },
  fc: { marginRight: SPACING.xs, backgroundColor: '#f0f0f0' },
  fcA: { backgroundColor: theme.colors.primaryContainer },
  clearAll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs },
  suggestions: { flex: 1, backgroundColor: '#fff' },
  sugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs },
  sugTitle: { color: '#888', fontWeight: '700', textTransform: 'uppercase' },
  sugItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  sugTxt: { color: '#333' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl },
  emptyTxt: { color: '#555', fontWeight: '600', textAlign: 'center' },
  resHeader: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: '#fff' },
  grid: { padding: SPACING.sm },
  row: { gap: 0 },
  loadingMore: { alignItems: 'center', paddingVertical: SPACING.lg },
  endText: { textAlign: 'center', color: '#bbb', paddingVertical: SPACING.lg },
  modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, width: '90%', gap: SPACING.sm, maxHeight: '80%' },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  modeBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center' },
  modeBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  modeTxt: { color: '#555', fontWeight: '600' },
  modeTxtActive: { color: theme.colors.primary },
  priceOpt: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0', marginBottom: SPACING.xs },
  priceOptSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  customRange: { gap: SPACING.md },
  customRangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md },
  customRangeInput: { flex: 1 },
  rangeInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: RADIUS.md, padding: SPACING.sm, fontSize: 16, color: '#222' },
  applyBtn: { backgroundColor: theme.colors.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
});
