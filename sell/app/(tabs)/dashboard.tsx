import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useOrderStore } from '@/src/stores/orderStore';
import { useProductStore } from '@/src/stores/productStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import StatCard from '@/src/components/common/StatCard';
import OrderStatusBadge from '@/src/components/common/OrderStatusBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDateTime } from '@/src/utils/helpers';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function DashboardScreen() {
  const router = useRouter();
  const seller = useAuthStore((s) => s.seller);
  const orders = useOrderStore((s) => s.orders);
  const products = useProductStore((s) => s.products);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const returnOrders = orders.filter((o) => o.status === 'return_requested');
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = products.filter((p) => {
    const stock = p.variants[0]?.stock ?? 0;
    return stock > 0 && stock <= 10;
  });
  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.shopName}>{seller?.shopName ?? 'Your Shop'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="Revenue" value={formatNPR(totalRevenue)} icon="cash-outline" iconColor={Colors.success} />
          <StatCard label="Orders" value={String(orders.length)} icon="receipt-outline" iconColor={Colors.info} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Products" value={String(products.length)} icon="cube-outline" iconColor={Colors.accent} />
          <StatCard label="Pending" value={String(pendingOrders.length)} icon="time-outline" iconColor={Colors.warning} />
        </View>

        {/* Alerts */}
        {(pendingOrders.length > 0 || returnOrders.length > 0 || lowStockProducts.length > 0) && (
          <View style={styles.alertsWrap}>
            {pendingOrders.length > 0 && (
              <TouchableOpacity style={[styles.alertCard, { borderLeftColor: Colors.warning }]} onPress={() => router.push('/(tabs)/orders')}>
                <Ionicons name="time-outline" size={20} color={Colors.warning} />
                <Text style={styles.alertText}>{pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} awaiting confirmation</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.grey500} />
              </TouchableOpacity>
            )}
            {returnOrders.length > 0 && (
              <TouchableOpacity style={[styles.alertCard, { borderLeftColor: Colors.warning }]} onPress={() => router.push('/(tabs)/orders')}>
                <Ionicons name="return-down-back-outline" size={20} color={Colors.warning} />
                <Text style={styles.alertText}>{returnOrders.length} return request{returnOrders.length > 1 ? 's' : ''} need attention</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.grey500} />
              </TouchableOpacity>
            )}
            {lowStockProducts.length > 0 && (
              <TouchableOpacity style={[styles.alertCard, { borderLeftColor: Colors.danger }]} onPress={() => router.push('/(tabs)/products')}>
                <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                <Text style={styles.alertText}>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.grey500} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {[
            { label: 'Add Product', icon: 'add-circle-outline', route: '/product/new', color: Colors.primary },
            { label: 'View Orders', icon: 'receipt-outline', route: '/(tabs)/orders', color: Colors.info },
            { label: 'Analytics', icon: 'bar-chart-outline', route: '/(tabs)/analytics', color: Colors.accent },
            { label: 'Payouts', icon: 'wallet-outline', route: '/payouts', color: Colors.success },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickBtn} onPress={() => router.push(item.route as any)}>
              <View style={[styles.quickIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push(`/order/${order.id}` as any)}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>#{order.id.toUpperCase()}</Text>
              <OrderStatusBadge status={order.status} />
            </View>
            <Text style={styles.buyerName}>{order.buyerName}</Text>
            <View style={styles.orderBottom}>
              <Text style={styles.orderTotal}>{formatNPR(order.total)}</Text>
              <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: Colors.primaryLight, fontSize: FontSize.sm },
  shopName: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.danger, borderRadius: 99, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.sm },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  alertsWrap: { gap: Spacing.sm, marginTop: Spacing.sm },
  alertCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderLeftWidth: 4, ...Shadow.sm },
  alertText: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickBtn: { width: '22%', alignItems: 'center', gap: 6 },
  quickIcon: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  orderCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  buyerName: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderTotal: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  orderDate: { fontSize: FontSize.xs, color: Colors.grey500 },
});
