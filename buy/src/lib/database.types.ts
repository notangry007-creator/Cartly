/**
 * Auto-generated Supabase database types for the Buy app.
 * Re-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          name: string;
          email: string | null;
          avatar_url: string | null;
          wallet_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          name: string;
          email?: string | null;
          avatar_url?: string | null;
          wallet_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string;
          email?: string | null;
          avatar_url?: string | null;
          wallet_balance?: number;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          province: string;
          district: string;
          municipality: string;
          ward: number;
          street: string | null;
          landmark: string;
          latitude: number;
          longitude: number;
          is_pickup_point_fallback: boolean;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          province: string;
          district: string;
          municipality: string;
          ward: number;
          street?: string | null;
          landmark: string;
          latitude: number;
          longitude: number;
          is_pickup_point_fallback?: boolean;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          label?: string;
          province?: string;
          district?: string;
          municipality?: string;
          ward?: number;
          street?: string | null;
          landmark?: string;
          latitude?: number;
          longitude?: number;
          is_pickup_point_fallback?: boolean;
          is_default?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          description: string;
          images: string[];
          category_id: string;
          subcategory_id: string | null;
          seller_id: string;
          brand: string | null;
          rating: number;
          total_reviews: number;
          is_authenticated: boolean;
          is_fast_delivery: boolean;
          cod_available_zones: string[];
          variants: Json;
          base_price: number;
          base_mrp: number;
          weight_kg: number;
          tags: string[];
          in_stock: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          images: string[];
          category_id: string;
          subcategory_id?: string | null;
          seller_id: string;
          brand?: string | null;
          rating?: number;
          total_reviews?: number;
          is_authenticated?: boolean;
          is_fast_delivery?: boolean;
          cod_available_zones?: string[];
          variants: Json;
          base_price: number;
          base_mrp: number;
          weight_kg?: number;
          tags?: string[];
          in_stock?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          images?: string[];
          category_id?: string;
          subcategory_id?: string | null;
          seller_id?: string;
          brand?: string | null;
          rating?: number;
          total_reviews?: number;
          is_authenticated?: boolean;
          is_fast_delivery?: boolean;
          cod_available_zones?: string[];
          variants?: Json;
          base_price?: number;
          base_mrp?: number;
          weight_kg?: number;
          tags?: string[];
          in_stock?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          items: Json;
          address_id: string;
          address_snapshot: Json;
          zone_id: string;
          delivery_option: string;
          payment_method: string;
          subtotal: number;
          shipping_fee: number;
          cod_fee: number;
          discount: number;
          coupon_code: string | null;
          total: number;
          status: string;
          timeline: Json;
          expected_delivery: string;
          can_review: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          items: Json;
          address_id: string;
          address_snapshot: Json;
          zone_id: string;
          delivery_option: string;
          payment_method: string;
          subtotal: number;
          shipping_fee: number;
          cod_fee: number;
          discount: number;
          coupon_code?: string | null;
          total: number;
          status?: string;
          timeline?: Json;
          expected_delivery: string;
          can_review?: boolean;
          created_at?: string;
        };
        Update: {
          status?: string;
          timeline?: Json;
          can_review?: boolean;
        };
      };
      return_requests: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          reason: string;
          description: string;
          photos: string[];
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          reason: string;
          description: string;
          photos?: string[];
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          reference_id: string | null;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          reference_id?: string | null;
          balance: number;
          created_at?: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          user_name: string;
          rating: number;
          comment: string;
          images: string[];
          order_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          user_name: string;
          rating: number;
          comment: string;
          images?: string[];
          order_id: string;
          created_at?: string;
        };
        Update: never;
      };
      sellers: {
        Row: {
          id: string;
          name: string;
          logo_url: string;
          is_verified: boolean;
          fulfillment_type: string;
          rating: number;
          total_reviews: number;
          phone: string;
          whatsapp: string;
          return_policy: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url: string;
          is_verified?: boolean;
          fulfillment_type?: string;
          rating?: number;
          total_reviews?: number;
          phone: string;
          whatsapp: string;
          return_policy: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          logo_url?: string;
          is_verified?: boolean;
          fulfillment_type?: string;
          rating?: number;
          total_reviews?: number;
          phone?: string;
          whatsapp?: string;
          return_policy?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon_name: string;
          image_url: string;
          parent_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon_name: string;
          image_url: string;
          parent_id?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          icon_name?: string;
          image_url?: string;
          parent_id?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
