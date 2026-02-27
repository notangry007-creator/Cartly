import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withDelay, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatNPR, formatDate } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, total, expectedDelivery, paymentMethod } = useLocalSearchParams<{
    orderId: string;
    total: string;
    expectedDelivery: string;
    paymentMethod: string;
  }>();

  // Entrance animations
  const checkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(40);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    contentTranslate.value = withDelay(400, withSpring(0, { damping: 14 }));
  }, []);

  async function handleShareInvoice() {
    const shortId = (orderId ?? '').slice(-10).toUpperCase();
    const payLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet';
    const deliveryLabel = expectedDelivery ? formatDate(expectedDelivery) : 'TBD';
    const message =
      `🛍️ Order Confirmed — Buy App\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Order ID:  #${shortId}\n` +
      `Amount:    ${formatNPR(Number(total ?? 0))}\n` +
      `Payment:   ${payLabel}\n` +
      `Delivery:  ${deliveryLabel}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Track your order in the Buy app.`;
    try {
      await Share.share({ message, title: `Order #${shortId} — Buy` });
    } catch {
      Alert.alert('Share failed', 'Could not share the invoice.');
    }
  }

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      {/* Check animation */}
      <View style={s.heroSection}>
        <Animated.View style={[s.checkCircle, checkStyle]}>
          <Ionicons name="checkmark" size={56} color="#fff" />
        </Animated.View>
        <Text variant="headlineMedium" style={s.heroTitle}>Order Placed!</Text>
        <Text variant="bodyMedium" style={s.heroSub}>
          Thank you! Your order has been confirmed.
        </Text>
      </View>

      <Animated.View style={[s.detailsCard, contentStyle]}>
        <View style={s.detailRow}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
          <View style={s.detailInfo}>
            <Text variant="labelSmall" style={s.detailLabel}>Order ID</Text>
            <Text variant="titleSmall" style={s.detailValue}>
              #{(orderId ?? '').slice(-10).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailRow}>
          <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
          <View style={s.detailInfo}>
            <Text variant="labelSmall" style={s.detailLabel}>Amount</Text>
            <Text variant="titleSmall" style={s.detailValue}>{formatNPR(Number(total ?? 0))}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailRow}>
          <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
          <View style={s.detailInfo}>
            <Text variant="labelSmall" style={s.detailLabel}>Payment</Text>
            <Text variant="titleSmall" style={s.detailValue}>
              {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet'}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailRow}>
          <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
          <View style={s.detailInfo}>
            <Text variant="labelSmall" style={s.detailLabel}>Expected Delivery</Text>
            <Text variant="titleSmall" style={s.detailValue}>
              {expectedDelivery ? formatDate(expectedDelivery) : 'Calculating...'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[s.actions, contentStyle]}>
        <Button
          mode="contained"
          onPress={() => router.replace(`/order/${orderId}`)}
          style={s.primaryBtn}
          contentStyle={s.btnContent}
          icon="receipt"
        >
          Track My Order
        </Button>
        <Button
          mode="outlined"
          onPress={handleShareInvoice}
          style={s.secondaryBtn}
          contentStyle={s.btnContent}
          icon="share-social-outline"
          accessibilityRole="button"
          accessibilityLabel="Share order invoice"
        >
          Share Invoice
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.replace('/(tabs)/home')}
          style={s.secondaryBtn}
          contentStyle={s.btnContent}
          icon="home"
        >
          Continue Shopping
        </Button>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  heroSection: { alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2E7D32', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  heroTitle: { fontWeight: '800', color: '#222', textAlign: 'center' },
  heroSub: { color: '#666', textAlign: 'center' },
  detailsCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  detailInfo: { flex: 1 },
  detailLabel: { color: '#999', marginBottom: 2 },
  detailValue: { fontWeight: '700', color: '#222' },
  divider: { height: 1, backgroundColor: '#f5f5f5' },
  actions: { width: '100%', gap: SPACING.md },
  primaryBtn: {},
  secondaryBtn: {},
  btnContent: { paddingVertical: SPACING.xs },
});
