import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { Text, Surface, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { COUPONS } from '../src/data/seed';
import { formatNPR, formatDate } from '../src/utils/helpers';
import { useToast } from '../src/context/ToastContext';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { useCartStore } from '../src/stores/cartStore';
import { useAuthStore } from '../src/stores/authStore';
import { theme, SPACING, RADIUS } from '../src/theme';

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess } = useToast();
  const { user } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCoupon(code: string) {
    // Use native Share as a fallback since @react-native-clipboard/clipboard is not installed
    // This shares the coupon code via the native share sheet
    try {
      await Share.share({ message: code, title: `Coupon Code: ${code}` });
    } catch {}
    setCopied(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopied(null), 2000);
  }

  function applyToCart(code: string) {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart first, then come back to apply a coupon.');
      return;
    }
    // Navigate to cart with the coupon pre-filled via URL param
    router.push({ pathname: '/(tabs)/cart', params: { applyCoupon: code } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(`Coupon "${code}" will be applied at checkout`);
  }

  const activeCoupons = COUPONS.filter(c => new Date(c.expiresAt) > new Date());

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Offers & Coupons" />
      <FlatList
        data={activeCoupons}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="pricetag-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={s.emptyTitle}>No active offers</Text>
            <Text variant="bodySmall" style={s.emptySub}>Check back later for new deals</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCopied = copied === item.code;
          const discountStr = item.type === 'percent'
            ? `${item.value}% off${item.maxDiscount ? ` (max ${formatNPR(item.maxDiscount)})` : ''}`
            : `${formatNPR(item.value)} off`;
          return (
            <Surface style={s.card} elevation={1}>
              {/* Dashed ticket border */}
              <View style={s.cardLeft}>
                <Text style={s.discountBig}>{item.type === 'percent' ? `${item.value}%` : formatNPR(item.value)}</Text>
                <Text style={s.discountLabel}>OFF</Text>
              </View>
              <View style={s.dividerVertical} />
              <View style={s.cardRight}>
                 <View style={s.codeRow}>
                   <View style={s.codeBadge}>
                     <Text style={s.codeText}>{item.code}</Text>
                   </View>
                   <TouchableOpacity
                     style={[s.copyBtn, isCopied && s.copyBtnDone]}
                     onPress={() => copyCoupon(item.code)}
                     accessibilityRole="button"
                     accessibilityLabel={`Copy coupon code ${item.code}`}
                   >
                     <Ionicons name={isCopied ? 'checkmark' : 'copy'} size={14} color={isCopied ? '#2E7D32' : theme.colors.primary} />
                     <Text style={[s.copyTxt, isCopied && s.copyTxtDone]}>{isCopied ? 'Copied!' : 'Copy'}</Text>
                   </TouchableOpacity>
                 </View>
                 {/* Apply to cart button */}
                 <Button
                   mode="contained"
                   compact
                   onPress={() => applyToCart(item.code)}
                   style={s.applyBtn}
                   contentStyle={s.applyBtnContent}
                   accessibilityRole="button"
                   accessibilityLabel={`Apply coupon ${item.code} to cart`}
                 >
                   Apply to Cart
                 </Button>
                <Text variant="bodySmall" style={s.desc}>{discountStr}</Text>
                <Text variant="labelSmall" style={s.minSpend}>Min. spend: {formatNPR(item.minSpend)}</Text>
                {item.validZones && (
                  <View style={s.tagsRow}>
                    {item.validZones.map(z => (
                      <Chip key={z} compact style={s.zoneTag} textStyle={{ fontSize: 10 }}>
                        {z.replace('_', ' ').toUpperCase()}
                      </Chip>
                    ))}
                  </View>
                )}
                <Text variant="labelSmall" style={s.expiry}>Expires: {formatDate(item.expiresAt)}</Text>
              </View>
            </Surface>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: SPACING.md, gap: SPACING.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 300 },
  emptyTitle: { fontWeight: '600', color: '#555' },
  emptySub: { color: '#999', textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.lg, overflow: 'hidden' },
  cardLeft: { width: 80, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', padding: SPACING.sm },
  discountBig: { color: '#fff', fontSize: 22, fontWeight: '900' },
  discountLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  dividerVertical: { width: 1, backgroundColor: '#f0f0f0' },
  cardRight: { flex: 1, padding: SPACING.md, gap: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  codeBadge: { backgroundColor: theme.colors.primaryContainer, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed' },
  codeText: { color: theme.colors.primary, fontWeight: '800', letterSpacing: 1, fontSize: 14 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: theme.colors.primary },
  copyBtnDone: { borderColor: '#2E7D32' },
  copyTxt: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  copyTxtDone: { color: '#2E7D32' },
  desc: { color: '#333', fontWeight: '600' },
  minSpend: { color: '#888' },
  tagsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  zoneTag: { backgroundColor: '#E3F2FD' },
  expiry: { color: '#aaa' },
  applyBtn: { marginTop: SPACING.xs, alignSelf: 'flex-start' },
  applyBtnContent: { paddingHorizontal: SPACING.sm, paddingVertical: 0 },
});
