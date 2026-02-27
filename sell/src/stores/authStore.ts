import { create } from 'zustand';
import { Seller } from '../types';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Helper — map Supabase seller_profiles row → app Seller type
// ---------------------------------------------------------------------------
function rowToSeller(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  shop_name: string;
  shop_description: string;
  avatar_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  rating: number;
  total_sales: number;
  joined_at: string;
  address_street: string;
  address_city: string;
  address_district: string;
  address_province: string;
}): Seller {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    shopName: row.shop_name,
    shopDescription: row.shop_description,
    avatarUrl: row.avatar_url ?? undefined,
    bannerUrl: row.banner_url ?? undefined,
    isVerified: row.is_verified,
    rating: row.rating,
    totalSales: row.total_sales,
    joinedAt: row.joined_at,
    address: {
      street: row.address_street,
      city: row.address_city,
      district: row.address_district,
      province: row.address_province,
    },
  };
}

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

  // ── hydrate ───────────────────────────────────────────────────────────────
  hydrate: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      set({ seller: null, isHydrated: true });
      return;
    }

    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    set({ seller: !error && data ? rowToSeller(data) : null, isHydrated: true });
  },

  // ── login ─────────────────────────────────────────────────────────────────
  // Called after Supabase OTP verification succeeds.
  // Upserts the seller_profiles row and loads the seller into state.
  login: async (phone: string) => {
    set({ isLoading: true });
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) throw new Error('Not authenticated with Supabase');

      const e164 = '+977' + phone.replace(/^977/, '');

      const { data, error } = await supabase
        .from('seller_profiles')
        .upsert(
          {
            id: authUser.id,
            phone: e164,
            name: 'Seller',
            email: authUser.email ?? '',
            shop_name: 'My Shop',
            shop_description: '',
            is_verified: false,
            rating: 0,
            total_sales: 0,
            joined_at: new Date().toISOString(),
            address_street: '',
            address_city: '',
            address_district: '',
            address_province: '',
          },
          { onConflict: 'id', ignoreDuplicates: true },
        )
        .select()
        .single();

      if (error || !data) throw error ?? new Error('Profile upsert failed');
      set({ seller: rowToSeller(data), isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  // ── logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut();
    set({ seller: null });
  },

  // ── updateProfile ─────────────────────────────────────────────────────────
  updateProfile: async (updates) => {
    const { seller } = get();
    if (!seller) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl ?? null;
    if (updates.bannerUrl !== undefined) dbUpdates.banner_url = updates.bannerUrl ?? null;
    if (updates.shopName !== undefined) dbUpdates.shop_name = updates.shopName;
    if (updates.shopDescription !== undefined) dbUpdates.shop_description = updates.shopDescription;
    if (updates.address) {
      dbUpdates.address_street = updates.address.street;
      dbUpdates.address_city = updates.address.city;
      dbUpdates.address_district = updates.address.district;
      dbUpdates.address_province = updates.address.province;
    }

    const { data, error } = await supabase
      .from('seller_profiles')
      .update(dbUpdates)
      .eq('id', seller.id)
      .select()
      .single();

    if (!error && data) set({ seller: rowToSeller(data) });
  },
}));
