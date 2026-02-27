import { create } from 'zustand';
import { Payout } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_PAYOUTS } from '../data/seed';

const STORAGE_KEY = 'sell_payouts';
const SCHEDULE_KEY = 'sell_payout_schedule';

export interface PayoutSchedule {
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  method: string;
  accountDetails: string;
  minAmount: number;
  nextPayoutDate: string;
}

interface PayoutState {
  payouts: Payout[];
  schedule: PayoutSchedule | null;
  hydrate: () => Promise<void>;
  requestPayout: (amount: number, method: string, accountDetails: string) => Promise<void>;
  saveSchedule: (schedule: PayoutSchedule) => Promise<void>;
  disableSchedule: () => Promise<void>;
}

function generateId(): string {
  return 'pay_' + Date.now().toString(36);
}

export const usePayoutStore = create<PayoutState>((set, get) => ({
  payouts: [],
  schedule: null,

  hydrate: async () => {
    const stored = await getItem<Payout[]>(STORAGE_KEY);
    const schedule = await getItem<PayoutSchedule>(SCHEDULE_KEY);
    set({ payouts: stored ?? SEED_PAYOUTS, schedule: schedule ?? null });
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

  saveSchedule: async (schedule) => {
    await setItem(SCHEDULE_KEY, schedule);
    set({ schedule });
  },

  disableSchedule: async () => {
    const updated: PayoutSchedule | null = get().schedule
      ? { ...get().schedule!, enabled: false }
      : null;
    if (updated) await setItem(SCHEDULE_KEY, updated);
    set({ schedule: updated });
  },
}));
