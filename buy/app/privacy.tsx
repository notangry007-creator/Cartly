import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Divider, Switch, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/stores/authStore';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '@/src/theme';
import { useRouter } from 'expo-router';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface PrivacySetting {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconsName;
}

const SETTINGS: PrivacySetting[] = [
  { id: 'analytics', title: 'Usage Analytics', subtitle: 'Help improve the app by sharing anonymous usage data', icon: 'analytics-outline' },
  { id: 'personalised_ads', title: 'Personalised Recommendations', subtitle: 'Show products based on your browsing history', icon: 'gift-outline' },
  { id: 'location_history', title: 'Location History', subtitle: 'Save location data to improve delivery estimates', icon: 'location-outline' },
  { id: 'order_updates', title: 'Order Update Notifications', subtitle: 'Receive push notifications for order status changes', icon: 'notifications-outline' },
  { id: 'promo_notifications', title: 'Promotional Notifications', subtitle: 'Receive offers, deals and new arrivals', icon: 'pricetag-outline' },
];

const PREFS_KEY = 'buy_privacy_prefs';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [prefs, setPrefs] = React.useState<Record<string, boolean>>({
    analytics: true,
    personalised_ads: true,
    location_history: true,
    order_updates: true,
    promo_notifications: false,
  });

  React.useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    });
  }, []);

  async function toggle(id: string) {
    const updated = { ...prefs, [id]: !prefs[id] };
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Privacy & Security" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Data & Permissions */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="labelSmall" style={styles.sectionLabel}>DATA & PERMISSIONS</Text>
          <Divider />
          {SETTINGS.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={styles.row}>
                <View style={[styles.iconWrap]}>
                  <Ionicons name={s.icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text variant="bodyMedium" style={styles.rowTitle}>{s.title}</Text>
                  <Text variant="labelSmall" style={styles.rowSub}>{s.subtitle}</Text>
                </View>
                <Switch
                  value={prefs[s.id] ?? false}
                  onValueChange={() => toggle(s.id)}
                  thumbColor={prefs[s.id] ? theme.colors.primary : '#f4f3f4'}
                  trackColor={{ false: '#e0e0e0', true: theme.colors.primaryContainer }}
                />
              </View>
              {i < SETTINGS.length - 1 && <Divider style={styles.innerDivider} />}
            </React.Fragment>
          ))}
        </Surface>

        {/* Security */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="labelSmall" style={styles.sectionLabel}>SECURITY</Text>
          <Divider />
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#2E7D32" />
            <View style={styles.infoText}>
              <Text variant="bodyMedium" style={styles.rowTitle}>Session Token</Text>
              <Text variant="labelSmall" style={styles.rowSub}>
                {user ? 'Active — logged in as +977 ' + user.phone : 'Not logged in'}
              </Text>
            </View>
          </View>
          <Divider style={styles.innerDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
            <View style={styles.infoText}>
              <Text variant="bodyMedium" style={styles.rowTitle}>Data Storage</Text>
              <Text variant="labelSmall" style={styles.rowSub}>
                Auth tokens stored in Secure Enclave. Cart and orders stored locally on device.
              </Text>
            </View>
          </View>
        </Surface>

        {/* Data Policy */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="labelSmall" style={styles.sectionLabel}>YOUR RIGHTS</Text>
          <Divider />
          <View style={styles.policyText}>
            <Text variant="bodySmall" style={styles.policy}>
              Buy collects minimal data to provide delivery and shopping features. Your payment details are never stored on this device. All data is processed locally unless you opt in to cloud sync.
            </Text>
            <Text variant="bodySmall" style={[styles.policy, { marginTop: SPACING.sm }]}>
              You can request a full export of your data or delete your account at any time.
            </Text>
          </View>
        </Surface>

        {/* Danger Zone */}
        <Surface style={[styles.section, styles.dangerSection]} elevation={1}>
          <Text variant="labelSmall" style={[styles.sectionLabel, styles.dangerLabel]}>DANGER ZONE</Text>
          <Divider />
          <View style={styles.dangerContent}>
            <Text variant="bodySmall" style={styles.dangerText}>
              Deleting your account permanently removes all your data including orders, addresses, wallet history, and reviews.
            </Text>
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              textColor="#B71C1C"
              style={styles.deleteBtn}
              icon="trash"
            >
              Delete My Account
            </Button>
          </View>
        </Surface>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  section: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: '#999',
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontWeight: '500', color: '#222' },
  rowSub: { color: '#888', marginTop: 2 },
  innerDivider: { marginLeft: SPACING.md + 36 + SPACING.md },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  infoText: { flex: 1 },
  policyText: { padding: SPACING.md },
  policy: { color: '#666', lineHeight: 20 },
  dangerSection: { backgroundColor: '#FFF5F5' },
  dangerLabel: { color: '#B71C1C' },
  dangerContent: { padding: SPACING.md, gap: SPACING.md },
  dangerText: { color: '#B71C1C', lineHeight: 20 },
  deleteBtn: { borderColor: '#B71C1C', alignSelf: 'flex-start' },
});
