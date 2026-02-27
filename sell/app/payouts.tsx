import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDate } from '@/src/utils/helpers';
import { SEED_PAYOUTS } from '@/src/data/seed';
import { PayoutStatus } from '@/src/types';

const STATUS_COLORS: Record<PayoutStatus, string> = {
  pending: Colors.warning,
  processing: Colors.info,
  completed: Colors.success,
  failed: Colors.danger,
};

export default function PayoutsScreen() {
  const router = useRouter();

  function requestPayout() {
    Alert.alert('Request Payout', 'Payout requests are processed within 2 business days.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request', onPress: () => Alert.alert('Submitted', 'Your payout request has been submitted.') },
    ]);
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
        data={SEED_PAYOUTS}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatNPR(75430)}</Text>
              <TouchableOpacity style={styles.requestBtn} onPress={requestPayout}>
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
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  amount: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
});
