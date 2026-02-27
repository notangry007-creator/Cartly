import { create } from 'zustand';
import { Payout } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_PAYOUTS } from '../data/seed';

const STORAGE_KEY = 'sell_payouts';

interface PayoutState {
  payouts: Payout[];
  hydrate: () => Promise<void>;
  requestPayout: (amount: number, method: string, accountDetails: string) => Promise<void>;
}

function generateId(): string {
  return 'pay_' + Date.now().toString(36);
}

export const usePayoutStore = create<PayoutState>((set, get) => ({
  payouts: [],

  hydrate: async () => {
    const stored = await getItem<Payout[]>(STORAGE_KEY);
    set({ payouts: stored ?? SEED_PAYOUTS });
    if (!stored) await setItem(STORAGE_KEY, SEED_PAYOUTS);
  },

  requestPayout: async (amount, method, accountDetails) => {
    const payout: Payout = {
      id: generateId(),
      amount,
      status: 'pending',
      method,
      accountDetails,
      requestedAt: new Date().toISOString(),
    };
    const payouts = [payout, ...get().payouts];
    await setItem(STORAGE_KEY, payouts);
    set({ payouts });
  },
}));
