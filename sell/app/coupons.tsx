import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useCouponStore } from '@/src/stores/couponStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatNPR, formatDate } from '@/src/utils/helpers';
import { CouponType } from '@/src/types';

const COUPON_TYPES: { value: CouponType; label: string }[] = [
  { value: 'percent', label: '% Percent Off' },
  { value: 'flat', label: 'NPR Flat Off' },
];

export default function CouponsScreen() {
  const router = useRouter();
  const seller = useAuthStore(s => s.seller);
  const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useCouponStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('percent');
  const [value, setValue] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  function resetForm() {
    setCode(''); setType('percent'); setValue(''); setMinSpend(''); setMaxDiscount(''); setExpiresAt('');
  }

  async function handleCreate() {
    if (!code.trim() || !value.trim() || !minSpend.trim()) {
      Alert.alert('Missing Fields', 'Code, Value, and Min Spend are required.');
      return;
    }
    const parsedValue = parseFloat(value);
    const parsedMin = parseFloat(minSpend);
    if (isNaN(parsedValue) || parsedValue <= 0) { Alert.alert('Invalid Value', 'Enter a valid discount value.'); return; }
    if (isNaN(parsedMin) || parsedMin < 0) { Alert.alert('Invalid Min Spend', 'Enter a valid minimum spend.'); return; }
    if (type === 'percent' && parsedValue > 100) { Alert.alert('Invalid Percent', 'Percent discount cannot exceed 100%.'); return; }

    setIsSubmitting(true);
    await addCoupon({
      sellerId: seller?.id ?? '',
      code: code.trim().toUpperCase(),
      type,
      value: parsedValue,
      minSpend: parsedMin,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      expiresAt: expiresAt
        ? new Date(expiresAt).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    });
    setIsSubmitting(false);
    setModalVisible(false);
    resetForm();
  }

  function confirmDelete(id: string, couponCode: string) {
    Alert.alert('Delete Coupon', `Delete coupon "${couponCode}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCoupon(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coupons</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={56} color={Colors.grey400} />
            <Text style={styles.emptyTitle}>No coupons yet</Text>
            <Text style={styles.emptySub}>Tap + to create your first coupon</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpired = new Date(item.expiresAt) < new Date();
          return (
            <View style={[styles.card, !item.isActive && styles.cardInactive]}>
              <View style={styles.cardLeft}>
                <Text style={styles.codeText}>{item.code}</Text>
                <Text style={styles.discountText}>
                  {item.type === 'percent' ? `${item.value}% OFF` : `NPR ${item.value} OFF`}
                </Text>
                {item.maxDiscount && (
                  <Text style={styles.maxText}>Max: {formatNPR(item.maxDiscount)}</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.minSpend}>Min: {formatNPR(item.minSpend)}</Text>
                <Text style={[styles.expiry, isExpired && styles.expired]}>
                  {isExpired ? '⚠ Expired' : `Exp: ${formatDate(item.expiresAt)}`}
                </Text>
                <Text style={styles.usedCount}>{item.usedCount} used</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, item.isActive && styles.toggleBtnActive]}
                    onPress={() => toggleCoupon(item.id)}
                  >
                    <Text style={[styles.toggleTxt, item.isActive && styles.toggleTxtActive]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id, item.code)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Coupon</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.grey700} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FieldInput label="Coupon Code *" value={code} onChangeText={v => setCode(v.toUpperCase())} placeholder="e.g. SAVE20" autoCapitalize="characters" />
              <Text style={styles.fieldLabel}>Discount Type *</Text>
              <View style={styles.typeRow}>
                {COUPON_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
                    onPress={() => setType(t.value)}
                  >
                    <Text style={[styles.typeTxt, type === t.value && styles.typeTxtActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <FieldInput label={`Value * (${type === 'percent' ? '%' : 'NPR'})`} value={value} onChangeText={setValue} placeholder={type === 'percent' ? '20' : '500'} keyboardType="decimal-pad" />
              <FieldInput label="Min Spend (NPR) *" value={minSpend} onChangeText={setMinSpend} placeholder="1000" keyboardType="decimal-pad" />
              {type === 'percent' && (
                <FieldInput label="Max Discount (NPR, optional)" value={maxDiscount} onChangeText={setMaxDiscount} placeholder="e.g. 2000" keyboardType="decimal-pad" />
              )}
              <FieldInput label="Expires At (YYYY-MM-DD, optional)" value={expiresAt} onChangeText={setExpiresAt} placeholder="2026-12-31" />
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={isSubmitting}>
                <Text style={styles.submitTxt}>{isSubmitting ? 'Creating...' : 'Create Coupon'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FieldInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.fieldInput} placeholderTextColor={Colors.grey400} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl, minHeight: 300 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, flexDirection: 'row', padding: Spacing.md, ...Shadow.sm, gap: Spacing.md },
  cardInactive: { opacity: 0.6 },
  cardLeft: { flex: 1 },
  codeText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  discountText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginTop: 2 },
  maxText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  minSpend: { fontSize: FontSize.xs, color: Colors.textSecondary },
  expiry: { fontSize: FontSize.xs, color: Colors.textSecondary },
  expired: { color: Colors.danger, fontWeight: '600' },
  usedCount: { fontSize: FontSize.xs, color: Colors.grey500 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive: { backgroundColor: Colors.success + '20', borderColor: Colors.success },
  toggleTxt: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  toggleTxtActive: { color: Colors.success },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: Spacing.xxl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.white },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  typeTxtActive: { color: Colors.white, fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  submitTxt: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
