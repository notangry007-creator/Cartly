import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Button, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useAddresses, useDeleteAddress } from '../../src/hooks/useAddresses';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { useToast } from '../../src/context/ToastContext';
import { theme, SPACING, RADIUS } from '../../src/theme';
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: addresses=[] } = useAddresses(user?.id??'');
  const { mutateAsync: deleteAddr } = useDeleteAddress();
  const { showSuccess } = useToast();
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Saved Addresses"/>
      <FlatList data={addresses} keyExtractor={i=>i.id} contentContainerStyle={s.list}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="location-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>No addresses saved</Text><Button mode="contained" onPress={()=>router.push('/addresses/new')}>Add Address</Button></View>}
        renderItem={({item})=>(
          <Surface style={s.card} elevation={1}>
            <View style={s.cardHeader}>
              <View style={s.labelRow}><Ionicons name="location" size={16} color={theme.colors.primary}/><Text variant="titleSmall" style={s.label}>{item.label}</Text>{item.isDefault&&<View style={s.defBadge}><Text style={s.defTxt}>Default</Text></View>}</View>
              <TouchableOpacity onPress={() => router.push(`/addresses/edit/${item.id}`)} style={{ marginRight: 8 }}>
                <Ionicons name="pencil-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Delete', 'Remove this address?', [{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>user&&deleteAddr({userId:user.id,addressId:item.id})}])}>
                <Ionicons name="trash-outline" size={18} color="#999" />
              </TouchableOpacity>
            </View>
            <Text variant="bodySmall" style={s.addr}>{item.landmark}, Ward {item.ward}, {item.municipality}, {item.district}, {item.province}</Text>
            {item.isPickupPointFallback&&<View style={s.pickupBadge}><Ionicons name="location" size={12} color="#FF8F00"/><Text style={s.pickupTxt}>Pickup point fallback enabled</Text></View>}
          </Surface>
        )}
      />
      <FAB icon="plus" style={s.fab} onPress={()=>router.push('/addresses/new')} label="Add Address"/>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  list:{padding:SPACING.md,gap:SPACING.sm,flexGrow:1},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  emptyTxt:{color:'#555',fontWeight:'600'},
  card:{backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.sm},
  labelRow:{flexDirection:'row',alignItems:'center',gap:SPACING.xs},
  label:{fontWeight:'700',color:'#222'},
  defBadge:{backgroundColor:theme.colors.primaryContainer,paddingHorizontal:6,paddingVertical:2,borderRadius:999},
  defTxt:{color:theme.colors.primary,fontSize:11,fontWeight:'700'},
  addr:{color:'#555',lineHeight:20},
  pickupBadge:{flexDirection:'row',alignItems:'center',gap:3,marginTop:6},
  pickupTxt:{color:'#FF8F00',fontSize:11},
  fab:{position:'absolute',bottom:SPACING.lg,right:SPACING.lg,backgroundColor:theme.colors.primary},
});
