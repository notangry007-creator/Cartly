import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, TextInput, Divider, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useCartStore } from '../../src/stores/cartStore';
import { useZoneStore } from '../../src/stores/zoneStore';
import { PRODUCTS, COUPONS } from '../../src/data/seed';
import { formatNPR, getDiscountPercent } from '../../src/utils/helpers';
import { getZone } from '../../src/data/zones';
import { theme, SPACING, RADIUS } from '../../src/theme';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem } = useCartStore();
  const { zoneId } = useZoneStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof COUPONS[0]|null>(null);
  const [couponError, setCouponError] = useState('');
  const zone = getZone(zoneId);

  if (!user) return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Cart</Text></View>
      <View style={s.empty}><Ionicons name="bag-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>Please login to view cart</Text><Button mode="contained" onPress={()=>router.push('/(auth)/login')}>Login</Button></View>
    </View>
  );

  if (!items.length) return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Cart</Text></View>
      <View style={s.empty}><Ionicons name="bag-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>Your cart is empty</Text><Button mode="contained" onPress={()=>router.push('/(tabs)/home')}>Shop Now</Button></View>
    </View>
  );

  const resolved = items.map(item=>{
    const product = PRODUCTS.find(p=>p.id===item.productId);
    const variant = product?.variants.find(v=>v.id===item.variantId);
    return { item, product, variant };
  }).filter(r=>r.product&&r.variant);

  const subtotal = resolved.reduce((sum,{item,variant})=>sum+(variant?.price??0)*item.quantity,0);
  const totalWeight = resolved.reduce((sum,{item,product})=>sum+(product?.weightKg??0.5)*item.quantity,0);
  const shippingFee = Math.max(zone.shippingBase, Math.round(totalWeight*zone.shippingBase));
  let discount = 0;
  if(appliedCoupon) {
    discount = appliedCoupon.type==='percent' ? Math.min(Math.round(subtotal*appliedCoupon.value/100),appliedCoupon.maxDiscount??Infinity) : appliedCoupon.value;
  }
  const total = subtotal + shippingFee - discount;

  function applyCoupon() {
    setCouponError('');
    const c = COUPONS.find(x=>x.code===couponCode.toUpperCase().trim());
    if(!c){setCouponError('Invalid coupon code');return;}
    if(subtotal<c.minSpend){setCouponError('Min spend NPR '+c.minSpend+' required');return;}
    if(c.validZones&&!c.validZones.includes(zoneId)){setCouponError('Coupon not valid in your zone');return;}
    if(c.validCategoryIds){const ok=resolved.some(({product})=>product&&c.validCategoryIds!.includes(product.categoryId));if(!ok){setCouponError('Coupon not applicable for cart items');return;}}
    setAppliedCoupon(c);
  }

  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Cart ({items.length})</Text></View>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {resolved.map(({item,product,variant})=>{
          if(!product||!variant) return null;
          const disc = getDiscountPercent(variant.price,variant.mrp);
          return (
            <Surface key={item.productId+item.variantId} style={s.cartItem} elevation={1}>
              <Image source={{uri:product.images[0]}} style={s.itemImg} contentFit="cover"/>
              <View style={s.itemInfo}>
                <Text variant="labelMedium" numberOfLines={2} style={s.itemTitle}>{product.title}</Text>
                <Text variant="labelSmall" style={s.varLabel}>{variant.label}</Text>
                <View style={s.priceRow}>
                  <Text variant="titleSmall" style={s.price}>{formatNPR(variant.price)}</Text>
                  {disc>0&&<Text style={s.mrp}>{formatNPR(variant.mrp)}</Text>}
                </View>
                <View style={s.qtyRow}>
                  <TouchableOpacity style={s.qBtn} onPress={()=>updateQuantity(user.id,item.productId,item.variantId,item.quantity-1)}><Ionicons name="remove" size={16} color="#333"/></TouchableOpacity>
                  <Text variant="titleSmall" style={s.qty}>{item.quantity}</Text>
                  <TouchableOpacity style={s.qBtn} onPress={()=>{if(item.quantity<variant.stock)updateQuantity(user.id,item.productId,item.variantId,item.quantity+1);}} disabled={item.quantity>=variant.stock}><Ionicons name="add" size={16} color={item.quantity>=variant.stock?'#ccc':'#333'}/></TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={s.removeBtn} onPress={()=>Alert.alert('Remove','Remove this item?',[{text:'Cancel'},{text:'Remove',onPress:()=>removeItem(user.id,item.productId,item.variantId),style:'destructive'}])}>
                <Ionicons name="trash-outline" size={18} color="#999"/>
              </TouchableOpacity>
            </Surface>
          );
        })}
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Coupon Code</Text>
          {appliedCoupon?(
            <View style={s.applied}><Ionicons name="pricetag" size={16} color="#2E7D32"/><Text style={s.appliedTxt}>{appliedCoupon.code} applied!</Text><TouchableOpacity onPress={()=>{setAppliedCoupon(null);setCouponCode('');}}><Ionicons name="close-circle" size={18} color="#999"/></TouchableOpacity></View>
          ):(
            <View style={s.couponRow}>
              <TextInput value={couponCode} onChangeText={setCouponCode} placeholder="Enter coupon code" mode="outlined" style={s.couponInput} autoCapitalize="characters"/>
              <Button mode="outlined" onPress={applyCoupon}>Apply</Button>
            </View>
          )}
          {couponError?<Text style={s.couponErr}>{couponError}</Text>:null}
        </Surface>
        <Surface style={s.section} elevation={1}>
          <Text variant="titleSmall" style={s.secTitle}>Price Details</Text>
          <PR label="Subtotal" value={subtotal}/>
          <PR label={"Shipping ("+zone.name+")"} value={shippingFee}/>
          {discount>0&&<PR label={"Discount ("+appliedCoupon?.code+")"} value={-discount} green/>}
          <PR label="COD Fee (preview)" value={zone.codFee} note="if paying by cash"/>
          <Divider style={{marginVertical:SPACING.sm}}/>
          <View style={s.totalRow}><Text variant="titleMedium" style={s.totalLabel}>Total</Text><Text variant="titleMedium" style={s.totalVal}>{formatNPR(total)}</Text></View>
          <Text variant="labelSmall" style={s.codNote}>{zone.codAvailable?'COD available (+NPR '+zone.codFee+' fee)':'COD not available. Prepaid only.'}</Text>
        </Surface>
        <View style={{height:100}}/>
      </ScrollView>
      <View style={[s.checkoutBar,{paddingBottom:insets.bottom+SPACING.sm}]}>
        <View><Text variant="titleMedium" style={s.checkTotal}>{formatNPR(total)}</Text><Text variant="labelSmall" style={s.checkSub}>{items.length} items</Text></View>
        <Button mode="contained" onPress={()=>router.push({pathname:'/checkout',params:{couponCode:appliedCoupon?.code??''}})} style={s.checkBtn} contentStyle={s.checkBtnC}>Proceed to Checkout</Button>
      </View>
    </View>
  );
}
function PR({ label, value, green, note }: { label:string; value:number; green?:boolean; note?:string }) {
  return (
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginVertical:3}}>
      <View><Text variant="bodySmall" style={{color:'#555'}}>{label}</Text>{note&&<Text variant="labelSmall" style={{color:'#999'}}>{note}</Text>}</View>
      <Text variant="bodySmall" style={{color:green?'#2E7D32':'#333',fontWeight:green?'600':'400'}}>{value<0?'- '+formatNPR(-value):formatNPR(value)}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  header:{backgroundColor:'#fff',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  headerTitle:{fontWeight:'700',color:'#222'},
  scroll:{flex:1,padding:SPACING.md},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md},
  emptyTxt:{color:'#555',fontWeight:'600'},
  cartItem:{flexDirection:'row',backgroundColor:'#fff',borderRadius:RADIUS.md,marginBottom:SPACING.sm,padding:SPACING.sm,gap:SPACING.sm},
  itemImg:{width:80,height:80,borderRadius:RADIUS.sm},
  itemInfo:{flex:1,gap:3},
  itemTitle:{color:'#333',lineHeight:16},
  varLabel:{color:'#888'},
  priceRow:{flexDirection:'row',alignItems:'center',gap:6},
  price:{color:theme.colors.primary,fontWeight:'700'},
  mrp:{color:'#bbb',fontSize:12,textDecorationLine:'line-through'},
  qtyRow:{flexDirection:'row',alignItems:'center',gap:SPACING.sm},
  qBtn:{width:28,height:28,borderRadius:RADIUS.sm,backgroundColor:'#f0f0f0',justifyContent:'center',alignItems:'center'},
  qty:{fontWeight:'700',minWidth:24,textAlign:'center'},
  removeBtn:{padding:4,justifyContent:'flex-start'},
  section:{backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,marginBottom:SPACING.sm},
  secTitle:{fontWeight:'700',color:'#222',marginBottom:SPACING.sm},
  couponRow:{flexDirection:'row',gap:SPACING.sm,alignItems:'center'},
  couponInput:{flex:1,height:44},
  couponErr:{color:theme.colors.error,fontSize:12,marginTop:4},
  applied:{flexDirection:'row',alignItems:'center',gap:SPACING.sm},
  appliedTxt:{flex:1,color:'#2E7D32',fontWeight:'600'},
  totalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  totalLabel:{fontWeight:'700',color:'#222'},
  totalVal:{fontWeight:'700',color:theme.colors.primary},
  codNote:{color:'#888',marginTop:4},
  checkoutBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#fff',paddingHorizontal:SPACING.lg,paddingTop:SPACING.md,borderTopWidth:1,borderTopColor:'#f0f0f0'},
  checkTotal:{fontWeight:'700',color:'#222'},
  checkSub:{color:'#888'},
  checkBtn:{flex:1,marginLeft:SPACING.lg},
  checkBtnC:{paddingVertical:4},
});
