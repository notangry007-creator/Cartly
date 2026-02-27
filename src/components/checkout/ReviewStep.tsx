import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Address, DeliveryOption, OrderItem, PaymentMethod } from '../../types';
import { formatNPR } from '../../utils/helpers';
import { SPACING, RADIUS, useAppColors, useAppTheme } from '../../theme';

interface PricingRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface Props {
  selectedAddress: Address | undefined;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
}

export default function ReviewStep({
  selectedAddress,
  items,
  subtotal,
  shippingFee,
  codFee,
  discount,
  total,
  paymentMethod,
}: Props) {
  const c = useAppColors();
  const t = useAppTheme();

  const pricingRows: PricingRow[] = [
    { label: 'Subtotal', value: formatNPR(subtotal) },
    { label: 'Shipping', value: formatNPR(shippingFee) },
    ...(codFee > 0 ? [{ label: 'COD Fee', value: formatNPR(codFee) }] : []),
    ...(discount > 0 ? [{ label: 'Discount', value: `- ${formatNPR(discount)}`, highlight: true }] : []),
  ];

  return (
    <View style={s.container}>
      <Text variant="titleMedium" style={[s.title, { color: c.text }]}>
        Review Order
      </Text>

      {/* Delivery address */}
      <Surface style={[s.section, { backgroundColor: c.cardBg }]} elevation={1}>
        <View style={s.sectionHeader}>
          <Ionicons name="location" size={16} color={t.colors.primary} />
          <Text variant="titleSmall" style={[s.sectionTitle, { color: c.text }]}>Delivery To</Text>
        </View>
        {selectedAddress && (
          <Text variant="bodySmall" style={{ color: c.textSecondary }}>
            {selectedAddress.label}: {selectedAddress.landmark}, Ward {selectedAddress.ward}, {selectedAddress.municipality}
          </Text>
        )}
      </Surface>

      {/* Items */}
      <Surface style={[s.section, { backgroundColor: c.cardBg }]} elevation={1}>
        <Text variant="titleSmall" style={[s.sectionTitle, { color: c.text, marginBottom: SPACING.sm }]}>
          Items ({items.length})
        </Text>
        {items.map(item => (
          <View key={item.productId + item.variantId} style={s.itemRow}>
            <Text variant="bodySmall" style={[s.itemTitle, { color: c.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={{ color: c.textMuted }}>
              {item.variantLabel} ×{item.quantity} = {formatNPR(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </Surface>

      {/* Price breakdown */}
      <Surface style={[s.section, { backgroundColor: c.cardBg }]} elevation={1}>
        <Text variant="titleSmall" style={[s.sectionTitle, { color: c.text, marginBottom: SPACING.sm }]}>
          Price
        </Text>
        {pricingRows.map(row => (
          <View key={row.label} style={s.priceRow}>
            <Text variant="bodySmall" style={{ color: c.textSecondary }}>{row.label}</Text>
            <Text variant="bodySmall" style={{ color: row.highlight ? c.success : c.text }}>{row.value}</Text>
          </View>
        ))}
        <Divider style={{ marginVertical: SPACING.sm }} />
        <View style={s.priceRow}>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: c.text }}>Total</Text>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: t.colors.primary }}>
            {formatNPR(total)}
          </Text>
        </View>
        <View style={[s.priceRow, { marginTop: 4 }]}>
          <Text variant="bodySmall" style={{ color: c.textSecondary }}>Payment</Text>
          <Text variant="bodySmall" style={{ color: c.text }}>
            {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet'}
          </Text>
        </View>
      </Surface>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  title: { fontWeight: '700', marginBottom: SPACING.sm },
  section: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  sectionTitle: { fontWeight: '700' },
  itemRow: { paddingVertical: 3 },
  itemTitle: { fontWeight: '500' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});
