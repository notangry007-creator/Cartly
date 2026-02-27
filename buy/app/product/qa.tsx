import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useQAStore } from '../../src/stores/qaStore';
import { useProduct } from '../../src/hooks/useProducts';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { timeAgo } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';

export default function ProductQAScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { questions, loadQuestions, addQuestion } = useQAStore();
  const { data: product } = useProduct(id);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadQuestions(id);
  }, [id]);

  async function handleSubmit() {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!questionText.trim()) { Alert.alert('Empty', 'Please enter your question.'); return; }
    setSubmitting(true);
    await addQuestion(id, user.id, user.name, questionText.trim());
    setQuestionText('');
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title={`Q&A — ${product?.title?.slice(0, 30) ?? 'Product'}`} />

      <FlatList
        data={questions}
        keyExtractor={q => q.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubble-outline" size={56} color="#ddd" />
            <Text variant="titleMedium" style={s.emptyTitle}>No questions yet</Text>
            <Text variant="bodySmall" style={s.emptySub}>Be the first to ask about this product</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Surface style={s.card} elevation={1}>
            <View style={s.qRow}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{item.userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.qContent}>
                <Text variant="labelMedium" style={s.userName}>{item.userName}</Text>
                <Text variant="bodySmall" style={s.questionTxt}>{item.question}</Text>
                <Text variant="labelSmall" style={s.time}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
            {item.answer ? (
              <View style={s.answerBox}>
                <View style={s.answerHeader}>
                  <Ionicons name="shield-checkmark" size={14} color="#1565C0" />
                  <Text style={s.answerLabel}>Seller Answer</Text>
                </View>
                <Text variant="bodySmall" style={s.answerTxt}>{item.answer}</Text>
                {item.answeredAt && (
                  <Text variant="labelSmall" style={s.time}>{timeAgo(item.answeredAt)}</Text>
                )}
              </View>
            ) : (
              <View style={s.pendingBox}>
                <Ionicons name="time-outline" size={13} color="#888" />
                <Text style={s.pendingTxt}>Awaiting seller response</Text>
              </View>
            )}
          </Surface>
        )}
      />

      {/* Ask a question */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TextInput
          style={s.input}
          placeholder={user ? 'Ask a question about this product...' : 'Login to ask a question'}
          placeholderTextColor="#999"
          value={questionText}
          onChangeText={setQuestionText}
          multiline
          maxLength={300}
          editable={!!user}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!questionText.trim() || submitting) && s.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!questionText.trim() || submitting}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 300 },
  emptyTitle: { fontWeight: '700', color: '#222' },
  emptySub: { color: '#888', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  qRow: { flexDirection: 'row', gap: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
  qContent: { flex: 1 },
  userName: { fontWeight: '700', color: '#222' },
  questionTxt: { color: '#333', lineHeight: 18, marginTop: 2 },
  time: { color: '#bbb', marginTop: 4 },
  answerBox: { backgroundColor: '#E3F2FD', borderRadius: RADIUS.sm, padding: SPACING.sm, gap: 4 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answerLabel: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
  answerTxt: { color: '#333', lineHeight: 18 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingTxt: { color: '#888', fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, padding: SPACING.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: 14, color: '#333', backgroundColor: '#fafafa' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});
