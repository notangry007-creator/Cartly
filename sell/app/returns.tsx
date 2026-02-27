import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '@/src/stores/orderStore';
import OrderStatusBadge from '@/src/components/common/OrderStatusBadge';
import EmptyState from '@/src/components/common/EmptyState';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDateTime } from '@/src/utils/helpers';
import { Order } from '@/src/types';

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_picked', 'refunded'] as const;

export default function ReturnsScreen() {
  const router = useRouter();
  const { orders, updateStatus } = useOrderStore();

  const returnOrders = orders.filter((o) => RETURN_STATUSES.includes(o.status as any));
  const sorted = [...returnOrders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function handleApprove(order: Order) {
    Alert.alert('Approve Return', `Approve return request for order #${order.id.toUpperCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => updateStatus(order.id, 'return_approved') },
    ]);
  }

  function handleReject(order: Order) {
    Alert.alert('Reject Return', 'Reject this return request? The order will remain delivered.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateStatus(order.id, 'delivered') },
    ]);
  }

  function handleMarkPicked(order: Order) {
    Alert.alert('Mark as Picked', 'Confirm item has been picked up from buyer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(order.id, 'return_picked') },
    ]);
  }

  function handleRefund(order: Order) {
    Alert.alert('Process Refund', `Issue refund of ${formatNPR(order.total)} to buyer?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refund', onPress: () => updateStatus(order.id, 'refunded') },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns & Refunds</Text>
        <Text style={styles.count}>{sorted.length}</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="return-down-back-outline"
            title="No return requests"
            description="Return requests from buyers will appear here."
          />
        }
        renderItem={({ item: order }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>#{order.id.toUpperCase()}</Text>
              <OrderStatusBadge status={order.status} />
            </View>

            <Text style={styles.buyerName}>{order.buyerName}</Text>
            <Text style={styles.date}>{formatDateTime(order.updatedAt)}</Text>

            {order.returnReason && (
              <View style={styles.reasonBox}>
                <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.reasonText}>{order.returnReason}</Text>
              </View>
            )}

            {/* Items */}
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Image source={{ uri: item.productImage }} style={styles.itemImg} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity} · {formatNPR(item.price)}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.total}>Total: {formatNPR(order.total)}</Text>

            {/* Action buttons based on status */}
            <View style={styles.actions}>
              {order.status === 'return_requested' && (
                <>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(order)}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(order)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'return_approved' && (
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleMarkPicked(order)}>
                  <Text style={styles.approveBtnText}>Mark as Picked Up</Text>
                </TouchableOpacity>
              )}
              {order.status === 'return_picked' && (
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleRefund(order)}>
                  <Text style={styles.approveBtnText}>Process Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  count: { color: Colors.primaryLight, fontSize: FontSize.sm },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  buyerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  date: { fontSize: FontSize.xs, color: Colors.grey500, marginBottom: Spacing.sm },
  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.grey50, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  reasonText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  itemImg: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  itemMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  total: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  approveBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: Colors.danger, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  rejectBtnText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },
});
