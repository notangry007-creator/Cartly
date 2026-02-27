import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { Text, Button, Surface, Divider, ActivityIndicator, RadioButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrder, useCancelOrder,
  useCancelOrderItem, useChangeOrderAddress,
} from '../../src/hooks/useOrders';
import { useAddresses } from '../../src/hooks/useAddresses';
import { useCartStore } from '../../src/stores/cartStore';
import { formatDate, formatDateTime, formatNPR } from '../../src/utils/helpers';
import { OrderStatus, Address } from '../../src/types';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import DeliveryTrackingMap from '../../src/components/common/DeliveryTrackingMap';
import { theme, SPACING, RADIUS } from '../../src/theme';

const SL: Record<OrderStatus, string> = {
  pending: 'Order Placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
  return_requested: 'Return Requested', return_approved: 'Return Approved',
  return_picked: 'Picked Up', refunded: 'Refunded',
};
const SI: Record<OrderStatus, string> = {
  pending: 'hourglass', confirmed: 'checkmark-circle', packed: 'cube', shipped: 'car',
  out_for_delivery: 'bicycle', delivered: 'checkmark-done-circle', cancelled: 'close-circle',
  return_requested: 'return-up-back', return_approved: 'checkmark-circle',
  return_picked: 'cube-outline', refunded: 'wallet',
};
const TL_ORDER: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const NEXT: Record<string, OrderStatus> = {
  pending: 'confirmed', confirmed: 'packed', packed: 'shipped',
  shipped: 'out_for_delivery', out_for_delivery: 'delivered',
};

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Ordered by mistake',
  'Delivery time too long',
  'Other',
];

