import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Surface, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useWithdrawWallet } from '../../src/hooks/useWallet';
import { useToast } from '../../src/context/ToastContext';
import { formatNPR } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../../src/theme';

const WITHDRAW_METHODS = [
  { id: 'esewa', label: 'eSewa', icon: 'phone-portrait', color: '#60BB46', placeholder: 'eSewa registered phone number' },
  { id: 'khalti', label: 'Khalti', icon: 'phone-portrait', color: '#5C2D91', placeholder: 'Khalti registered phone number' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business', color: '#1565C0', placeholder: 'Account number (e.g. 0123456789)' },
] as const;

const QUICK_AMOUNTS = [200, 500, 1000, 2000, 5000];

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, debitWallet } = useAuthStore();
  const { mutateAsync: withdraw } = useWithdrawWallet();
  const { showSuccess, showError } = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'esewa' | 'khalti' | 'bank'>('esewa');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const amount = selectedAmount ?? Number(customAmount);
  const balance = user?.walletBalance ?? 0;
  const selectedMethodInfo = WITHDRAW_METHODS.find(m => m.id === selectedMethod)!;

  async function handleWithdraw() {
    if (!user) return;
    if (!amount || amount < 100) {
      showError('Minimum withdrawal amount is NPR 100');
      return;
    }
    if (amount > balance) {
      showError('Insufficient wallet balance');
      return;
    }
    if (!accountDetails.trim()) {
      showError('Please enter your account details');
      return;
    }

    setLoading(true);
    try {
      await withdraw({
        userId: user.id,
        amount,
        method: selectedMethod,
        accountDetails: accountDetails.trim(),
        currentBalance: balance,
        debitWallet,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`${formatNPR(amount)} withdrawal initiated to ${selectedMethodInfo.label}`);
      router.back();
    } catch (e: any) {
      showError(e?.message ?? 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Withdraw Money" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Current balance */}
          <Surface style={s.balanceBadge} elevation={1}>
            <Text variant="labelMedium" style={s.balLabel}>Available Balance</Text>
            <Text variant="headlineMedium" style={s.balAmt}>{formatNPR(balance)}</Text>
          </Surface>

          {/* Quick amounts */}
          <Text variant="titleSmall" style={s.sectionTitle}>Select Amount</Text>
          <View style={s.quickGrid}>
            {QUICK_AMOUNTS.filter(a => a <= balance).map(amt => (
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
          <TextInput
            label="Custom Amount (NPR)"
            value={customAmount}
            onChangeText={v => { setCustomAmount(v); setSelectedAmount(null); }}
            keyboardType="number-pad"
            mode="outlined"
            left={<TextInput.Affix text="NPR " />}
            placeholder="Enter amount"
          />

          {/* Limits info */}
          <Surface style={s.limitsBox} elevation={0}>
            <Ionicons name="information-circle-outline" size={16} color="#888" />
            <Text variant="labelSmall" style={{ color: '#888', flex: 1 }}>
              Min: NPR 100 · Max: NPR 10,000 per transaction
            </Text>
          </Surface>

          {/* Withdrawal method */}
          <Text variant="titleSmall" style={s.sectionTitle}>Withdrawal Method</Text>
          {WITHDRAW_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[s.methodCard, selectedMethod === method.id && s.methodCardSel]}
              onPress={() => { setSelectedMethod(method.id); setAccountDetails(''); Haptics.selectionAsync(); }}
            >
              <View style={[s.methodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon as any} size={22} color={method.color} />
              </View>
              <Text variant="labelMedium" style={s.methodLabel}>{method.label}</Text>
              <Ionicons
                name={selectedMethod === method.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedMethod === method.id ? theme.colors.primary : '#ccc'}
              />
            </TouchableOpacity>
          ))}

          {/* Account details */}
          <TextInput
            label={selectedMethodInfo.placeholder}
            value={accountDetails}
            onChangeText={setAccountDetails}
            mode="outlined"
            keyboardType={selectedMethod === 'bank' ? 'number-pad' : 'phone-pad'}
          />

          <Button
            mode="contained"
            onPress={handleWithdraw}
            loading={loading}
            disabled={loading || !amount || amount < 100 || amount > balance || !accountDetails.trim()}
            style={s.withdrawBtn}
            contentStyle={{ paddingVertical: SPACING.xs }}
            icon="arrow-up"
          >
            {amount ? `Withdraw ${formatNPR(amount)}` : 'Enter Amount to Continue'}
          </Button>

          <Text variant="labelSmall" style={s.disclaimer}>
            Withdrawals are processed within 1-2 business days. Funds are transferred to your selected account.
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
  limitsBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: '#f5f5f5' },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'transparent' },
  methodCardSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  methodIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  methodLabel: { flex: 1, fontWeight: '600', color: '#222' },
  withdrawBtn: { marginTop: SPACING.sm },
  disclaimer: { textAlign: 'center', color: '#aaa' },
});
