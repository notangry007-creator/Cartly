import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Chip, Surface, Button } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonBox } from '../../src/components/common/SkeletonLoader';
import { useAuthStore } from '../../src/stores/authStore';
import { useOrders } from '../../src/hooks/useOrders';
import { Order, OrderStatus } from '../../src/types';
import { formatDate, formatNPR } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
const STATUS_COLORS: Record<OrderStatus,string> = { pending:'#FF8F00', confirmed:'#1565C0', packed:'#6A1B9A', shipped:'#00838F', out_for_delivery:'#E65100', delivered:'#2E7D32', cancelled:'#B71C1C', return_requested:'#F57F17', return_approved:'#558B2F', return_picked:'#00695C', refunded:'#37474F' };
const STATUS_LABELS: Record<OrderStatus,string> = { pending:'Pending', confirmed:'Confirmed', packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled', return_requested:'Return Requested', return_approved:'Return Approved', return_picked:'Picked Up', refunded:'Refunded' };
type Filter = 'all'|'active'|'delivered'|'cancelled';
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<Filter>('all');
  const isFirstLoad = isLoading && orders.length === 0;
  const { data: orders=[], isLoading, refetch } = useOrders(user?.id??'');
  if (!user) return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Orders</Text></View>
      <View style={s.empty}><Ionicons name="receipt-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTitle}>Please login</Text><Button mode="contained" onPress={()=>router.push('/(auth)/login')}>Login</Button></View>
    </View>
  );
  const filtered = orders.filter(o=>{
    if(filter==='all') return true;
    if(filter==='active') return !['delivered','cancelled','refunded'].includes(o.status);
    if(filter==='delivered') return o.status==='delivered';
    if(filter==='cancelled') return ['cancelled','refunded'].includes(o.status);
    return true;
  });
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>My Orders</Text></View>
      <View style={s.filters}>
        {(['all','active','delivered','cancelled'] as Filter[]).map(f=>(
          <Chip key={f} selected={filter===f} onPress={()=>setFilter(f)} style={[s.chip,filter===f&&s.chipA]} textStyle={filter===f?s.chipTxtA:s.chipTxt} compact accessibilityRole="button" accessibilityLabel={`Filter by ${f}`} accessibilityState={{selected: filter===f}}>{f.charAt(0).toUpperCase()+f.slice(1)}</Chip>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={i=>i.id} contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]}/>}
        getItemLayout={(_data, index) => ({ length: 136, offset: 136 * index + SPACING.md, index })}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="receipt-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTitle}>No orders yet</Text><Button mode="contained" onPress={()=>router.push('/(tabs)/home')}>Start Shopping</Button></View>}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>router.push('/order/'+item.id)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Order ${item.id.slice(-8).toUpperCase()}, ${STATUS_LABELS[item.status]}, total ${formatNPR(item.total)}`}>
            <Surface style={s.card} elevation={1}>
              <View style={s.cardHeader}>
                <Text variant="labelMedium" style={s.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
                <View style={[s.badge,{backgroundColor:STATUS_COLORS[item.status]+'20'}]}><Text style={[s.badgeTxt,{color:STATUS_COLORS[item.status]}]}>{STATUS_LABELS[item.status]}</Text></View>
              </View>
              <View style={s.cardBody}>
                {item.items[0]&&<Image source={{uri:item.items[0].imageUrl}} style={s.itemImg} contentFit="cover"/>}
                <View style={s.itemInfo}>
                  <Text variant="labelMedium" style={s.itemTitle} numberOfLines={2}>{item.items[0]?.title}</Text>
                  {item.items.length>1&&<Text variant="labelSmall" style={s.more}>+{item.items.length-1} more</Text>}
                  <Text variant="labelSmall" style={s.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={s.amount}>
                  <Text variant="titleSmall" style={s.total}>{formatNPR(item.total)}</Text>
                  <Text variant="labelSmall" style={s.method}>{item.paymentMethod.toUpperCase()}</Text>
                </View>
              </View>
              <View style={s.cardFooter}><Ionicons name="time-outline" size={13} color="#999"/><Text variant="labelSmall" style={s.eta}>{item.status==='delivered'?'Delivered '+formatDate(item.timeline.find(t=>t.status==='delivered')?.timestamp??item.expectedDelivery):'Expected: '+formatDate(item.expectedDelivery)}</Text></View>
            </Surface>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  header:{backgroundColor:'#fff',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  headerTitle:{fontWeight:'700',color:'#222'},
  filters:{flexDirection:'row',gap:SPACING.sm,paddingHorizontal:SPACING.md,paddingVertical:SPACING.sm,backgroundColor:'#fff'},
  chip:{backgroundColor:'#f0f0f0'},
  chipA:{backgroundColor:theme.colors.primaryContainer},
  chipTxt:{color:'#555'},
  chipTxtA:{color:theme.colors.primary},
  list:{padding:SPACING.md,gap:SPACING.sm,flexGrow:1},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  emptyTitle:{color:'#555',fontWeight:'600'},
  card:{backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,gap:SPACING.sm},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  orderId:{color:'#666',fontWeight:'600'},
  badge:{paddingHorizontal:8,paddingVertical:3,borderRadius:999},
  badgeTxt:{fontSize:11,fontWeight:'700'},
  cardBody:{flexDirection:'row',gap:SPACING.sm,alignItems:'center'},
  itemImg:{width:60,height:60,borderRadius:RADIUS.sm},
  itemInfo:{flex:1,gap:3},
  itemTitle:{color:'#333',lineHeight:16},
  more:{color:'#888'},
  date:{color:'#aaa'},
  amount:{alignItems:'flex-end'},
  total:{fontWeight:'700',color:'#222'},
  method:{color:'#888'},
  cardFooter:{flexDirection:'row',alignItems:'center',gap:4,borderTopWidth:1,borderTopColor:'#f5f5f5',paddingTop:SPACING.sm},
  eta:{color:'#888'},
});
