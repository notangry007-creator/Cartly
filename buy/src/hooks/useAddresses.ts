import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '../types';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAddress(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    province: row.province,
    district: row.district,
    municipality: row.municipality,
    ward: row.ward,
    street: row.street ?? undefined,
    landmark: row.landmark,
    latitude: row.latitude,
    longitude: row.longitude,
    isPickupPointFallback: row.is_pickup_point_fallback,
    isDefault: row.is_default,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export const useAddresses = (userId: string) =>
  useQuery({
    queryKey: ['addresses', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToAddress);
    },
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: Omit<Address, 'id'>) => {
      // If new address is default, clear existing defaults first
      if (addr.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', addr.userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: addr.userId,
          label: addr.label,
          province: addr.province,
          district: addr.district,
          municipality: addr.municipality,
          ward: addr.ward,
          street: addr.street ?? null,
          landmark: addr.landmark,
          latitude: addr.latitude,
          longitude: addr.longitude,
          is_pickup_point_fallback: addr.isPickupPointFallback,
          is_default: addr.isDefault,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToAddress(data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['addresses', v.userId] }),
  });
};

export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: Address) => {
      if (addr.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', addr.userId);
      }

      const { error } = await supabase
        .from('addresses')
        .update({
          label: addr.label,
          province: addr.province,
          district: addr.district,
          municipality: addr.municipality,
          ward: addr.ward,
          street: addr.street ?? null,
          landmark: addr.landmark,
          latitude: addr.latitude,
          longitude: addr.longitude,
          is_pickup_point_fallback: addr.isPickupPointFallback,
          is_default: addr.isDefault,
        })
        .eq('id', addr.id);

      if (error) throw error;
      return addr;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['addresses', v.userId] }),
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, addressId }: { userId: string; addressId: string }) => {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['addresses', v.userId] }),
  });
};
