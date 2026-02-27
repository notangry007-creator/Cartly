import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';
import { useReturns } from '../src/hooks/useOrders';
import { formatDate } from '../src/utils/helpers';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF8F00', approved: '#2E7D32', rejected: '#B71C1C', picked: '#00838F', refunded: '#37474F',
};

export default function ReturnsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: returns = [], isLoading, refetch } = useReturns(user?.id ?? '');
  const auth = useAuthGuard();

  if (!auth) return null;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Returns & Refunds" />
      {isLoading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="refresh-outline" size={64} color="#ccc" />
              <Text variant="titleMedium" style={s.emptyTitle}>No return requests</Text>
              <Text variant="bodySmall" style={s.emptySub}>
                You can request a return within 7 days of delivery
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Surface style={s.card} elevation={1}>
              <View style={s.cardHeader}>
                <Text variant="labelMedium" style={s.orderId}>
                  Order #{item.orderId.slice(-8).toUpperCase()}
                </Text>
                <Chip
                  style={{ backgroundColor: (STATUS_COLORS[item.status] ?? '#666') + '20' }}
                  textStyle={{ color: STATUS_COLORS[item.status] ?? '#666', fontSize: 11, fontWeight: '700' }}
                  compact
                >
                  {item.status.toUpperCase()}
                </Chip>
              </View>
              <Text variant="bodySmall" style={s.reason}>
                Reason: {item.reason.replace(/_/g, ' ')}
              </Text>
              <Text variant="bodySmall" style={s.desc} numberOfLines={2}>{item.description}</Text>
              <Text variant="labelSmall" style={s.date}>Submitted: {formatDate(item.createdAt)}</Text>
            </Surface>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 300 },
  emptyTitle: { color: '#555', fontWeight: '600' },
  emptySub: { color: '#999', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  orderId: { fontWeight: '700', color: '#333' },
  reason: { color: '#555', textTransform: 'capitalize' },
  desc: { color: '#888' },
  date: { color: '#bbb' },
});
