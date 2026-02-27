import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/src/stores/notificationStore';
import EmptyState from '@/src/components/common/EmptyState';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatDateTime } from '@/src/utils/helpers';
import { NotificationType } from '@/src/types';

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  new_order: 'receipt-outline',
  order_update: 'refresh-circle-outline',
  low_stock: 'warning-outline',
  review: 'star-outline',
  payout: 'wallet-outline',
};

const COLORS: Record<NotificationType, string> = {
  new_order: Colors.primary,
  order_update: Colors.info,
  low_stock: Colors.danger,
  review: Colors.accent,
  payout: Colors.success,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useNotificationStore();

  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} hitSlop={8}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No notifications" description="You're all caught up!" />}
        renderItem={({ item }) => {
          const color = COLORS[item.type];
          return (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
                <Ionicons name={ICONS[item.type]} size={22} color={color} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  markAll: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, ...Shadow.sm },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  time: { fontSize: FontSize.xs, color: Colors.grey400, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
});
