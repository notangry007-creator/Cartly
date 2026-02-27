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

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stock: number;
  category: string;
  tags: string[];
  images: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  totalSold: number;
  views: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stock: number;
  category: string;
  tags: string[];
  images: string[];
  status: ProductStatus;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
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
  paymentMethod: 'cash_on_delivery' | 'esewa' | 'khalti' | 'bank_transfer';
  isPaid: boolean;
  note?: string;
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
