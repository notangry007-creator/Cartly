import { create } from 'zustand';
import { CartItem } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { useAuthStore } from './authStore';

// Returns the AsyncStorage key for the active user's cart.
// Returns null if no user is logged in (actions become no-ops).
function cartKey(): string | null {
  const userId = useAuthStore.getState().user?.id;
  return userId ? `${STORAGE_KEYS.CART}_${userId}` : null;
}

interface CartState {
  items: CartItem[];
  isLoaded: boolean;
  /** Called once on app init / after login with the authenticated userId. */
  loadCart: (userId: string) => Promise<void>;
  addItem: (productId: string, variantId: string, qty?: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoaded: false,

  loadCart: async (userId) => {
    const key = `${STORAGE_KEYS.CART}_${userId}`;
    const items = (await getItem<CartItem[]>(key)) ?? [];
    set({ items, isLoaded: true });
  },

  addItem: async (productId, variantId, qty = 1) => {
    const key = cartKey();
    if (!key) return;
    const { items } = get();
    const existing = items.find(i => i.productId === productId && i.variantId === variantId);
    const updated = existing
      ? items.map(i =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: i.quantity + qty }
            : i,
        )
      : [...items, { productId, variantId, quantity: qty, addedAt: new Date().toISOString() }];
    await setItem(key, updated);
    set({ items: updated });
  },

  removeItem: async (productId, variantId) => {
    const key = cartKey();
    if (!key) return;
    const updated = get().items.filter(
      i => !(i.productId === productId && i.variantId === variantId),
    );
    await setItem(key, updated);
    set({ items: updated });
  },

  updateQuantity: async (productId, variantId, qty) => {
    const key = cartKey();
    if (!key) return;
    const updated =
      qty <= 0
        ? get().items.filter(i => !(i.productId === productId && i.variantId === variantId))
        : get().items.map(i =>
            i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i,
          );
    await setItem(key, updated);
    set({ items: updated });
  },

  clearCart: async () => {
    const key = cartKey();
    if (!key) return;
    await setItem(key, []);
    set({ items: [] });
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
