import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useWalletTransactions } from '../../src/hooks/useWallet';
import { formatNPR, formatDateTime } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { useAuthGuard } from '../../src/hooks/useAuthGuard';
import { theme, SPACING, RADIUS } from '../../src/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
        <View style={s.walletActions}>
          <Button
            mode="contained-tonal"
            onPress={() => router.push('/wallet/topup')}
            icon="plus"
            style={s.actionBtn}
            textColor="#fff"
            accessibilityRole="button"
            accessibilityLabel="Add money to wallet"
          >
            Add Money
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => router.push('/wallet/withdraw')}
            icon="arrow-up"
            style={s.actionBtn}
            textColor="#fff"
            accessibilityRole="button"
            accessibilityLabel="Withdraw money from wallet"
          >
            Withdraw
          </Button>
        </View>
      </Surface>
      <Text variant="labelSmall" style={s.txHeader}>TRANSACTION HISTORY</Text>
      {isLoading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          // txCard height: padding*2(24) + content(40) + gap = ~72dp
          getItemLayout={(_data, index) => ({ length: 72, offset: (72 + SPACING.sm) * index + SPACING.sm, index })}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text variant="bodyMedium" style={{ color: '#888' }}>No transactions yet</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40)}>
              <Surface
                style={s.txCard}
                elevation={1}
                accessibilityRole="text"
                accessibilityLabel={`${item.type === 'credit' ? 'Received' : 'Spent'} ${formatNPR(item.amount)}: ${item.description}, balance after: ${formatNPR(item.balance)}`}
              >
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
  walletActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full },
  txHeader: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, color: '#999', fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, padding: SPACING.xxl, minHeight: 200 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc: { color: '#333' },
  txDate: { color: '#888' },
  txAmount: { alignItems: 'flex-end' },
});
