import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import StatCard from '@/src/components/common/StatCard';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, percentageChange } from '@/src/utils/helpers';
import { useOrderStore } from '@/src/stores/orderStore';
import { useProductStore } from '@/src/stores/productStore';
import { SEED_ANALYTICS } from '@/src/data/seed';

const PERIODS = ['7 Days', '14 Days', '30 Days'] as const;
type Period = (typeof PERIODS)[number];

const ORDER_STATUSES = [
  { label: 'Delivered', key: 'delivered' as const, color: Colors.statusDelivered },
  { label: 'Shipped', key: 'shipped' as const, color: Colors.statusShipped },
  { label: 'Confirmed', key: 'confirmed' as const, color: Colors.statusConfirmed },
  { label: 'Pending', key: 'pending' as const, color: Colors.statusPending },
  { label: 'Cancelled', key: 'cancelled' as const, color: Colors.statusCancelled },
];

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('14 Days');
  const orders = useOrderStore((s) => s.orders);
  const products = useProductStore((s) => s.products);

  const days = period === '7 Days' ? 7 : period === '14 Days' ? 14 : 30;

  // Compute live stats from orders
  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    [orders],
  );
  const totalOrders = orders.length;

  // Order breakdown counts
  const breakdownCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }, [orders]);
  const maxBreakdown = Math.max(...Object.values(breakdownCounts), 1);

  // Top products by totalSold
  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 3),
    [products],
  );

  // Build a daily revenue chart from real order data for the selected period
  const shownStats = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const revenue = orders
        .filter((o) => o.status === 'delivered' && o.createdAt.startsWith(dateStr))
        .reduce((sum, o) => sum + o.total, 0);
      const orderCount = orders.filter((o) => o.createdAt.startsWith(dateStr)).length;
      return { date: dateStr, revenue, orders: orderCount };
    });
  }, [orders, days]);

  // Fall back to seed data for chart if all real values are 0 (demo mode)
  const hasRealData = shownStats.some((s) => s.revenue > 0);
  const chartStats = hasRealData ? shownStats : SEED_ANALYTICS.dailyStats.slice(-days);
  const maxRevenue = Math.max(...chartStats.map((s) => s.revenue), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary cards — live data */}
        <View style={styles.statsRow}>
          <StatCard label="Total Revenue" value={formatNPR(totalRevenue)} icon="cash-outline" iconColor={Colors.success} />
          <StatCard label="Total Orders" value={String(totalOrders)} icon="receipt-outline" iconColor={Colors.info} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Products" value={String(products.length)} icon="cube-outline" iconColor={Colors.accent} />
          <StatCard label="Delivered" value={String(breakdownCounts['delivered'] ?? 0)} icon="checkmark-circle-outline" iconColor={Colors.success} />
        </View>

        {/* Revenue bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue trend — Last {days} days</Text>
          <View style={styles.chart}>
            {chartStats.map((stat, idx) => {
              const barHeight = Math.max((stat.revenue / maxRevenue) * 100, 4);
              return (
                <View key={stat.date} style={styles.bar}>
                  <View style={[styles.barFill, { height: barHeight }]} />
                  {idx % Math.ceil(days / 7) === 0 && (
                    <Text style={styles.barLabel}>{stat.date.slice(5)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Top products — live from store */}
        <Text style={styles.sectionTitle}>Top Products</Text>
        {topProducts.length === 0 ? (
          <Text style={styles.emptyText}>No product sales yet.</Text>
        ) : (
          topProducts.map((p, idx) => (
            <View key={p.id} style={styles.topProductCard}>
              <Text style={styles.rank}>#{idx + 1}</Text>
              <Image source={{ uri: p.images[0] }} style={styles.productImage} contentFit="cover" />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productStats}>{p.totalSold} sold · {formatNPR(p.price * p.totalSold)}</Text>
              </View>
            </View>
          ))
        )}

        {/* Orders by status — live */}
        <Text style={styles.sectionTitle}>Order Breakdown</Text>
        <View style={styles.breakdownCard}>
          {ORDER_STATUSES.map((item) => {
            const count = breakdownCounts[item.key] ?? 0;
            return (
              <View key={item.label} style={styles.breakdownRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <View style={styles.breakdownBarWrap}>
                  <View style={[styles.breakdownBar, { width: `${(count / maxBreakdown) * 100}%`, backgroundColor: item.color + '60' }]} />
                </View>
                <Text style={styles.breakdownCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  periodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  periodTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  periodLabelActive: { color: Colors.white, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  chartCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  chartTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 3 },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 8, color: Colors.grey500, marginTop: 2 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
  topProductCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm, gap: Spacing.sm },
  rank: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary, width: 28 },
  productImage: { width: 48, height: 48, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  productStats: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  breakdownCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm, gap: Spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { width: 70, fontSize: FontSize.sm, color: Colors.text },
  breakdownBarWrap: { flex: 1, height: 10, backgroundColor: Colors.grey100, borderRadius: 5, overflow: 'hidden' },
  breakdownBar: { height: '100%', borderRadius: 5 },
  breakdownCount: { width: 24, fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, textAlign: 'right' },
});
