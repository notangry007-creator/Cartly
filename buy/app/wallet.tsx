import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';
import { useWalletTransactions } from '../src/hooks/useWallet';
import { formatNPR, formatDateTime } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { theme, SPACING, RADIUS } from '../src/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: txs = [], isLoading, refetch } = useWalletTransactions(user?.id ?? '');
  const auth = useAuthGuard();

  if (!auth) return null;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Buy Wallet" />

      <Surface style={s.balCard} elevation={2}>
        <Ionicons name="wallet" size={40} color="#fff" />
        <Text variant="labelLarge" style={s.balLabel}>Available Balance</Text>
        <Text variant="displaySmall" style={s.balance}>{formatNPR(user?.walletBalance ?? 0)}</Text>
      </Surface>

      <Text variant="labelSmall" style={s.txHeader}>TRANSACTIONS</Text>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text variant="bodyMedium" style={{ color: '#888' }}>No transactions yet</Text>
              <Text variant="labelSmall" style={{ color: '#bbb' }}>
                Your wallet activity will appear here
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <Surface style={s.txCard} elevation={1}>
                <View style={[s.txIcon, { backgroundColor: item.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Ionicons name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={item.type === 'credit' ? '#2E7D32' : '#B71C1C'} />
                </View>
                <View style={s.txInfo}>
                  <Text variant="labelMedium" style={s.txDesc} numberOfLines={1}>{item.description}</Text>
                  <Text variant="labelSmall" style={s.txDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <View style={s.txAmount}>
                  <Text variant="titleSmall" style={{ fontWeight: '700', color: item.type === 'credit' ? '#2E7D32' : '#B71C1C' }}>
                    {item.type === 'credit' ? '+' : '-'}{formatNPR(item.amount)}
                  </Text>
                  <Text variant="labelSmall" style={{ color: '#888' }}>Bal: {formatNPR(item.balance)}</Text>
                </View>
              </Surface>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  balCard: { margin: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.xxl, backgroundColor: theme.colors.primary, alignItems: 'center', gap: SPACING.sm },
  balLabel: { color: 'rgba(255,255,255,0.8)' },
  balance: { color: '#fff', fontWeight: '800' },
  txHeader: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, color: '#999', fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, padding: SPACING.xxl, minHeight: 250 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc: { color: '#333' },
  txDate: { color: '#888' },
  txAmount: { alignItems: 'flex-end' },
});
