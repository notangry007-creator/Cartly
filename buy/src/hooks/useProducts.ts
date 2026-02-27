import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PRODUCTS, REVIEWS, SELLERS, CATEGORIES } from '../data/seed';
import { Review, ZoneId, DeliveryOption } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export const PAGE_SIZE = 20;

export interface ProductFilters {
  categoryId?: string;
  subcategoryId?: string;
  zoneId?: ZoneId;
  search?: string;
  isFastDelivery?: boolean;
  isAuthenticated?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  codAvailable?: boolean;
  deliverySpeed?: DeliveryOption;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'fastest';
  brand?: string;
  sellerId?: string;
  /** If true, only show products available in the given zoneId (codAvailableZones includes zoneId OR product ships to all zones) */
  zoneVisible?: boolean;
}

function applyFilters(filters?: ProductFilters) {
  let p = [...PRODUCTS];

  // Zone-based visibility: only show products that are available in the user's zone
  // A product is visible if it has the zone in codAvailableZones OR it's a standard-delivery product
  if (filters?.zoneVisible && filters.zoneId) {
    const zid = filters.zoneId;
    p = p.filter(x =>
      x.codAvailableZones.includes(zid) ||
      // Products available in rest_nepal are available everywhere
      x.codAvailableZones.includes('rest_nepal') ||
      // Products with no zone restriction (all zones) — inferred if codAvailableZones has all 4
      x.codAvailableZones.length === 4
    );
  }

  if (filters?.categoryId) p = p.filter(x => x.categoryId === filters.categoryId);
  if (filters?.subcategoryId) p = p.filter(x => x.subcategoryId === filters.subcategoryId);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    p = p.filter(x =>
      x.title.toLowerCase().includes(q) ||
      x.brand?.toLowerCase().includes(q) ||
      x.tags.some(t => t.includes(q)) ||
      x.description.toLowerCase().includes(q)
    );
  }
  if (filters?.isFastDelivery) p = p.filter(x => x.isFastDelivery);
  if (filters?.isAuthenticated) p = p.filter(x => x.isAuthenticated);
  if (filters?.inStock) p = p.filter(x => x.inStock);
  if (filters?.minPrice != null) p = p.filter(x => x.basePrice >= filters.minPrice!);
  if (filters?.maxPrice != null) p = p.filter(x => x.basePrice <= filters.maxPrice!);
  if (filters?.minRating != null) p = p.filter(x => x.rating >= filters.minRating!);
  if (filters?.codAvailable && filters.zoneId) p = p.filter(x => x.codAvailableZones.includes(filters.zoneId!));
  if (filters?.deliverySpeed === 'same_day' || filters?.deliverySpeed === 'next_day') p = p.filter(x => x.isFastDelivery);
  if (filters?.brand) p = p.filter(x => x.brand?.toLowerCase() === filters.brand!.toLowerCase());
  if (filters?.sellerId) p = p.filter(x => x.sellerId === filters.sellerId);

  switch (filters?.sortBy) {
    case 'price_asc': p.sort((a, b) => a.basePrice - b.basePrice); break;
    case 'price_desc': p.sort((a, b) => b.basePrice - a.basePrice); break;
    case 'rating': p.sort((a, b) => b.rating - a.rating); break;
    case 'fastest': p.sort((a, b) => (b.isFastDelivery ? 1 : 0) - (a.isFastDelivery ? 1 : 0)); break;
  }

  return p;
}

// ─── Standard (non-paginated) query — used for home sections, category screens ──
export const useProducts = (filters?: ProductFilters) => {
  const stableKey = useMemo(() => [
    'products',
    filters?.categoryId ?? null,
    filters?.subcategoryId ?? null,
    filters?.zoneId ?? null,
    filters?.search ?? null,
    filters?.isFastDelivery ?? null,
    filters?.isAuthenticated ?? null,
    filters?.inStock ?? null,
    filters?.minPrice ?? null,
    filters?.maxPrice ?? null,
    filters?.minRating ?? null,
    filters?.codAvailable ?? null,
    filters?.deliverySpeed ?? null,
    filters?.sortBy ?? null,
    filters?.brand ?? null,
    filters?.sellerId ?? null,
    filters?.zoneVisible ?? null,
  ], [
    filters?.categoryId, filters?.subcategoryId, filters?.zoneId, filters?.search,
    filters?.isFastDelivery, filters?.isAuthenticated, filters?.inStock,
    filters?.minPrice, filters?.maxPrice, filters?.minRating, filters?.codAvailable,
    filters?.deliverySpeed, filters?.sortBy, filters?.brand, filters?.sellerId,
    filters?.zoneVisible,
  ]);

  return useQuery({
    queryKey: stableKey,
    queryFn: async () => {
      await delay();
      return applyFilters(filters);
    },
    staleTime: 30000,
  });
};

