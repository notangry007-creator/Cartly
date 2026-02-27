import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletTransaction } from '../types';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTx(row: any): WalletTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    referenceId: row.reference_id ?? undefined,
    balance: row.balance,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export const useWalletTransactions = (userId: string) =>
  useQuery({
    queryKey: ['wallet', userId],
    enabled: !!userId,
    staleTime: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToTx);
    },
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const useAddWalletTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: tx.userId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          reference_id: tx.referenceId ?? null,
          balance: tx.balance,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToTx(data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['wallet', v.userId] }),
  });
};
