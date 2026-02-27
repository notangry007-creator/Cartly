import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { ProductStatus } from '@/src/types';

const CATEGORIES = ['Electronics', 'Computers', 'Accessories', 'Home & Office', 'Clothing', 'Books', 'Sports', 'Other'];

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, updateProduct } = useProductStore();
  const product = products.find((p) => p.id === id);

  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [comparePrice, setComparePrice] = useState(String(product?.comparePrice ?? ''));
  const [sku, setSku] = useState(product?.sku ?? '');
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [tags, setTags] = useState(product?.tags.join(', ') ?? '');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'active');
  const [isSaving, setIsSaving] = useState(false);

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  async function handleSave() {
    if (!name.trim() || !price.trim() || !sku.trim() || !stock.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Name, Price, SKU, and Stock.');
      return;
    }
    setIsSaving(true);
    await updateProduct(product.id, {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      sku: sku.trim().toUpperCase(),
      stock: parseInt(stock, 10),
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status,
    });
    setIsSaving(false);
    Alert.alert('Saved', 'Product updated successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Edit Product</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <Field label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Wireless Earbuds" />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe your product..." multiline />
          <Field label="SKU *" value={sku} onChangeText={setSku} placeholder="e.g. EARB-001" autoCapitalize="characters" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Field label="Price (NPR) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Compare Price (NPR)" value={comparePrice} onChangeText={setComparePrice} placeholder="Optional original price" keyboardType="decimal-pad" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <Field label="Stock Quantity *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Field label="Tags (comma-separated)" value={tags} onChangeText={setTags} placeholder="e.g. bluetooth, earbuds" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            {(['active', 'draft', 'inactive'] as ProductStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOpt, status === s && styles.statusOptActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.statusOptText, status === s && styles.statusOptTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, props.multiline && { height: 88, textAlignVertical: 'top' }]}
        placeholderTextColor={Colors.grey400}
        {...props}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  saveText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  section: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  chipRow: { gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: Spacing.sm },
  statusOpt: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statusOptActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusOptText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  statusOptTextActive: { color: Colors.white, fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
