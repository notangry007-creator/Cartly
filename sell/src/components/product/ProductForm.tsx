import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../theme';
import { ProductFormData, ProductStatus } from '../../types';

const CATEGORIES = [
  'Electronics', 'Computers', 'Accessories', 'Home & Office',
  'Clothing', 'Books', 'Sports', 'Other',
];

interface Props {
  initialValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel: string;
  isLoading: boolean;
}

export default function ProductForm({ initialValues, onSubmit, submitLabel, isLoading }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(initialValues?.price ? String(initialValues.price) : '');
  const [comparePrice, setComparePrice] = useState(
    initialValues?.comparePrice ? String(initialValues.comparePrice) : '',
  );
  const [sku, setSku] = useState(initialValues?.sku ?? '');
  const [stock, setStock] = useState(initialValues?.stock !== undefined ? String(initialValues.stock) : '');
  const [category, setCategory] = useState(initialValues?.category ?? CATEGORIES[0]);
  const [tags, setTags] = useState(initialValues?.tags?.join(', ') ?? '');
  const [status, setStatus] = useState<ProductStatus>(initialValues?.status ?? 'active');
  const [images, setImages] = useState<string[]>(initialValues?.images ?? []);

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
    if (!name.trim() || !price.trim() || !sku.trim() || !stock.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Name, Price, SKU, and Stock.');
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
    // Use a placeholder if no image uploaded
    const finalImages = images.length > 0
      ? images
      : [`https://picsum.photos/seed/${sku.trim()}/400/400`];

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      sku: sku.trim().toUpperCase(),
      stock: parsedStock,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: finalImages,
      status,
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
        <Field label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Wireless Earbuds" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe your product..." multiline />
        <Field label="SKU *" value={sku} onChangeText={setSku} placeholder="e.g. EARB-001" autoCapitalize="characters" />
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <Field label="Price (NPR) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
        <Field label="Compare Price (NPR)" value={comparePrice} onChangeText={setComparePrice} placeholder="Optional original price" keyboardType="decimal-pad" />
      </View>

      {/* Inventory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <Field label="Stock Quantity *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
      </View>

      {/* Category */}
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
});
