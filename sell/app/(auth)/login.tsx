import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/authStore';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  async function sendOtp() {
    if (phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    setError('');
    const formatted = '+977' + phone.trim().replace(/^977/, '');
    setE164(formatted);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep('otp');
    setCountdown(30);
  }

  function handleDigit(val: string, idx: number) {
    const d = val.replace(/\D/g, '').slice(-1);
    const nd = [...digits];
    nd[idx] = d;
    setDigits(nd);
    setError('');
    if (d && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKey(key: string, idx: number) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function verifyOtp() {
    const token = digits.join('');
    if (token.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164,
      token,
      type: 'sms',
    });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }
    try {
      await login(phone.trim());
      router.replace('/(tabs)/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setDigits(['', '', '', '', '', '']);
    setCountdown(30);
    setError('');
    await supabase.auth.signInWithOtp({ phone: e164 });
  }

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.white} />
            </View>
            <Text style={styles.appName}>Verify OTP</Text>
            <Text style={styles.tagline}>Sent to +977 {phone}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>Check your SMS for the 6-digit code</Text>
            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={r => { inputs.current[i] = r; }}
                  value={d}
                  onChangeText={v => handleDigit(v, i)}
                  onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.digit, error ? styles.digitErr : null]}
                />
              ))}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={verifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Verify & Continue</Text>}
            </TouchableOpacity>
            <View style={styles.resendRow}>
              <Text style={styles.hint}>Didn't receive? </Text>
              {countdown > 0 ? (
                <Text style={styles.hint}>Resend in {countdown}s</Text>
              ) : (
                <TouchableOpacity onPress={resend}>
                  <Text style={[styles.hint, { color: Colors.primary, fontWeight: '600' }]}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setStep('phone')} style={{ marginTop: Spacing.sm }}>
              <Text style={[styles.hint, { color: Colors.primary }]}>← Change number</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={48} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Sell</Text>
          <Text style={styles.tagline}>Your seller dashboard</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your shop</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={20} color={Colors.grey500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number (98XXXXXXXX)"
              placeholderTextColor={Colors.grey400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={sendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Get OTP</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: FontSize.md, color: Colors.primaryLight, marginTop: 4 },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  btn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.grey500, marginTop: Spacing.md },
  errorText: { color: '#D32F2F', fontSize: FontSize.sm, marginBottom: Spacing.sm },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: Spacing.md },
  digit: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: '#fafafa',
  },
  digitErr: { borderColor: '#D32F2F' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
});
