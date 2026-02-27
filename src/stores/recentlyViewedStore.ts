import { create } from 'zustand';
import { Product } from '../types';
import { getItem, setItem } from '../utils/storage';

const RV_KEY = 'buy_recently_viewed';
const MAX_ITEMS = 20;

interface RecentlyViewedState {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  loadProducts: () => Promise<void>;
  clear: () => Promise<void>;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  products: [],

  loadProducts: async () => {
    const saved = (await getItem<Product[]>(RV_KEY)) ?? [];
    set({ products: saved });
  },

  addProduct: async (product: Product) => {
    const { products } = get();
    const filtered = products.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    await setItem(RV_KEY, updated);
    set({ products: updated });
  },

  clear: async () => {
    await setItem(RV_KEY, []);
    set({ products: [] });
  },
}));
