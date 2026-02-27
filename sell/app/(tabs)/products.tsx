import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import ProductStatusBadge from '@/src/components/common/ProductStatusBadge';
import EmptyState from '@/src/components/common/EmptyState';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR } from '@/src/utils/helpers';
import { Product, ProductStatus } from '@/src/types';

const FILTER_TABS: { label: string; value: ProductStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Inactive', value: 'inactive' },
];

export default function ProductsScreen() {
  const router = useRouter();
  const { products, deleteProduct } = useProductStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all');

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  function confirmDelete(product: Product) {
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(product.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/product/new')}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.grey500} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.search}
          placeholder="Search products..."
          placeholderTextColor={Colors.grey400}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.grey400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, filter === item.value && styles.filterTabActive]}
            onPress={() => setFilter(item.value)}
          >
            <Text style={[styles.filterLabel, filter === item.value && styles.filterLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product list */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="No products found" description="Tap + to add your first product." />}
        renderItem={({ item: product }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${product.id}` as any)}>
            <Image source={{ uri: product.images[0] }} style={styles.image} contentFit="cover" />
            <View style={styles.cardInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <ProductStatusBadge status={product.status} />
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatNPR(product.price)}</Text>
                {product.comparePrice && (
                  <Text style={styles.comparePrice}>{formatNPR(product.comparePrice)}</Text>
                )}
              </View>
              <Text style={styles.stockText}>Stock: {product.stock} · Sold: {product.totalSold}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(product)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: Spacing.md, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44, ...Shadow.sm },
  search: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  filterList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 8 },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterLabelActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.sm, ...Shadow.sm },
  image: { width: 80, height: 80, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  cardInfo: { flex: 1, marginLeft: Spacing.sm, gap: 4 },
  productName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  comparePrice: { fontSize: FontSize.sm, color: Colors.grey500, textDecorationLine: 'line-through' },
  stockText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  deleteBtn: { padding: Spacing.xs },
});
