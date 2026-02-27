import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDate } from '@/src/utils/helpers';
import { PayoutStatus } from '@/src/types';
import { useOrderStore } from '@/src/stores/orderStore';
import { usePayoutStore } from '@/src/stores/payoutStore';

const STATUS_COLORS: Record<PayoutStatus, string> = {
  pending: Colors.warning,
  processing: Colors.info,
  completed: Colors.success,
  failed: Colors.danger,
};

const METHODS = ['Bank Transfer', 'eSewa', 'Khalti'];

export default function PayoutsScreen() {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const { payouts, requestPayout } = usePayoutStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]);
  const [accountDetails, setAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available balance = delivered revenue minus completed + pending payouts
  const deliveredRevenue = useMemo(
    () => orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    [orders],
  );
  const reservedAmount = payouts
    .filter((p) => p.status === 'completed' || p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = Math.max(deliveredRevenue - reservedAmount, 0);

  async function handleRequestPayout() {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    if (parsedAmount > availableBalance) {
      Alert.alert('Insufficient Balance', `Maximum available: ${formatNPR(availableBalance)}`);
      return;
    }
    if (!accountDetails.trim()) {
      Alert.alert('Missing Details', 'Please enter your account details.');
      return;
    }
    setIsSubmitting(true);
    await requestPayout(parsedAmount, method, accountDetails.trim());
    setIsSubmitting(false);
    setModalVisible(false);
    setAmount('');
    setAccountDetails('');
    Alert.alert('Request Submitted', 'Your payout request has been submitted and will be processed within 2 business days.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payouts</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={payouts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No payout history yet.</Text>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatNPR(availableBalance)}</Text>
              <TouchableOpacity
                style={[styles.requestBtn, availableBalance === 0 && { opacity: 0.5 }]}
                onPress={() => availableBalance > 0 ? setModalVisible(true) : Alert.alert('No Balance', 'You have no available balance to withdraw.')}
              >
                <Text style={styles.requestBtnText}>Request Payout</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Payout History</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.amount}>{formatNPR(item.amount)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: color + '20', borderColor: color }]}>
                  <Text style={[styles.statusText, { color }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <InfoRow icon="card-outline" label={`${item.method} · ${item.accountDetails}`} />
              <InfoRow icon="time-outline" label={`Requested: ${formatDate(item.requestedAt)}`} />
              {item.completedAt && <InfoRow icon="checkmark-circle-outline" label={`Completed: ${formatDate(item.completedAt)}`} />}
            </View>
          );
        }}
      />

      {/* Request Payout Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.grey700} />
              </TouchableOpacity>
            </View>

            <Text style={styles.availableText}>Available: {formatNPR(availableBalance)}</Text>

            <Text style={styles.fieldLabel}>Amount (NPR) *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Enter amount"
              placeholderTextColor={Colors.grey400}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.fieldLabel}>Method *</Text>
            <View style={styles.methodRow}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Account Details *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={method === 'Bank Transfer' ? 'Bank name & account number' : `${method} phone number`}
              placeholderTextColor={Colors.grey400}
              value={accountDetails}
              onChangeText={setAccountDetails}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleRequestPayout} disabled={isSubmitting}>
              <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <Ionicons name={icon} size={14} color={Colors.grey500} />
      <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center', ...Shadow.md },
  balanceLabel: { color: Colors.primaryLight, fontSize: FontSize.md, marginBottom: 6 },
  balanceAmount: { color: Colors.white, fontSize: FontSize.xxxl, fontWeight: '800', marginBottom: Spacing.md },
  requestBtn: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: BorderRadius.full },
  requestBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.md, padding: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  amount: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  availableText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '600', marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.md },
  methodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  methodBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  methodTextActive: { color: Colors.white, fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
