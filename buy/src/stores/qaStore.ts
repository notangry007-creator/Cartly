import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';

export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

interface QAState {
  questions: ProductQuestion[];
  loadQuestions: (productId: string) => Promise<void>;
  addQuestion: (productId: string, userId: string, userName: string, question: string) => Promise<void>;
}

const qk = (pid: string) => `buy_qa_${pid}`;

export const useQAStore = create<QAState>((set, get) => ({
  questions: [],

  loadQuestions: async (productId) => {
    const questions = (await getItem<ProductQuestion[]>(qk(productId))) ?? [];
    set({ questions });
  },

  addQuestion: async (productId, userId, userName, question) => {
    const existing = (await getItem<ProductQuestion[]>(qk(productId))) ?? [];
    const newQ: ProductQuestion = {
      id: 'q_' + Date.now().toString(36),
      productId,
      userId,
      userName,
      question,
      createdAt: new Date().toISOString(),
    };
    const updated = [newQ, ...existing];
    await setItem(qk(productId), updated);
    set({ questions: updated });
  },
}));
