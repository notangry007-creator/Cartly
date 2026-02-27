import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/src/stores/authStore';
import { useCartStore } from '@/src/stores/cartStore';
import { useZoneStore } from '@/src/stores/zoneStore';
import { useAddresses } from '@/src/hooks/useAddresses';
import { useCreateOrder } from '@/src/hooks/useOrders';
import { useAddWalletTransaction } from '@/src/hooks/useWallet';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { useToast } from '@/src/context/ToastContext';
import { PRODUCTS, COUPONS } from '@/src/data/seed';
import { getZone, calculateShippingFee } from '@/src/data/zones';
import { formatNPR } from '@/src/utils/helpers';
import { DeliveryOption, OrderItem, PaymentMethod } from '@/src/types';
import { theme, SPACING, RADIUS, useAppColors } from '@/src/theme';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import AddressStep from '@/src/components/checkout/AddressStep';
import DeliveryStep from '@/src/components/checkout/DeliveryStep';
import PaymentStep from '@/src/components/checkout/PaymentStep';
import ReviewStep from '@/src/components/checkout/ReviewStep';

const STEPS = ['Address', 'Delivery', 'Payment', 'Review'];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const { couponCode: pCoupon } = useLocalSearchParams<{ couponCode?: string }>();
  const { user, debitWallet } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const { zoneId } = useZoneStore();
  const { data: addresses = [], isLoading: loadAddr } = useAddresses(user?.id ?? '');
  const { mutateAsync: createOrder, isPending: creating } = useCreateOrder();
  const { mutateAsync: addTx } = useAddWalletTransaction();
  const { addNotification } = useNotificationStore();
  const { showError } = useToast();

  const zone = getZone(zoneId);
  const [step, setStep] = useState(0);
  const [selAddrId, setSelAddrId] = useState('');
  const [dOpt, setDOpt] = useState<DeliveryOption>(
    (zone.deliveryOptions[0] as DeliveryOption) ?? 'standard',
  );
  const [payMethod, setPayMethod] = useState<PaymentMethod>(
    zone.codAvailable ? 'cod' : 'wallet',
  );

  // ── Derived pricing ─────────────────────────────────────────────────────────
  const appliedCoupon = pCoupon ? COUPONS.find(c => c.code === pCoupon) : null;
  const resolved = items
    .map(item => {
      const p = PRODUCTS.find(x => x.id === item.productId);
      const v = p?.variants.find(x => x.id === item.variantId);
      return { item, p, v };
    })
    .filter(r => r.p && r.v);

  const subtotal = resolved.reduce((s, { item, v }) => s + (v?.price ?? 0) * item.quantity, 0);
  const totalWeightKg = resolved.reduce((s, { item, p }) => s + (p?.weightKg ?? 0.5) * item.quantity, 0);
  const shippingFee = calculateShippingFee(zoneId, dOpt, totalWeightKg);
  const codFee = payMethod === 'cod' ? zone.codFee : 0;
  const discount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.min(
          Math.round((subtotal * appliedCoupon.value) / 100),
          appliedCoupon.maxDiscount ?? Infinity,
        )
      : appliedCoupon.value
    : 0;
  const total = subtotal + shippingFee + codFee - discount;
  const selAddr = addresses.find(a => a.id === selAddrId) ?? addresses.find(a => a.isDefault);

  // Redirect if cart is empty or user is not logged in
  if (!user || !items.length) {
    router.replace('/(tabs)/cart');
    return null;
  }

  function canProceed(): boolean {
    if (step === 0) return !!selAddr;
    if (step === 1) return !!dOpt;
    if (step === 2) {
      if (payMethod === 'wallet') return (user?.walletBalance ?? 0) >= total;
      if (payMethod === 'cod') return zone.codAvailable;
      return true;
    }
    return true;
  }

  async function placeOrder() {
    if (!selAddr || !user) return;
    const u = user;
    try {
      const orderItems: OrderItem[] = resolved.map(({ item, p, v }) => ({
        productId: item.productId,
        variantId: item.variantId,
        title: p!.title,
        variantLabel: v!.label,
        imageUrl: p!.images[0],
        quantity: item.quantity,
        price: v!.price,
        mrp: v!.mrp,
      }));

      const order = await createOrder({
        userId: u.id,
        items: orderItems,
        addressId: selAddr.id,
        addressSnapshot: selAddr,
        zoneId,
        deliveryOption: dOpt,
        paymentMethod: payMethod,
        subtotal,
        shippingFee,
        codFee,
        discount,
        couponCode: appliedCoupon?.code,
        total,
        status: 'pending',
      });

      if (payMethod === 'wallet') {
        await debitWallet(total);
        await addTx({
          userId: u.id,
          type: 'debit',
          amount: total,
          description: 'Order ' + order.id,
          referenceId: order.id,
          balance: u.walletBalance - total,
        });
      }

      await clearCart();
      await addNotification({
        title: 'Order Placed!',
        body: `Order #${order.id.slice(-8).toUpperCase()} placed. Total: ${formatNPR(total)}`,
        type: 'order',
        referenceId: order.id,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace({
        pathname: '/order/confirmation',
        params: {
          orderId: order.id,
          total: String(total),
          expectedDelivery: order.expectedDelivery,
          paymentMethod: payMethod,
        },
      });
    } catch {
      showError('Failed to place order. Please try again.');
    }
  }

  // ── Step content ─────────────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <AddressStep
            addresses={addresses}
            isLoading={loadAddr}
            selectedId={selAddrId}
            onSelect={setSelAddrId}
          />
        );
      case 1:
        return (
          <DeliveryStep
            options={zone.deliveryOptions}
            zoneId={zoneId}
            selected={dOpt}
            onSelect={setDOpt}
          />
        );
      case 2:
        return (
          <PaymentStep
            zone={zone}
            selected={payMethod}
            walletBalance={user?.walletBalance ?? 0}
            total={total}
            onSelect={setPayMethod}
          />
        );
      case 3: {
        const reviewItems: OrderItem[] = resolved.map(({ item, p, v }) => ({
          productId: item.productId,
          variantId: item.variantId,
          title: p!.title,
          variantLabel: v!.label,
          imageUrl: p!.images[0],
          quantity: item.quantity,
          price: v!.price,
          mrp: v!.mrp,
        }));
        return (
          <ReviewStep
            selectedAddress={selAddr}
            items={reviewItems}
            subtotal={subtotal}
            shippingFee={shippingFee}
            codFee={codFee}
            discount={discount}
            total={total}
            paymentMethod={payMethod}
          />
        );
      }
      default:
        return null;
    }
  }

  return (
    <View style={[s.container, { backgroundColor: c.screenBg, paddingTop: insets.top }]}>
      <ScreenHeader title="Checkout" />

      {/* Step indicator bar */}
      <View style={[s.stepBar, { backgroundColor: c.cardBg, borderBottomColor: c.divider }]}>
        {STEPS.map((st, i) => (
          <React.Fragment key={st}>
            <TouchableOpacity
              style={s.stepItem}
              onPress={() => i < step && setStep(i)}
              disabled={i >= step}
            >
              <View
                style={[
                  s.stepCircle,
                  { backgroundColor: c.screenBg },
                  i <= step && { backgroundColor: theme.colors.primary },
                  i < step && { backgroundColor: '#2E7D32' },
                ]}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[s.stepNum, i === step && s.stepNumActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                variant="labelSmall"
                style={[
                  s.stepLabel,
                  { color: c.textMuted },
                  i === step && { color: theme.colors.primary, fontWeight: '700' },
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
            {i < STEPS.length - 1 && (
              <View
                style={[
                  s.stepLine,
                  { backgroundColor: c.border },
                  i < step && { backgroundColor: '#2E7D32' },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {renderStep()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={[
          s.bottomBar,
          { backgroundColor: c.cardBg, borderTopColor: c.divider, paddingBottom: insets.bottom + SPACING.sm },
        ]}
      >
        {step > 0 && (
          <Button
            mode="outlined"
            onPress={() => { setStep(step - 1); Haptics.selectionAsync(); }}
          >
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            mode="contained"
            onPress={() => { setStep(step + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            disabled={!canProceed()}
            style={s.nextBtn}
            contentStyle={{ paddingVertical: 4 }}
          >
            Continue
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={placeOrder}
            loading={creating}
            disabled={creating || !canProceed()}
            style={s.nextBtn}
            contentStyle={{ paddingVertical: 4 }}
          >
            Place Order · {formatNPR(total)}
          </Button>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: { color: '#999', fontSize: 12, fontWeight: '700' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10 },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  scroll: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  nextBtn: { flex: 1 },
});
