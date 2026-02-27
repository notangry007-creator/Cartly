import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PRODUCTS, REVIEWS, SELLERS, CATEGORIES } from '../data/seed';
import { Review, ZoneId, DeliveryOption } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
const delay = (ms=300) => new Promise(r => setTimeout(r,ms));

export const useProducts = (filters?: {
  categoryId?:string; subcategoryId?:string; zoneId?:ZoneId; search?:string;
  isFastDelivery?:boolean; isAuthenticated?:boolean; inStock?:boolean;
  minPrice?:number; maxPrice?:number; minRating?:number; codAvailable?:boolean;
  deliverySpeed?:DeliveryOption; sortBy?:'relevance'|'price_asc'|'price_desc'|'rating'|'fastest';
}) => useQuery({
  queryKey: ['products', filters],
  queryFn: async () => {
    await delay();
    let p = [...PRODUCTS];
    if (filters?.categoryId) p = p.filter(x => x.categoryId===filters.categoryId);
    if (filters?.subcategoryId) p = p.filter(x => x.subcategoryId===filters.subcategoryId);
    if (filters?.search) { const q=filters.search.toLowerCase(); p = p.filter(x => x.title.toLowerCase().includes(q)||x.brand?.toLowerCase().includes(q)||x.tags.some(t=>t.includes(q))); }
    if (filters?.isFastDelivery) p = p.filter(x => x.isFastDelivery);
    if (filters?.isAuthenticated) p = p.filter(x => x.isAuthenticated);
    if (filters?.inStock) p = p.filter(x => x.inStock);
    if (filters?.minPrice!=null) p = p.filter(x => x.basePrice>=filters.minPrice!);
    if (filters?.maxPrice!=null) p = p.filter(x => x.basePrice<=filters.maxPrice!);
    if (filters?.minRating!=null) p = p.filter(x => x.rating>=filters.minRating!);
    if (filters?.codAvailable && filters.zoneId) p = p.filter(x => x.codAvailableZones.includes(filters.zoneId!));
    if (filters?.deliverySpeed==='same_day'||filters?.deliverySpeed==='next_day') p = p.filter(x => x.isFastDelivery);
    switch(filters?.sortBy) {
      case 'price_asc': p.sort((a,b)=>a.basePrice-b.basePrice); break;
      case 'price_desc': p.sort((a,b)=>b.basePrice-a.basePrice); break;
      case 'rating': p.sort((a,b)=>b.rating-a.rating); break;
      case 'fastest': p.sort((a,b)=>(b.isFastDelivery?1:0)-(a.isFastDelivery?1:0)); break;
    }
    return p;
  }, staleTime: 30000,
});

export const useProduct = (id: string) => useQuery({
  queryKey: ['product', id],
  queryFn: async () => { await delay(200); return PRODUCTS.find(p=>p.id===id)??null; },
  staleTime: 60000,
});

export const useSeller = (id: string) => useQuery({
  queryKey: ['seller', id],
  queryFn: async () => { await delay(100); return SELLERS.find(s=>s.id===id)??null; },
  staleTime: 300000, enabled: !!id,
});

export const useCategories = (parentId?: string) => useQuery({
  queryKey: ['categories', parentId],
  queryFn: async () => { await delay(100); return CATEGORIES.filter(c => parentId ? c.parentId===parentId : !c.parentId); },
  staleTime: 300000,
});

export const useReviews = (productId: string) => useQuery({
  queryKey: ['reviews', productId],
  queryFn: async () => {
    await delay(200);
    const local = (await getItem<Review[]>(STORAGE_KEYS.REVIEWS+'_'+productId))??[];
    const seed = REVIEWS.filter(r=>r.productId===productId);
    return [...local,...seed].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  }, staleTime: 30000,
});

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: Omit<Review,'id'|'createdAt'>) => {
      await delay(300);
      const key = STORAGE_KEYS.REVIEWS+'_'+review.productId;
      const ex = (await getItem<Review[]>(key))??[];
      const nr: Review = { ...review, id:uuid(), createdAt:new Date().toISOString() };
      await setItem(key, [nr,...ex]); return nr;
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey: ['reviews', v.productId] }),
  });
};
