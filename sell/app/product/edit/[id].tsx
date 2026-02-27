import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import ProductForm from '@/src/components/product/ProductForm';
import { Colors, FontSize, Spacing } from '@/src/theme';
import { ProductFormData } from '@/src/types';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, updateProduct } = useProductStore();
  const product = products.find((p) => p.id === id);
  const [isLoading, setIsLoading] = useState(false);

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  async function handleSubmit(data: ProductFormData) {
    const productId = product!.id;
    setIsLoading(true);
    try {
      await updateProduct(productId, data);
      Alert.alert('Saved', 'Product updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Map Product → ProductFormData for the form
  const defaultVariant = product.variants[0];
  const initialValues = {
    title: product.title,
    description: product.description,
    price: defaultVariant?.price ?? product.basePrice,
    mrp: defaultVariant?.mrp ?? product.baseMrp,
    sku: defaultVariant?.sku ?? '',
    stock: defaultVariant?.stock ?? 0,
    categoryId: product.categoryId,
    tags: product.tags,
    images: product.images,
    status: product.status,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Edit Product</Text>
        <View style={{ width: 22 }} />
      </View>
      <ProductForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.md,
  },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
