import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button, Surface, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useAddWalletTransaction } from '../../src/hooks/useWallet';
import { useToast } from '../../src/context/ToastContext';
import { formatNPR } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../../src/theme';

const METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline', placeholder: 'Bank name & account number' },
  { id: 'esewa', label: 'eSewa', icon: 'phone-portrait-outline', placeholder: 'eSewa phone number' },
  { id: 'khalti', label: 'Khalti', icon: 'phone-portrait-outline', placeholder: 'Khalti phone number' },
  { id: 'ime', label: 'IME Pay', icon: 'phone-portrait-outline', placeholder: 'IME Pay phone number' },
];

const MIN_WITHDRAWAL = 100;
const PROCESSING_FEE = 10; // NPR flat fee

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, debitWallet } = useAuthStore();
  const { mutateAsync: addTx } = useAddWalletTransaction();
  const { showSuccess, showError } = useToast();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0].id);
  const [accountDetails, setAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= MIN_WITHDRAWAL;
  const totalDeducted = isValidAmount ? parsedAmount + PROCESSING_FEE : 0;
  const balance = user?.walletBalance ?? 0;
  const canWithdraw = isValidAmount && totalDeducted <= balance && accountDetails.trim().length > 0;

  const selectedMethod = METHODS.find(m => m.id === method)!;

  async function handleWithdraw() {
    if (!user || !canWithdraw) return;
    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${formatNPR(parsedAmount)} to ${selectedMethod.label}?\n\nProcessing fee: ${formatNPR(PROCESSING_FEE)}\nTotal deducted: ${formatNPR(totalDeducted)}\n\nFunds will arrive within 1–2 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await debitWallet(totalDeducted);
              await addTx({
                userId: user.id,
                type: 'debit',
                amount: totalDeducted,
                description: `Withdrawal to ${selectedMethod.label} — ${accountDetails.trim().slice(0, 30)}`,
                balance: balance - totalDeducted,
              });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showSuccess(`Withdrawal of ${formatNPR(parsedAmount)} initiated!`);
              router.back();
            } catch {
              showError('Withdrawal failed. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Withdraw to Bank" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Balance card */}
        <Surface style={s.balCard} elevation={1}>
          <Text variant="labelSmall" style={s.balLabel}>Available Balance</Text>
          <Text variant="headlineMedium" style={s.balance}>{formatNPR(balance)}</Text>
          <Text variant="labelSmall" style={s.minNote}>Minimum withdrawal: {formatNPR(MIN_WITHDRAWAL)}</Text>
        </Surface>

        {/* Amount */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Withdrawal Amount</Text>
          <TextInput
            label="Amount (NPR)"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="decimal-pad"
            error={amount !== '' && !isValidAmount}
          />
          {amount !== '' && !isValidAmount && (
            <Text style={s.errorTxt}>Minimum withdrawal is {formatNPR(MIN_WITHDRAWAL)}</Text>
          )}
          {isValidAmount && totalDeducted > balance && (
            <Text style={s.errorTxt}>Insufficient balance (need {formatNPR(totalDeducted)} including fee)</Text>
          )}
          {isValidAmount && totalDeducted <= balance && (
            <View style={s.feeRow}>
              <Text variant="bodySmall" style={{ color: '#666' }}>Processing fee</Text>
              <Text variant="bodySmall" style={{ color: '#666' }}>{formatNPR(PROCESSING_FEE)}</Text>
            </View>
          )}
        </Surface>

        {/* Quick amounts */}
        <View style={s.quickRow}>
          {[500, 1000, 2000, 5000].map(amt => (
            <TouchableOpacity
              key={amt}
              style={[s.quickBtn, parsedAmount === amt && s.quickBtnSel]}
              onPress={() => setAmount(String(amt))}
            >
              <Text style={[s.quickTxt, parsedAmount === amt && s.quickTxtSel]}>
                {formatNPR(amt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Method */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Withdrawal Method</Text>
          <View style={s.methodGrid}>
            {METHODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[s.methodBtn, method === m.id && s.methodBtnSel]}
                onPress={() => { setMethod(m.id); setAccountDetails(''); }}
              >
                <Ionicons name={m.icon as any} size={20} color={method === m.id ? '#fff' : theme.colors.primary} />
                <Text style={[s.methodTxt, method === m.id && s.methodTxtSel]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {/* Account details */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Account Details</Text>
          <TextInput
            label={selectedMethod.placeholder}
            value={accountDetails}
            onChangeText={setAccountDetails}
            mode="outlined"
            multiline={method === 'bank'}
            numberOfLines={method === 'bank' ? 3 : 1}
          />
        </Surface>

        {/* Summary */}
        {isValidAmount && totalDeducted <= balance && (
          <Surface style={s.summary} elevation={1}>
            <Text variant="titleSmall" style={s.secTitle}>Summary</Text>
            <View style={s.summaryRow}><Text variant="bodySmall" style={{ color: '#666' }}>Withdrawal amount</Text><Text variant="bodySmall">{formatNPR(parsedAmount)}</Text></View>
            <View style={s.summaryRow}><Text variant="bodySmall" style={{ color: '#666' }}>Processing fee</Text><Text variant="bodySmall">{formatNPR(PROCESSING_FEE)}</Text></View>
            <Divider style={{ marginVertical: SPACING.sm }} />
            <View style={s.summaryRow}><Text variant="titleSmall" style={{ fontWeight: '700' }}>Total deducted</Text><Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>{formatNPR(totalDeducted)}</Text></View>
            <View style={s.summaryRow}><Text variant="bodySmall" style={{ color: '#666' }}>Remaining balance</Text><Text variant="bodySmall">{formatNPR(balance - totalDeducted)}</Text></View>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleWithdraw}
          loading={isSubmitting}
          disabled={!canWithdraw || isSubmitting}
          style={s.withdrawBtn}
          contentStyle={{ paddingVertical: SPACING.xs }}
          icon="arrow-up-circle"
        >
          Withdraw {isValidAmount ? formatNPR(parsedAmount) : ''}
        </Button>

        <Text style={s.disclaimer}>
          Withdrawals are processed within 1–2 business days. A processing fee of {formatNPR(PROCESSING_FEE)} applies per transaction.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  balCard: { backgroundColor: theme.colors.primary, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', gap: SPACING.xs },
  balLabel: { color: 'rgba(255,255,255,0.7)' },
  balance: { color: '#fff', fontWeight: '800' },
  minNote: { color: 'rgba(255,255,255,0.6)' },
  section: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  secTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.xs },
  errorTxt: { color: theme.colors.error, fontSize: 12, marginTop: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  quickBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: theme.colors.primary },
  quickBtnSel: { backgroundColor: theme.colors.primary },
  quickTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  quickTxtSel: { color: '#fff' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: theme.colors.primary, minWidth: '45%' },
  methodBtnSel: { backgroundColor: theme.colors.primary },
  methodTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  methodTxtSel: { color: '#fff' },
  summary: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  withdrawBtn: { marginTop: SPACING.sm },
  disclaimer: { color: '#aaa', fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
