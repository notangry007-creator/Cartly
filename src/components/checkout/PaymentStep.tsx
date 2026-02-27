import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, RadioButton, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod, Zone } from '../../types';
import { formatNPR } from '../../utils/helpers';
import { SPACING, RADIUS, useAppColors, useAppTheme } from '../../theme';

interface Props {
  zone: Zone;
  selected: PaymentMethod;
  walletBalance: number;
  total: number;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentStep({ zone, selected, walletBalance, total, onSelect }: Props) {
  const c = useAppColors();
  const t = useAppTheme();
  const insufficientWallet = walletBalance < total;

  return (
    <View style={s.container}>
      <Text variant="titleMedium" style={[s.title, { color: c.text }]}>
        Payment Method
      </Text>

      {/* Cash on Delivery */}
      {zone.codAvailable ? (
        <TouchableOpacity onPress={() => onSelect('cod')} activeOpacity={0.8}>
          <Surface
            style={[
              s.card,
              { borderColor: selected === 'cod' ? t.colors.primary : 'transparent', backgroundColor: c.cardBg },
              selected === 'cod' && { backgroundColor: t.colors.primaryContainer },
            ]}
            elevation={1}
          >
            <RadioButton.Android
              value="cod"
              status={selected === 'cod' ? 'checked' : 'unchecked'}
              onPress={() => onSelect('cod')}
              color={t.colors.primary}
            />
            <View style={s.info}>
              <View style={s.labelRow}>
                <Ionicons name="cash-outline" size={20} color="#2E7D32" />
                <Text variant="titleSmall" style={[s.optLabel, { color: c.text }]}>
                  Cash on Delivery
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: c.textMuted, marginTop: 2 }}>
                Pay when order arrives{zone.codFee > 0 ? ` (+NPR ${zone.codFee} fee)` : ''}
              </Text>
            </View>
          </Surface>
        </TouchableOpacity>
      ) : (
        <Surface style={[s.card, s.disabledCard, { backgroundColor: c.screenBg }]} elevation={0}>
          <View style={s.info}>
            <Text variant="titleSmall" style={{ color: c.textDisabled }}>Cash on Delivery</Text>
            <Text variant="bodySmall" style={{ color: c.textDisabled }}>Not available in your zone</Text>
          </View>
        </Surface>
      )}

      {/* Buy Wallet */}
      <TouchableOpacity onPress={() => onSelect('wallet')} activeOpacity={0.8}>
        <Surface
          style={[
            s.card,
            { borderColor: selected === 'wallet' ? t.colors.primary : 'transparent', backgroundColor: c.cardBg },
            selected === 'wallet' && { backgroundColor: t.colors.primaryContainer },
          ]}
          elevation={1}
        >
          <RadioButton.Android
            value="wallet"
            status={selected === 'wallet' ? 'checked' : 'unchecked'}
            onPress={() => onSelect('wallet')}
            color={t.colors.primary}
          />
          <View style={s.info}>
            <View style={s.labelRow}>
              <Ionicons name="wallet-outline" size={20} color={t.colors.primary} />
              <Text variant="titleSmall" style={[s.optLabel, { color: c.text }]}>
                Buy Wallet
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: insufficientWallet ? t.colors.error : c.textMuted, marginTop: 2 }}>
              Balance: {formatNPR(walletBalance)}
              {insufficientWallet ? ' · Insufficient' : ''}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  title: { fontWeight: '700', marginBottom: SPACING.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  disabledCard: { borderWidth: 0 },
  info: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  optLabel: { fontWeight: '600' },
});
