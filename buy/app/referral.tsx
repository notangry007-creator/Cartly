import React, { useState } from 'react';
import { View, StyleSheet, Share, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/stores/authStore';
import { useToast } from '../src/context/ToastContext';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

const REFERRAL_REWARD = 100; // NPR per successful referral

function generateReferralCode(userId: string): string {
  // Deterministic code based on userId — first 6 chars uppercased
  return 'BUY' + userId.replace(/-/g, '').slice(0, 5).toUpperCase();
}

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralCode = generateReferralCode(user.id);
  const referralLink = `https://buy.app/join?ref=${referralCode}`;

  function copyCode() {
    Clipboard.setString(referralCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(`Code "${referralCode}" copied!`);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareReferral() {
    try {
      await Share.share({
        title: 'Join Buy — Nepal\'s Best Shopping App',
        message:
          `🛍️ I'm shopping on Buy — Nepal's best e-commerce app!\n\n` +
          `Use my referral code **${referralCode}** when you sign up and we both get NPR ${REFERRAL_REWARD} wallet credit!\n\n` +
          `Download: ${referralLink}`,
        url: referralLink,
      });
    } catch {
      Alert.alert('Share failed', 'Could not share the referral link.');
    }
  }

  const steps = [
    { icon: 'share-social-outline', title: 'Share your code', desc: 'Send your unique referral code to friends' },
    { icon: 'person-add-outline', title: 'Friend signs up', desc: 'They register using your referral code' },
    { icon: 'wallet-outline', title: 'Both get rewarded', desc: `You and your friend each get NPR ${REFERRAL_REWARD} wallet credit` },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Refer & Earn" />

      <View style={s.content}>
        {/* Hero */}
        <Surface style={s.heroCard} elevation={2}>
          <Ionicons name="gift" size={48} color="#fff" />
          <Text style={s.heroTitle}>Earn NPR {REFERRAL_REWARD}</Text>
          <Text style={s.heroSub}>for every friend you refer to Buy</Text>
        </Surface>

        {/* Referral code */}
        <Surface style={s.codeCard} elevation={1}>
          <Text style={s.codeLabel}>Your Referral Code</Text>
          <View style={s.codeRow}>
            <Text style={s.code}>{referralCode}</Text>
            <TouchableOpacity
              style={[s.copyBtn, copied && s.copyBtnDone]}
              onPress={copyCode}
              accessibilityRole="button"
              accessibilityLabel={`Copy referral code ${referralCode}`}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? '#2E7D32' : theme.colors.primary} />
              <Text style={[s.copyTxt, copied && s.copyTxtDone]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
          <Button
            mode="contained"
            onPress={shareReferral}
            icon="share-social"
            style={s.shareBtn}
            contentStyle={{ paddingVertical: 4 }}
          >
            Share with Friends
          </Button>
        </Surface>

        {/* How it works */}
        <Text style={s.howTitle}>How it works</Text>
        {steps.map((step, i) => (
          <View key={i} style={s.step}>
            <View style={s.stepIcon}>
              <Ionicons name={step.icon as any} size={22} color={theme.colors.primary} />
            </View>
            <View style={s.stepText}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* Terms */}
        <Text style={s.terms}>
          * Wallet credit is added after your friend completes their first order of NPR 500+.
          Referral rewards are subject to Buy's terms and conditions.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: SPACING.md },
  heroCard: { backgroundColor: theme.colors.primary, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  codeCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  codeLabel: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  code: { flex: 1, fontSize: 28, fontWeight: '900', color: theme.colors.primary, letterSpacing: 4 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: theme.colors.primary },
  copyBtnDone: { borderColor: '#2E7D32' },
  copyTxt: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
  copyTxtDone: { color: '#2E7D32' },
  shareBtn: { marginTop: SPACING.xs },
  howTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: SPACING.md },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
  stepIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  stepDesc: { fontSize: 13, color: '#666', marginTop: 2, lineHeight: 18 },
  terms: { fontSize: 11, color: '#aaa', lineHeight: 16, marginTop: SPACING.md },
});
