import { create } from 'zustand';
import { Product, ProductFormData, ProductStatus } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_PRODUCTS } from '../data/seed';

const STORAGE_KEY = 'sell_products';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  addProduct: (data: ProductFormData, sellerId: string) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ProductStatus) => Promise<void>;
  updateStock: (id: string, stock: number) => Promise<void>;
}

function generateId(): string {
  return 'prod_' + Date.now().toString(36);
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,

  hydrate: async () => {
    const stored = await getItem<Product[]>(STORAGE_KEY);
    set({ products: stored ?? SEED_PRODUCTS });
    if (!stored) await setItem(STORAGE_KEY, SEED_PRODUCTS);
  },

  addProduct: async (data, sellerId) => {
    const product: Product = {
      id: generateId(),
      sellerId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSold: 0,
      views: 0,
    };
    const products = [product, ...get().products];
    await setItem(STORAGE_KEY, products);
    set({ products });
    return product;
  },

  updateProduct: async (id, updates) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
    );
    await setItem(STORAGE_KEY, products);
    set({ products });
  },

  deleteProduct: async (id) => {
    const products = get().products.filter((p) => p.id !== id);
    await setItem(STORAGE_KEY, products);
    set({ products });
  },

  updateStatus: async (id, status) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p,
    );
    await setItem(STORAGE_KEY, products);
    set({ products });
  },

  updateStock: async (id, stock) => {
    const newStatus = (p: Product): ProductStatus => {
      if (stock === 0) return 'out_of_stock';
      if (p.status === 'out_of_stock') return 'active';
      return p.status;
    };
    const products = get().products.map((p) =>
      p.id === id
        ? { ...p, stock, status: newStatus(p), updatedAt: new Date().toISOString() }
        : p,
    );
    await setItem(STORAGE_KEY, products);
    set({ products });
  },
}));
