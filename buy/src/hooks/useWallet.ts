import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletTransaction } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';

const wk = (uid: string) => STORAGE_KEYS.WALLET_TXS + '_' + uid;

export const useWalletTransactions = (userId: string) => useQuery({
  queryKey: ['wallet', userId], enabled: !!userId, staleTime: 10000,
  queryFn: async () => (await getItem<WalletTransaction[]>(wk(userId))) ?? [],
});

export const useAddWalletTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
      const ex = (await getItem<WalletTransaction[]>(wk(tx.userId))) ?? [];
      const nt: WalletTransaction = { ...tx, id: uuid(), createdAt: new Date().toISOString() };
      await setItem(wk(tx.userId), [nt, ...ex]);
      return nt;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['wallet', v.userId] }),
  });
};

export interface WithdrawRequest {
  userId: string;
  amount: number;
  method: 'esewa' | 'khalti' | 'bank';
  accountDetails: string;
  currentBalance: number;
  debitWallet: (amount: number) => Promise<void>;
}

export const useWithdrawWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      method,
      accountDetails,
      currentBalance,
      debitWallet,
    }: WithdrawRequest) => {
      if (amount > currentBalance) {
        throw new Error('Insufficient wallet balance');
      }
      if (amount < 100) {
        throw new Error('Minimum withdrawal amount is NPR 100');
      }
      if (amount > 10000) {
        throw new Error('Maximum single withdrawal is NPR 10,000');
      }

      // Simulate processing delay
      await new Promise(r => setTimeout(r, 1500));

      // Debit wallet
      await debitWallet(amount);

      // Record transaction — use fresh balance from debitWallet
      const ex = (await getItem<WalletTransaction[]>(wk(userId))) ?? [];
      const newBalance = currentBalance - amount;
      const nt: WalletTransaction = {
        id: uuid(),
        userId,
        type: 'debit',
        amount,
        description: `Withdrawal via ${method.toUpperCase()} to ${accountDetails}`,
        balance: newBalance,
        createdAt: new Date().toISOString(),
      };
      await setItem(wk(userId), [nt, ...ex]);
      return nt;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['wallet', v.userId] }),
  });
};
