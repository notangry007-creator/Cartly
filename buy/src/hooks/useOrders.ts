import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderItem, OrderStatus, ReturnRequest } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { addDaysToDate } from '../utils/helpers';
import { scheduleOrderProgressNotifications, scheduleOrderNotification } from '../utils/pushNotifications';

const ok = (uid: string) => STORAGE_KEYS.ORDERS + '_' + uid;
const rk = (uid: string) => STORAGE_KEYS.RETURN_REQUESTS + '_' + uid;

// ─── Timer registry for cleanup ───────────────────────────────────────────────
// Maps orderId → array of timer IDs so we can cancel them on order cancellation
const orderTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

function registerTimer(orderId: string, timer: ReturnType<typeof setTimeout>) {
  const existing = orderTimers.get(orderId) ?? [];
  orderTimers.set(orderId, [...existing, timer]);
}

function clearOrderTimers(orderId: string) {
  const timers = orderTimers.get(orderId) ?? [];
  timers.forEach(t => clearTimeout(t));
  orderTimers.delete(orderId);
}

async function progressOrder(uid: string, oid: string, status: OrderStatus, note: string) {
  const orders = (await getItem<Order[]>(ok(uid))) ?? [];
  const updated = orders.map(o =>
    o.id !== oid ? o : {
      ...o,
      status,
      canReview: status === 'delivered',
      timeline: [...o.timeline, { status, timestamp: new Date().toISOString(), note }],
    }
  );
  await setItem(ok(uid), updated);
}

export const useOrders = (userId: string) => useQuery({
  queryKey: ['orders', userId], enabled: !!userId, staleTime: 10000,
  queryFn: async () => (await getItem<Order[]>(ok(userId))) ?? [],
});

export const useOrder = (userId: string, orderId: string) => useQuery({
  queryKey: ['order', userId, orderId], enabled: !!userId && !!orderId, staleTime: 5000,
  queryFn: async () => ((await getItem<Order[]>(ok(userId))) ?? []).find(o => o.id === orderId) ?? null,
});

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'createdAt' | 'timeline' | 'expectedDelivery' | 'canReview'>) => {
      const existing = (await getItem<Order[]>(ok(order.userId))) ?? [];
      const days = order.deliveryOption === 'same_day' ? 0 : order.deliveryOption === 'next_day' ? 1 : 4;
      const no: Order = {
        ...order,
        id: uuid(),
        createdAt: new Date().toISOString(),
        expectedDelivery: addDaysToDate(new Date(), days).toISOString(),
        canReview: false,
        timeline: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }],
      };
      await setItem(ok(order.userId), [no, ...existing]);

      // Simulate order progression — timers are tracked for cleanup
      const t1 = setTimeout(() => progressOrder(order.userId, no.id, 'confirmed', 'Confirmed by seller'), 8000);
      const t2 = setTimeout(() => progressOrder(order.userId, no.id, 'packed', 'Packed and ready for shipment'), 20000);
      registerTimer(no.id, t1);
      registerTimer(no.id, t2);

      // Schedule push notifications for the full order journey
      scheduleOrderProgressNotifications(no.id).catch(() => {});
      return no;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['orders', v.userId] }),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, orderId, status, note }: { userId: string; orderId: string; status: OrderStatus; note?: string }) => {
      await progressOrder(userId, orderId, status, note ?? status);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['order', v.userId, v.orderId] });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, orderId, reason }: { userId: string; orderId: string; reason?: string }) => {
      // Clear any pending progression timers for this order
      clearOrderTimers(orderId);
      await progressOrder(userId, orderId, 'cancelled', reason ? `Cancelled by buyer: ${reason}` : 'Cancelled by buyer');
      scheduleOrderNotification(orderId, 'cancelled', 0).catch(() => {});
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['order', v.userId, v.orderId] });
    },
  });
};

