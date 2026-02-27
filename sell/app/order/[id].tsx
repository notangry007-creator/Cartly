import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '@/src/stores/orderStore';
import OrderStatusBadge from '@/src/components/common/OrderStatusBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDateTime, orderStatusLabel } from '@/src/utils/helpers';
import { OrderStatus } from '@/src/types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'out_for_delivery',
  out_for_delivery: 'delivered',
  return_requested: 'return_approved',
  return_approved: 'return_picked',
  return_picked: 'refunded',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders, updateStatus } = useOrderStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Order not found.</Text>
      </View>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];

  function handleAdvanceStatus() {
    if (!nextStatus || !order) return;
    const orderId = order.id;
    Alert.alert('Update Status', `Mark this order as "${nextStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => updateStatus(orderId, nextStatus) },
    ]);
  }

  function handleCancel() {
    if (!order) return;
    const orderId = order.id;
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => updateStatus(orderId, 'cancelled') },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.toUpperCase()}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <OrderStatusBadge status={order.status} />
            <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
          </View>
          {order.note && (
            <View style={styles.noteWrap}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.note}>{order.note}</Text>
            </View>
          )}
        </View>

        {/* Buyer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buyer</Text>
          <InfoRow icon="person-outline" label={order.buyerName} />
          <InfoRow icon="call-outline" label={order.buyerPhone} />
          <InfoRow icon="location-outline" label={order.buyerAddress} />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image source={{ uri: item.productImage }} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity} × {formatNPR(item.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatNPR(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name={order.isPaid ? 'checkmark-circle' : 'time-outline'} size={18} color={order.isPaid ? Colors.success : Colors.warning} />
            <Text style={[styles.paymentStatus, { color: order.isPaid ? Colors.success : Colors.warning }]}>
              {order.isPaid ? 'Paid' : 'Payment Pending'} · {order.paymentMethod.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          <View style={styles.totalBreakdown}>
            <TotalRow label="Subtotal" value={formatNPR(order.subtotal)} />
            <TotalRow label="Delivery Fee" value={formatNPR(order.deliveryFee)} />
            <View style={styles.divider} />
            <TotalRow label="Total" value={formatNPR(order.total)} bold />
          </View>
        </View>

        {/* Actions */}
        {(nextStatus || ['pending', 'confirmed', 'packed'].includes(order.status)) && (
          <View style={styles.actionsWrap}>
            {nextStatus && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAdvanceStatus}>
                <Ionicons name="arrow-forward-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.primaryBtnText}>
                  Mark as {orderStatusLabel(nextStatus)}
                </Text>
              </TouchableOpacity>
            )}
            {(['pending', 'confirmed', 'packed'] as const).includes(order.status as any) && (
              <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel}>
                <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                <Text style={styles.dangerBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 }}>
      <Ionicons name={icon} size={16} color={Colors.grey500} />
      <Text style={{ fontSize: FontSize.md, color: Colors.text }}>{label}</Text>
    </View>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text style={{ fontSize: FontSize.md, color: bold ? Colors.text : Colors.textSecondary, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontSize: FontSize.md, color: bold ? Colors.primary : Colors.text, fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: FontSize.xs, color: Colors.grey500 },
  noteWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.grey50, borderRadius: BorderRadius.sm },
  note: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  itemImage: { width: 56, height: 56, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  itemQty: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  paymentStatus: { fontSize: FontSize.sm, fontWeight: '600' },
  totalBreakdown: {},
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  actionsWrap: { gap: Spacing.sm },
  primaryBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  dangerBtn: { height: 52, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.danger, backgroundColor: Colors.white },
  dangerBtnText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '700' },
});
