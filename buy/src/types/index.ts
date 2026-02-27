// ─── Delivery & Zone ──────────────────────────────────────────────────────────

/** The four delivery zone identifiers used throughout the app. */
export type ZoneId = 'ktm_core' | 'ktm_outer' | 'major_city' | 'rest_nepal';

/** Delivery speed options available to a buyer at checkout. */
export type DeliveryOption = 'same_day' | 'next_day' | 'standard' | 'pickup';

export interface Zone {
  id: ZoneId;
  name: string;
  codAvailable: boolean;
  deliveryOptions: DeliveryOption[];
  /** Extra fee charged for Cash on Delivery (NPR). */
  codFee: number;
  /** Base shipping price for this zone (NPR). */
  shippingBase: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  walletBalance: number;
  createdAt: string;
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  label: string;
  province: string;
  district: string;
  municipality: string;
  ward: number;
  street?: string;
  landmark: string;
  latitude: number;
  longitude: number;
  /** True when this address maps to a pickup point rather than a home address. */
  isPickupPointFallback: boolean;
  isDefault: boolean;
}

// ─── Seller ───────────────────────────────────────────────────────────────────

export interface Seller {
  id: string;
  name: string;
  logoUrl: string;
  isVerified: boolean;
  fulfillmentType: 'buy_fulfilled' | 'seller_fulfilled';
  rating: number;
  totalReviews: number;
  phone: string;
  whatsapp: string;
  returnPolicy: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  imageUrl: string;
  /** Omitted for top-level categories; present for subcategories. */
  parentId?: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  label: string;
  attributes: Record<string, string>;
  price: number;
  mrp: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  categoryId: string;
  subcategoryId?: string;
  sellerId: string;
  brand?: string;
  rating: number;
  totalReviews: number;
  /** True if the product has been authenticity-verified by Buy. */
  isAuthenticated: boolean;
  isFastDelivery: boolean;
  codAvailableZones: ZoneId[];
  variants: ProductVariant[];
  basePrice: number;
  baseMrp: number;
  weightKg: number;
  tags: string[];
  inStock: boolean;
  createdAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  orderId: string;
  createdAt: string;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  targetType: 'category' | 'product' | 'search';
  targetId?: string;
  targetQuery?: string;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minSpend: number;
  maxDiscount?: number;
  validZones?: ZoneId[];
  validCategoryIds?: string[];
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

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

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  variantLabel: string;
  imageUrl: string;
  quantity: number;
  price: number;
  mrp: number;
}

export type PaymentMethod = 'cod' | 'wallet';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  addressId: string;
  /** Snapshot of the address at time of order, preserved even if address is later edited. */
  addressSnapshot: Address;
  zoneId: ZoneId;
  deliveryOption: DeliveryOption;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  timeline: OrderTimeline[];
  createdAt: string;
  expectedDelivery: string;
  /** True once the order reaches 'delivered' — enables the review flow. */
  canReview: boolean;
}

/**
 * Input type for creating a new order.
 * Auto-generated fields (id, createdAt, timeline, expectedDelivery, canReview)
 * are omitted — the mutation computes them.
 */
export type CreateOrderInput = Omit<
  Order,
  'id' | 'createdAt' | 'timeline' | 'expectedDelivery' | 'canReview'
>;

// ─── Return ───────────────────────────────────────────────────────────────────

export type ReturnReason =
  | 'wrong_item'
  | 'damaged'
  | 'not_as_described'
  | 'changed_mind'
  | 'other';

export type ReturnRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'picked'
  | 'refunded';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: ReturnReason;
  description: string;
  photos: string[];
  status: ReturnRequestStatus;
  createdAt: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletTxType = 'credit' | 'debit';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: number;
  description: string;
  referenceId?: string;
  balance: number;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = 'order' | 'promo' | 'return' | 'wallet' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  referenceId?: string;
  read: boolean;
  createdAt: string;
}
