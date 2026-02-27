import { create } from 'zustand';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';

interface WishlistState {
  productIds: string[];
  isLoaded: boolean;
  loadWishlist: (userId: string) => Promise<void>;
  toggle: (userId: string, productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const wk = (uid: string) => STORAGE_KEYS.WISHLIST + '_' + uid;

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: [],
  isLoaded: false,

  loadWishlist: async (userId) => {
    const ids = (await getItem<string[]>(wk(userId))) ?? [];
    set({ productIds: ids, isLoaded: true });
  },

  toggle: async (userId, productId) => {
    const { productIds } = get();
    const updated = productIds.includes(productId)
      ? productIds.filter(id => id !== productId)
      : [...productIds, productId];
    await setItem(wk(userId), updated);
    set({ productIds: updated });
  },

  isWishlisted: (productId) => get().productIds.includes(productId),
}));
