import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '@/src/stores/orderStore';
import OrderStatusBadge from '@/src/components/common/OrderStatusBadge';
import EmptyState from '@/src/components/common/EmptyState';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDateTime } from '@/src/utils/helpers';
import { OrderStatus } from '@/src/types';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = sorted.filter((o) => {
    const matchesSearch =
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.count}>{orders.length} total</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.grey500} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.search}
          placeholder="Search by buyer or order ID..."
          placeholderTextColor={Colors.grey400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === item.value && styles.filterTabActive]}
            onPress={() => setStatusFilter(item.value)}
          >
            <Text style={[styles.filterLabel, statusFilter === item.value && styles.filterLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders found" description="Orders from buyers will appear here." />}
        renderItem={({ item: order }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/order/${order.id}` as any)}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>#{order.id.toUpperCase()}</Text>
              <OrderStatusBadge status={order.status} />
            </View>
            <Text style={styles.buyerName}>{order.buyerName}</Text>
            <Text style={styles.items} numberOfLines={1}>
              {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
            </Text>
            <View style={styles.cardBottom}>
              <Text style={styles.total}>{formatNPR(order.total)}</Text>
              <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
            </View>
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
  count: { color: Colors.primaryLight, fontSize: FontSize.sm },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: Spacing.md, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44, ...Shadow.sm },
  search: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  filterList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 8 },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterLabelActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  buyerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  items: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  date: { fontSize: FontSize.xs, color: Colors.grey500 },
});
