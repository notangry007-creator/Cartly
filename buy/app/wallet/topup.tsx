import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/src/stores/authStore';
import { useAddWalletTransaction } from '@/src/hooks/useWallet';
import { useToast } from '@/src/context/ToastContext';
import { formatNPR } from '@/src/utils/helpers';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '@/src/theme';

const QUICK_AMOUNTS = [200, 500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  { id: 'esewa', label: 'eSewa', icon: 'phone-portrait', color: '#60BB46', note: 'Simulation only' },
  { id: 'khalti', label: 'Khalti', icon: 'phone-portrait', color: '#5C2D91', note: 'Simulation only' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business', color: '#1565C0', note: 'NEFT / RTGS' },
  { id: 'card', label: 'Debit / Credit Card', icon: 'card', color: '#E53935', note: 'Visa / Mastercard' },
];

export default function WalletTopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, creditWallet } = useAuthStore();
  const { mutateAsync: addTx } = useAddWalletTransaction();
  const { showSuccess, showError } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('esewa');
  const [loading, setLoading] = useState(false);

  const amount = selectedAmount ?? Number(customAmount);

  async function handleTopUp() {
    if (!user || !amount || amount < 10) {
      showError('Minimum top-up amount is NPR 10');
      return;
    }
    if (amount > 25000) {
      showError('Maximum single top-up is NPR 25,000');
      return;
    }
    setLoading(true);
    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 1500));
      await creditWallet(amount);
      await addTx({
        userId: user.id,
        type: 'credit',
        amount,
        description: `Top-up via ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label ?? selectedMethod}`,
        balance: user.walletBalance + amount,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`${formatNPR(amount)} added to your wallet!`);
      router.back();
    } catch {
      showError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Add Money" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Current balance */}
          <Surface style={s.balanceBadge} elevation={1}>
            <Text variant="labelMedium" style={s.balLabel}>Current Balance</Text>
            <Text variant="headlineMedium" style={s.balAmt}>{formatNPR(user?.walletBalance ?? 0)}</Text>
          </Surface>

          {/* Quick amounts */}
          <Text variant="titleSmall" style={s.sectionTitle}>Select Amount</Text>
          <View style={s.quickGrid}>
            {QUICK_AMOUNTS.map(amt => (
              <TouchableOpacity
                key={amt}
                style={[s.quickBtn, selectedAmount === amt && s.quickBtnSel]}
                onPress={() => { setSelectedAmount(amt); setCustomAmount(''); Haptics.selectionAsync(); }}
              >
                <Text style={[s.quickBtnTxt, selectedAmount === amt && s.quickBtnTxtSel]}>
                  {formatNPR(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom amount */}
          <Text variant="labelMedium" style={s.orTxt}>— or enter custom amount —</Text>
          <Surface style={s.customInput} elevation={1}>
            <Text variant="titleSmall" style={s.currencyLabel}>NPR</Text>
            <Text
              style={[s.customAmt, !customAmount && s.customAmtPlaceholder]}
              onPress={() => setSelectedAmount(null)}
            >
              {customAmount || '0'}
            </Text>
          </Surface>
          <View style={s.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[s.numKey, !k && s.numKeyDisabled]}
                onPress={() => {
                  if (!k) return;
                  setSelectedAmount(null);
                  Haptics.selectionAsync();
                  if (k === '⌫') { setCustomAmount(p => p.slice(0,-1)); return; }
                  const next = (customAmount + k).replace(/^0+(?=\d)/, '');
                  if (Number(next) <= 25000) setCustomAmount(next);
                }}
                disabled={!k}
              >
                <Text style={s.numKeyTxt}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment method */}
          <Text variant="titleSmall" style={s.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[s.methodCard, selectedMethod === method.id && s.methodCardSel]}
              onPress={() => { setSelectedMethod(method.id); Haptics.selectionAsync(); }}
            >
              <View style={[s.methodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon as any} size={22} color={method.color} />
              </View>
              <View style={s.methodInfo}>
                <Text variant="labelMedium" style={s.methodLabel}>{method.label}</Text>
                <Text variant="labelSmall" style={s.methodNote}>{method.note}</Text>
              </View>
              <Ionicons name={selectedMethod === method.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedMethod === method.id ? theme.colors.primary : '#ccc'} />
            </TouchableOpacity>
          ))}

          <Button
            mode="contained"
            onPress={handleTopUp}
            loading={loading}
            disabled={loading || !amount || amount < 10}
            style={s.payBtn}
            contentStyle={{ paddingVertical: SPACING.xs }}
            icon="lock-closed"
          >
            {amount ? `Pay ${formatNPR(amount)} Securely` : 'Enter Amount to Continue'}
          </Button>

          <Text variant="labelSmall" style={s.disclaimer}>
            This is a simulated payment for demo purposes. No real money is transferred.
          </Text>
        </View>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md },
  balanceBadge: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center' },
  balLabel: { color: '#888' },
  balAmt: { fontWeight: '800', color: theme.colors.primary },
  sectionTitle: { fontWeight: '700', color: '#222' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  quickBtnSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  quickBtnTxt: { color: '#444', fontWeight: '600' },
  quickBtnTxtSel: { color: theme.colors.primary },
  orTxt: { textAlign: 'center', color: '#999' },
  customInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  currencyLabel: { color: '#888', fontWeight: '600' },
  customAmt: { fontSize: 28, fontWeight: '800', color: '#222', flex: 1 },
  customAmtPlaceholder: { color: '#ccc' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  numKey: { width: '30%', aspectRatio: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f0f0f0' },
  numKeyDisabled: { backgroundColor: 'transparent', borderColor: 'transparent' },
  numKeyTxt: { fontSize: 20, fontWeight: '600', color: '#222' },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'transparent' },
  methodCardSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  methodIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1 },
  methodLabel: { fontWeight: '600', color: '#222' },
  methodNote: { color: '#888' },
  payBtn: { marginTop: SPACING.sm },
  disclaimer: { textAlign: 'center', color: '#aaa' },
});
