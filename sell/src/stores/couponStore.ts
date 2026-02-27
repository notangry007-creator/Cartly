import { create } from 'zustand';
import { SellerCoupon } from '../types';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'sell_coupons';

interface CouponState {
  coupons: SellerCoupon[];
  hydrate: () => Promise<void>;
  addCoupon: (data: Omit<SellerCoupon, 'id' | 'usedCount' | 'createdAt'>) => Promise<void>;
  toggleCoupon: (id: string) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  incrementUsed: (id: string) => Promise<void>;
}

function generateId(): string {
  return 'cpn_' + Date.now().toString(36);
}

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: [],

  hydrate: async () => {
    const stored = await getItem<SellerCoupon[]>(STORAGE_KEY);
    set({ coupons: stored ?? [] });
  },

  addCoupon: async (data) => {
    const coupon: SellerCoupon = {
      ...data,
      id: generateId(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    const coupons = [coupon, ...get().coupons];
    await setItem(STORAGE_KEY, coupons);
    set({ coupons });
  },

  toggleCoupon: async (id) => {
    const coupons = get().coupons.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c,
    );
    await setItem(STORAGE_KEY, coupons);
    set({ coupons });
  },

  deleteCoupon: async (id) => {
    const coupons = get().coupons.filter(c => c.id !== id);
    await setItem(STORAGE_KEY, coupons);
    set({ coupons });
  },

  incrementUsed: async (id) => {
    const coupons = get().coupons.map(c =>
      c.id === id ? { ...c, usedCount: c.usedCount + 1 } : c,
    );
    await setItem(STORAGE_KEY, coupons);
    set({ coupons });
  },
}));
