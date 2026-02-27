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

/** Map a simple ProductFormData (flat price/sku/stock) to the canonical Product shape */
function formDataToProduct(data: ProductFormData, id: string, sellerId: string): Product {
  const variantId = 'v_' + id;
  return {
    id,
    sellerId,
    title: data.title,
    description: data.description,
    images: data.images,
    categoryId: data.categoryId,
    tags: data.tags,
    variants: [{
      id: variantId,
      label: 'Default',
      price: data.price,
      mrp: data.mrp ?? data.price,
      stock: data.stock,
      sku: data.sku,
    }],
    basePrice: data.price,
    baseMrp: data.mrp ?? data.price,
    status: data.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalSold: 0,
    views: 0,
    rating: 0,
    totalReviews: 0,
  };
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
    const product = formDataToProduct(data, generateId(), sellerId);
    const products = [product, ...get().products];
    await setItem(STORAGE_KEY, products);
    set({ products });
    return product;
  },

  updateProduct: async (id, data) => {
    const products = get().products.map((p) => {
      if (p.id !== id) return p;
      const updated = { ...p, updatedAt: new Date().toISOString() };
      if (data.title !== undefined) updated.title = data.title;
      if (data.description !== undefined) updated.description = data.description;
      if (data.images !== undefined) updated.images = data.images;
      if (data.categoryId !== undefined) updated.categoryId = data.categoryId;
      if (data.tags !== undefined) updated.tags = data.tags;
      if (data.status !== undefined) updated.status = data.status;
      if (data.price !== undefined || data.mrp !== undefined || data.stock !== undefined || data.sku !== undefined) {
        updated.variants = p.variants.map((v, idx) =>
          idx === 0
            ? {
                ...v,
                price: data.price ?? v.price,
                mrp: data.mrp ?? data.price ?? v.mrp,
                stock: data.stock ?? v.stock,
                sku: data.sku ?? v.sku,
              }
            : v,
        );
        updated.basePrice = data.price ?? p.basePrice;
        updated.baseMrp = data.mrp ?? data.price ?? p.baseMrp;
      }
      return updated;
    });
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
        ? {
            ...p,
            variants: p.variants.map((v, idx) => (idx === 0 ? { ...v, stock } : v)),
            status: newStatus(p),
            updatedAt: new Date().toISOString(),
          }
        : p,
    );
    await setItem(STORAGE_KEY, products);
    set({ products });
  },
}));
