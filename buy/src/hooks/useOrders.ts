import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus, ReturnRequest, CreateOrderInput } from '../types';
import { supabase } from '../lib/supabase';
import { addDaysToDate } from '../utils/helpers';
import { scheduleOrderProgressNotifications, scheduleOrderNotification } from '../utils/pushNotifications';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    items: row.items,
    addressId: row.address_id,
    addressSnapshot: row.address_snapshot,
    zoneId: row.zone_id,
    deliveryOption: row.delivery_option,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    codFee: row.cod_fee,
    discount: row.discount,
    couponCode: row.coupon_code ?? undefined,
    total: row.total,
    status: row.status,
    timeline: row.timeline,
    expectedDelivery: row.expected_delivery,
    canReview: row.can_review,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReturn(row: any): ReturnRequest {
  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    reason: row.reason,
    description: row.description,
    photos: row.photos ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export const useOrders = (userId: string) =>
  useQuery({
    queryKey: ['orders', userId],
    enabled: !!userId,
    staleTime: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToOrder);
    },
  });

export const useOrder = (userId: string, orderId: string) =>
  useQuery({
    queryKey: ['order', userId, orderId],
    enabled: !!userId && !!orderId,
    staleTime: 5_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();
      if (error) return null;
      return rowToOrder(data);
    },
  });

export const useReturns = (userId: string) =>
  useQuery({
    queryKey: ['returns', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToReturn);
    },
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: CreateOrderInput) => {
      const days =
        order.deliveryOption === 'same_day'
          ? 0
          : order.deliveryOption === 'next_day'
          ? 1
          : 4;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: order.userId,
          items: order.items,
          address_id: order.addressId,
          address_snapshot: order.addressSnapshot,
          zone_id: order.zoneId,
          delivery_option: order.deliveryOption,
          payment_method: order.paymentMethod,
          subtotal: order.subtotal,
          shipping_fee: order.shippingFee,
          cod_fee: order.codFee,
          discount: order.discount,
          coupon_code: order.couponCode ?? null,
          total: order.total,
          status: 'pending',
          timeline: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }],
          expected_delivery: addDaysToDate(new Date(), days).toISOString(),
          can_review: false,
        })
        .select()
        .single();

      if (error) throw error;
      const newOrder = rowToOrder(data);

      // Schedule push notifications
      scheduleOrderProgressNotifications(newOrder.id).catch(() => {});

      // Simulate order progression (dev/demo — replace with Supabase Edge Functions in production)
      if (__DEV__) {
        setTimeout(async () => {
          await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              timeline: [
                ...newOrder.timeline,
                { status: 'confirmed', timestamp: new Date().toISOString(), note: 'Confirmed by seller' },
              ],
            })
            .eq('id', newOrder.id);
          qc.invalidateQueries({ queryKey: ['orders', order.userId] });
        }, 8_000);
      }

      return newOrder;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['orders', v.userId] }),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      orderId,
      status,
      note,
    }: {
      userId: string;
      orderId: string;
      status: OrderStatus;
      note?: string;
    }) => {
      // Fetch current timeline first
      const { data: current } = await supabase
        .from('orders')
        .select('timeline, can_review')
        .eq('id', orderId)
        .single();

      const timeline = [
        ...(current?.timeline ?? []),
        { status, timestamp: new Date().toISOString(), note: note ?? status },
      ];

      const { error } = await supabase
        .from('orders')
        .update({ status, timeline, can_review: status === 'delivered' })
        .eq('id', orderId);

      if (error) throw error;
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
    mutationFn: async ({ userId, orderId }: { userId: string; orderId: string }) => {
      const { data: current } = await supabase
        .from('orders')
        .select('timeline')
        .eq('id', orderId)
        .single();

      const timeline = [
        ...(current?.timeline ?? []),
        { status: 'cancelled', timestamp: new Date().toISOString(), note: 'Cancelled by buyer' },
      ];

      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', timeline })
        .eq('id', orderId);

      if (error) throw error;
      scheduleOrderNotification(orderId, 'cancelled', 0).catch(() => {});
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
      const { data, error } = await supabase
        .from('return_requests')
        .insert({
          order_id: req.orderId,
          user_id: req.userId,
          reason: req.reason,
          description: req.description,
          photos: req.photos ?? [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update order status to return_requested
      const { data: order } = await supabase
        .from('orders')
        .select('timeline')
        .eq('id', req.orderId)
        .single();

      await supabase
        .from('orders')
        .update({
          status: 'return_requested',
          timeline: [
            ...(order?.timeline ?? []),
            {
              status: 'return_requested',
              timestamp: new Date().toISOString(),
              note: 'Return request submitted',
            },
          ],
        })
        .eq('id', req.orderId);

      return rowToReturn(data);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['orders', v.userId] });
      qc.invalidateQueries({ queryKey: ['returns', v.userId] });
    },
  });
};
