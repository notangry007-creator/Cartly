import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductStatus } from '../../types';
import { productStatusColor, productStatusLabel } from '../../utils/helpers';
import { FontSize, BorderRadius } from '../../theme';

interface Props {
  status: ProductStatus;
}

export default function ProductStatusBadge({ status }: Props) {
  const color = productStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{productStatusLabel(status)}</Text>
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
