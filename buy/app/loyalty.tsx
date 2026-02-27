import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Surface, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../src/stores/authStore';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import {
  useLoyaltyTransactions,
  POINTS_PER_NPR,
  NPR_PER_POINT,
  MIN_REDEEM_POINTS,
  pointsToNPR,
} from '../src/hooks/useLoyalty';
import { formatDateTime, formatNPR } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: txs = [], isLoading, refetch } = useLoyaltyTransactions(user?.id ?? '');
  const auth = useAuthGuard();
  if (!auth) return null;

  const points = user?.loyaltyPoints ?? 0;
  const pointsValue = pointsToNPR(points);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Loyalty Points" />

      {/* Points balance card */}
      <Surface style={s.balCard} elevation={2}>
        <Ionicons name="star" size={40} color="#FFD700" />
        <Text variant="labelLarge" style={s.balLabel}>Your Points Balance</Text>
        <Text variant="displaySmall" style={s.balPoints}>{points.toLocaleString()}</Text>
        <Text variant="bodySmall" style={s.balValue}>≈ {formatNPR(pointsValue)} value</Text>

        {points >= MIN_REDEEM_POINTS && (
          <Button
            mode="contained-tonal"
            onPress={() => router.push('/(tabs)/cart')}
            icon="gift"
            style={s.redeemBtn}
            textColor="#fff"
          >
            Redeem at Checkout
          </Button>
        )}
        {points < MIN_REDEEM_POINTS && (
          <Text style={s.minNote}>
            Earn {MIN_REDEEM_POINTS - points} more points to redeem
          </Text>
        )}
      </Surface>

      {/* How it works */}
      <Surface style={s.howCard} elevation={1}>
        <Text variant="titleSmall" style={s.howTitle}>How It Works</Text>
        <View style={s.howRow}>
          <Ionicons name="bag" size={18} color={theme.colors.primary} />
          <Text variant="bodySmall" style={s.howTxt}>
            Earn <Text style={{ fontWeight: '700' }}>{POINTS_PER_NPR * 10} point</Text> for every NPR 10 spent
          </Text>
        </View>
        <View style={s.howRow}>
          <Ionicons name="gift" size={18} color="#2E7D32" />
          <Text variant="bodySmall" style={s.howTxt}>
            1 point = <Text style={{ fontWeight: '700' }}>{formatNPR(NPR_PER_POINT)}</Text> discount at checkout
          </Text>
        </View>
        <View style={s.howRow}>
          <Ionicons name="checkmark-circle" size={18} color="#1565C0" />
          <Text variant="bodySmall" style={s.howTxt}>
            Minimum <Text style={{ fontWeight: '700' }}>{MIN_REDEEM_POINTS} points</Text> required to redeem
          </Text>
        </View>
        <View style={s.howRow}>
          <Ionicons name="time" size={18} color="#FF8F00" />
          <Text variant="bodySmall" style={s.howTxt}>
            Points are valid for <Text style={{ fontWeight: '700' }}>12 months</Text> from earning date
          </Text>
        </View>
      </Surface>

      {/* Transaction history */}
      <Text variant="labelSmall" style={s.txHeader}>POINTS HISTORY</Text>
      {isLoading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="star-outline" size={48} color="#ccc" />
              <Text variant="bodyMedium" style={{ color: '#888' }}>No points history yet</Text>
              <Text variant="bodySmall" style={{ color: '#aaa', textAlign: 'center' }}>
                Start shopping to earn loyalty points!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40)}>
              <Surface style={s.txCard} elevation={1}>
                <View style={[s.txIcon, { backgroundColor: item.type === 'earn' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Ionicons
                    name={item.type === 'earn' ? 'star' : item.type === 'redeem' ? 'gift' : 'time'}
                    size={18}
                    color={item.type === 'earn' ? '#2E7D32' : item.type === 'redeem' ? theme.colors.primary : '#888'}
                  />
                </View>
                <View style={s.txInfo}>
                  <Text variant="labelMedium" style={s.txDesc} numberOfLines={1}>{item.description}</Text>
                  <Text variant="labelSmall" style={s.txDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <View style={s.txAmount}>
                  <Text variant="titleSmall" style={{ fontWeight: '700', color: item.type === 'earn' ? '#2E7D32' : '#B71C1C' }}>
                    {item.type === 'earn' ? '+' : '-'}{item.points} pts
                  </Text>
                  <Text variant="labelSmall" style={{ color: '#888' }}>Bal: {item.balance} pts</Text>
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
  balCard: {
    margin: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balLabel: { color: 'rgba(255,255,255,0.8)' },
  balPoints: { color: '#FFD700', fontWeight: '800' },
  balValue: { color: 'rgba(255,255,255,0.7)' },
  redeemBtn: { marginTop: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full },
  minNote: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
  howCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: '#fff',
    gap: SPACING.sm,
  },
  howTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.xs },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  howTxt: { color: '#555', flex: 1, lineHeight: 18 },
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
