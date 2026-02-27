import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'seller' | 'buyer';
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ChatThread {
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatState {
  threads: ChatThread[];
  hydrate: () => Promise<void>;
  sendMessage: (orderId: string, buyerName: string, buyerPhone: string, text: string, sellerId: string, sellerName: string) => Promise<void>;
  markRead: (orderId: string) => Promise<void>;
  getThread: (orderId: string) => ChatThread | undefined;
}

const STORAGE_KEY = 'sell_chat_threads';

function generateId(): string {
  return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],

  hydrate: async () => {
    const stored = await getItem<ChatThread[]>(STORAGE_KEY);
    set({ threads: stored ?? [] });
  },

  sendMessage: async (orderId, buyerName, buyerPhone, text, sellerId, sellerName) => {
    const { threads } = get();
    const existing = threads.find(t => t.orderId === orderId);
    const message: ChatMessage = {
      id: generateId(),
      orderId,
      senderId: sellerId,
      senderName: sellerName,
      senderRole: 'seller',
      text,
      createdAt: new Date().toISOString(),
      read: true,
    };

    let updated: ChatThread[];
    if (existing) {
      updated = threads.map(t =>
        t.orderId === orderId
          ? { ...t, messages: [...t.messages, message], lastMessage: text, lastMessageAt: message.createdAt }
          : t,
      );
    } else {
      const newThread: ChatThread = {
        orderId,
        buyerName,
        buyerPhone,
        lastMessage: text,
        lastMessageAt: message.createdAt,
        unreadCount: 0,
        messages: [message],
      };
      updated = [newThread, ...threads];
    }

    await setItem(STORAGE_KEY, updated);
    set({ threads: updated });
  },

  markRead: async (orderId) => {
    const threads = get().threads.map(t =>
      t.orderId === orderId
        ? { ...t, unreadCount: 0, messages: t.messages.map(m => ({ ...m, read: true })) }
        : t,
    );
    await setItem(STORAGE_KEY, threads);
    set({ threads });
  },

  getThread: (orderId) => get().threads.find(t => t.orderId === orderId),
}));
