import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, TextInput, Button, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useProductQuestions, useAskQuestion, useMarkHelpful } from '../../src/hooks/useProductQA';
import { timeAgo } from '../../src/utils/helpers';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { useToast } from '../../src/context/ToastContext';
import { theme, SPACING, RADIUS } from '../../src/theme';

export default function ProductQAScreen() {
  const insets = useSafeAreaInsets();
  const { id: productId, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { user } = useAuthStore();
  const { data: questions = [], isLoading } = useProductQuestions(productId);
  const { mutateAsync: askQuestion, isPending } = useAskQuestion();
  const { mutateAsync: markHelpful } = useMarkHelpful();
  const { showSuccess, showError } = useToast();
  const [newQuestion, setNewQuestion] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleAsk() {
    if (!user) return;
    if (newQuestion.trim().length < 10) {
      showError('Question must be at least 10 characters');
      return;
    }
    await askQuestion({
      productId,
      userId: user.id,
      userName: user.name,
      question: newQuestion.trim(),
    });
    setNewQuestion('');
    setShowForm(false);
    showSuccess('Your question has been submitted!');
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={`Q&A — ${(title ?? 'Product').slice(0, 20)}`} />

      <FlatList
        data={questions}
        keyExtractor={q => q.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View style={s.header}>
            <Text variant="titleSmall" style={s.headerTitle}>
              {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </Text>
            {user && (
              <Button
                mode="outlined"
                compact
                icon="add"
                onPress={() => setShowForm(!showForm)}
              >
                Ask a Question
              </Button>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="help-circle-outline" size={48} color="#ccc" />
            <Text variant="bodyMedium" style={{ color: '#888' }}>No questions yet</Text>
            <Text variant="bodySmall" style={{ color: '#aaa', textAlign: 'center' }}>
              Be the first to ask about this product!
            </Text>
          </View>
        }
        renderItem={({ item: q }) => (
          <Surface style={s.qCard} elevation={1}>
            {/* Question */}
            <View style={s.qHeader}>
              <View style={s.qAvatar}>
                <Text style={s.qAvatarTxt}>{q.userName.charAt(0)}</Text>
              </View>
              <View style={s.qMeta}>
                <Text variant="labelMedium" style={{ fontWeight: '600', color: '#333' }}>{q.userName}</Text>
                <Text variant="labelSmall" style={{ color: '#bbb' }}>{timeAgo(q.createdAt)}</Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={s.qText}>{q.question}</Text>

            {/* Answer */}
            {q.answer ? (
              <View style={s.answerBox}>
                <View style={s.answerHeader}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text variant="labelSmall" style={s.answeredBy}>
                    Answered by {q.answeredBy}
                  </Text>
                </View>
                <Text variant="bodySmall" style={s.answerText}>{q.answer}</Text>
              </View>
            ) : (
              <Text variant="labelSmall" style={{ color: '#aaa', fontStyle: 'italic', marginTop: SPACING.xs }}>
                Awaiting answer from seller...
              </Text>
            )}

            {/* Helpful */}
            <TouchableOpacity
              style={s.helpfulBtn}
              onPress={() => markHelpful({ productId, questionId: q.id })}
            >
              <Ionicons name="thumbs-up-outline" size={14} color="#888" />
              <Text variant="labelSmall" style={{ color: '#888' }}>
                Helpful ({q.helpful})
              </Text>
            </TouchableOpacity>
          </Surface>
        )}
      />

      {/* Ask question form */}
      {showForm && user && (
        <View style={s.formBar}>
          <TextInput
            value={newQuestion}
            onChangeText={setNewQuestion}
            placeholder="Ask a question about this product..."
            mode="outlined"
            multiline
            numberOfLines={3}
            style={s.formInput}
          />
          <View style={s.formActions}>
            <Button mode="outlined" onPress={() => setShowForm(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleAsk}
              loading={isPending}
              disabled={newQuestion.trim().length < 10}
            >
              Submit
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  headerTitle: { fontWeight: '700', color: '#222' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl, minHeight: 200 },
  qCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  qAvatarTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  qMeta: { flex: 1 },
  qText: { color: '#333', lineHeight: 20 },
  answerBox: { backgroundColor: '#F1F8E9', borderRadius: RADIUS.sm, padding: SPACING.sm, gap: SPACING.xs },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answeredBy: { color: '#2E7D32', fontWeight: '600' },
  answerText: { color: '#444', lineHeight: 18 },
  helpfulBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  formBar: { backgroundColor: '#fff', padding: SPACING.md, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: SPACING.sm },
  formInput: { backgroundColor: '#fff' },
  formActions: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'flex-end' },
});
