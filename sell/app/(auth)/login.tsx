import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors, FontSize, Spacing, BorderRadius } from '@/src/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  async function handleLogin() {
    if (phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    await login(phone.trim());
    router.replace('/(tabs)/dashboard');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={48} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Sell</Text>
          <Text style={styles.tagline}>Your seller dashboard</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your shop</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={20} color={Colors.grey500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor={Colors.grey400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>Demo: enter any 10-digit number</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  appName: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: FontSize.md, color: Colors.primaryLight, marginTop: 4 },
  card: { width: '100%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, height: 52 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  btn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.grey500, marginTop: Spacing.md },
});
