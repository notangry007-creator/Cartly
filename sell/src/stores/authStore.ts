import { create } from 'zustand';
import { Seller } from '../types';
import { getItem, setItem, removeItem } from '../utils/storage';
import { SEED_SELLER } from '../data/seed';

const STORAGE_KEY = 'sell_auth';

interface AuthState {
  seller: Seller | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Seller>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  seller: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const stored = await getItem<Seller>(STORAGE_KEY);
    set({ seller: stored, isHydrated: true });
  },

  login: async (phone: string) => {
    set({ isLoading: true });
    // Simulate API call — seed with demo seller
    await new Promise((r) => setTimeout(r, 800));
    const seller: Seller = { ...SEED_SELLER, phone };
    await setItem(STORAGE_KEY, seller);
    set({ seller, isLoading: false });
  },

  logout: async () => {
    await removeItem(STORAGE_KEY);
    set({ seller: null });
  },

  updateProfile: async (updates) => {
    const current = get().seller;
    if (!current) return;
    const updated = { ...current, ...updates };
    await setItem(STORAGE_KEY, updated);
    set({ seller: updated });
  },
}));
