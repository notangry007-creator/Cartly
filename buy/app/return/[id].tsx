import React from 'react';
import { View, StyleSheet, ScrollView, Image as RNImage, Linking, Alert } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useReturns, useCancelReturn, useProcessRefund } from '../../src/hooks/useOrders';
import { useOrder } from '../../src/hooks/useOrders';
import { formatDate, formatNPR } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { useToast } from '../../src/context/ToastContext';
import { theme, SPACING, RADIUS } from '../../src/theme';

const STATUS_STEPS = ['pending', 'approved', 'picked', 'refunded'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Request Submitted',
  approved: 'Return Approved',
  rejected: 'Return Rejected',
  picked: 'Item Picked Up',
  refunded: 'Refund Processed',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#FF8F00', approved: '#2E7D32', rejected: '#B71C1C', picked: '#00838F', refunded: '#1565C0',
};

export default function ReturnDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: returnId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: returns = [], isLoading } = useReturns(user?.id ?? '');
  const returnReq = returns.find(r => r.id === returnId);
  const { data: order } = useOrder(user?.id ?? '', returnReq?.orderId ?? '');
  const { mutateAsync: cancelReturn, isPending: cancelling } = useCancelReturn();
  const { mutateAsync: processRefund, isPending: refunding } = useProcessRefund();
  const { creditWallet } = useAuthStore();
  const { showSuccess, showError } = useToast();

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!returnReq) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Return Details" />
        <View style={s.notFound}><Text>Return request not found</Text></View>
      </View>
    );
  }

  const isRejected = returnReq.status === 'rejected';
  const canCancel = returnReq.status === 'pending';
  const canProcessRefund = returnReq.status === 'picked' && order;

  async function handleCancelReturn() {
    if (!user) return;
    Alert.alert(
      'Cancel Return',
      'Are you sure you want to cancel this return request?',
      [
        { text: 'No' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReturn({ userId: user.id, returnId: returnReq.id, orderId: returnReq.orderId });
              showSuccess('Return request cancelled');
              router.back();
            } catch {
              showError('Failed to cancel return request');
            }
          },
        },
      ]
    );
  }

  async function handleProcessRefund() {
    if (!user || !order) return;
    Alert.alert(
      'Process Refund',
      `Refund ${formatNPR(order.total)} to wallet?`,
      [
        { text: 'Cancel' },
        {
          text: 'Process Refund',
          onPress: async () => {
            try {
              await processRefund({
                userId: user.id,
                returnId: returnReq.id,
                orderId: returnReq.orderId,
                refundAmount: order.total,
                creditWallet,
              });
              showSuccess(`${formatNPR(order.total)} refunded to your wallet`);
            } catch {
              showError('Failed to process refund');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Return Details" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <Surface style={s.statusCard} elevation={2}>
          <View style={s.statusTop}>
            <View style={[s.statusIcon, { backgroundColor: (STATUS_COLORS[returnReq.status] ?? '#666') + '20' }]}>
              <Ionicons
                name={isRejected ? 'close-circle' : 'return-up-back'}
                size={32}
                color={STATUS_COLORS[returnReq.status] ?? '#666'}
              />
            </View>
            <View>
              <Text variant="headlineSmall" style={s.statusTitle}>
                {STATUS_LABELS[returnReq.status] ?? returnReq.status}
              </Text>
              <Text variant="bodySmall" style={s.statusDate}>
                Submitted: {formatDate(returnReq.createdAt)}
              </Text>
            </View>
          </View>

          {/* Timeline (only for non-rejected) */}
          {!isRejected && (
            <View style={s.timeline}>
              {STATUS_STEPS.map((step, i) => {
                const stepIdx = STATUS_STEPS.indexOf(returnReq.status as any);
                const isDone = i <= stepIdx;
                const isCurrent = i === stepIdx;
                return (
                  <View key={step} style={s.tlItem}>
                    <View style={s.tlLeft}>
                      <View style={[s.tlDot, isDone && s.tlDotDone, isCurrent && s.tlDotCurrent]}>
                        {isDone && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      {i < STATUS_STEPS.length - 1 && <View style={[s.tlLine, isDone && s.tlLineDone]} />}
                    </View>
                    <Text variant="labelMedium" style={[s.tlLabel, !isDone && s.tlLabelFuture]}>
                      {STATUS_LABELS[step]}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Surface>

        {/* Details */}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.sectionTitle}>Return Details</Text>
          <View style={s.detailRow}>
            <Text variant="labelMedium" style={s.detailKey}>Order ID</Text>
            <Text variant="bodySmall" style={s.detailVal}>#{returnReq.orderId.slice(-10).toUpperCase()}</Text>
          </View>
          <View style={s.detailRow}>
            <Text variant="labelMedium" style={s.detailKey}>Reason</Text>
            <Text variant="bodySmall" style={s.detailVal}>{returnReq.reason.replace(/_/g, ' ')}</Text>
          </View>
          <View style={s.detailRow}>
            <Text variant="labelMedium" style={s.detailKey}>Description</Text>
            <Text variant="bodySmall" style={s.detailVal}>{returnReq.description}</Text>
          </View>
          {order && (
            <View style={s.detailRow}>
              <Text variant="labelMedium" style={s.detailKey}>Refund Amount</Text>
              <Text variant="bodySmall" style={[s.detailVal, { color: '#2E7D32', fontWeight: '700' }]}>
                {formatNPR(order.total)}
              </Text>
            </View>
          )}
        </Surface>

        {/* Photos */}
        {returnReq.photos.length > 0 && (
          <Surface style={s.section} elevation={1}>
            <Text variant="titleSmall" style={s.sectionTitle}>Attached Photos</Text>
            <View style={s.photoGrid}>
              {returnReq.photos.map((uri, i) => (
                <RNImage key={i} source={{ uri }} style={s.photo} resizeMode="cover" />
              ))}
            </View>
          </Surface>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          {canCancel && (
            <Button
              mode="outlined"
              onPress={handleCancelReturn}
              loading={cancelling}
              textColor={theme.colors.error}
              icon="close-circle-outline"
              accessibilityRole="button"
              accessibilityLabel="Cancel this return request"
            >
              Cancel Return Request
            </Button>
          )}

          {canProcessRefund && __DEV__ && (
            <Button
              mode="contained"
              onPress={handleProcessRefund}
              loading={refunding}
              icon="wallet"
              accessibilityRole="button"
              accessibilityLabel="Process refund to wallet"
            >
              [Dev] Process Refund
            </Button>
          )}

          {/* Contact support */}
          <Button
            mode="outlined"
            onPress={() => Linking.openURL('https://wa.me/9779801234567?text=Hi, I need help with return request ' + returnReq.id.slice(-8).toUpperCase())}
            icon="logo-whatsapp"
            accessibilityRole="button"
            accessibilityLabel="Contact support via WhatsApp about this return"
          >
            Contact Support
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/support')}
            icon="help-circle-outline"
            accessibilityRole="button"
            accessibilityLabel="View help and support"
          >
            Help & FAQ
          </Button>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: { margin: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.lg, backgroundColor: '#fff', gap: SPACING.lg },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  statusIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontWeight: '700', color: '#222' },
  statusDate: { color: '#888' },
  timeline: { gap: 0 },
  tlItem: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  tlLeft: { alignItems: 'center', width: 20 },
  tlDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  tlDotDone: { backgroundColor: '#2E7D32' },
  tlDotCurrent: { backgroundColor: theme.colors.primary },
  tlLine: { flex: 1, width: 2, backgroundColor: '#e0e0e0', minHeight: 24 },
  tlLineDone: { backgroundColor: '#2E7D32' },
  tlLabel: { fontWeight: '600', color: '#222', paddingBottom: SPACING.md, flex: 1 },
  tlLabelFuture: { color: '#bbb', fontWeight: '400' },
  section: { margin: SPACING.md, marginTop: 0, borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: '#fff', gap: SPACING.sm },
  sectionTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  detailKey: { color: '#888', width: 100 },
  detailVal: { flex: 1, color: '#333', textAlign: 'right', textTransform: 'capitalize' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photo: { width: 90, height: 90, borderRadius: RADIUS.md },
  actions: { margin: SPACING.md, marginTop: 0, gap: SPACING.sm },
});
