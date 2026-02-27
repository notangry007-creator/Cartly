import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { v4 as uuid } from 'uuid';
const delay = (ms = 200) => __DEV__ ? new Promise(r => setTimeout(r, ms)) : Promise.resolve();
const ak = (uid:string) => STORAGE_KEYS.ADDRESSES+'_'+uid;
export const useAddresses = (userId: string) => useQuery({
  queryKey: ['addresses', userId], enabled: !!userId, staleTime: 30000,
  queryFn: async () => { await delay(); return (await getItem<Address[]>(ak(userId)))??[]; },
});
export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: Omit<Address,'id'>) => {
      await delay(300);
      let addresses = (await getItem<Address[]>(ak(addr.userId)))??[];
      if (addr.isDefault) addresses = addresses.map(a=>({...a,isDefault:false}));
      const na: Address = { ...addr, id:uuid() };
      if (!addresses.length) na.isDefault = true;
      addresses.push(na);
      await setItem(ak(addr.userId), addresses); return na;
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey:['addresses',v.userId] }),
  });
};
export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: Address) => {
      let addresses = (await getItem<Address[]>(ak(addr.userId)))??[];
      if (addr.isDefault) addresses = addresses.map(a=>({...a,isDefault:a.id===addr.id}));
      else addresses = addresses.map(a=>a.id===addr.id?addr:a);
      await setItem(ak(addr.userId), addresses); return addr;
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey:['addresses',v.userId] }),
  });
};
export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({userId,addressId}:{userId:string;addressId:string}) => {
      const addresses = ((await getItem<Address[]>(ak(userId)))??[]).filter(a=>a.id!==addressId);
      await setItem(ak(userId), addresses);
    },
    onSuccess: (_,v) => qc.invalidateQueries({ queryKey:['addresses',v.userId] }),
  });
};
