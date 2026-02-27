import { create } from 'zustand';
import { User, Address } from '../types';
import { clearAuthToken, getItem, removeItem, saveAuthToken, saveUserId, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { DEMO_ADDRESSES } from '../data/seed';

// Generate a short referral code from user ID
function generateReferralCode(userId: string): string {
  return 'BUY' + userId.slice(-6).toUpperCase();
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, name: string, email?: string) => Promise<void>;
  updateProfile: (p: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: (userId: string) => Promise<void>;
  creditWallet: (amount: number) => Promise<void>;
  debitWallet: (amount: number) => Promise<void>;
  addLoyaltyPoints: (points: number) => Promise<void>;
  redeemLoyaltyPoints: (points: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  loadUser: async (userId) => {
    const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    const user = users.find(u => u.id === userId) ?? null;
    set({ user, isAuthenticated: !!user });
  },

  login: async (phone, name, email) => {
    set({ isLoading: true });
    try {
      let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
      let user = users.find(u => u.phone === phone);
      if (!user) {
        const newId = uuid();
        user = {
          id: newId,
          phone,
          name,
          email,
          walletBalance: 500,
          loyaltyPoints: 0,
          referralCode: generateReferralCode(newId),
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        await setItem(STORAGE_KEYS.USERS, users);
        // Seed default addresses for new user
        const addrKey = `${STORAGE_KEYS.ADDRESSES}_${user.id}`;
        const existingAddrs = await getItem<Address[]>(addrKey);
        if (!existingAddrs || existingAddrs.length === 0) {
          const seeded: Address[] = DEMO_ADDRESSES.map((a, i) => ({
            ...a,
            id: uuid(),
            userId: user!.id,
            isDefault: i === 0,
          }));
          await setItem(addrKey, seeded);
        }
      } else if (name) {
        user = { ...user, name, email: email ?? user.email };
        // Ensure legacy users have loyaltyPoints and referralCode
        if (user.loyaltyPoints === undefined) user = { ...user, loyaltyPoints: 0 };
        if (!user.referralCode) user = { ...user, referralCode: generateReferralCode(user.id) };
        users = users.map(u => u.id === user!.id ? user! : u);
        await setItem(STORAGE_KEYS.USERS, users);
      }
      await saveAuthToken('sim_' + uuid());
      await saveUserId(user.id);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  updateProfile: async (partial) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...partial };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },

  creditWallet: async (amount) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, walletBalance: user.walletBalance + amount };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },

  debitWallet: async (amount) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, walletBalance: Math.max(0, user.walletBalance - amount) };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },

  addLoyaltyPoints: async (points) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, loyaltyPoints: (user.loyaltyPoints ?? 0) + points };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },

  redeemLoyaltyPoints: async (points) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, loyaltyPoints: Math.max(0, (user.loyaltyPoints ?? 0) - points) };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },

  logout: async () => {
    await clearAuthToken();
    set({ user: null, isAuthenticated: false });
  },
}));
