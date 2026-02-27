import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import ProductStatusBadge from '@/src/components/common/ProductStatusBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDateTime } from '@/src/utils/helpers';
import { ProductStatus } from '@/src/types';

const STATUS_OPTIONS: ProductStatus[] = ['active', 'inactive', 'draft'];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, updateStock, updateStatus, deleteProduct, incrementViews } = useProductStore();
  const product = products.find((p) => p.id === id);

  const [stockInput, setStockInput] = useState('');

  // Increment view count when product detail is opened
  useEffect(() => {
    if (id) incrementViews(id);
  }, [id]);

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  function handleStockUpdate() {
    const n = parseInt(stockInput, 10);
    if (isNaN(n) || n < 0) {
      Alert.alert('Invalid', 'Please enter a valid stock number.');
      return;
    }
    updateStock(product!.id, n);
    setStockInput('');
    Alert.alert('Updated', `Stock updated to ${n}`);
  }

  function handleDelete() {
    Alert.alert('Delete Product', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteProduct(product!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push(`/product/edit/${product.id}` as any)} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={8} style={{ marginLeft: Spacing.md }}>
            <Ionicons name="trash-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Images */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
          {product.images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.image} contentFit="cover" />
          ))}
        </ScrollView>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.productName}>{product.title}</Text>
          <View style={styles.row}>
            <ProductStatusBadge status={product.status} />
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          </View>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNPR(product.basePrice)}</Text>
            {product.baseMrp > product.basePrice && (
              <Text style={styles.comparePrice}>{formatNPR(product.baseMrp)}</Text>
            )}
          </View>
          {product.baseMrp > product.basePrice && (
            <Text style={styles.discount}>
              {Math.round(((product.baseMrp - product.basePrice) / product.baseMrp) * 100)}% off
            </Text>
          )}
        </View>

        {/* Inventory */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inventory</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'In Stock', value: product.variants[0]?.stock ?? 0 },
              { label: 'Total Sold', value: product.totalSold },
              { label: 'Views', value: product.views },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Update stock */}
          <View style={styles.stockRow}>
            <TextInput
              style={styles.stockInput}
              placeholder="New stock qty"
              placeholderTextColor={Colors.grey400}
              keyboardType="number-pad"
              value={stockInput}
              onChangeText={setStockInput}
            />
            <TouchableOpacity style={styles.stockBtn} onPress={handleStockUpdate}>
              <Text style={styles.stockBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOpt, product.status === s && styles.statusOptActive]}
                onPress={() => updateStatus(product.id, s)}
              >
                <Text style={[styles.statusOptText, product.status === s && styles.statusOptTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags */}
        {product.tags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tags</Text>
            <View style={styles.tagsWrap}>
              {product.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.meta}>Created: {formatDateTime(product.createdAt)}</Text>
        <Text style={styles.meta}>Updated: {formatDateTime(product.updatedAt)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  content: { paddingBottom: Spacing.xxl },
  imageScroll: { padding: Spacing.md, gap: Spacing.sm },
  image: { width: 200, height: 200, borderRadius: BorderRadius.md, backgroundColor: Colors.grey100 },
  section: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  productName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  sku: { fontSize: FontSize.sm, color: Colors.textSecondary },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  card: { backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  price: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  comparePrice: { fontSize: FontSize.lg, color: Colors.grey500, textDecorationLine: 'line-through' },
  discount: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '600', marginTop: 4 },
  statsGrid: { flexDirection: 'row', marginBottom: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  stockRow: { flexDirection: 'row', gap: Spacing.sm },
  stockInput: { flex: 1, height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  stockBtn: { backgroundColor: Colors.primary, height: 44, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  stockBtnText: { color: Colors.white, fontWeight: '700' },
  statusOptions: { flexDirection: 'row', gap: Spacing.sm },
  statusOpt: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statusOptActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusOptText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  statusOptTextActive: { color: Colors.white, fontWeight: '700' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSize.sm, color: Colors.primaryDark, fontWeight: '500' },
  meta: { fontSize: FontSize.xs, color: Colors.grey500, textAlign: 'center', marginBottom: 4 },
});
