import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoyaltyTransaction } from '../types';
import { getItem, setItem } from '../utils/storage';
import { v4 as uuid } from 'uuid';

const lk = (uid: string) => 'buy_loyalty_' + uid;

// Points earned per NPR spent (1 point per NPR 10)
export const POINTS_PER_NPR = 0.1;
// Points value: 1 point = NPR 0.5
export const NPR_PER_POINT = 0.5;
// Minimum points to redeem
export const MIN_REDEEM_POINTS = 100;
// Maximum % of order total that can be paid with points
export const MAX_POINTS_REDEEM_PERCENT = 0.2;

export function calculatePointsEarned(orderTotal: number): number {
  return Math.floor(orderTotal * POINTS_PER_NPR);
}

export function pointsToNPR(points: number): number {
  return points * NPR_PER_POINT;
}

export function nprToPoints(npr: number): number {
  return Math.ceil(npr / NPR_PER_POINT);
}

export const useLoyaltyTransactions = (userId: string) => useQuery({
  queryKey: ['loyalty', userId],
  enabled: !!userId,
  staleTime: 10000,
  queryFn: async () => (await getItem<LoyaltyTransaction[]>(lk(userId))) ?? [],
});

export const useAddLoyaltyTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<LoyaltyTransaction, 'id' | 'createdAt'>) => {
      const ex = (await getItem<LoyaltyTransaction[]>(lk(tx.userId))) ?? [];
      const nt: LoyaltyTransaction = { ...tx, id: uuid(), createdAt: new Date().toISOString() };
      await setItem(lk(tx.userId), [nt, ...ex]);
      return nt;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['loyalty', v.userId] }),
  });
};
