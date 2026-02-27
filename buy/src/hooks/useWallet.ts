import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletTransaction } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
const wk = (uid:string) => STORAGE_KEYS.WALLET_TXS+'_'+uid;
export const useWalletTransactions = (userId: string) => useQuery({
  queryKey: ['wallet', userId], enabled: !!userId, staleTime: 10000,
  queryFn: async () => (await getItem<WalletTransaction[]>(wk(userId)))??[],
});
export const useAddWalletTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<WalletTransaction,'id'|'createdAt'>) => {
      const ex = (await getItem<WalletTransaction[]>(wk(tx.userId)))??[];
      const nt: WalletTransaction = { ...tx, id:uuid(), createdAt:new Date().toISOString() };
      await setItem(wk(tx.userId), [nt,...ex]); return nt;
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey:['wallet',v.userId] }),
  });
};
