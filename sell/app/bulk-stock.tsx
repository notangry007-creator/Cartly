import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '@/src/stores/productStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR } from '@/src/utils/helpers';

export default function BulkStockScreen() {
  const router = useRouter();
  const { products, bulkUpdateStock } = useProductStore();
  const [stockMap, setStockMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function updateStock(id: string, value: string) {
    setStockMap(prev => ({ ...prev, [id]: value }));
  }

  async function handleSave() {
    const updates = Object.entries(stockMap)
      .map(([id, val]) => ({ id, stock: parseInt(val, 10) }))
      .filter(u => !isNaN(u.stock) && u.stock >= 0);

    if (updates.length === 0) {
      Alert.alert('No Changes', 'No stock values were modified.');
      return;
    }

    Alert.alert(
      'Update Stock',
      `Update stock for ${updates.length} product${updates.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setIsSaving(true);
            await bulkUpdateStock(updates);
            setIsSaving(false);
            Alert.alert('Done', 'Stock updated successfully.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  }

  const changedCount = Object.keys(stockMap).filter(id => stockMap[id] !== '').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Stock Update</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || changedCount === 0}
          style={[styles.saveBtn, (isSaving || changedCount === 0) && { opacity: 0.5 }]}
        >
          <Text style={styles.saveBtnTxt}>{isSaving ? 'Saving...' : `Save (${changedCount})`}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Enter new stock quantities. Leave blank to keep current stock.
      </Text>

      <FlatList
        data={products}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: product }) => {
          const currentStock = product.variants[0]?.stock ?? 0;
          const newVal = stockMap[product.id];
          const hasChange = newVal !== undefined && newVal !== '';
          return (
            <View style={[styles.card, hasChange && styles.cardChanged]}>
              <Image source={{ uri: product.images[0] }} style={styles.img} contentFit="cover" />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{product.title}</Text>
                <Text style={styles.price}>{formatNPR(product.basePrice)}</Text>
                <View style={styles.stockRow}>
                  <Text style={styles.currentStock}>Current: {currentStock}</Text>
                  {hasChange && (
                    <Text style={[styles.newStock, { color: parseInt(newVal) === 0 ? Colors.danger : Colors.success }]}>
                      → {newVal}
                    </Text>
                  )}
                </View>
              </View>
              <TextInput
                style={[styles.input, hasChange && styles.inputChanged]}
                placeholder={String(currentStock)}
                placeholderTextColor={Colors.grey400}
                keyboardType="number-pad"
                value={newVal ?? ''}
                onChangeText={val => updateStock(product.id, val)}
                maxLength={6}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={Colors.grey400} />
            <Text style={styles.emptyTxt}>No products found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  saveBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  saveBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  hint: { padding: Spacing.md, fontSize: FontSize.sm, color: Colors.textSecondary, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, ...Shadow.sm, borderWidth: 1.5, borderColor: 'transparent' },
  cardChanged: { borderColor: Colors.primary },
  img: { width: 56, height: 56, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  info: { flex: 1, marginLeft: Spacing.sm },
  name: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, lineHeight: 16 },
  price: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  currentStock: { fontSize: FontSize.xs, color: Colors.textSecondary },
  newStock: { fontSize: FontSize.xs, fontWeight: '700' },
  input: { width: 72, height: 40, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, fontSize: FontSize.md, color: Colors.text, textAlign: 'center', backgroundColor: Colors.white },
  inputChanged: { borderColor: Colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl },
  emptyTxt: { color: Colors.textSecondary, fontSize: FontSize.md },
});
