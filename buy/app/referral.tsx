import React, { useState } from 'react';
import { View, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/stores/authStore';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { useToast } from '../src/context/ToastContext';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

// Referral reward amounts
const REFERRER_REWARD_NPR = 200;
const REFEREE_REWARD_NPR = 100;

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);
  const auth = useAuthGuard();
  if (!auth || !user) return null;

  const referralCode = user.referralCode ?? 'BUY' + user.id.slice(-6).toUpperCase();

  async function handleShare() {
    await Share.share({
      title: 'Join Buy — Nepal\'s trusted shopping platform',
      message: `🛍️ Shop on Buy and get NPR ${REFEREE_REWARD_NPR} wallet bonus!\n\nUse my referral code: ${referralCode}\n\nDownload Buy app and enter this code at signup to claim your bonus.\n\nI'll also earn NPR ${REFERRER_REWARD_NPR} when you make your first purchase! 🎉`,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleCopyCode() {
    // Use Share as clipboard fallback
    await Share.share({ message: referralCode });
    setCopied(true);
    Haptics.selectionAsync();
    showSuccess(`Referral code "${referralCode}" shared!`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Refer & Earn" />

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="people" size={48} color={theme.colors.primary} />
        </View>
        <Text variant="headlineMedium" style={s.heroTitle}>Invite Friends, Earn Rewards</Text>
        <Text variant="bodyMedium" style={s.heroSub}>
          Share your code and earn NPR {REFERRER_REWARD_NPR} when your friend makes their first purchase.
          Your friend gets NPR {REFEREE_REWARD_NPR} too!
        </Text>
      </View>

      {/* Referral code card */}
      <Surface style={s.codeCard} elevation={2}>
        <Text variant="labelSmall" style={s.codeLabel}>YOUR REFERRAL CODE</Text>
        <View style={s.codeRow}>
          <Text style={s.code}>{referralCode}</Text>
          <TouchableOpacity
            style={[s.copyBtn, copied && s.copyBtnDone]}
            onPress={handleCopyCode}
            accessibilityRole="button"
            accessibilityLabel="Copy referral code"
          >
            <Ionicons name={copied ? 'checkmark' : 'copy'} size={18} color={copied ? '#2E7D32' : theme.colors.primary} />
            <Text style={[s.copyTxt, copied && s.copyTxtDone]}>{copied ? 'Shared!' : 'Share'}</Text>
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Share button */}
      <Button
        mode="contained"
        onPress={handleShare}
        icon="share-social"
        style={s.shareBtn}
        contentStyle={{ paddingVertical: SPACING.xs }}
      >
        Share with Friends
      </Button>

      {/* How it works */}
      <Surface style={s.howCard} elevation={1}>
        <Text variant="titleSmall" style={s.howTitle}>How It Works</Text>
        {[
          { icon: 'share-social', color: theme.colors.primary, text: `Share your code "${referralCode}" with friends` },
          { icon: 'person-add', color: '#1565C0', text: 'Friend signs up using your referral code' },
          { icon: 'bag', color: '#2E7D32', text: 'Friend makes their first purchase' },
          { icon: 'wallet', color: '#FF8F00', text: `You earn NPR ${REFERRER_REWARD_NPR} · Friend gets NPR ${REFEREE_REWARD_NPR}` },
        ].map((step, i) => (
          <View key={i} style={s.step}>
            <View style={[s.stepNum, { backgroundColor: step.color + '20' }]}>
              <Ionicons name={step.icon as any} size={18} color={step.color} />
            </View>
            <Text variant="bodySmall" style={s.stepTxt}>{step.text}</Text>
          </View>
        ))}
      </Surface>

      {/* Terms */}
      <Text variant="labelSmall" style={s.terms}>
        Referral rewards are credited to your Buy Wallet after your friend's first successful order.
        Maximum 10 referrals per account. Rewards expire after 90 days.
      </Text>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  hero: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontWeight: '800', color: '#222', textAlign: 'center' },
  heroSub: { color: '#666', textAlign: 'center', lineHeight: 22 },
  codeCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  codeLabel: { color: '#888', fontWeight: '700', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  code: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  copyBtnDone: { borderColor: '#2E7D32' },
  copyTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  copyTxtDone: { color: '#2E7D32' },
  shareBtn: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  howCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: '#fff',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  howTitle: { fontWeight: '700', color: '#222' },
  step: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepNum: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { color: '#555', flex: 1, lineHeight: 18 },
  terms: { color: '#aaa', textAlign: 'center', paddingHorizontal: SPACING.xl, lineHeight: 18 },
});
