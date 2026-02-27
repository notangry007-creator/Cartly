import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus, ReturnRequest, CreateOrderInput } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { addDaysToDate } from '../utils/helpers';
import { scheduleOrderProgressNotifications, scheduleOrderNotification } from '../utils/pushNotifications';

// Typed augmentation for the global timer registry used by the order simulation.
declare global {
  // eslint-disable-next-line no-var
  var __buyOrderTimers: ReturnType<typeof setTimeout>[] | undefined;
}
const ok = (uid:string) => STORAGE_KEYS.ORDERS+'_'+uid;
const rk = (uid:string) => STORAGE_KEYS.RETURN_REQUESTS+'_'+uid;
async function progressOrder(uid:string, oid:string, status:OrderStatus, note:string) {
  const orders = (await getItem<Order[]>(ok(uid)))??[];
  const updated = orders.map(o => o.id!==oid?o:{...o,status,canReview:status==='delivered',timeline:[...o.timeline,{status,timestamp:new Date().toISOString(),note}]});
  await setItem(ok(uid), updated);
}
export const useOrders = (userId: string) => useQuery({
  queryKey: ['orders', userId], enabled: !!userId, staleTime: 10000,
  queryFn: async () => (await getItem<Order[]>(ok(userId)))??[],
});
export const useOrder = (userId: string, orderId: string) => useQuery({
  queryKey: ['order', userId, orderId], enabled: !!userId&&!!orderId, staleTime: 5000,
  queryFn: async () => ((await getItem<Order[]>(ok(userId)))??[]).find(o=>o.id===orderId)??null,
});
export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: CreateOrderInput) => {
      const existing = (await getItem<Order[]>(ok(order.userId)))??[];
      const days = order.deliveryOption==='same_day'?0:order.deliveryOption==='next_day'?1:4;
      const no: Order = { ...order, id:uuid(), createdAt:new Date().toISOString(), expectedDelivery:addDaysToDate(new Date(),days).toISOString(), canReview:false, timeline:[{status:'pending',timestamp:new Date().toISOString(),note:'Order placed'}] };
      await setItem(ok(order.userId), [no,...existing]);
      // Simulate order progression (dev/demo only; replace with webhooks in production)
      const t1 = setTimeout(() => progressOrder(order.userId, no.id, 'confirmed', 'Confirmed by seller'), 8000);
      const t2 = setTimeout(() => progressOrder(order.userId, no.id, 'packed', 'Packed and ready for shipment'), 20000);
      // Register for potential cleanup (best-effort in non-component context)
      globalThis.__buyOrderTimers = [...(globalThis.__buyOrderTimers ?? []), t1, t2];
      // Schedule push notifications for the full order journey
      scheduleOrderProgressNotifications(no.id).catch(() => {});
      return no;
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey:['orders',v.userId] }),
  });
};
export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({userId,orderId,status,note}:{userId:string;orderId:string;status:OrderStatus;note?:string}) => {
      await progressOrder(userId,orderId,status,note??status);
    },
    onSuccess: (_,v) => { qc.invalidateQueries({queryKey:['orders',v.userId]}); qc.invalidateQueries({queryKey:['order',v.userId,v.orderId]}); },
  });
};
export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({userId,orderId}:{userId:string;orderId:string}) => {
      await progressOrder(userId,orderId,'cancelled','Cancelled by buyer');
      scheduleOrderNotification(orderId, 'cancelled', 0).catch(() => {});
    },
    onSuccess: (_,v) => { qc.invalidateQueries({queryKey:['orders',v.userId]}); qc.invalidateQueries({queryKey:['order',v.userId,v.orderId]}); },
  });
};
export const useCreateReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: Omit<ReturnRequest,'id'|'createdAt'|'status'>) => {
      const ex = (await getItem<ReturnRequest[]>(rk(req.userId)))??[];
      const nr: ReturnRequest = { ...req, id:uuid(), status:'pending', createdAt:new Date().toISOString() };
      await setItem(rk(req.userId), [nr,...ex]);
      await progressOrder(req.userId, req.orderId, 'return_requested', 'Return request submitted');
      return nr;
    },
    onSuccess: (_,v) => { qc.invalidateQueries({queryKey:['orders',v.userId]}); qc.invalidateQueries({queryKey:['returns',v.userId]}); },
  });
};
export const useReturns = (userId: string) => useQuery({
  queryKey: ['returns', userId], enabled: !!userId,
  queryFn: async () => (await getItem<ReturnRequest[]>(rk(userId)))??[],
});
