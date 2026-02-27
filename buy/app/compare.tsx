import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { Text, Surface, Button, Divider } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useZoneStore } from '../src/stores/zoneStore';
import { PRODUCTS } from '../src/data/seed';
import { formatNPR, getDiscountPercent, getBestETA } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';
import { Product } from '../src/types';

const MAX_COMPARE = 3;

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons key={n} name="star" size={12} color={n <= Math.round(rating) ? '#FFA000' : '#e0e0e0'} />
      ))}
    </View>
  );
}

function CompareColumn({ product, onRemove, zoneId }: { product: Product; onRemove: () => void; zoneId: any }) {
  const router = useRouter();
  const variant = product.variants[0];
  const discount = getDiscountPercent(variant?.price ?? 0, variant?.mrp ?? 0);
  const eta = getBestETA(product, zoneId);
  const cod = product.codAvailableZones.includes(zoneId);

  return (
    <View style={col.container}>
      {/* Image + remove */}
      <View style={col.imgWrap}>
        <TouchableOpacity onPress={() => router.push(`/product/${product.id}`)} activeOpacity={0.85}>
          <Image source={{ uri: product.images[0] }} style={col.img} contentFit="cover" />
        </TouchableOpacity>
        <TouchableOpacity style={col.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color="#B71C1C" />
        </TouchableOpacity>
      </View>
      {/* Title */}
      <Text variant="labelMedium" style={col.title} numberOfLines={3}>{product.title}</Text>
      {/* Price */}
      <Text variant="titleSmall" style={col.price}>{formatNPR(variant?.price ?? product.basePrice)}</Text>
      {discount > 0 && <Text style={col.discount}>{discount}% OFF</Text>}
      {/* Rating */}
      <StarRow rating={product.rating} />
      <Text variant="labelSmall" style={col.reviews}>({product.totalReviews})</Text>
      {/* Delivery */}
      <Text variant="labelSmall" style={col.eta}>{eta}</Text>
      {/* COD */}
      <View style={[col.badge, { backgroundColor: cod ? '#E8F5E9' : '#FFEBEE' }]}>
        <Text style={[col.badgeTxt, { color: cod ? '#2E7D32' : '#B71C1C' }]}>{cod ? 'COD ✓' : 'No COD'}</Text>
      </View>
      {/* Auth */}
      <View style={[col.badge, { backgroundColor: product.isAuthenticated ? '#E3F2FD' : '#f5f5f5' }]}>
        <Text style={[col.badgeTxt, { color: product.isAuthenticated ? '#1565C0' : '#999' }]}>
          {product.isAuthenticated ? '✅ Verified' : 'Unverified'}
        </Text>
      </View>
      {/* Fast */}
      <View style={[col.badge, { backgroundColor: product.isFastDelivery ? '#FFF8E1' : '#f5f5f5' }]}>
        <Text style={[col.badgeTxt, { color: product.isFastDelivery ? '#FF8F00' : '#999' }]}>
          {product.isFastDelivery ? '⚡ Fast' : 'Standard'}
        </Text>
      </View>
      {/* Stock */}
      <Text variant="labelSmall" style={{ color: product.inStock ? '#2E7D32' : '#B71C1C', fontWeight: '600' }}>
        {product.inStock ? 'In Stock' : 'Out of Stock'}
      </Text>
      <Button
        mode="contained"
        compact
        onPress={() => router.push(`/product/${product.id}`)}
        style={{ marginTop: SPACING.sm }}
        contentStyle={{ paddingHorizontal: 4 }}
      >
        View
      </Button>
    </View>
  );
}

const col = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: SPACING.sm, gap: 6, minWidth: 130 },
  imgWrap: { position: 'relative', width: '100%' },
  img: { width: '100%', aspectRatio: 1, borderRadius: RADIUS.md, backgroundColor: '#f0f0f0' },
  removeBtn: { position: 'absolute', top: -6, right: -6 },
  title: { color: '#333', textAlign: 'center', lineHeight: 16 },
  price: { color: theme.colors.primary, fontWeight: '700' },
  discount: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  reviews: { color: '#888' },
  eta: { color: '#555', textAlign: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
});

