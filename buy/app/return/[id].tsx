import React from 'react';
import { View, StyleSheet, ScrollView, Image as RNImage } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useReturns } from '../../src/hooks/useOrders';
import { formatDate } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../../src/theme';

const STATUS_STEPS = ['pending','approved','picked','refunded'] as const;
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
  detailKey: { color: '#888', width: 90 },
  detailVal: { flex: 1, color: '#333', textAlign: 'right', textTransform: 'capitalize' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photo: { width: 90, height: 90, borderRadius: RADIUS.md },
});
