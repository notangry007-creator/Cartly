import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../theme';
import { ProductFormData, ProductStatus, VariantFormData } from '../../types';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'cat_electronics', label: 'Electronics' },
  { id: 'cat_computers', label: 'Computers' },
  { id: 'cat_accessories', label: 'Accessories' },
  { id: 'cat_home', label: 'Home & Office' },
  { id: 'cat_clothing', label: 'Clothing' },
  { id: 'cat_books', label: 'Books' },
  { id: 'cat_sports', label: 'Sports' },
  { id: 'cat_other', label: 'Other' },
];

interface Props {
  initialValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel: string;
  isLoading: boolean;
}

export default function ProductForm({ initialValues, onSubmit, submitLabel, isLoading }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(initialValues?.price ? String(initialValues.price) : '');
  const [mrp, setMrp] = useState(initialValues?.mrp ? String(initialValues.mrp) : '');
  const [sku, setSku] = useState(initialValues?.sku ?? '');
  const [stock, setStock] = useState(initialValues?.stock !== undefined ? String(initialValues.stock) : '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? CATEGORIES[0].id);
  const [tags, setTags] = useState(initialValues?.tags?.join(', ') ?? '');
  const [status, setStatus] = useState<ProductStatus>(initialValues?.status ?? 'active');
  const [images, setImages] = useState<string[]>(initialValues?.images ?? []);
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState<VariantFormData[]>([
    { label: '', price: 0, mrp: undefined, stock: 0, sku: '' },
  ]);

  function addVariant() {
    setVariants(prev => [...prev, { label: '', price: 0, mrp: undefined, stock: 0, sku: '' }]);
  }

  function removeVariant(idx: number) {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof VariantFormData, value: string) {
    setVariants(prev => prev.map((v, i) => {
      if (i !== idx) return v;
      if (field === 'label' || field === 'sku') return { ...v, [field]: value };
      const num = parseFloat(value);
      return { ...v, [field]: isNaN(num) ? 0 : num };
    }));
  }

  async function pickImage() {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  }

  async function takePhoto() {
    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take product photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  async function handleSubmit() {
    if (!title.trim() || !price.trim() || !sku.trim() || !stock.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Title, Price, SKU, and Stock.');
      return;
    }
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Invalid Stock', 'Please enter a valid stock quantity.');
      return;
    }
    const finalImages = images.length > 0
      ? images
      : [`https://picsum.photos/seed/${sku.trim()}/400/400`];

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      mrp: mrp ? parseFloat(mrp) : undefined,
      sku: sku.trim().toUpperCase(),
      stock: parsedStock,
      categoryId,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: finalImages,
      status,
      variants: useVariants ? variants.filter(v => v.label.trim() && v.sku.trim()) : undefined,
    });
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {images.map((uri) => (
            <View key={uri} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.imageThumbnail} contentFit="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(uri)}>
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <View style={styles.addImageButtons}>
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color={Colors.primary} />
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addImageBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                <Text style={styles.addImageText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <Text style={styles.imageHint}>Up to 5 images. First image is the cover.</Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <Field label="Product Title *" value={title} onChangeText={setTitle} placeholder="e.g. Wireless Earbuds" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe your product..." multiline />
        <Field label="SKU *" value={sku} onChangeText={setSku} placeholder="e.g. EARB-001" autoCapitalize="characters" />
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <Field label="Selling Price (NPR) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
        <Field label="MRP / Compare Price (NPR)" value={mrp} onChangeText={setMrp} placeholder="Optional original / MRP price" keyboardType="decimal-pad" />
      </View>

      {/* Inventory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <Field label="Stock Quantity *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
      </View>

      {/* Variants */}
      <View style={styles.section}>
        <View style={styles.variantHeader}>
          <Text style={styles.sectionTitle}>Variants (Size, Color, etc.)</Text>
          <TouchableOpacity
            style={[styles.variantToggle, useVariants && styles.variantToggleActive]}
            onPress={() => setUseVariants(!useVariants)}
          >
            <Text style={[styles.variantToggleTxt, useVariants && styles.variantToggleTxtActive]}>
              {useVariants ? 'Enabled' : 'Enable'}
            </Text>
          </TouchableOpacity>
        </View>
        {useVariants && (
          <>
            <Text style={styles.variantHint}>Add variants like "Red / S", "Blue / M". Each has its own price, stock, and SKU.</Text>
            {variants.map((v, idx) => (
              <View key={idx} style={styles.variantCard}>
                <View style={styles.variantCardHeader}>
                  <Text style={styles.variantCardTitle}>Variant {idx + 1}</Text>
                  {variants.length > 1 && (
                    <TouchableOpacity onPress={() => removeVariant(idx)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.variantInput}
                  placeholder="Label (e.g. Red / XL)"
                  placeholderTextColor={Colors.grey400}
                  value={v.label}
                  onChangeText={val => updateVariant(idx, 'label', val)}
                />
                <View style={styles.variantRow}>
                  <TextInput
                    style={[styles.variantInput, { flex: 1 }]}
                    placeholder="Price (NPR)"
                    placeholderTextColor={Colors.grey400}
                    keyboardType="decimal-pad"
                    value={v.price ? String(v.price) : ''}
                    onChangeText={val => updateVariant(idx, 'price', val)}
                  />
                  <TextInput
                    style={[styles.variantInput, { flex: 1 }]}
                    placeholder="MRP (optional)"
                    placeholderTextColor={Colors.grey400}
                    keyboardType="decimal-pad"
                    value={v.mrp ? String(v.mrp) : ''}
                    onChangeText={val => updateVariant(idx, 'mrp', val)}
                  />
                </View>
                <View style={styles.variantRow}>
                  <TextInput
                    style={[styles.variantInput, { flex: 1 }]}
                    placeholder="Stock"
                    placeholderTextColor={Colors.grey400}
                    keyboardType="number-pad"
                    value={v.stock ? String(v.stock) : ''}
                    onChangeText={val => updateVariant(idx, 'stock', val)}
                  />
                  <TextInput
                    style={[styles.variantInput, { flex: 1 }]}
                    placeholder="SKU"
                    placeholderTextColor={Colors.grey400}
                    autoCapitalize="characters"
                    value={v.sku}
                    onChangeText={val => updateVariant(idx, 'sku', val)}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addVariantBtn} onPress={addVariant}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addVariantTxt}>Add Another Variant</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, categoryId === cat.id && styles.chipActive]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <Field label="Tags (comma-separated)" value={tags} onChangeText={setTags} placeholder="e.g. bluetooth, earbuds, wireless" />
      </View>

      {/* Status */}
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

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.md,
    color: Colors.text, backgroundColor: Colors.white,
  },
});

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  section: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  imageRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  imageWrap: { position: 'relative' },
  imageThumbnail: { width: 90, height: 90, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6 },
  addImageButtons: { flexDirection: 'row', gap: Spacing.sm },
  addImageBtn: {
    width: 90, height: 90, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  imageHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
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
  variantHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  variantToggle: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  variantToggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  variantToggleTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  variantToggleTxtActive: { color: Colors.white },
  variantHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
  variantCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  variantCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  variantCardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  variantInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: FontSize.sm, color: Colors.text, backgroundColor: Colors.white, marginBottom: Spacing.xs },
  variantRow: { flexDirection: 'row', gap: Spacing.sm },
  addVariantBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  addVariantTxt: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
