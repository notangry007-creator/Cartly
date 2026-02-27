import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, RadioButton, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useCartStore } from '../../src/stores/cartStore';
import { useZoneStore } from '../../src/stores/zoneStore';
import { useAddresses } from '../../src/hooks/useAddresses';
import { useCreateOrder } from '../../src/hooks/useOrders';
import { useAddWalletTransaction } from '../../src/hooks/useWallet';
import { useNotificationStore } from '../../src/stores/notificationStore';
import * as Haptics from 'expo-haptics';
import { useToast } from '../../src/context/ToastContext';
import { PRODUCTS, COUPONS } from '../../src/data/seed';
import { getZone, DELIVERY_FEE_MAP, calculateShippingFee } from '../../src/data/zones';
import { formatNPR } from '../../src/utils/helpers';
import { DeliveryOption, OrderItem, PaymentMethod } from '../../src/types';
import { theme, SPACING, RADIUS } from '../../src/theme';
import ScreenHeader from '../../src/components/common/ScreenHeader';
const STEPS = ['Address','Delivery','Payment','Review'];
export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { couponCode: pCoupon } = useLocalSearchParams<{couponCode?:string}>();
  const { user, debitWallet } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const { zoneId } = useZoneStore();
  const { data: addresses=[], isLoading: loadAddr } = useAddresses(user?.id??'');
  const { mutateAsync: createOrder, isPending: creating } = useCreateOrder();
  const { mutateAsync: addTx } = useAddWalletTransaction();
  const { addNotification } = useNotificationStore();
  const { showError } = useToast();
  const zone = getZone(zoneId);
  const [step, setStep] = useState(0);
  const [selAddrId, setSelAddrId] = useState('');
  const [dOpt, setDOpt] = useState<DeliveryOption>((zone.deliveryOptions[0] ?? 'standard') as DeliveryOption);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cod');
  const appliedCoupon = pCoupon ? COUPONS.find(c=>c.code===pCoupon) : null;
  const resolved = items.map(item=>{const p=PRODUCTS.find(x=>x.id===item.productId);const v=p?.variants.find(x=>x.id===item.variantId);return{item,p,v};}).filter(r=>r.p&&r.v);
  const subtotal = resolved.reduce((s,{item,v})=>s+(v?.price??0)*item.quantity,0);
  const totalWeightKg = resolved.reduce((s,{item,p})=>s+(p?.weightKg??0.5)*item.quantity, 0);
  const shippingFee = calculateShippingFee(zoneId, dOpt, totalWeightKg);
  const codFee = payMethod==='cod'?zone.codFee:0;
  let discount = 0;
  if(appliedCoupon) discount=appliedCoupon.type==='percent'?Math.min(Math.round(subtotal*appliedCoupon.value/100),appliedCoupon.maxDiscount??Infinity):appliedCoupon.value;
  const total = subtotal+shippingFee+codFee-discount;
  const selAddr = addresses.find(a=>a.id===selAddrId)??addresses.find(a=>a.isDefault);
  if(!user||!items.length){router.replace('/(tabs)/cart');return null;}
  function canProceed(){
    if(step===0) return !!selAddr;
    if(step===1) return !!dOpt;
    if(step===2){if(payMethod==='wallet') return (user?.walletBalance??0)>=total;if(payMethod==='cod') return zone.codAvailable;return true;}
    return true;
  }
  async function placeOrder(){
    if(!selAddr) return;
    try {
      const orderItems: OrderItem[] = resolved.map(({item,p,v})=>({productId:item.productId,variantId:item.variantId,title:p!.title,variantLabel:v!.label,imageUrl:p!.images[0],quantity:item.quantity,price:v!.price,mrp:v!.mrp}));
      const order = await createOrder({userId:user.id,items:orderItems,addressId:selAddr.id,addressSnapshot:selAddr,zoneId,deliveryOption:dOpt,paymentMethod:payMethod,subtotal,shippingFee,codFee,discount,couponCode:appliedCoupon?.code,total,status:'pending'});
      if(payMethod==='wallet'){await debitWallet(total);await addTx({userId:user.id,type:'debit',amount:total,description:'Order '+order.id,referenceId:order.id,balance:user.walletBalance-total});}
      await clearCart(user.id);
      await addNotification(user.id,{title:'Order Placed!',body:'Order #'+order.id.slice(-8).toUpperCase()+' placed. Total: '+formatNPR(total),type:'order',referenceId:order.id});
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/order/confirmation',
        params: {
          orderId: order.id,
          total: String(total),
          expectedDelivery: order.expectedDelivery,
          paymentMethod,
        },
      });
    } catch(e){showError('Failed to place order. Please try again.');}
  }
  const dOpts = zone.deliveryOptions;
  const dLabels: Record<DeliveryOption,string> = {same_day:'⚡ Same Day',next_day:'🚲 Next Day',standard:'📦 Standard',pickup:'🏪 Pickup'};
  const dEta: Record<DeliveryOption,string> = {same_day:'Delivered today',next_day:'Delivered tomorrow',standard:'3-5 business days',pickup:'Pick up from nearest point'};
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Checkout"/>
      <View style={s.stepBar}>
        {STEPS.map((st,i)=>(
          <React.Fragment key={st}>
            <TouchableOpacity style={s.stepItem} onPress={()=>i<step&&setStep(i)} disabled={i>=step}>
              <View style={[s.stepCircle,i<=step&&s.scActive,i<step&&s.scDone]}>{i<step?<Ionicons name="checkmark" size={14} color="#fff"/>:<Text style={[s.sNum,i===step&&s.sNumA]}>{i+1}</Text>}</View>
              <Text variant="labelSmall" style={[s.sLabel,i===step&&s.sLabelA]}>{st}</Text>
            </TouchableOpacity>
            {i<STEPS.length-1&&<View style={[s.stepLine,i<step&&s.slDone]}/>}
          </React.Fragment>
        ))}
      </View>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {step===0&&<View style={s.stepContent}>
          <Text variant="titleMedium" style={s.stepTitle}>Select Delivery Address</Text>
          {loadAddr?<ActivityIndicator color={theme.colors.primary}/>:addresses.length===0?<View style={s.noAddr}><Text variant="bodyMedium" style={{color:'#666'}}>No saved addresses.</Text><Button mode="contained" onPress={()=>router.push('/addresses/new')}>Add Address</Button></View>:addresses.map(addr=>(
            <TouchableOpacity key={addr.id} onPress={()=>setSelAddrId(addr.id)} activeOpacity={0.8}>
              <Surface style={[s.optCard,(selAddrId===addr.id||(!selAddrId&&addr.isDefault))&&s.optCardA]} elevation={1}>
                <RadioButton.Android value={addr.id} status={(selAddrId===addr.id||(!selAddrId&&addr.isDefault))?'checked':'unchecked'} onPress={()=>setSelAddrId(addr.id)} color={theme.colors.primary}/>
                <View style={s.addrInfo}>
                  <Text variant="labelMedium" style={s.addrLabel}>{addr.label}</Text>
                  <Text variant="bodySmall" style={s.addrTxt}>{addr.landmark}, Ward {addr.ward}, {addr.municipality}, {addr.district}</Text>
                  {addr.isPickupPointFallback&&<View style={{flexDirection:'row',alignItems:'center',gap:3,marginTop:4}}><Ionicons name="location" size={12} color="#FF8F00"/><Text style={{color:'#FF8F00',fontSize:11}}>Pickup point fallback</Text></View>}
                </View>
              </Surface>
            </TouchableOpacity>
          ))}
          <Button mode="outlined" icon="plus" onPress={()=>router.push('/addresses/new')} style={{marginTop:SPACING.sm}}>Add New Address</Button>
        </View>}
        {step===1&&<View style={s.stepContent}>
          <Text variant="titleMedium" style={s.stepTitle}>Choose Delivery</Text>
          {dOpts.map(opt=>(
            <TouchableOpacity key={opt} onPress={()=>setDOpt(opt)} activeOpacity={0.8}>
              <Surface style={[s.optCard,dOpt===opt&&s.optCardA]} elevation={1}>
                <RadioButton.Android value={opt} status={dOpt===opt?'checked':'unchecked'} onPress={()=>setDOpt(opt)} color={theme.colors.primary}/>
                <View style={s.optInfo}><Text variant="titleSmall" style={s.optLabel}>{dLabels[opt]}</Text><Text variant="bodySmall" style={s.optEta}>{dEta[opt]}</Text></View>
                <Text variant="titleSmall" style={s.optFee}>{formatNPR(DELIVERY_FEE_MAP[zoneId]?.[opt]??0)}</Text>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>}
        {step===2&&<View style={s.stepContent}>
          <Text variant="titleMedium" style={s.stepTitle}>Payment Method</Text>
          {zone.codAvailable&&<TouchableOpacity onPress={()=>setPayMethod('cod')} activeOpacity={0.8}><Surface style={[s.optCard,payMethod==='cod'&&s.optCardA]} elevation={1}><RadioButton.Android value="cod" status={payMethod==='cod'?'checked':'unchecked'} onPress={()=>setPayMethod('cod')} color={theme.colors.primary}/><View style={s.optInfo}><View style={{flexDirection:'row',alignItems:'center',gap:SPACING.xs}}><Ionicons name="cash-outline" size={20} color="#2E7D32"/><Text variant="titleSmall" style={s.optLabel}>Cash on Delivery</Text></View><Text variant="bodySmall" style={s.optEta}>Pay when order arrives{zone.codFee>0?' (+NPR '+zone.codFee+' fee)':''}</Text></View></Surface></TouchableOpacity>}
          {!zone.codAvailable&&<Surface style={[s.optCard,{backgroundColor:'#f8f8f8'}]} elevation={0}><View style={s.optInfo}><Text variant="titleSmall" style={{color:'#bbb'}}>Cash on Delivery</Text><Text variant="bodySmall" style={{color:'#ccc'}}>Not available in your zone</Text></View></Surface>}
          <TouchableOpacity onPress={()=>setPayMethod('wallet')} activeOpacity={0.8}><Surface style={[s.optCard,payMethod==='wallet'&&s.optCardA]} elevation={1}><RadioButton.Android value="wallet" status={payMethod==='wallet'?'checked':'unchecked'} onPress={()=>setPayMethod('wallet')} color={theme.colors.primary}/><View style={s.optInfo}><View style={{flexDirection:'row',alignItems:'center',gap:SPACING.xs}}><Ionicons name="wallet-outline" size={20} color={theme.colors.primary}/><Text variant="titleSmall" style={s.optLabel}>Buy Wallet</Text></View><Text variant="bodySmall" style={s.optEta}>Balance: {formatNPR(user.walletBalance)}{user.walletBalance<total?' · Insufficient':''}</Text></View></Surface></TouchableOpacity>
        </View>}
        {step===3&&<View style={s.stepContent}>
          <Text variant="titleMedium" style={s.stepTitle}>Review Order</Text>
          <Surface style={s.revSec} elevation={1}><View style={{flexDirection:'row',alignItems:'center',gap:SPACING.xs,marginBottom:SPACING.xs}}><Ionicons name="location" size={16} color={theme.colors.primary}/><Text variant="titleSmall" style={{fontWeight:'700',color:'#222'}}>Delivery To</Text></View>{selAddr&&<Text variant="bodySmall" style={{color:'#555'}}>{selAddr.label}: {selAddr.landmark}, Ward {selAddr.ward}, {selAddr.municipality}</Text>}</Surface>
          <Surface style={s.revSec} elevation={1}><Text variant="titleSmall" style={{fontWeight:'700',color:'#222',marginBottom:SPACING.sm}}>Items ({resolved.length})</Text>{resolved.map(({item,p,v})=><View key={item.productId+item.variantId} style={{paddingVertical:3}}><Text variant="bodySmall" style={{color:'#333',fontWeight:'500'}} numberOfLines={1}>{p?.title}</Text><Text variant="bodySmall" style={{color:'#888'}}>{v?.label} x{item.quantity} = {formatNPR((v?.price??0)*item.quantity)}</Text></View>)}</Surface>
          <Surface style={s.revSec} elevation={1}>
            <Text variant="titleSmall" style={{fontWeight:'700',color:'#222',marginBottom:SPACING.sm}}>Price</Text>
            {[['Subtotal',formatNPR(subtotal)],['Shipping',formatNPR(shippingFee)],codFee>0?['COD Fee',formatNPR(codFee)]:null,discount>0?['Discount','- '+formatNPR(discount)]:null].filter(Boolean).map(([l,v])=><View key={l!} style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}><Text variant="bodySmall" style={{color:'#555'}}>{l}</Text><Text variant="bodySmall" style={{color:l==='Discount'?'#2E7D32':'#333'}}>{v}</Text></View>)}
            <Divider style={{marginVertical:SPACING.sm}}/>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text variant="titleSmall" style={{fontWeight:'700'}}>Total</Text><Text variant="titleSmall" style={{fontWeight:'700',color:theme.colors.primary}}>{formatNPR(total)}</Text></View>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:4}}><Text variant="bodySmall" style={{color:'#555'}}>Payment</Text><Text variant="bodySmall" style={{color:'#333'}}>{payMethod==='cod'?'Cash on Delivery':'Buy Wallet'}</Text></View>
          </Surface>
        </View>}
        <View style={{height:100}}/>
      </ScrollView>
      <View style={[s.bottomBar,{paddingBottom:insets.bottom+SPACING.sm}]}>
        {step>0&&<Button mode="outlined" onPress={()=>setStep(step-1)}>Back</Button>}
        {step<STEPS.length-1?<Button mode="contained" onPress={()=>setStep(step+1)} disabled={!canProceed()} style={s.nextBtn} contentStyle={{paddingVertical:4}}>Continue</Button>:<Button mode="contained" onPress={placeOrder} loading={creating} disabled={creating||!canProceed()} style={s.nextBtn} contentStyle={{paddingVertical:4}}>Place Order · {formatNPR(total)}</Button>}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  stepBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  stepItem:{alignItems:'center',gap:4},
  stepCircle:{width:28,height:28,borderRadius:14,backgroundColor:'#f0f0f0',justifyContent:'center',alignItems:'center'},
  scActive:{backgroundColor:theme.colors.primary},
  scDone:{backgroundColor:'#2E7D32'},
  sNum:{color:'#999',fontSize:12,fontWeight:'700'},
  sNumA:{color:'#fff'},
  sLabel:{color:'#999',fontSize:10},
  sLabelA:{color:theme.colors.primary,fontWeight:'700'},
  stepLine:{flex:1,height:2,backgroundColor:'#e0e0e0',marginBottom:16},
  slDone:{backgroundColor:'#2E7D32'},
  scroll:{flex:1},
  stepContent:{padding:SPACING.md,gap:SPACING.sm},
  stepTitle:{fontWeight:'700',color:'#222',marginBottom:SPACING.sm},
  optCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.sm,borderWidth:1.5,borderColor:'transparent',marginBottom:SPACING.sm},
  optCardA:{borderColor:theme.colors.primary,backgroundColor:'#FFF5F5'},
  optInfo:{flex:1},
  optLabel:{fontWeight:'600',color:'#222'},
  optEta:{color:'#888',marginTop:2},
  optFee:{color:theme.colors.primary,fontWeight:'700'},
  addrInfo:{flex:1},
  addrLabel:{fontWeight:'700',color:'#222',marginBottom:2},
  addrTxt:{color:'#555',lineHeight:18},
  noAddr:{alignItems:'center',gap:SPACING.md,padding:SPACING.xl},
  revSec:{backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,marginBottom:SPACING.sm},
  bottomBar:{flexDirection:'row',gap:SPACING.md,padding:SPACING.md,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#f0f0f0'},
  nextBtn:{flex:1},
});