// ─── Product Picker Modal ─────────────────────────────────────────────────────
function ProductPicker({ onSelect, excludeIds }: { onSelect: (p: Product) => void; excludeIds: string[] }) {
  const [search, setSearch] = useState('');
  const filtered = PRODUCTS.filter(p =>
    !excludeIds.includes(p.id) &&
    (search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={pk.container}>
      <View style={pk.searchRow}>
        <Ionicons name="search" size={16} color="#999" />
        <Text
          style={pk.searchInput}
          onPress={() => {}}
        >
          {search || 'Search products to compare...'}
        </Text>
      </View>
      <FlatList
        data={filtered.slice(0, 20)}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={pk.item} onPress={() => onSelect(item)}>
            <Image source={{ uri: item.images[0] }} style={pk.img} contentFit="cover" />
            <View style={pk.info}>
              <Text variant="labelMedium" style={pk.name} numberOfLines={2}>{item.title}</Text>
              <Text variant="labelSmall" style={pk.price}>{formatNPR(item.basePrice)}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
}

const pk = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fafafa' },
  searchInput: { flex: 1, color: '#999', fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  img: { width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: '#f0f0f0' },
  info: { flex: 1 },
  name: { color: '#333', lineHeight: 16 },
  price: { color: theme.colors.primary, fontWeight: '700', marginTop: 2 },
});

// ─── Main Compare Screen ──────────────────────────────────────────────────────
export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { zoneId } = useZoneStore();
  const [selected, setSelected] = useState<Product[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  function addProduct(p: Product) {
    if (selected.length < MAX_COMPARE) {
      setSelected(prev => [...prev, p]);
    }
    setShowPicker(false);
  }

  function removeProduct(id: string) {
    setSelected(prev => prev.filter(p => p.id !== id));
  }

  if (showPicker) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Add Product to Compare"
          left={
            <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
          }
        />
        <ProductPicker onSelect={addProduct} excludeIds={selected.map(p => p.id)} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Compare Products" />

      {selected.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="git-compare-outline" size={72} color="#ddd" />
          <Text variant="titleMedium" style={s.emptyTitle}>Compare Products</Text>
          <Text variant="bodySmall" style={s.emptySub}>
            Add up to {MAX_COMPARE} products to compare prices, delivery, and features side by side.
          </Text>
          <Button mode="contained" onPress={() => setShowPicker(true)} icon="add" style={{ marginTop: SPACING.md }}>
            Add Product
          </Button>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Row labels */}
          <View style={s.tableHeader}>
            <View style={s.labelCol}>
              <Text style={s.labelTxt}>Price</Text>
              <Text style={s.labelTxt}>Rating</Text>
              <Text style={s.labelTxt}>Delivery</Text>
              <Text style={s.labelTxt}>COD</Text>
              <Text style={s.labelTxt}>Auth</Text>
              <Text style={s.labelTxt}>Speed</Text>
              <Text style={s.labelTxt}>Stock</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={s.columnsRow}>
                {selected.map(p => (
                  <CompareColumn
                    key={p.id}
                    product={p}
                    onRemove={() => removeProduct(p.id)}
                    zoneId={zoneId}
                  />
                ))}
                {selected.length < MAX_COMPARE && (
                  <TouchableOpacity style={s.addCol} onPress={() => setShowPicker(true)}>
                    <Ionicons name="add-circle-outline" size={40} color={theme.colors.primary} />
                    <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: SPACING.sm }}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  emptyTitle: { fontWeight: '700', color: '#222' },
  emptySub: { color: '#888', textAlign: 'center', lineHeight: 20 },
  tableHeader: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  labelCol: { width: 70, gap: 28, paddingTop: 180, justifyContent: 'flex-start' },
  labelTxt: { fontSize: 11, color: '#888', fontWeight: '600' },
  columnsRow: { flexDirection: 'row', gap: SPACING.sm },
  addCol: { width: 130, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', borderRadius: RADIUS.lg, minHeight: 200 },
});
