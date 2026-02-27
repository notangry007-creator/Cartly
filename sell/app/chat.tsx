import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useOrderStore } from '@/src/stores/orderStore';
import { useChatStore } from '@/src/stores/chatStore';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/src/theme';
import { formatDateTime } from '@/src/utils/helpers';

export default function ChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const seller = useAuthStore(s => s.seller);
  const orders = useOrderStore(s => s.orders);
  const { threads, sendMessage, markRead, hydrate } = useChatStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const order = orders.find(o => o.id === orderId);
  const thread = threads.find(t => t.orderId === orderId);
  const messages = thread?.messages ?? [];

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (orderId) markRead(orderId);
  }, [orderId, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim() || !seller || !order) return;
    setSending(true);
    await sendMessage(
      orderId,
      order.buyerName,
      order.buyerPhone,
      text.trim(),
      seller.id,
      seller.shopName,
    );
    setText('');
    setSending(false);
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>Order not found</Text>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{order.buyerName}</Text>
          <Text style={styles.headerSub}>Order #{orderId.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Call Buyer', `Call ${order.buyerPhone}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => {} },
          ])}
          hitSlop={8}
        >
          <Ionicons name="call-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.grey300} />
              <Text style={styles.emptyTxt}>No messages yet</Text>
              <Text style={styles.emptySub}>Start the conversation with {order.buyerName}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSeller = item.senderRole === 'seller';
            return (
              <View style={[styles.msgRow, isSeller && styles.msgRowSeller]}>
                {!isSeller && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{item.senderName.charAt(0)}</Text>
                  </View>
                )}
                <View style={[styles.bubble, isSeller ? styles.bubbleSeller : styles.bubbleBuyer]}>
                  <Text style={[styles.bubbleTxt, isSeller && styles.bubbleTxtSeller]}>{item.text}</Text>
                  <Text style={[styles.bubbleTime, isSeller && { color: 'rgba(255,255,255,0.6)' }]}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.grey400}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerInfo: { flex: 1 },
  headerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: FontSize.xs },
  messageList: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, padding: Spacing.xxl, minHeight: 300 },
  emptyTxt: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.grey500, textAlign: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  msgRowSeller: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.grey200, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  bubble: { maxWidth: '75%', borderRadius: BorderRadius.lg, padding: Spacing.sm, gap: 2 },
  bubbleBuyer: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleSeller: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTxt: { fontSize: FontSize.md, color: Colors.text, lineHeight: 20 },
  bubbleTxtSeller: { color: Colors.white },
  bubbleTime: { fontSize: FontSize.xs, color: Colors.grey500, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.grey50 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.grey300 },
});
