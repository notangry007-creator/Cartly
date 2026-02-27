export type ZoneId = 'ktm_core' | 'ktm_outer' | 'major_city' | 'rest_nepal';
export type DeliveryOption = 'same_day' | 'next_day' | 'standard' | 'pickup';
export interface Zone { id: ZoneId; name: string; codAvailable: boolean; deliveryOptions: DeliveryOption[]; codFee: number; shippingBase: number; }
export interface User { id: string; phone: string; name: string; email?: string; avatarUrl?: string; walletBalance: number; loyaltyPoints: number; referralCode: string; createdAt: string; }
export interface Address { id: string; userId: string; label: string; province: string; district: string; municipality: string; ward: number; street?: string; landmark: string; latitude: number; longitude: number; isPickupPointFallback: boolean; isDefault: boolean; }
export interface Seller { id: string; name: string; logoUrl: string; isVerified: boolean; fulfillmentType: 'buy_fulfilled' | 'seller_fulfilled'; rating: number; totalReviews: number; phone: string; whatsapp: string; returnPolicy: string; }
export interface Category { id: string; name: string; slug: string; iconName: string; imageUrl: string; parentId?: string; }
export interface ProductVariant { id: string; label: string; attributes: Record<string,string>; price: number; mrp: number; stock: number; sku: string; }
export interface Product { id: string; title: string; description: string; images: string[]; categoryId: string; subcategoryId?: string; sellerId: string; brand?: string; rating: number; totalReviews: number; isAuthenticated: boolean; isFastDelivery: boolean; codAvailableZones: ZoneId[]; variants: ProductVariant[]; basePrice: number; baseMrp: number; weightKg: number; tags: string[]; inStock: boolean; createdAt: string; }
export interface Review { id: string; productId: string; userId: string; userName: string; rating: number; comment: string; images?: string[]; videoUri?: string; orderId: string; createdAt: string; }
export interface Banner { id: string; imageUrl: string; title: string; subtitle?: string; targetType: 'category' | 'product' | 'search'; targetId?: string; targetQuery?: string; }
export interface Coupon { id: string; code: string; type: 'percent' | 'flat'; value: number; minSpend: number; maxDiscount?: number; validZones?: ZoneId[]; validCategoryIds?: string[]; expiresAt: string; usageLimit: number; usedCount: number; }
export interface CartItem { productId: string; variantId: string; quantity: number; addedAt: string; }
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'return_approved' | 'return_picked' | 'refunded';
export interface OrderTimeline { status: OrderStatus; timestamp: string; note?: string; }
export interface OrderItem { productId: string; variantId: string; title: string; variantLabel: string; imageUrl: string; quantity: number; price: number; mrp: number; }
export type PaymentMethod = 'cod' | 'wallet';
export interface Order { id: string; userId: string; items: OrderItem[]; addressId: string; addressSnapshot: Address; zoneId: ZoneId; deliveryOption: DeliveryOption; scheduledDelivery?: ScheduledDeliverySlot; paymentMethod: PaymentMethod; subtotal: number; shippingFee: number; codFee: number; discount: number; couponCode?: string; loyaltyPointsUsed?: number; total: number; status: OrderStatus; timeline: OrderTimeline[]; createdAt: string; expectedDelivery: string; canReview: boolean; }
export type ReturnReason = 'wrong_item' | 'damaged' | 'not_as_described' | 'changed_mind' | 'other';
export interface ReturnRequest { id: string; orderId: string; userId: string; reason: ReturnReason; description: string; photos: string[]; status: 'pending' | 'approved' | 'rejected' | 'picked' | 'refunded'; createdAt: string; }
export type WalletTxType = 'credit' | 'debit';
export interface WalletTransaction { id: string; userId: string; type: WalletTxType; amount: number; description: string; referenceId?: string; balance: number; createdAt: string; }
export interface AppNotification { id: string; userId: string; title: string; body: string; type: 'order' | 'promo' | 'return' | 'wallet' | 'system' | 'price_drop' | 'loyalty'; referenceId?: string; read: boolean; createdAt: string; }

// ─── Flash Sales ──────────────────────────────────────────────────────────────
export interface FlashSale {
  id: string;
  title: string;
  subtitle: string;
  endsAt: string; // ISO timestamp
  productIds: string[];
  discountPercent: number;
  badgeColor: string;
}

// ─── Loyalty Points ───────────────────────────────────────────────────────────
export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  description: string;
  referenceId?: string;
  balance: number;
  createdAt: string;
}

// ─── Referral ─────────────────────────────────────────────────────────────────
export interface ReferralRecord {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  rewardCredited: boolean;
  createdAt: string;
}

// ─── Product Q&A ──────────────────────────────────────────────────────────────
export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  answeredBy?: string; // seller name or 'Buy Support'
  answeredAt?: string;
  createdAt: string;
  helpful: number;
}

// ─── Scheduled Delivery ───────────────────────────────────────────────────────
export interface DeliveryTimeSlot {
  id: string;
  label: string; // e.g. "9 AM – 12 PM"
  startHour: number;
  endHour: number;
}

export interface ScheduledDeliverySlot {
  date: string; // ISO date string (YYYY-MM-DD)
  slotId: string;
  slotLabel: string;
}

// ─── Pickup Points ────────────────────────────────────────────────────────────
export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openHours: string;
  phone: string;
  zoneId: ZoneId;
}

// ─── Price Drop Alert ─────────────────────────────────────────────────────────
export interface PriceDropAlert {
  productId: string;
  userId: string;
  targetPrice: number; // alert when price drops to or below this
  createdAt: string;
}

// ─── Analytics Events ─────────────────────────────────────────────────────────
export type AnalyticsEvent =
  | { name: 'product_view'; productId: string; categoryId: string }
  | { name: 'add_to_cart'; productId: string; variantId: string; price: number }
  | { name: 'checkout_start'; itemCount: number; subtotal: number }
  | { name: 'order_placed'; orderId: string; total: number; paymentMethod: PaymentMethod }
  | { name: 'search'; query: string; resultCount: number }
  | { name: 'wishlist_add'; productId: string }
  | { name: 'review_submit'; productId: string; rating: number }
  | { name: 'referral_share'; referralCode: string };
