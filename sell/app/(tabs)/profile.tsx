import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  onPress?: () => void;
  badge?: number;
  danger?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { seller, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  function confirmLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/edit-profile' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications', badge: unreadCount },
    { icon: 'wallet-outline', label: 'Payouts', route: '/payouts' },
    { icon: 'shield-checkmark-outline', label: 'Account Verification', onPress: () => Alert.alert('Verification', 'Please contact support@cartly.app to complete seller verification.') },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/support' },
    { icon: 'document-text-outline', label: 'Terms & Privacy', route: '/privacy' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Shop card */}
        <View style={styles.shopCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{seller?.shopName.charAt(0) ?? 'S'}</Text>
          </View>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{seller?.shopName}</Text>
            <Text style={styles.sellerName}>{seller?.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.rating}>{seller?.rating.toFixed(1)} · {seller?.totalSales} sales</Text>
            </View>
            {seller?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
                <Text style={styles.verifiedText}>Verified Seller</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Sales', value: seller?.totalSales ?? 0 },
            { label: 'Rating', value: seller?.rating.toFixed(1) ?? '—' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.route ? () => router.push(item.route as any) : item.onPress}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color={item.danger ? Colors.danger : Colors.grey700} />
                <Text style={[styles.menuLabel, item.danger && { color: Colors.danger }]}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {!!item.badge && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.grey400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Sell App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  shopCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.md, marginBottom: Spacing.md },
  avatarWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  sellerName: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: FontSize.sm, color: Colors.textSecondary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.md, marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', padding: Spacing.md },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  menu: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, ...Shadow.sm, marginBottom: Spacing.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuLabel: { fontSize: FontSize.md, color: Colors.text },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: { backgroundColor: Colors.danger, borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.danger },
  version: { textAlign: 'center', color: Colors.grey400, fontSize: FontSize.xs, marginTop: Spacing.lg },
});
