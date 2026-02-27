import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Surface, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { timeAgo } from '@/src/utils/helpers';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '@/src/theme';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';
import { NotificationType } from '@/src/types';
import Animated, { FadeInDown } from 'react-native-reanimated';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<NotificationType, IoniconsName> = {
  order: 'receipt',
  wallet: 'wallet',
  return: 'return-up-back',
  promo: 'pricetag',
  system: 'notifications',
};
const COLORS: Record<NotificationType, string> = { order:'#1565C0', wallet:'#2E7D32', return:'#F57F17', promo:theme.colors.primary, system:'#666' };

const NOTIF_ROUTES: Record<string, (id?: string) => string> = {
  order: (id) => id ? `/order/${id}` : '/(tabs)/orders',
  return: (id) => id ? `/order/return/${id}` : '/returns',
  wallet: () => '/wallet',
  promo: () => '/(tabs)/home',
  system: () => '/(tabs)/home',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, markRead, markAllRead, loadNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    if (user) await loadNotifications(user.id); // loadNotifications still takes userId for initial load
    setRefreshing(false);
  }
  const guard = useAuthGuard();
  if (guard) return guard;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Notifications"
        right={
          notifications.some(n => !n.read) ? (
            <TouchableOpacity onPress={() => markAllRead()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark all notifications as read">
              <Text variant="labelSmall" style={s.markAll}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        // Approx card height: padding*2 + icon(44) + gap = ~76dp + SPACING.sm gap between items
        getItemLayout={(_data, index) => ({ length: 84, offset: (84 + SPACING.sm) * index + SPACING.md, index })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={s.emptyTitle}>No notifications yet</Text>
            <Text variant="bodySmall" style={s.emptySub}>
              We'll notify you about orders, offers and more
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity
              onPress={() => {
                markRead(item.id);
                const getRoute = NOTIF_ROUTES[item.type] ?? NOTIF_ROUTES.system;
                const route = getRoute(item.referenceId);
                router.push(route as `/${string}`);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Unread notification: '}${item.title}. ${item.body}`}
              accessibilityState={{ selected: !item.read }}
            >
              <Surface style={[s.card, !item.read && s.cardUnread]} elevation={1}>
                <View style={[s.iconWrap, { backgroundColor: (COLORS[item.type] ?? '#666') + '20' }]}>
                  <Ionicons name={ICONS[item.type] ?? 'notifications'} size={22} color={COLORS[item.type] ?? '#666'} />
                </View>
                <View style={s.info}>
                  <View style={s.titleRow}>
                    <Text variant="labelMedium" style={[s.title, !item.read && s.titleBold]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={s.unreadDot} />}
                  </View>
                  <Text variant="bodySmall" style={s.body} numberOfLines={2}>{item.body}</Text>
                  <Text variant="labelSmall" style={s.date}>{timeAgo(item.createdAt)}</Text>
                </View>
              </Surface>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  markAll: { color: theme.colors.primary, fontWeight: '600' },
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 300 },
  emptyTitle: { color: '#555', fontWeight: '600' },
  emptySub: { color: '#999', textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  cardUnread: { backgroundColor: '#FFFBF5' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#333', flex: 1 },
  titleBold: { fontWeight: '700', color: '#111' },
  body: { color: '#666', marginTop: 2 },
  date: { color: '#bbb', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
});
