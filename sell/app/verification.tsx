import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';

type DocType = 'pan' | 'citizenship' | 'business_reg' | 'bank_statement';

interface Document {
  type: DocType;
  label: string;
  description: string;
  required: boolean;
  uri?: string;
}

const INITIAL_DOCS: Document[] = [
  { type: 'pan', label: 'PAN Card', description: 'Permanent Account Number card (front)', required: true },
  { type: 'citizenship', label: 'Citizenship Certificate', description: 'Nepal citizenship certificate (front & back)', required: true },
  { type: 'business_reg', label: 'Business Registration', description: 'Company registration certificate or trade license', required: false },
  { type: 'bank_statement', label: 'Bank Statement', description: 'Last 3 months bank statement', required: false },
];

export default function VerificationScreen() {
  const router = useRouter();
  const { seller, updateProfile } = useAuthStore();
  const [docs, setDocs] = useState<Document[]>(INITIAL_DOCS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function pickDocument(type: DocType) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setDocs(prev => prev.map(d => d.type === type ? { ...d, uri: result.assets[0].uri } : d));
    }
  }

  async function handleSubmit() {
    const requiredMissing = docs.filter(d => d.required && !d.uri);
    if (requiredMissing.length > 0) {
      Alert.alert('Missing Documents', `Please upload: ${requiredMissing.map(d => d.label).join(', ')}`);
      return;
    }
    setIsSubmitting(true);
    // Simulate API submission
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    // In production: send docs to backend for review
    Alert.alert(
      'Submitted!',
      'Your verification documents have been submitted. Our team will review them within 2–3 business days.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  if (seller?.isVerified) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.verifiedState}>
          <Ionicons name="shield-checkmark" size={72} color={Colors.primary} />
          <Text style={styles.verifiedTitle}>Account Verified</Text>
          <Text style={styles.verifiedSub}>Your seller account has been verified. You have access to all seller features.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Verification</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why get verified?</Text>
          {[
            '✅ Verified badge on your shop',
            '📈 Higher visibility in search results',
            '💰 Faster payout processing',
            '🛡️ Increased buyer trust',
          ].map((b, i) => (
            <Text key={i} style={styles.benefit}>{b}</Text>
          ))}
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>Required Documents</Text>
        {docs.map(doc => (
          <View key={doc.type} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>
                  {doc.label}
                  {doc.required && <Text style={styles.required}> *</Text>}
                </Text>
                <Text style={styles.docDesc}>{doc.description}</Text>
              </View>
              {doc.uri ? (
                <View style={styles.uploadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.uploadedTxt}>Uploaded</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Ionicons name="cloud-upload-outline" size={16} color={Colors.grey500} />
                  <Text style={styles.pendingTxt}>Pending</Text>
                </View>
              )}
            </View>
            {doc.uri && (
              <Image source={{ uri: doc.uri }} style={styles.docPreview} resizeMode="cover" />
            )}
            <TouchableOpacity
              style={[styles.uploadBtn, doc.uri && styles.uploadBtnDone]}
              onPress={() => pickDocument(doc.type)}
            >
              <Ionicons name={doc.uri ? 'refresh-outline' : 'camera-outline'} size={16} color={doc.uri ? Colors.primary : Colors.white} />
              <Text style={[styles.uploadBtnTxt, doc.uri && styles.uploadBtnTxtDone]}>
                {doc.uri ? 'Replace' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, (isSubmitting || submitted) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || submitted}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.white} />
          <Text style={styles.submitTxt}>{isSubmitting ? 'Submitting...' : 'Submit for Verification'}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Documents are reviewed within 2–3 business days. All information is kept confidential and used only for verification purposes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  benefitsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, gap: Spacing.xs },
  benefitsTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  benefit: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  docCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm, gap: Spacing.sm },
  docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  docInfo: { flex: 1 },
  docLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  required: { color: Colors.danger },
  docDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  uploadedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadedTxt: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingTxt: { fontSize: FontSize.xs, color: Colors.grey500 },
  docPreview: { width: '100%', height: 120, borderRadius: BorderRadius.sm, backgroundColor: Colors.grey100 },
  uploadBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: 10, borderRadius: BorderRadius.md },
  uploadBtnDone: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary },
  uploadBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  uploadBtnTxtDone: { color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.md },
  submitTxt: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  disclaimer: { fontSize: FontSize.xs, color: Colors.grey500, textAlign: 'center', lineHeight: 16 },
  verifiedState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl },
  verifiedTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  verifiedSub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
