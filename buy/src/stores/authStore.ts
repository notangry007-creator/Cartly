import { create } from 'zustand';
import { User, Address } from '../types';
import {
  clearAuthToken,
  getItem,
  saveAuthToken,
  saveUserId,
  setItem,
  STORAGE_KEYS,
} from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { DEMO_ADDRESSES } from '../data/seed';

// ---------------------------------------------------------------------------
// Serialisation queue — prevents interleaved read-modify-write on the shared
// USERS array.  All mutations that touch the array are chained through this
// promise so they always see the latest committed state.
// ---------------------------------------------------------------------------
let _usersMutex: Promise<void> = Promise.resolve();

function enqueueUsersMutation(fn: () => Promise<void>): Promise<void> {
  const next = _usersMutex.then(fn);
  // Swallow errors on the chain so a failed mutation doesn't block the queue.
  _usersMutex = next.catch(() => {});
  return next;
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
      let finalUser: User | null = null;

      await enqueueUsersMutation(async () => {
        let users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
        let user = users.find(u => u.phone === phone);

        if (!user) {
          user = {
            id: uuid(),
            phone,
            name,
            email,
            walletBalance: 500,
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
          users = users.map(u => (u.id === user!.id ? user! : u));
          await setItem(STORAGE_KEYS.USERS, users);
        }

        finalUser = user;
      });

      if (!finalUser) throw new Error('Login failed');
      await saveAuthToken('sim_' + uuid());
      await saveUserId((finalUser as User).id);
      set({ user: finalUser, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  updateProfile: async (partial) => {
    const { user } = get();
    if (!user) return;

    await enqueueUsersMutation(async () => {
      // Re-read the latest users array inside the queue to avoid overwriting
      // concurrent changes made by creditWallet / debitWallet.
      const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
      const current = users.find(u => u.id === user.id);
      if (!current) return;
      const updated: User = { ...current, ...partial };
      await setItem(
        STORAGE_KEYS.USERS,
        users.map(u => (u.id === user.id ? updated : u)),
      );
      set({ user: updated });
    });
  },

  creditWallet: async (amount) => {
    const { user } = get();
    if (!user) return;

    await enqueueUsersMutation(async () => {
      const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
      const current = users.find(u => u.id === user.id);
      if (!current) return;
      const updated: User = { ...current, walletBalance: current.walletBalance + amount };
      await setItem(
        STORAGE_KEYS.USERS,
        users.map(u => (u.id === user.id ? updated : u)),
      );
      set({ user: updated });
    });
  },

  debitWallet: async (amount) => {
    const { user } = get();
    if (!user) return;

    await enqueueUsersMutation(async () => {
      const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
      const current = users.find(u => u.id === user.id);
      if (!current) return;
      const updated: User = {
        ...current,
        walletBalance: Math.max(0, current.walletBalance - amount),
      };
      await setItem(
        STORAGE_KEYS.USERS,
        users.map(u => (u.id === user.id ? updated : u)),
      );
      set({ user: updated });
    });
  },

  logout: async () => {
    await clearAuthToken();
    set({ user: null, isAuthenticated: false });
  },
}));
