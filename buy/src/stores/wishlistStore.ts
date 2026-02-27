import { create } from 'zustand';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { useAuthStore } from './authStore';

function wishlistKey(): string | null {
  const userId = useAuthStore.getState().user?.id;
  return userId ? `${STORAGE_KEYS.WISHLIST}_${userId}` : null;
}

interface WishlistState {
  productIds: string[];
  isLoaded: boolean;
  /** Called once on app init / after login with the authenticated userId. */
  loadWishlist: (userId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: [],
  isLoaded: false,

  loadWishlist: async (userId) => {
    const key = `${STORAGE_KEYS.WISHLIST}_${userId}`;
    const ids = (await getItem<string[]>(key)) ?? [];
    set({ productIds: ids, isLoaded: true });
  },

  toggle: async (productId) => {
    const key = wishlistKey();
    if (!key) return;
    const { productIds } = get();
    const updated = productIds.includes(productId)
      ? productIds.filter(id => id !== productId)
      : [...productIds, productId];
    await setItem(key, updated);
    set({ productIds: updated });
  },

  isWishlisted: (productId) => get().productIds.includes(productId),
}));
