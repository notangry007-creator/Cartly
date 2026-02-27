import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Review, ZoneId, DeliveryOption, Product, Seller, Category } from '../types';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    images: row.images ?? [],
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id ?? undefined,
    sellerId: row.seller_id,
    brand: row.brand ?? undefined,
    rating: row.rating,
    totalReviews: row.total_reviews,
    isAuthenticated: row.is_authenticated,
    isFastDelivery: row.is_fast_delivery,
    codAvailableZones: row.cod_available_zones ?? [],
    variants: row.variants ?? [],
    basePrice: row.base_price,
    baseMrp: row.base_mrp,
    weightKg: row.weight_kg,
    tags: row.tags ?? [],
    inStock: row.in_stock,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSeller(row: any): Seller {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    isVerified: row.is_verified,
    fulfillmentType: row.fulfillment_type,
    rating: row.rating,
    totalReviews: row.total_reviews,
    phone: row.phone,
    whatsapp: row.whatsapp,
    returnPolicy: row.return_policy,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    parentId: row.parent_id ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReview(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    images: row.images ?? [],
    orderId: row.order_id,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const useProducts = (filters?: {
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
}) => {
  const stableKey = useMemo(
    () => [
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filters?.categoryId,
      filters?.subcategoryId,
      filters?.zoneId,
      filters?.search,
      filters?.isFastDelivery,
      filters?.isAuthenticated,
      filters?.inStock,
      filters?.minPrice,
      filters?.maxPrice,
      filters?.minRating,
      filters?.codAvailable,
      filters?.deliverySpeed,
      filters?.sortBy,
    ],
  );

  return useQuery({
    queryKey: stableKey,
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase.from('products').select('*').eq('in_stock', true);

      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
      if (filters?.isFastDelivery) query = query.eq('is_fast_delivery', true);
      if (filters?.isAuthenticated) query = query.eq('is_authenticated', true);
      if (filters?.inStock !== false) query = query.eq('in_stock', true);
      if (filters?.minPrice != null) query = query.gte('base_price', filters.minPrice);
      if (filters?.maxPrice != null) query = query.lte('base_price', filters.maxPrice);
      if (filters?.minRating != null) query = query.gte('rating', filters.minRating);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

      // Sorting
      switch (filters?.sortBy) {
        case 'price_asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let products = (data ?? []).map(rowToProduct);

      // Client-side filters that Supabase can't easily handle
      if (filters?.codAvailable && filters.zoneId) {
        products = products.filter(p => p.codAvailableZones.includes(filters.zoneId!));
      }
      if (filters?.deliverySpeed === 'same_day' || filters?.deliverySpeed === 'next_day') {
        products = products.filter(p => p.isFastDelivery);
      }

      return products;
    },
  });
};

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return rowToProduct(data);
    },
  });

// ---------------------------------------------------------------------------
// Sellers
// ---------------------------------------------------------------------------
export const useSeller = (id: string) =>
  useQuery({
    queryKey: ['seller', id],
    enabled: !!id,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return rowToSeller(data);
    },
  });

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const useCategories = (parentId?: string) =>
  useQuery({
    queryKey: ['categories', parentId ?? 'root'],
    staleTime: 300_000,
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(rowToCategory);
    },
  });

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const useReviews = (productId: string) =>
  useQuery({
    queryKey: ['reviews', productId],
    enabled: !!productId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToReview);
    },
  });

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: review.productId,
          user_id: review.userId,
          user_name: review.userName,
          rating: review.rating,
          comment: review.comment,
          images: review.images ?? [],
          order_id: review.orderId,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToReview(data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['reviews', v.productId] }),
  });
};
