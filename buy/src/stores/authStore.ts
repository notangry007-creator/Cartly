import { create } from 'zustand';
import { User, Address } from '../types';
import { supabase } from '../lib/supabase';
import { DEMO_ADDRESSES } from '../data/seed';

// ---------------------------------------------------------------------------
// Helper — map Supabase profile row → app User type
// ---------------------------------------------------------------------------
function rowToUser(row: {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  created_at: string;
}): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    walletBalance: row.wallet_balance,
    createdAt: row.created_at,
  };
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

  // ── loadUser ──────────────────────────────────────────────────────────────
  loadUser: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    set({ user: rowToUser(data), isAuthenticated: true });
  },

  // ── login ─────────────────────────────────────────────────────────────────
  // Uses Supabase Phone OTP auth. The OTP screen calls supabase.auth.verifyOtp()
  // before this; here we upsert the profile row and seed demo addresses.
  login: async (phone, name, email) => {
    set({ isLoading: true });
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) throw new Error('Not authenticated with Supabase');

      // Upsert profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            phone,
            name,
            email: email ?? null,
            wallet_balance: 500,
          },
          { onConflict: 'id', ignoreDuplicates: false },
        )
        .select()
        .single();

      if (profileError || !profile) throw profileError ?? new Error('Profile upsert failed');

      // Seed demo addresses for brand-new users
      const { count } = await supabase
        .from('addresses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUser.id);

      if ((count ?? 0) === 0) {
        const seeded: Address[] = DEMO_ADDRESSES.map((a, i) => ({
          ...a,
          id: crypto.randomUUID(),
          userId: authUser.id,
          isDefault: i === 0,
        }));
        await supabase.from('addresses').insert(
          seeded.map(a => ({
            id: a.id,
            user_id: a.userId,
            label: a.label,
            province: a.province,
            district: a.district,
            municipality: a.municipality,
            ward: a.ward,
            street: a.street ?? null,
            landmark: a.landmark,
            latitude: a.latitude,
            longitude: a.longitude,
            is_pickup_point_fallback: a.isPickupPointFallback,
            is_default: a.isDefault,
          })),
        );
      }

      set({ user: rowToUser(profile), isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  // ── updateProfile ─────────────────────────────────────────────────────────
  updateProfile: async (partial) => {
    const { user } = get();
    if (!user) return;

    const updates: Record<string, unknown> = {};
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.email !== undefined) updates.email = partial.email ?? null;
    if (partial.avatarUrl !== undefined) updates.avatar_url = partial.avatarUrl ?? null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) set({ user: rowToUser(data) });
  },

  // ── creditWallet ──────────────────────────────────────────────────────────
  creditWallet: async (amount) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({ wallet_balance: user.walletBalance + amount })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) set({ user: rowToUser(data) });
  },

  // ── debitWallet ───────────────────────────────────────────────────────────
  debitWallet: async (amount) => {
    const { user } = get();
    if (!user) return;

    const newBalance = Math.max(0, user.walletBalance - amount);
    const { data, error } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) set({ user: rowToUser(data) });
  },

  // ── logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
