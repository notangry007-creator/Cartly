import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Linking, Share } from 'react-native';
import { Text, Button, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProduct, useSeller, useReviews } from '../../src/hooks/useProducts';
import { useCartStore } from '../../src/stores/cartStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useZoneStore } from '../../src/stores/zoneStore';
import { formatNPR, getDiscountPercent, getBestETA, getAvailableDeliveryOptions, getDeliveryFee, getETA, timeAgo } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
import { DeliveryOption } from '../../src/types';
const { width: W } = Dimensions.get('window');
export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{id:string}>();
  const { user } = useAuthStore();
  const { zoneId } = useZoneStore();
  const { addItem } = useCartStore();
  const { data: product, isLoading } = useProduct(id);
  const { data: seller } = useSeller(product?.sellerId??'');
  const { data: reviews=[] } = useReviews(id);
  const [selVariantId, setSelVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  if (isLoading) return <View style={[s.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><ActivityIndicator size="large" color={theme.colors.primary}/></View>;
  if (!product) return <View style={[s.container,{paddingTop:insets.top}]}><Text style={{margin:20}}>Product not found</Text></View>;
  const variant = (product.variants.find(v=>v.id===(selVariantId||product.variants[0]?.id)))??product.variants[0];
  const curVid = selVariantId||(product.variants[0]?.id??'');
  const discount = getDiscountPercent(variant?.price??0,variant?.mrp??0);
  const codAvail = product.codAvailableZones.includes(zoneId);
  const dOpts = getAvailableDeliveryOptions(product,zoneId);
  const attrKeys = [...new Set(product.variants.flatMap(v=>Object.keys(v.attributes)))];
  async function addToCart() {
    if(!user){router.push('/(auth)/login');return;}
    setAdding(true); await addItem(user.id,product.id,curVid,qty); setAdding(false);
    Alert.alert('Added to Cart','',[ {text:'Continue Shopping'}, {text:'View Cart',onPress:()=>router.push('/(tabs)/cart')} ]);
  }
  async function buyNow() {
    if(!user){router.push('/(auth)/login');return;}
    await addItem(user.id,product.id,curVid,qty);
    router.push('/checkout');
  }
  return (
    <View style={[s.container,{paddingBottom:insets.bottom}]}>
      <View style={[s.header,{paddingTop:insets.top+SPACING.sm}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.hBtn}><Ionicons name="arrow-back" size={22} color="#333"/></TouchableOpacity>
        <View style={s.hActions}>
          <TouchableOpacity onPress={()=>Share.share({message:product.title+' on Buy app! '+formatNPR(variant?.price??0)})} style={s.hBtn}><Ionicons name="share-social-outline" size={22} color="#333"/></TouchableOpacity>
          <TouchableOpacity onPress={()=>router.push('/(tabs)/cart')} style={s.hBtn}><Ionicons name="bag-outline" size={22} color="#333"/></TouchableOpacity>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.carousel}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={e=>setImgIdx(Math.round(e.nativeEvent.contentOffset.x/W))} scrollEventThrottle={16}>
            {product.images.map((img,i)=><Image key={i} source={{uri:img}} style={s.mainImg} contentFit="cover"/>)}
          </ScrollView>
          <View style={s.dots}>{product.images.map((_,i)=><View key={i} style={[s.dot,i===imgIdx&&s.dotA]}/>)}</View>
          {product.isAuthenticated&&<View style={s.authBadge}><Ionicons name="shield-checkmark" size={14} color="#fff"/><Text style={s.authTxt}>Authenticity Verified</Text></View>}
        </View>
        <View style={s.content}>
          <Text variant="headlineSmall" style={s.title}>{product.title}</Text>
          {product.brand&&<Text variant="labelMedium" style={s.brand}>by {product.brand}</Text>}
          <View style={s.ratingRow}><Ionicons name="star" size={16} color="#FFA000"/><Text variant="titleSmall" style={s.ratingVal}>{product.rating}</Text><Text variant="bodySmall" style={s.ratingCnt}>({product.totalReviews})</Text><TouchableOpacity onPress={()=>router.push({pathname:'/product/reviews',params:{id:product.id}})}><Text variant="labelSmall" style={s.seeReviews}>See all →</Text></TouchableOpacity></View>
          <View style={s.priceRow}><Text variant="headlineMedium" style={s.price}>{formatNPR(variant?.price??product.basePrice)}</Text>{discount>0&&<><Text style={s.mrp}>{formatNPR(variant?.mrp??product.baseMrp)}</Text><View style={s.discTag}><Text style={s.discTxt}>{discount}% OFF</Text></View></>}</View>
          <Divider/>
          <View style={s.delivSec}>
            <Text variant="titleSmall" style={s.secTitle}>Delivery</Text>
            {!dOpts.length?<Text variant="bodySmall" style={{color:'#B71C1C'}}>Not available in your zone</Text>:dOpts.map(opt=>(
              <View key={opt} style={s.dOpt}><Ionicons name={opt==='same_day'?'flash':opt==='next_day'?'bicycle':'cube'} size={16} color={theme.colors.primary}/><Text variant="bodySmall" style={{color:'#444'}}>{getETA(zoneId,opt)} · {formatNPR(getDeliveryFee(zoneId,opt))}</Text></View>
            ))}
            <View style={s.codRow}><Ionicons name={codAvail?'cash':'close-circle'} size={14} color={codAvail?'#2E7D32':'#B71C1C'}/><Text style={[s.codTxt,!codAvail&&{color:'#B71C1C'}]}>{codAvail?'Cash on Delivery available':'COD not available in your zone'}</Text></View>
          </View>
          <Divider/>
          {attrKeys.length>0&&<View style={s.varSec}>
            {attrKeys.map(key=>{
              return (
                <View key={key}>
                  <Text variant="titleSmall" style={s.varKey}>{key.charAt(0).toUpperCase()+key.slice(1)}: <Text style={s.varSel}>{variant?.attributes[key]??''}</Text></Text>
                  <View style={s.varRow}>
                    {product.variants.map(v=>{const isSel=v.id===curVid;const oos=v.stock===0;return(
                      <TouchableOpacity key={v.id} onPress={()=>!oos&&setSelVariantId(v.id)} style={[s.vChip,isSel&&s.vChipSel,oos&&s.vChipOOS]} disabled={oos}>
                        <Text style={[s.vChipTxt,isSel&&s.vChipTxtSel,oos&&s.vChipTxtOOS]}>{v.attributes[key]}</Text>
                      </TouchableOpacity>
                    );})}
                  </View>
                </View>
              );
            })}
          </View>}
          <View style={s.qtyRow}><Text variant="titleSmall" style={s.secTitle}>Quantity</Text><View style={s.qtyCtrl}><TouchableOpacity style={s.qBtn} onPress={()=>setQty(Math.max(1,qty-1))}><Ionicons name="remove" size={18} color="#333"/></TouchableOpacity><Text variant="titleMedium" style={s.qVal}>{qty}</Text><TouchableOpacity style={s.qBtn} onPress={()=>{if(qty<(variant?.stock??1))setQty(qty+1);}} disabled={qty>=(variant?.stock??1)}><Ionicons name="add" size={18} color={qty>=(variant?.stock??1)?'#ccc':'#333'}/></TouchableOpacity></View><Text variant="labelSmall" style={s.stockTxt}>{variant?.stock??0} in stock</Text></View>
          <Divider/>
          {seller&&<Surface style={s.sellerCard} elevation={1}>
            <View style={s.sellerHeader}><Image source={{uri:seller.logoUrl}} style={s.sellerLogo} contentFit="cover"/><View style={s.sellerInfo}><View style={s.sellerNameRow}><Text variant="titleSmall" style={s.sellerName}>{seller.name}</Text>{seller.isVerified&&<View style={s.verifiedBadge}><Ionicons name="checkmark-circle" size={14} color="#1565C0"/><Text style={s.verTxt}>Verified</Text></View>}</View><Text variant="labelSmall" style={s.fulfill}>{seller.fulfillmentType==='buy_fulfilled'?'✅ Buy Fulfilled':'📦 Seller Fulfilled'}</Text><View style={s.sRating}><Ionicons name="star" size={12} color="#FFA000"/><Text variant="labelSmall" style={{color:'#666'}}>{seller.rating} ({seller.totalReviews})</Text></View></View></View>
            <View style={s.sellerActions}>
              <TouchableOpacity style={s.sABtn} onPress={()=>Linking.openURL('tel:'+seller.phone)}><Ionicons name="call" size={16} color={theme.colors.primary}/><Text style={s.sABtnTxt}>Call</Text></TouchableOpacity>
              <TouchableOpacity style={s.sABtn} onPress={()=>Linking.openURL('https://wa.me/977'+seller.whatsapp+'?text=Hi about '+encodeURIComponent(product.title))}><Ionicons name="logo-whatsapp" size={16} color="#25D366"/><Text style={s.sABtnTxt}>WhatsApp</Text></TouchableOpacity>
            </View>
          </Surface>}
          <Surface style={s.trustSection} elevation={1}>
            <Text variant="titleSmall" style={s.secTitle}>Why Buy with Trust</Text>
            <TI icon="shield-checkmark" text={product.isAuthenticated?'Authenticity Verified':'Not Verified'} ok={product.isAuthenticated}/>
            <TI icon="refresh-circle" text="Easy 7-day Returns" ok/>
            <TI icon="headset" text="24/7 Support" ok/>
            <TI icon="cash" text={codAvail?'COD Available':'Prepaid Only'} ok={codAvail}/>
            <View style={s.retPolicy}><Text variant="labelSmall" style={{color:'#555',fontWeight:'600'}}>Return Policy</Text><Text variant="bodySmall" style={{color:'#666',lineHeight:18,marginTop:2}}>{seller?.returnPolicy??'Standard 7-day return policy.'}</Text></View>
          </Surface>
          <View style={s.descSec}><Text variant="titleSmall" style={s.secTitle}>Description</Text><Text variant="bodySmall" style={{color:'#555',lineHeight:22}}>{product.description}</Text></View>
          <View style={s.reviewsSec}>
            <View style={s.reviewsHeader}><Text variant="titleSmall" style={s.secTitle}>Reviews ({reviews.length})</Text><TouchableOpacity onPress={()=>router.push({pathname:'/product/reviews',params:{id:product.id}})}><Text variant="labelSmall" style={{color:theme.colors.primary}}>See all →</Text></TouchableOpacity></View>
            {reviews.slice(0,3).map(rev=>(
              <Surface key={rev.id} style={s.revCard} elevation={0}>
                <View style={s.revHeader}><View style={s.revAvatar}><Text style={s.revAvatarTxt}>{rev.userName.charAt(0)}</Text></View><View style={s.revMeta}><Text variant="labelMedium" style={{fontWeight:'600',color:'#333'}}>{rev.userName}</Text><View style={{flexDirection:'row',gap:2}}>{[1,2,3,4,5].map(s2=><Ionicons key={s2} name="star" size={12} color={s2<=rev.rating?'#FFA000':'#e0e0e0'}/>)}</View></View><Text variant="labelSmall" style={{color:'#bbb'}}>{timeAgo(rev.createdAt)}</Text></View>
                <Text variant="bodySmall" style={{color:'#555',lineHeight:18}}>{rev.comment}</Text>
              </Surface>
            ))}
          </View>
          <View style={{height:100}}/>
        </View>
      </ScrollView>
      <View style={[s.bottomBar,{paddingBottom:insets.bottom+SPACING.sm}]}>
        <Button mode="outlined" onPress={addToCart} style={s.addBtn} loading={adding} disabled={!product.inStock||(variant?.stock??0)===0}>Add to Cart</Button>
        <Button mode="contained" onPress={buyNow} style={s.buyBtn} disabled={!product.inStock||(variant?.stock??0)===0}>{product.inStock?'Buy Now':'Out of Stock'}</Button>
      </View>
    </View>
  );
}
function TI({ icon, text, ok }: { icon:string; text:string; ok:boolean }) {
  return <View style={{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:6}}><Ionicons name={ok?icon as any:'close-circle'} size={16} color={ok?'#2E7D32':'#B71C1C'}/><Text variant="bodySmall" style={{color:ok?'#444':'#B71C1C'}}>{text}</Text></View>;
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff'},
  header:{position:'absolute',top:0,left:0,right:0,zIndex:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:SPACING.sm,paddingBottom:SPACING.sm},
  hBtn:{width:38,height:38,borderRadius:999,backgroundColor:'rgba(255,255,255,0.9)',justifyContent:'center',alignItems:'center'},
  hActions:{flexDirection:'row',gap:SPACING.sm},
  carousel:{width:W,position:'relative'},
  mainImg:{width:W,height:W,backgroundColor:'#f0f0f0'},
  dots:{flexDirection:'row',justifyContent:'center',gap:5,marginVertical:SPACING.sm},
  dot:{width:6,height:6,borderRadius:3,backgroundColor:'#ddd'},
  dotA:{backgroundColor:theme.colors.primary,width:14},
  authBadge:{position:'absolute',bottom:40,left:SPACING.md,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#2E7D32',paddingHorizontal:SPACING.sm,paddingVertical:4,borderRadius:999},
  authTxt:{color:'#fff',fontSize:11,fontWeight:'600'},
  content:{padding:SPACING.lg},
  title:{fontWeight:'700',color:'#222',lineHeight:30},
  brand:{color:'#888',marginTop:2},
  ratingRow:{flexDirection:'row',alignItems:'center',gap:6,marginVertical:SPACING.sm},
  ratingVal:{fontWeight:'700',color:'#333'},
  ratingCnt:{color:'#888'},
  seeReviews:{color:theme.colors.primary},
  priceRow:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:SPACING.md},
  price:{fontWeight:'800',color:theme.colors.primary},
  mrp:{color:'#bbb',fontSize:16,textDecorationLine:'line-through'},
  discTag:{backgroundColor:'#E8F5E9',paddingHorizontal:8,paddingVertical:3,borderRadius:RADIUS.sm},
  discTxt:{color:'#2E7D32',fontWeight:'700',fontSize:13},
  secTitle:{fontWeight:'700',color:'#222',marginBottom:SPACING.sm},
  delivSec:{paddingVertical:SPACING.md,gap:6},
  dOpt:{flexDirection:'row',alignItems:'center',gap:SPACING.sm},
  codRow:{flexDirection:'row',alignItems:'center',gap:5,marginTop:4},
  codTxt:{color:'#2E7D32',fontSize:13,fontWeight:'600'},
  varSec:{paddingVertical:SPACING.md,gap:SPACING.sm},
  varKey:{color:'#555',marginBottom:6},
  varSel:{color:'#222',fontWeight:'700'},
  varRow:{flexDirection:'row',flexWrap:'wrap',gap:SPACING.sm},
  vChip:{paddingHorizontal:SPACING.md,paddingVertical:6,borderRadius:RADIUS.sm,borderWidth:1.5,borderColor:'#e0e0e0'},
  vChipSel:{borderColor:theme.colors.primary,backgroundColor:'#FFF5F5'},
  vChipOOS:{borderColor:'#f0f0f0',backgroundColor:'#fafafa'},
  vChipTxt:{color:'#444',fontSize:13},
  vChipTxtSel:{color:theme.colors.primary,fontWeight:'700'},
  vChipTxtOOS:{color:'#ccc'},
  qtyRow:{flexDirection:'row',alignItems:'center',gap:SPACING.md,paddingVertical:SPACING.md},
  qtyCtrl:{flexDirection:'row',alignItems:'center',gap:SPACING.sm},
  qBtn:{width:32,height:32,borderRadius:RADIUS.sm,backgroundColor:'#f0f0f0',justifyContent:'center',alignItems:'center'},
  qVal:{fontWeight:'700',minWidth:28,textAlign:'center'},
  stockTxt:{color:'#888',marginLeft:'auto' as const},
  sellerCard:{borderRadius:RADIUS.lg,padding:SPACING.md,backgroundColor:'#FAFAFA',marginVertical:SPACING.md},
  sellerHeader:{flexDirection:'row',gap:SPACING.md},
  sellerLogo:{width:48,height:48,borderRadius:RADIUS.md,backgroundColor:'#f0f0f0'},
  sellerInfo:{flex:1,gap:2},
  sellerNameRow:{flexDirection:'row',alignItems:'center',gap:SPACING.xs},
  sellerName:{fontWeight:'700',color:'#222'},
  verifiedBadge:{flexDirection:'row',alignItems:'center',gap:2},
  verTxt:{color:'#1565C0',fontSize:11,fontWeight:'600'},
  fulfill:{color:'#666'},
  sRating:{flexDirection:'row',alignItems:'center',gap:3},
  sellerActions:{flexDirection:'row',gap:SPACING.md,marginTop:SPACING.md},
  sABtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:SPACING.xs,paddingVertical:SPACING.sm,borderRadius:RADIUS.md,borderWidth:1,borderColor:'#e0e0e0'},
  sABtnTxt:{color:'#444',fontSize:13,fontWeight:'600'},
  trustSection:{borderRadius:RADIUS.lg,padding:SPACING.md,backgroundColor:'#F8FFF8',marginVertical:SPACING.md},
  retPolicy:{marginTop:SPACING.sm,borderTopWidth:1,borderTopColor:'#e8f5e9',paddingTop:SPACING.sm},
  descSec:{marginVertical:SPACING.md},
  reviewsSec:{marginVertical:SPACING.md},
  reviewsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.sm},
  revCard:{marginBottom:SPACING.sm,padding:SPACING.sm,borderRadius:RADIUS.md,backgroundColor:'#fafafa'},
  revHeader:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:6},
  revAvatar:{width:32,height:32,borderRadius:999,backgroundColor:theme.colors.primary,justifyContent:'center',alignItems:'center'},
  revAvatarTxt:{color:'#fff',fontWeight:'700',fontSize:14},
  revMeta:{flex:1},
  bottomBar:{flexDirection:'row',gap:SPACING.md,padding:SPACING.md,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#f0f0f0'},
  addBtn:{flex:1},
  buyBtn:{flex:1},
});
