import { create } from 'zustand';
import { User } from '../types';
import { clearAuthToken, getItem, removeItem, saveAuthToken, saveUserId, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
interface AuthState {
  user: User|null; isLoading: boolean; isAuthenticated: boolean;
  login: (phone:string, name:string, email?:string) => Promise<void>;
  updateProfile: (p: Partial<Pick<User,'name'|'email'|'avatarUrl'>>) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: (userId:string) => Promise<void>;
  creditWallet: (amount:number) => Promise<void>;
  debitWallet: (amount:number) => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isLoading: false, isAuthenticated: false,
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
        user = { id: uuid(), phone, name, email, walletBalance: 500, createdAt: new Date().toISOString() };
        users.push(user);
        await setItem(STORAGE_KEYS.USERS, users);
      } else if (name) {
        user = { ...user, name, email: email ?? user.email };
        users = users.map(u => u.id === user!.id ? user! : u);
        await setItem(STORAGE_KEYS.USERS, users);
      }
      await saveAuthToken('sim_' + uuid());
      await saveUserId(user.id);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch(e) { set({ isLoading: false }); throw e; }
  },
  updateProfile: async (partial) => {
    const { user } = get(); if (!user) return;
    const updated = { ...user, ...partial };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },
  creditWallet: async (amount) => {
    const { user } = get(); if (!user) return;
    const updated = { ...user, walletBalance: user.walletBalance + amount };
    let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    users = users.map(u => u.id === user.id ? updated : u);
    await setItem(STORAGE_KEYS.USERS, users);
    set({ user: updated });
  },
  debitWallet: async (amount) => {
    const { user } = get(); if (!user) return;
    const updated = { ...user, walletBalance: Math.max(0, user.walletBalance - amount) };
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
