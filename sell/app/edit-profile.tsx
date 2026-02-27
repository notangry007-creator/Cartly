import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { seller, updateProfile } = useAuthStore();
  const [name, setName] = useState(seller?.name ?? '');
  const [shopName, setShopName] = useState(seller?.shopName ?? '');
  const [shopDescription, setShopDescription] = useState(seller?.shopDescription ?? '');
  const [phone, setPhone] = useState(seller?.phone ?? '');
  const [email, setEmail] = useState(seller?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !shopName.trim()) {
      Alert.alert('Required', 'Name and Shop Name are required.');
      return;
    }
    setIsSaving(true);
    await updateProfile({ name: name.trim(), shopName: shopName.trim(), shopDescription: shopDescription.trim(), phone: phone.trim(), email: email.trim() });
    setIsSaving(false);
    Alert.alert('Saved', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <Field label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="98XXXXXXXX" keyboardType="phone-pad" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Info</Text>
          <Field label="Shop Name *" value={shopName} onChangeText={setShopName} placeholder="Your shop name" />
          <Field label="Shop Description" value={shopDescription} onChangeText={setShopDescription} placeholder="Describe your shop..." multiline />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, props.multiline && { height: 88, textAlignVertical: 'top' }]}
        placeholderTextColor={Colors.grey400}
        {...props}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  saveText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  section: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  submitBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
