import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductQuestion } from '../types';
import { getItem, setItem } from '../utils/storage';
import { v4 as uuid } from 'uuid';

const qak = (productId: string) => 'buy_qa_' + productId;

export const useProductQuestions = (productId: string) => useQuery({
  queryKey: ['qa', productId],
  enabled: !!productId,
  staleTime: 30000,
  queryFn: async () => (await getItem<ProductQuestion[]>(qak(productId))) ?? [],
});

export const useAskQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Omit<ProductQuestion, 'id' | 'createdAt' | 'helpful'>) => {
      const ex = (await getItem<ProductQuestion[]>(qak(q.productId))) ?? [];
      const nq: ProductQuestion = { ...q, id: uuid(), helpful: 0, createdAt: new Date().toISOString() };
      await setItem(qak(q.productId), [nq, ...ex]);
      return nq;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['qa', v.productId] }),
  });
};

export const useAnswerQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, questionId, answer, answeredBy }: {
      productId: string;
      questionId: string;
      answer: string;
      answeredBy: string;
    }) => {
      const questions = (await getItem<ProductQuestion[]>(qak(productId))) ?? [];
      const updated = questions.map(q =>
        q.id === questionId
          ? { ...q, answer, answeredBy, answeredAt: new Date().toISOString() }
          : q
      );
      await setItem(qak(productId), updated);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['qa', v.productId] }),
  });
};

export const useMarkHelpful = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, questionId }: { productId: string; questionId: string }) => {
      const questions = (await getItem<ProductQuestion[]>(qak(productId))) ?? [];
      const updated = questions.map(q =>
        q.id === questionId ? { ...q, helpful: q.helpful + 1 } : q
      );
      await setItem(qak(productId), updated);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['qa', v.productId] }),
  });
};
