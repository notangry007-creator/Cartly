import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product, ZoneId } from '../../types';
import { formatNPR, getDiscountPercent, getBestETA } from '../../utils/helpers';
import { SPACING, RADIUS, theme } from '../../theme';
interface Props { product: Product; zoneId: ZoneId; onPress: () => void; }
export default function ProductCard({ product, zoneId, onPress }: Props) {
  const discount = getDiscountPercent(product.basePrice, product.baseMrp);
  const eta = getBestETA(product, zoneId);
  const cod = product.codAvailableZones.includes(zoneId);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.wrap}>
      <Surface style={s.card} elevation={1}>
        <View style={s.imgWrap}>
          <Image source={{ uri: product.images[0] }} style={s.img} contentFit="cover" />
          {discount > 0 && <View style={s.disc}><Text style={s.discTxt}>{discount}% off</Text></View>}
          {product.isAuthenticated && <View style={s.auth}><Ionicons name="shield-checkmark" size={10} color="#fff" /></View>}
        </View>
        <View style={s.info}>
          <Text variant="labelMedium" numberOfLines={2} style={s.title}>{product.title}</Text>
          <View style={s.priceRow}>
            <Text variant="titleSmall" style={s.price}>{formatNPR(product.basePrice)}</Text>
            {discount > 0 && <Text style={s.mrp}>{formatNPR(product.baseMrp)}</Text>}
          </View>
          <View style={s.ratingRow}>
            <Ionicons name="star" size={12} color="#FFA000" />
            <Text variant="labelSmall" style={s.rating}>{product.rating} ({product.totalReviews})</Text>
          </View>
          <View style={s.badges}>
            {cod && <View style={s.codBadge}><Text style={s.codTxt}>COD</Text></View>}
            <Text variant="labelSmall" style={s.eta}>{eta}</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, margin: SPACING.xs },
  card: { borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#fff' },
  imgWrap: { position: 'relative' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  disc: { position:'absolute', top:6, left:6, backgroundColor:theme.colors.primary, paddingHorizontal:5, paddingVertical:2, borderRadius:RADIUS.sm },
  discTxt: { color:'#fff', fontSize:10, fontWeight:'700' },
  auth: { position:'absolute', top:6, right:6, backgroundColor:'#2E7D32', padding:3, borderRadius:999 },
  info: { padding: SPACING.sm },
  title: { color:'#333', lineHeight:16, marginBottom:4 },
  priceRow: { flexDirection:'row', alignItems:'center', gap:4, marginBottom:2 },
  price: { color:theme.colors.primary, fontWeight:'700' },
  mrp: { color:'#bbb', fontSize:11, textDecorationLine:'line-through' },
  ratingRow: { flexDirection:'row', alignItems:'center', gap:3, marginBottom:4 },
  rating: { color:'#666' },
  badges: { flexDirection:'row', alignItems:'center', gap:4, flexWrap:'wrap' },
  codBadge: { backgroundColor:'#E8F5E9', paddingHorizontal:5, paddingVertical:2, borderRadius:RADIUS.sm, borderWidth:1, borderColor:'#4CAF50' },
  codTxt: { color:'#2E7D32', fontSize:9, fontWeight:'700' },
  eta: { color:'#888', fontSize:10 },
});
