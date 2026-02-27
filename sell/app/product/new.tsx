import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import { useAuthStore } from '@/src/stores/authStore';
import ProductForm from '@/src/components/product/ProductForm';
import { Colors, FontSize, Spacing } from '@/src/theme';
import { ProductFormData } from '@/src/types';

export default function NewProductScreen() {
  const router = useRouter();
  const { addProduct } = useProductStore();
  const seller = useAuthStore((s) => s.seller);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: ProductFormData) {
    if (!seller) return;
    setIsLoading(true);
    try {
      await addProduct(data, seller.id);
      Alert.alert('Product Added', `"${data.name}" has been added to your listings.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 24 }} />
      </View>
      <ProductForm
        onSubmit={handleSubmit}
        submitLabel="Add Product"
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
    alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
