import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  hydrate: () => Promise<void>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Row mapper — maps the buy app's orders table to the sell app's Order type
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): Order {
  // items is a jsonb array of OrderItem from the buy app
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (row.items ?? []).map((item: any) => ({
    productId: item.productId,
    variantId: item.variantId,
    title: item.title,
    variantLabel: item.variantLabel,
    productImage: item.imageUrl ?? '',
    quantity: item.quantity,
    price: item.price,
    mrp: item.mrp,
  }));

  const snapshot = row.address_snapshot ?? {};

  return {
    id: row.id,
    buyerName: snapshot.label ?? 'Buyer',
    buyerPhone: '',
    buyerAddress: [
      snapshot.street,
      snapshot.municipality,
      snapshot.district,
      snapshot.province,
    ]
      .filter(Boolean)
      .join(', '),
    items,
    subtotal: row.subtotal,
    deliveryFee: row.shipping_fee,
    total: row.total,
    status: row.status,
    paymentMethod: row.payment_method,
    isPaid: row.payment_method === 'wallet',
    note: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,

  // ── hydrate ───────────────────────────────────────────────────────────────
  // Loads orders that contain products belonging to this seller.
  // Uses a Supabase RPC or a join — here we use a simple approach:
  // fetch all orders and filter client-side by seller's product IDs.
  hydrate: async () => {
    set({ isLoading: true });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ orders: [], isLoading: false });
      return;
    }

    // Get seller's product IDs
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    const productIds = new Set((products ?? []).map((p: { id: string }) => p.id));

    if (productIds.size === 0) {
      set({ orders: [], isLoading: false });
      return;
    }

    // Fetch all orders (RLS ensures only authenticated users can read their own,
    // but sellers need to see orders containing their products — this requires
    // a Supabase RPC or a service-role query in production.
    // For now we fetch recent orders and filter client-side.)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      set({ orders: [], isLoading: false });
      return;
    }

    // Filter to orders that contain at least one of this seller's products
    const sellerOrders = (data ?? []).filter((row: { items: Array<{ productId: string }> }) =>
      (row.items ?? []).some((item: { productId: string }) => productIds.has(item.productId)),
    );

    set({ orders: sellerOrders.map(rowToOrder), isLoading: false });
  },

  // ── updateStatus ──────────────────────────────────────────────────────────
  updateStatus: async (id, status) => {
    // Fetch current timeline
    const { data: current } = await supabase
      .from('orders')
      .select('timeline')
      .eq('id', id)
      .single();

    const timeline = [
      ...(current?.timeline ?? []),
      { status, timestamp: new Date().toISOString(), note: `Status updated to ${status}` },
    ];

    const { error } = await supabase
      .from('orders')
      .update({ status, timeline })
      .eq('id', id);

    if (error) throw error;

    set({
      orders: get().orders.map(o =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
      ),
    });
  },
}));
