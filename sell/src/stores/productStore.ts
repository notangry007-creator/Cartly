import { create } from 'zustand';
import { Product, ProductFormData, ProductStatus } from '../types';
import { getItem, setItem } from '../utils/storage';
import { SEED_PRODUCTS } from '../data/seed';
import { notifyLowStock } from '../utils/pushNotifications';

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
  bulkUpdateStock: (updates: { id: string; stock: number }[]) => Promise<void>;
  incrementViews: (id: string) => void;
  updateLowStockThreshold: (id: string, threshold: number) => Promise<void>;
}

function generateId(): string {
  return 'prod_' + Date.now().toString(36);
}

/** Map ProductFormData to the canonical Product shape, supporting multi-variants */
function formDataToProduct(data: ProductFormData, id: string, sellerId: string): Product {
  const extraVariants = data.variants ?? [];
  const allVariants = extraVariants.length > 0
    ? extraVariants.map((v, i) => ({
        id: `v_${id}_${i}`,
        label: v.label || 'Default',
        price: v.price,
        mrp: v.mrp ?? v.price,
        stock: v.stock,
        sku: v.sku,
      }))
    : [{
        id: 'v_' + id,
        label: 'Default',
        price: data.price,
        mrp: data.mrp ?? data.price,
        stock: data.stock,
        sku: data.sku,
      }];

  const basePrice = Math.min(...allVariants.map(v => v.price));
  const baseMrp = Math.min(...allVariants.map(v => v.mrp));

  return {
    id,
    sellerId,
    title: data.title,
    description: data.description,
    images: data.images,
    categoryId: data.categoryId,
    tags: data.tags,
    variants: allVariants,
    basePrice,
    baseMrp,
    status: data.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalSold: 0,
    views: 0,
    rating: 0,
    totalReviews: 0,
    lowStockThreshold: 10, // default
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
    // Fire low stock notification if threshold crossed
    const product = get().products.find(p => p.id === id);
    if (product && stock > 0 && stock <= (product.lowStockThreshold ?? 10)) {
      notifyLowStock(product.title, stock).catch(() => {});
    }
  },

  bulkUpdateStock: async (updates) => {
    const updateMap = new Map(updates.map(u => [u.id, u.stock]));
    const products = get().products.map((p) => {
      const newStock = updateMap.get(p.id);
      if (newStock === undefined) return p;
      const status: ProductStatus = newStock === 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'active' : p.status;
      return {
        ...p,
        variants: p.variants.map((v, idx) => (idx === 0 ? { ...v, stock: newStock } : v)),
        status,
        updatedAt: new Date().toISOString(),
      };
    });
    await setItem(STORAGE_KEY, products);
    set({ products });
  },

  incrementViews: (id) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, views: p.views + 1 } : p,
    );
    set({ products });
  },

  updateLowStockThreshold: async (id, threshold) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, lowStockThreshold: threshold, updatedAt: new Date().toISOString() } : p,
    );
    await setItem(STORAGE_KEY, products);
    set({ products });
  },
}));
