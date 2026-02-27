import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';

const SECTIONS = [
  { title: 'Data We Collect', body: 'We collect your name, phone number, shop details, product listings, and order information to operate the Sell platform.' },
  { title: 'How We Use Your Data', body: 'Your data is used to manage your seller account, process orders, calculate payouts, and improve the platform experience.' },
  { title: 'Data Sharing', body: 'We share only the necessary order and contact information with buyers to fulfill deliveries. We do not sell your data to third parties.' },
  { title: 'Data Security', body: 'All data is encrypted in transit and stored securely. You can request account deletion at any time by contacting support.' },
  { title: 'Terms of Service', body: 'By using the Sell app, you agree to list only genuine products, fulfill orders in a timely manner, and maintain accurate stock information.' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: July 2024</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  lastUpdated: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  cardBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