// ─── Paginated (infinite scroll) query — used for search results, category grids ──
export const useInfiniteProducts = (filters?: ProductFilters) => {
  const stableKey = useMemo(() => [
    'products_infinite',
    filters?.categoryId ?? null,
    filters?.subcategoryId ?? null,
    filters?.zoneId ?? null,
    filters?.search ?? null,
    filters?.isFastDelivery ?? null,
    filters?.isAuthenticated ?? null,
    filters?.inStock ?? null,
    filters?.minPrice ?? null,
    filters?.maxPrice ?? null,
    filters?.minRating ?? null,
    filters?.codAvailable ?? null,
    filters?.deliverySpeed ?? null,
    filters?.sortBy ?? null,
    filters?.brand ?? null,
    filters?.sellerId ?? null,
    filters?.zoneVisible ?? null,
  ], [
    filters?.categoryId, filters?.subcategoryId, filters?.zoneId, filters?.search,
    filters?.isFastDelivery, filters?.isAuthenticated, filters?.inStock,
    filters?.minPrice, filters?.maxPrice, filters?.minRating, filters?.codAvailable,
    filters?.deliverySpeed, filters?.sortBy, filters?.brand, filters?.sellerId,
    filters?.zoneVisible,
  ]);

  return useInfiniteQuery({
    queryKey: stableKey,
    queryFn: async ({ pageParam = 0 }) => {
      await delay(200);
      const all = applyFilters(filters);
      const start = (pageParam as number) * PAGE_SIZE;
      const items = all.slice(start, start + PAGE_SIZE);
      return {
        items,
        nextPage: items.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: all.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30000,
  });
};

export const useProduct = (id: string) => useQuery({
  queryKey: ['product', id],
  queryFn: async () => { await delay(200); return PRODUCTS.find(p => p.id === id) ?? null; },
  staleTime: 60000,
});

export const useSeller = (id: string) => useQuery({
  queryKey: ['seller', id],
  queryFn: async () => { await delay(100); return SELLERS.find(s => s.id === id) ?? null; },
  staleTime: 300000, enabled: !!id,
});

export const useCategories = (parentId?: string) => useQuery({
  queryKey: ['categories', parentId],
  queryFn: async () => { await delay(100); return CATEGORIES.filter(c => parentId ? c.parentId === parentId : !c.parentId); },
  staleTime: 300000,
});

export const useReviews = (productId: string) => useQuery({
  queryKey: ['reviews', productId],
  queryFn: async () => {
    await delay(200);
    const local = (await getItem<Review[]>(STORAGE_KEYS.REVIEWS + '_' + productId)) ?? [];
    const seed = REVIEWS.filter(r => r.productId === productId);
    return [...local, ...seed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, staleTime: 30000,
});

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'createdAt'>) => {
      await delay(300);
      const key = STORAGE_KEYS.REVIEWS + '_' + review.productId;
      const ex = (await getItem<Review[]>(key)) ?? [];
      const nr: Review = { ...review, id: uuid(), createdAt: new Date().toISOString() };
      await setItem(key, [nr, ...ex]); return nr;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['reviews', v.productId] }),
  });
};

// ─── Notify Me (back in stock) ─────────────────────────────────────────────────
const NOTIFY_ME_STORAGE_KEY = 'buy_notify_me';

export interface NotifyMeEntry {
  productId: string;
  userId: string;
  createdAt: string;
}

export const useNotifyMe = (userId: string) => useQuery({
  queryKey: ['notify_me', userId],
  queryFn: async () => {
    const all = (await getItem<NotifyMeEntry[]>(NOTIFY_ME_STORAGE_KEY)) ?? [];
    return all.filter(e => e.userId === userId);
  },
  enabled: !!userId,
  staleTime: 30000,
});

export const useToggleNotifyMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, userId }: { productId: string; userId: string }) => {
      const all = (await getItem<NotifyMeEntry[]>(NOTIFY_ME_STORAGE_KEY)) ?? [];
      const existing = all.find(e => e.productId === productId && e.userId === userId);
      let updated: NotifyMeEntry[];
      if (existing) {
        updated = all.filter(e => !(e.productId === productId && e.userId === userId));
      } else {
        updated = [...all, { productId, userId, createdAt: new Date().toISOString() }];
      }
      await setItem(NOTIFY_ME_STORAGE_KEY, updated);
      return !existing; // returns true if now subscribed
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['notify_me', v.userId] }),
  });
};

export const useIsNotifyMe = (productId: string, userId: string) => useQuery({
  queryKey: ['notify_me_check', productId, userId],
  queryFn: async () => {
    const all = (await getItem<NotifyMeEntry[]>(NOTIFY_ME_STORAGE_KEY)) ?? [];
    return all.some(e => e.productId === productId && e.userId === userId);
  },
  enabled: !!userId && !!productId,
  staleTime: 10000,
});

// ─── Unique brands from products ──────────────────────────────────────────────
export function getAllBrands(): string[] {
  return [...new Set(PRODUCTS.map(p => p.brand).filter(Boolean) as string[])].sort();
}
