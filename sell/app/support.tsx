import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';

const FAQ = [
  { q: 'How do I add a new product?', a: 'Go to the Products tab and tap the + button in the top right.' },
  { q: 'How long does payout processing take?', a: 'Payouts are processed within 2 business days after your request.' },
  { q: 'What payment methods are supported?', a: 'We support eSewa, Khalti, and Bank Transfer for payouts.' },
  { q: 'How do I update my shop information?', a: 'Go to Profile → Edit Profile to update your shop name, description, and contact details.' },
  { q: 'How do I cancel an order?', a: 'Open the order detail and tap "Cancel Order". Only pending and confirmed orders can be cancelled.' },
];

export default function SupportScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={28} color={Colors.primary} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactSub}>support@cartly.app</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@cartly.app')}>
            <Ionicons name="open-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ.map((item, idx) => (
          <View key={idx} style={styles.faqCard}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
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
  contactCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  contactSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  faqCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  question: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  answer: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
