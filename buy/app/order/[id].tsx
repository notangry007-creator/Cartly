import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useOrder, useCancelOrder, useUpdateOrderStatus } from '../../src/hooks/useOrders';
import { formatDate, formatDateTime, formatNPR } from '../../src/utils/helpers';
import { OrderStatus } from '../../src/types';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import DeliveryTrackingMap from '../../src/components/common/DeliveryTrackingMap';
import { theme, SPACING, RADIUS } from '../../src/theme';
const SL: Record<OrderStatus,string> = { pending:'Order Placed', confirmed:'Confirmed', packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled', return_requested:'Return Requested', return_approved:'Return Approved', return_picked:'Picked Up', refunded:'Refunded' };
const SI: Record<OrderStatus,string> = { pending:'hourglass', confirmed:'checkmark-circle', packed:'cube', shipped:'car', out_for_delivery:'bicycle', delivered:'checkmark-done-circle', cancelled:'close-circle', return_requested:'return-up-back', return_approved:'checkmark-circle', return_picked:'cube-outline', refunded:'wallet' };
const TL_ORDER: OrderStatus[] = ['pending','confirmed','packed','shipped','out_for_delivery','delivered'];
const NEXT: Record<string,OrderStatus> = { pending:'confirmed', confirmed:'packed', packed:'shipped', shipped:'out_for_delivery', out_for_delivery:'delivered' };

function PR({ label, value, bold, green }: { label:string; value:string; bold?:boolean; green?:boolean }) {
  return (
    <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
      <Text variant="bodySmall" style={{color:'#666'}}>{label}</Text>
      <Text variant="bodySmall" style={{fontWeight:bold?'700':'400',color:green?'#2E7D32':'#333'}}>{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{id:string}>();
  const { user } = useAuthStore();
  const { data: order, isLoading } = useOrder(user?.id??'', id);
  const { mutateAsync: cancelOrder, isPending: cancelling } = useCancelOrder();
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();
  if (isLoading) return <View style={[s.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><ActivityIndicator size="large" color={theme.colors.primary}/></View>;
  if (!order) return <View style={[s.container,{paddingTop:insets.top}]}><ScreenHeader title="Order"/><View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Order not found</Text></View></View>;
  const canCancel = ['pending','confirmed'].includes(order.status);
  const canReturn = order.status==='delivered';
  const canSim = !['delivered','cancelled','refunded'].includes(order.status);
  const tlStatuses = order.timeline.map(t=>t.status);
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title={"Order #"+order.id.slice(-8).toUpperCase()}/>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={s.statusCard} elevation={2}>
          <View style={s.statusTop}><Ionicons name={SI[order.status] as any} size={36} color={theme.colors.primary}/><View><Text variant="headlineSmall" style={s.statusTitle}>{SL[order.status]}</Text><Text variant="bodySmall" style={{color:'#888'}}>{order.status==='delivered'?'Delivered '+formatDate(order.timeline.find(t=>t.status==='delivered')?.timestamp??order.expectedDelivery):'Expected: '+formatDate(order.expectedDelivery)}</Text></View></View>
          <View style={s.timeline}>
            {TL_ORDER.map((st,i)=>{const done=tlStatuses.includes(st);const isCur=order.status===st;const tl=order.timeline.find(t=>t.status===st);return(
              <View key={st} style={s.tlItem}>
                <View style={s.tlLeft}><View style={[s.tlDot,done&&s.tlDotDone,isCur&&s.tlDotCur]}>{done&&<Ionicons name="checkmark" size={10} color="#fff"/>}</View>{i<TL_ORDER.length-1&&<View style={[s.tlLine,done&&s.tlLineDone]}/>}</View>
                <View style={s.tlRight}><Text variant="labelMedium" style={[s.tlLabel,!done&&s.tlLabelF]}>{SL[st]}</Text>{tl&&<Text variant="labelSmall" style={{color:'#888'}}>{formatDateTime(tl.timestamp)}</Text>}{tl?.note&&<Text variant="labelSmall" style={{color:'#aaa',fontStyle:'italic'}}>{tl.note}</Text>}</View>
              </View>
            );})}
          </View>
          {canSim&&<Button mode="text" compact onPress={()=>{const n=NEXT[order.status];if(n)updateStatus({userId:user!.id,orderId:order.id,status:n});}} textColor="#aaa" style={{marginTop:SPACING.sm}}>[Dev] Simulate Next Step</Button>}
        </Surface>

        {/* ── LIVE DELIVERY MAP ── */}
        <DeliveryTrackingMap order={order} />

        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Items</Text>
          {order.items.map(item=>(
            <TouchableOpacity key={item.productId+item.variantId} style={s.itemRow} onPress={()=>router.push('/product/'+item.productId)}>
              <Image source={{uri:item.imageUrl}} style={s.itemImg} contentFit="cover"/>
              <View style={s.itemInfo}><Text variant="labelMedium" style={{color:'#333',lineHeight:16}} numberOfLines={2}>{item.title}</Text><Text variant="labelSmall" style={{color:'#888'}}>{item.variantLabel}</Text><Text variant="labelSmall" style={{color:'#aaa'}}>Qty: {item.quantity}</Text></View>
              <Text variant="titleSmall" style={{fontWeight:'700',color:'#222'}}>{formatNPR(item.price*item.quantity)}</Text>
            </TouchableOpacity>
          ))}
        </Surface>
        <Surface style={s.section} elevation={1}>
          <View style={{flexDirection:'row',alignItems:'center',gap:SPACING.xs}}><Ionicons name="location" size={16} color={theme.colors.primary}/><Text variant="titleSmall" style={s.secTitle}>Delivery Address</Text></View>
          <Text variant="bodySmall" style={{color:'#555',marginTop:4}}><Text style={{fontWeight:'700'}}>{order.addressSnapshot.label}: </Text>{order.addressSnapshot.landmark}, Ward {order.addressSnapshot.ward}, {order.addressSnapshot.municipality}, {order.addressSnapshot.district}</Text>
        </Surface>
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Payment</Text>
          <PR label="Subtotal" value={formatNPR(order.subtotal)} />
          <PR label="Shipping" value={formatNPR(order.shippingFee)} />
          {order.codFee > 0 && <PR label="COD Fee" value={formatNPR(order.codFee)} />}
          {order.discount > 0 && <PR label={"Discount" + (order.couponCode ? " (" + order.couponCode + ")" : "")} value={"- " + formatNPR(order.discount)} green />}
          <Divider style={{marginVertical:SPACING.sm}}/>
          <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text variant="titleSmall" style={{fontWeight:'700'}}>Total</Text><Text variant="titleSmall" style={{fontWeight:'700',color:theme.colors.primary}}>{formatNPR(order.total)}</Text></View>
          <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:4}}><Text variant="bodySmall" style={{color:'#555'}}>Method</Text><Text variant="bodySmall">{order.paymentMethod==='cod'?'Cash on Delivery':'Buy Wallet'}</Text></View>
        </Surface>
        <View style={s.actions}>
          {canCancel&&<Button mode="outlined" onPress={()=>Alert.alert('Cancel Order','Are you sure?',[{text:'No'},{text:'Yes',style:'destructive',onPress:()=>cancelOrder({userId:user!.id,orderId:order.id})}])} loading={cancelling} textColor={theme.colors.error}>Cancel Order</Button>}
          {canReturn&&<Button mode="outlined" onPress={()=>router.push('/order/return/'+order.id)} icon="return-up-back">Request Return</Button>}
          {order.canReview&&<Button mode="contained" onPress={()=>router.push({pathname:'/order/review',params:{orderId:order.id}})} icon="star">Write a Review</Button>}
        </View>
        <View style={{height:SPACING.xl}}/>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  scroll:{flex:1},
  statusCard:{margin:SPACING.md,borderRadius:RADIUS.lg,padding:SPACING.lg,backgroundColor:'#fff'},
  statusTop:{flexDirection:'row',alignItems:'center',gap:SPACING.md,marginBottom:SPACING.lg},
  statusTitle:{fontWeight:'700',color:'#222'},
  timeline:{gap:0},
  tlItem:{flexDirection:'row',gap:SPACING.md},
  tlLeft:{alignItems:'center',width:20},
  tlDot:{width:20,height:20,borderRadius:10,backgroundColor:'#e0e0e0',justifyContent:'center',alignItems:'center'},
  tlDotDone:{backgroundColor:'#2E7D32'},
  tlDotCur:{backgroundColor:theme.colors.primary},
  tlLine:{flex:1,width:2,backgroundColor:'#e0e0e0',minHeight:24},
  tlLineDone:{backgroundColor:'#2E7D32'},
  tlRight:{flex:1,paddingBottom:SPACING.md},
  tlLabel:{fontWeight:'600',color:'#222'},
  tlLabelF:{color:'#bbb',fontWeight:'400'},
  section:{margin:SPACING.md,marginTop:0,borderRadius:RADIUS.md,padding:SPACING.md,backgroundColor:'#fff'},
  secTitle:{fontWeight:'700',color:'#222',marginBottom:SPACING.sm},
  itemRow:{flexDirection:'row',gap:SPACING.sm,alignItems:'center',marginBottom:SPACING.sm},
  itemImg:{width:60,height:60,borderRadius:RADIUS.sm},
  itemInfo:{flex:1},
  actions:{margin:SPACING.md,marginTop:0,gap:SPACING.sm},
});
