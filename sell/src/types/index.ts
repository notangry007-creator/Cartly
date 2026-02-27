// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopDescription: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  rating: number;
  totalSales: number;
  joinedAt: string;
  address: SellerAddress;
}

export interface SellerAddress {
  street: string;
  city: string;
  district: string;
  province: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'draft';

export interface ProductVariant {
  id: string;
  label: string;       // e.g. "Red / XL"
  price: number;       // selling price (NPR)
  mrp: number;         // compare-at / MRP price
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  sellerId: string;
  /** Display title shown to buyers. Matches buy/Product.title */
  title: string;
  description: string;
  images: string[];
  /** FK to a Category id. Matches buy/Product.categoryId */
  categoryId: string;
  tags: string[];
  /** Variants (size, colour, etc.). At least one required. Matches buy/Product.variants */
  variants: ProductVariant[];
  /** Convenience field: lowest variant price */
  basePrice: number;
  /** Convenience field: lowest variant MRP */
  baseMrp: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  totalSold: number;
  views: number;
  rating: number;
  totalReviews: number;
  /** Low stock alert threshold — notify when stock falls at or below this value. Default: 10 */
  lowStockThreshold: number;
}

export interface VariantFormData {
  label: string;   // e.g. "Red / XL"
  price: number;
  mrp?: number;
  stock: number;
  sku: string;
}

export interface ProductFormData {
  title: string;
  description: string;
  /** Simple price (NPR) — maps to a single default variant on save */
  price: number;
  /** Compare-at / MRP — maps to variant.mrp */
  mrp?: number;
  sku: string;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  status: ProductStatus;
  /** Optional additional variants beyond the default */
  variants?: VariantFormData[];
}

// ─── Coupon ──────────────────────────────────────────────────────────────────

export type CouponType = 'percent' | 'flat';

export interface SellerCoupon {
  id: string;
  sellerId: string;
  code: string;
  type: CouponType;
  value: number;
  minSpend: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

/**
 * Canonical order status shared between buy and sell apps.
 * Matches buy/src/types/index.ts OrderStatus exactly.
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_picked'
  | 'refunded';

/**
 * Payment methods shared between buy and sell.
 * 'cod' = cash on delivery (matches buy/PaymentMethod)
 * 'wallet' = in-app wallet (matches buy/PaymentMethod)
 * 'esewa' | 'khalti' | 'bank_transfer' = seller-side payout methods
 */
export type PaymentMethod = 'cod' | 'wallet' | 'esewa' | 'khalti' | 'bank_transfer';

export interface OrderItem {
  productId: string;
  variantId: string;
  /** Snapshot of product title at time of order */
  title: string;
  variantLabel: string;
  productImage: string;
  quantity: number;
  price: number;
  mrp: number;
}

export interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  note?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DailyStat {
  date: string;
  revenue: number;
  orders: number;
  views: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  revenueChange: number; // percentage vs last period
  ordersChange: number;
  dailyStats: DailyStat[];
  topProducts: TopProduct[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  productImage: string;
  totalSold: number;
  revenue: number;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType = 'new_order' | 'order_update' | 'low_stock' | 'review' | 'payout';

export interface SellerNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

// ─── Payout ──────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  method: string;
  accountDetails: string;
  requestedAt: string;
  completedAt?: string;
}
