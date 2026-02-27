import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../../types';
import { orderStatusColor, orderStatusLabel } from '../../utils/helpers';
import { FontSize, BorderRadius } from '../../theme';

interface Props {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: Props) {
  const color = orderStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{orderStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