export const useCancelOrderItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, orderId, productId, variantId }: { userId: string; orderId: string; productId: string; variantId: string }) => {
      const orders = (await getItem<Order[]>(ok(userId))) ?? [];
      const updated = orders.map(o => {
        if (o.id !== orderId) return o;
        const remainingItems = o.items.filter(i => !(i.productId === productId && i.variantId === variantId));
        if (remainingItems.length === 0) {
          // All items cancelled — cancel the whole order
          clearOrderTimers(orderId);
          return {
            ...o,
            items: remainingItems,
            status: 'cancelled' as OrderStatus,
            timeline: [...o.timeline, { status: 'cancelled' as OrderStatus, timestamp: new Date().toISOString(), note: 'All items cancelled' }],
          };
        }
        // Recalculate subtotal
        const newSubtotal = remainingItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return {
          ...o,
          items: remainingItems,
          subtotal: newSubtotal,
          total: newSubtotal + o.shippingFee + o.codFee - o.discount,
          timeline: [...o.timeline, {
            status: o.status,
            timestamp: new Date().toISOString(),
            note: `Item cancelled: ${productId}`,
          }],
        };
      });
      await setItem(ok(userId), updated);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['order', v.userId, v.orderId] });
    },
  });
};

export const useChangeOrderAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, orderId, newAddress }: { userId: string; orderId: string; newAddress: Order['addressSnapshot'] }) => {
      const orders = (await getItem<Order[]>(ok(userId))) ?? [];
      const updated = orders.map(o => {
        if (o.id !== orderId) return o;
        if (!['pending', 'confirmed'].includes(o.status)) {
          throw new Error('Address can only be changed for pending or confirmed orders');
        }
        return {
          ...o,
          addressId: newAddress.id,
          addressSnapshot: newAddress,
          timeline: [...o.timeline, {
            status: o.status,
            timestamp: new Date().toISOString(),
            note: `Delivery address updated to: ${newAddress.label}`,
          }],
        };
      });
      await setItem(ok(userId), updated);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['order', v.userId, v.orderId] });
    },
  });
};

export const useCreateReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) => {
      const ex = (await getItem<ReturnRequest[]>(rk(req.userId))) ?? [];
      const nr: ReturnRequest = { ...req, id: uuid(), status: 'pending', createdAt: new Date().toISOString() };
      await setItem(rk(req.userId), [nr, ...ex]);
      await progressOrder(req.userId, req.orderId, 'return_requested', 'Return request submitted');
      return nr;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['returns', v.userId] });
    },
  });
};

export const useCancelReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, returnId, orderId }: { userId: string; returnId: string; orderId: string }) => {
      const returns = (await getItem<ReturnRequest[]>(rk(userId))) ?? [];
      const updated = returns.map(r =>
        r.id === returnId ? { ...r, status: 'rejected' as const } : r
      );
      await setItem(rk(userId), updated);
      // Revert order status back to delivered
      await progressOrder(userId, orderId, 'delivered', 'Return request cancelled by buyer');
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['returns', v.userId] });
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
    },
  });
};

export const useApproveReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, returnId, orderId }: { userId: string; returnId: string; orderId: string }) => {
      const returns = (await getItem<ReturnRequest[]>(rk(userId))) ?? [];
      const updated = returns.map(r =>
        r.id === returnId ? { ...r, status: 'approved' as const } : r
      );
      await setItem(rk(userId), updated);
      await progressOrder(userId, orderId, 'return_approved', 'Return approved — pickup scheduled');
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['returns', v.userId] });
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
    },
  });
};

/**
 * Process refund: marks return as refunded, credits wallet, updates order status.
 * Called when return is picked up.
 */
export const useProcessRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      returnId,
      orderId,
      refundAmount,
      creditWallet,
    }: {
      userId: string;
      returnId: string;
      orderId: string;
      refundAmount: number;
      creditWallet: (amount: number) => Promise<void>;
    }) => {
      // 1. Mark return as refunded
      const returns = (await getItem<ReturnRequest[]>(rk(userId))) ?? [];
      const updated = returns.map(r =>
        r.id === returnId ? { ...r, status: 'refunded' as const } : r
      );
      await setItem(rk(userId), updated);

      // 2. Credit wallet
      await creditWallet(refundAmount);

      // 3. Update order status
      await progressOrder(userId, orderId, 'refunded', `Refund of NPR ${refundAmount} credited to wallet`);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['returns', v.userId] });
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['wallet', v.userId] });
    },
  });
};

export const useReturns = (userId: string) => useQuery({
  queryKey: ['returns', userId], enabled: !!userId,
  queryFn: async () => (await getItem<ReturnRequest[]>(rk(userId))) ?? [],
});

export const useReturn = (userId: string, returnId: string) => useQuery({
  queryKey: ['return', userId, returnId], enabled: !!userId && !!returnId,
  queryFn: async () => {
    const all = (await getItem<ReturnRequest[]>(rk(userId))) ?? [];
    return all.find(r => r.id === returnId) ?? null;
  },
});
