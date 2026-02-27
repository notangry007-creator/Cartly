import { create } from 'zustand';
import { Product, ProductFormData, ProductStatus } from '../types';
import { supabase } from '../lib/supabase';

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

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  const variants: Product['variants'] = Array.isArray(row.variants) ? row.variants : [];
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description,
    images: row.images ?? [],
    categoryId: row.category_id,
    tags: row.tags ?? [],
    variants,
    basePrice: row.base_price,
    baseMrp: row.base_mrp,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalSold: row.total_sold ?? 0,
    views: row.views ?? 0,
    rating: row.rating ?? 0,
    totalReviews: row.total_reviews ?? 0,
  };
}

/** Map a simple ProductFormData (flat price/sku/stock) to the canonical variants shape */
function buildVariants(data: ProductFormData, existingVariants?: Product['variants']) {
  if (existingVariants && existingVariants.length > 0) {
    return existingVariants.map((v, idx) =>
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
  }
  return [
    {
      id: 'v_default',
      label: 'Default',
      price: data.price,
      mrp: data.mrp ?? data.price,
      stock: data.stock,
      sku: data.sku,
    },
  ];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,

  // ── hydrate ───────────────────────────────────────────────────────────────
  hydrate: async () => {
    set({ isLoading: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ products: [], isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    set({ products: !error && data ? data.map(rowToProduct) : [], isLoading: false });
  },

  // ── addProduct ────────────────────────────────────────────────────────────
  addProduct: async (data, sellerId) => {
    const variants = buildVariants(data);
    const { data: row, error } = await supabase
      .from('products')
      .insert({
        seller_id: sellerId,
        title: data.title,
        description: data.description,
        images: data.images,
        category_id: data.categoryId,
        tags: data.tags,
        variants,
        base_price: data.price,
        base_mrp: data.mrp ?? data.price,
        in_stock: data.stock > 0,
        status: data.status,
        weight_kg: 0.5,
        cod_available_zones: [],
        is_authenticated: false,
        is_fast_delivery: false,
      })
      .select()
      .single();

    if (error) throw error;
    const product = rowToProduct(row);
    set({ products: [product, ...get().products] });
    return product;
  },

  // ── updateProduct ─────────────────────────────────────────────────────────
  updateProduct: async (id, data) => {
    const existing = get().products.find(p => p.id === id);
    if (!existing) return;

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.images !== undefined) updates.images = data.images;
    if (data.categoryId !== undefined) updates.category_id = data.categoryId;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.status !== undefined) updates.status = data.status;

    if (
      data.price !== undefined ||
      data.mrp !== undefined ||
      data.stock !== undefined ||
      data.sku !== undefined
    ) {
      const newVariants = buildVariants(data, existing.variants);
      updates.variants = newVariants;
      updates.base_price = data.price ?? existing.basePrice;
      updates.base_mrp = data.mrp ?? data.price ?? existing.baseMrp;
      if (data.stock !== undefined) updates.in_stock = data.stock > 0;
    }

    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;

    set({
      products: get().products.map(p =>
        p.id === id
          ? {
              ...p,
              ...Object.fromEntries(
                Object.entries({
                  title: data.title,
                  description: data.description,
                  images: data.images,
                  categoryId: data.categoryId,
                  tags: data.tags,
                  status: data.status,
                  basePrice: data.price,
                  baseMrp: data.mrp ?? data.price,
                }).filter(([, v]) => v !== undefined),
              ),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    });
  },

  // ── deleteProduct ─────────────────────────────────────────────────────────
  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    set({ products: get().products.filter(p => p.id !== id) });
  },

  // ── updateStatus ──────────────────────────────────────────────────────────
  updateStatus: async (id, status) => {
    const { error } = await supabase.from('products').update({ status }).eq('id', id);
    if (error) throw error;
    set({
      products: get().products.map(p =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p,
      ),
    });
  },

  // ── updateStock ───────────────────────────────────────────────────────────
  updateStock: async (id, stock) => {
    const p = get().products.find(x => x.id === id);
    if (!p) return;

    const newStatus: ProductStatus =
      stock === 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'active' : p.status;

    const newVariants = p.variants.map((v, idx) => (idx === 0 ? { ...v, stock } : v));

    const { error } = await supabase
      .from('products')
      .update({ variants: newVariants, status: newStatus, in_stock: stock > 0 })
      .eq('id', id);

    if (error) throw error;
    set({
      products: get().products.map(x =>
        x.id === id
          ? { ...x, variants: newVariants, status: newStatus, updatedAt: new Date().toISOString() }
          : x,
      ),
    });
  },
}));
