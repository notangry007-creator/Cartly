import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '@/src/components/common/StatCard';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR } from '@/src/utils/helpers';
import { SEED_ANALYTICS } from '@/src/data/seed';

const PERIODS = ['7 Days', '14 Days', '30 Days'] as const;
type Period = (typeof PERIODS)[number];

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('14 Days');

  const analytics = SEED_ANALYTICS;
  const days = period === '7 Days' ? 7 : period === '14 Days' ? 14 : 30;
  const shownStats = analytics.dailyStats.slice(-days);

  const maxRevenue = Math.max(...shownStats.map((s) => s.revenue), 1);

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

        {/* Summary cards */}
        <View style={styles.statsRow}>
          <StatCard label="Total Revenue" value={formatNPR(analytics.totalRevenue)} icon="cash-outline" iconColor={Colors.success} change={analytics.revenueChange} />
          <StatCard label="Total Orders" value={String(analytics.totalOrders)} icon="receipt-outline" iconColor={Colors.info} change={analytics.ordersChange} />
        </View>

        {/* Revenue bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue — Last {days} days</Text>
          <View style={styles.chart}>
            {shownStats.map((stat, idx) => {
              const barHeight = Math.max((stat.revenue / maxRevenue) * 100, 4);
              return (
                <View key={stat.date} style={styles.bar}>
                  <View style={[styles.barFill, { height: barHeight }]} />
                  {idx % 3 === 0 && (
                    <Text style={styles.barLabel}>{stat.date.slice(5)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Top products */}
        <Text style={styles.sectionTitle}>Top Products</Text>
        {analytics.topProducts.map((tp, idx) => (
          <View key={tp.productId} style={styles.topProductCard}>
            <Text style={styles.rank}>#{idx + 1}</Text>
            <Image source={{ uri: tp.productImage }} style={styles.productImage} contentFit="cover" />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{tp.productName}</Text>
              <Text style={styles.productStats}>{tp.totalSold} sold · {formatNPR(tp.revenue)}</Text>
            </View>
          </View>
        ))}

        {/* Orders by status */}
        <Text style={styles.sectionTitle}>Order Breakdown</Text>
        <View style={styles.breakdownCard}>
          {[
            { label: 'Delivered', count: 1, color: Colors.statusDelivered },
            { label: 'Shipped', count: 1, color: Colors.statusShipped },
            { label: 'Confirmed', count: 1, color: Colors.statusConfirmed },
            { label: 'Pending', count: 1, color: Colors.statusPending },
            { label: 'Cancelled', count: 1, color: Colors.statusCancelled },
          ].map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <View style={styles.breakdownBarWrap}>
                <View style={[styles.breakdownBar, { width: `${(item.count / 5) * 100}%`, backgroundColor: item.color + '60' }]} />
              </View>
              <Text style={styles.breakdownCount}>{item.count}</Text>
            </View>
          ))}
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