// 7-day return window in milliseconds
const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function PR({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text variant="bodySmall" style={{ color: '#666' }}>{label}</Text>
      <Text variant="bodySmall" style={{ fontWeight: bold ? '700' : '400', color: green ? '#2E7D32' : '#333' }}>{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: order, isLoading } = useOrder(user?.id ?? '', id);
  const { mutateAsync: cancelOrder, isPending: cancelling } = useCancelOrder();
  const { mutateAsync: cancelItem } = useCancelOrderItem();
  const { mutateAsync: changeAddress } = useChangeOrderAddress();
  const { data: addresses = [] } = useAddresses(user?.id ?? '');
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Order" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Order not found</Text>
        </View>
      </View>
    );
  }

  async function handleShareInvoice() {
    if (!order) return;
    const { Share } = require('react-native');
    const lines = [
      '========================================',
      '           BUY - ORDER INVOICE',
      '========================================',
      `Order ID:    #${order.id.slice(-10).toUpperCase()}`,
      `Date:        ${formatDate(order.createdAt)}`,
      `Status:      ${SL[order.status]}`,
      '',
      '--- DELIVERY ADDRESS ---',
      `${order.addressSnapshot.label}: ${order.addressSnapshot.landmark}`,
      `Ward ${order.addressSnapshot.ward}, ${order.addressSnapshot.municipality}`,
      `${order.addressSnapshot.district}`,
      '',
      '--- ITEMS ---',
      ...order.items.map(i => `${i.title} (${i.variantLabel}) x${i.quantity}  ${formatNPR(i.price * i.quantity)}`),
      '',
      '--- PRICE BREAKDOWN ---',
      `Subtotal:    ${formatNPR(order.subtotal)}`,
      `Shipping:    ${formatNPR(order.shippingFee)}`,
      ...(order.codFee > 0 ? [`COD Fee:     ${formatNPR(order.codFee)}`] : []),
      ...(order.discount > 0 ? [`Discount:    -${formatNPR(order.discount)}${order.couponCode ? ` (${order.couponCode})` : ''}`] : []),
      '----------------------------------------',
      `TOTAL:       ${formatNPR(order.total)}`,
      `Payment:     ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet'}`,
      '',
      `Expected:    ${formatDate(order.expectedDelivery)}`,
      '========================================',
      "Thank you for shopping with Buy!",
      "Nepal's trusted shopping platform",
      '========================================',
    ];
    await Share.share({
      title: `Buy Order Invoice #${order.id.slice(-8).toUpperCase()}`,
      message: lines.join('\n'),
    });
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  // 7-day return window enforcement
  const deliveredAt = order.timeline.find(t => t.status === 'delivered')?.timestamp;
  const isWithinReturnWindow = deliveredAt
    ? Date.now() - new Date(deliveredAt).getTime() <= RETURN_WINDOW_MS
    : false;
  const canReturn = order.status === 'delivered' && isWithinReturnWindow;
  const returnWindowExpired = order.status === 'delivered' && !isWithinReturnWindow;

  const canBuyAgain = ['delivered', 'cancelled', 'refunded'].includes(order.status);
  const canChangeAddress = ['pending', 'confirmed'].includes(order.status);

  async function handleBuyAgain() {
    if (!user || !order) return;
    for (const item of order.items) {
      await addItem(user.id, item.productId, item.variantId, item.quantity);
    }
    router.push('/(tabs)/cart');
  }

  async function handleCancelConfirm() {
    if (!user) return;
    setShowCancelModal(false);
    await cancelOrder({ userId: user.id, orderId: order.id, reason: cancelReason });
  }

  async function handleCancelItem(productId: string, variantId: string, title: string) {
    if (!user) return;
    Alert.alert(
      'Cancel Item',
      `Remove "${title}" from this order?`,
      [
        { text: 'No' },
        {
          text: 'Yes, Cancel Item',
          style: 'destructive',
          onPress: () => cancelItem({ userId: user.id, orderId: order.id, productId, variantId }),
        },
      ]
    );
  }

  async function handleChangeAddress() {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr || !user) return;
    setShowAddressModal(false);
    await changeAddress({ userId: user.id, orderId: order.id, newAddress: addr });
  }

  const tlStatuses = order.timeline.map(t => t.status);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={'Order #' + order.id.slice(-8).toUpperCase()} />
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { queryClient.invalidateQueries({ queryKey: ['order', user?.id, order?.id] }); }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Status card */}
        <Surface style={s.statusCard} elevation={2}>
          <View style={s.statusTop}>
            <Ionicons name={SI[order.status] as any} size={36} color={theme.colors.primary} />
            <View>
              <Text variant="headlineSmall" style={s.statusTitle}>{SL[order.status]}</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>
                {order.status === 'delivered'
                  ? 'Delivered ' + formatDate(order.timeline.find(t => t.status === 'delivered')?.timestamp ?? order.expectedDelivery)
                  : 'Expected: ' + formatDate(order.expectedDelivery)
                }
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={s.timeline}>
            {TL_ORDER.map((st, i) => {
              const done = tlStatuses.includes(st);
              const isCur = order.status === st;
              const tl = order.timeline.find(t => t.status === st);
              return (
                <View key={st} style={s.tlItem}>
                  <View style={s.tlLeft}>
                    <View style={[s.tlDot, done && s.tlDotDone, isCur && s.tlDotCur]}>
                      {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    {i < TL_ORDER.length - 1 && <View style={[s.tlLine, done && s.tlLineDone]} />}
                  </View>
                  <View style={s.tlRight}>
                    <Text variant="labelMedium" style={[s.tlLabel, !done && s.tlLabelF]}>{SL[st]}</Text>
                    {tl && <Text variant="labelSmall" style={{ color: '#888' }}>{formatDateTime(tl.timestamp)}</Text>}
                    {tl?.note && <Text variant="labelSmall" style={{ color: '#aaa', fontStyle: 'italic' }}>{tl.note}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

        </Surface>

        {/* Live delivery map */}
        <DeliveryTrackingMap order={order} />

        {/* Items */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Items</Text>
          {order.items.map(item => (
            <View key={item.productId + item.variantId} style={s.itemRow}>
              <TouchableOpacity
                style={s.itemTouchable}
                onPress={() => router.push('/product/' + item.productId)}
                accessibilityRole="button"
                accessibilityLabel={`View product: ${item.title}, quantity ${item.quantity}`}
              >
                <Image source={{ uri: item.imageUrl }} style={s.itemImg} contentFit="cover" />
                <View style={s.itemInfo}>
                  <Text variant="labelMedium" style={{ color: '#333', lineHeight: 16 }} numberOfLines={2}>{item.title}</Text>
                  <Text variant="labelSmall" style={{ color: '#888' }}>{item.variantLabel}</Text>
                  <Text variant="labelSmall" style={{ color: '#aaa' }}>Qty: {item.quantity}</Text>
                </View>
                <Text variant="titleSmall" style={{ fontWeight: '700', color: '#222' }}>{formatNPR(item.price * item.quantity)}</Text>
              </TouchableOpacity>
              {/* Cancel individual item — only for pending/confirmed */}
              {canCancel && (
                <TouchableOpacity
                  style={s.cancelItemBtn}
                  onPress={() => handleCancelItem(item.productId, item.variantId, item.title)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cancel ${item.title}`}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#B71C1C" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Surface>

        {/* Delivery address */}
        <Surface style={s.section} elevation={1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text variant="titleSmall" style={s.secTitle}>Delivery Address</Text>
            </View>
            {canChangeAddress && (
              <TouchableOpacity
                onPress={() => { setSelectedAddressId(order.addressId); setShowAddressModal(true); }}
                accessibilityRole="button"
                accessibilityLabel="Change delivery address"
              >
                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text variant="bodySmall" style={{ color: '#555' }}>
            <Text style={{ fontWeight: '700' }}>{order.addressSnapshot.label}: </Text>
            {order.addressSnapshot.landmark}, Ward {order.addressSnapshot.ward}, {order.addressSnapshot.municipality}, {order.addressSnapshot.district}
          </Text>
        </Surface>

        {/* Payment */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Payment</Text>
          <PR label="Subtotal" value={formatNPR(order.subtotal)} />
          <PR label="Shipping" value={formatNPR(order.shippingFee)} />
          {order.codFee > 0 && <PR label="COD Fee" value={formatNPR(order.codFee)} />}
          {order.discount > 0 && <PR label={'Discount' + (order.couponCode ? ' (' + order.couponCode + ')' : '')} value={'- ' + formatNPR(order.discount)} green />}
          <Divider style={{ marginVertical: SPACING.sm }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>Total</Text>
            <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>{formatNPR(order.total)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text variant="bodySmall" style={{ color: '#555' }}>Method</Text>
            <Text variant="bodySmall">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet'}</Text>
          </View>
        </Surface>

        {/* Actions */}
        <View style={s.actions}>
          {/* Share Invoice — always available */}
          <Button
            mode="outlined"
            onPress={handleShareInvoice}
            icon="share-social-outline"
            accessibilityRole="button"
            accessibilityLabel="Share order invoice"
          >
            Share Invoice
          </Button>

          {canCancel && (
            <Button
              mode="outlined"
              onPress={() => setShowCancelModal(true)}
              loading={cancelling}
              textColor={theme.colors.error}
              accessibilityRole="button"
              accessibilityLabel="Cancel this order"
            >
              Cancel Order
            </Button>
          )}
          {canReturn && (
            <Button
              mode="outlined"
              onPress={() => router.push('/order/return/' + order.id)}
              icon="return-up-back"
              accessibilityRole="button"
              accessibilityLabel="Request a return for this order"
            >
              Request Return
            </Button>
          )}
          {returnWindowExpired && (
            <Surface style={s.returnExpiredBanner} elevation={0}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text variant="labelSmall" style={{ color: '#888', flex: 1 }}>
                Return window expired (7 days from delivery)
              </Text>
            </Surface>
          )}
          {canBuyAgain && (
            <Button
              mode="outlined"
              onPress={handleBuyAgain}
              icon="refresh"
              accessibilityRole="button"
              accessibilityLabel="Buy again — add all items from this order to cart"
            >
              Buy Again
            </Button>
          )}
          {order.canReview && (
            <Button
              mode="contained"
              onPress={() => router.push({ pathname: '/order/review', params: { orderId: order.id } })}
              icon="star"
              accessibilityRole="button"
              accessibilityLabel={`Write reviews for ${order.items.length} product${order.items.length > 1 ? 's' : ''}`}
            >
              Write Reviews ({order.items.length} product{order.items.length > 1 ? 's' : ''})
            </Button>
          )}
        </View>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Cancel order modal with reason */}
      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text variant="titleMedium" style={s.modalTitle}>Cancel Order</Text>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: SPACING.md }}>
              Please tell us why you're cancelling:
            </Text>
            {CANCEL_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={s.reasonRow}
                onPress={() => setCancelReason(reason)}
              >
                <RadioButton.Android
                  value={reason}
                  status={cancelReason === reason ? 'checked' : 'unchecked'}
                  onPress={() => setCancelReason(reason)}
                  color={theme.colors.primary}
                />
                <Text variant="bodyMedium" style={{ color: '#333' }}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <View style={s.modalActions}>
              <Button mode="outlined" onPress={() => setShowCancelModal(false)}>Keep Order</Button>
              <Button mode="contained" onPress={handleCancelConfirm} buttonColor={theme.colors.error}>
                Cancel Order
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change address modal */}
      <Modal visible={showAddressModal} transparent animationType="fade" onRequestClose={() => setShowAddressModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text variant="titleMedium" style={s.modalTitle}>Change Delivery Address</Text>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: SPACING.md }}>
              Select a new delivery address:
            </Text>
            {addresses.map(addr => (
              <TouchableOpacity
                key={addr.id}
                style={[s.addrOption, selectedAddressId === addr.id && s.addrOptionSel]}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <RadioButton.Android
                  value={addr.id}
                  status={selectedAddressId === addr.id ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedAddressId(addr.id)}
                  color={theme.colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="labelMedium" style={{ fontWeight: '700', color: '#222' }}>{addr.label}</Text>
                  <Text variant="bodySmall" style={{ color: '#555' }}>
                    {addr.landmark}, Ward {addr.ward}, {addr.municipality}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={s.modalActions}>
              <Button mode="outlined" onPress={() => setShowAddressModal(false)}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleChangeAddress}
                disabled={!selectedAddressId || selectedAddressId === order.addressId}
              >
                Confirm Change
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  statusCard: { margin: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, backgroundColor: '#fff' },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  statusTitle: { fontWeight: '700', color: '#222' },
  timeline: { gap: 0 },
  tlItem: { flexDirection: 'row', gap: SPACING.md },
  tlLeft: { alignItems: 'center', width: 20 },
  tlDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  tlDotDone: { backgroundColor: '#2E7D32' },
  tlDotCur: { backgroundColor: theme.colors.primary },
  tlLine: { flex: 1, width: 2, backgroundColor: '#e0e0e0', minHeight: 24 },
  tlLineDone: { backgroundColor: '#2E7D32' },
  tlRight: { flex: 1, paddingBottom: SPACING.md },
  tlLabel: { fontWeight: '600', color: '#222' },
  tlLabelF: { color: '#bbb', fontWeight: '400' },
  section: { margin: SPACING.md, marginTop: 0, borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: '#fff' },
  secTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  itemTouchable: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', flex: 1 },
  itemImg: { width: 60, height: 60, borderRadius: RADIUS.sm },
  itemInfo: { flex: 1 },
  cancelItemBtn: { padding: SPACING.xs, marginLeft: SPACING.xs },
  actions: { margin: SPACING.md, marginTop: 0, gap: SPACING.sm },
  returnExpiredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: '#f5f5f5',
  },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', gap: SPACING.xs },
  modalTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.sm },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md, justifyContent: 'flex-end' },
  addrOption: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0', marginBottom: SPACING.sm },
  addrOptionSel: { borderColor: theme.colors.primary, backgroundColor: '#FFF5F5' },
});
