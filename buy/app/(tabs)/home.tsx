import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Dimensions } from 'react-native';
import { Text, Searchbar, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneStore } from '../../src/stores/zoneStore';
import { useProducts, useCategories } from '../../src/hooks/useProducts';
import { ZONES } from '../../src/data/zones';
import { BANNERS } from '../../src/data/seed';
import { IMG } from '../../src/data/images';
import ProductCard from '../../src/components/common/ProductCard';
import CachedImage from '../../src/components/common/CachedImage';
import { BannerSkeleton, ProductRowSkeleton } from '../../src/components/common/SkeletonLoader';
import { theme, SPACING, RADIUS } from '../../src/theme';
import { ZoneId } from '../../src/types';
const { width: W } = Dimensions.get('window');
function SectionHeader({ title, onSeeAll }: { title:string; onSeeAll?:()=>void }) {
  return (
    <View style={sh.row}>
      <Text variant="titleMedium" style={sh.title}>{title}</Text>
      {onSeeAll&&<TouchableOpacity onPress={onSeeAll}><Text variant="labelMedium" style={sh.all}>See All</Text></TouchableOpacity>}
    </View>
  );
}
const sh = StyleSheet.create({ row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:SPACING.lg,marginTop:SPACING.lg,marginBottom:SPACING.sm}, title:{fontWeight:'700',color:'#222'}, all:{color:theme.colors.primary} });
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { zoneId, setZone } = useZoneStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: fastProducts, isLoading: loadingFast } = useProducts({ zoneId, isFastDelivery:true, inStock:true });
  const { data: verifiedProducts, isLoading: loadingVerified } = useProducts({ zoneId, isAuthenticated:true, inStock:true });
  const { data: dealProducts, isLoading: loadingDeals } = useProducts({ sortBy:'price_asc', inStock:true });
  const onRefresh = useCallback(async()=>{ setRefreshing(true); await qc.invalidateQueries(); setRefreshing(false); },[qc]);
  const curZone = ZONES.find(z=>z.id===zoneId);
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.zoneBtn} onPress={()=>setShowZonePicker(true)}>
          <Ionicons name="location" size={16} color={theme.colors.primary}/>
          <Text variant="labelMedium" style={s.zoneName} numberOfLines={1}>{curZone?.name??'Select Zone'}</Text>
          <Ionicons name="chevron-down" size={14} color="#666"/>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>router.push('/notifications')}><Ionicons name="notifications-outline" size={22} color="#333"/></TouchableOpacity>
      </View>
      <TouchableOpacity onPress={()=>router.push('/search')} style={s.searchWrap} activeOpacity={0.8}>
        <Searchbar placeholder="Search products..." value="" style={s.searchBar} editable={false}/>
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]}/>}>
        {/* ── Banners with CachedImage ── */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{marginTop:SPACING.sm}} onScroll={e=>setBannerIdx(Math.round(e.nativeEvent.contentOffset.x/(W-SPACING.lg*2)))} scrollEventThrottle={16}>
          {BANNERS.map((b, idx)=>{
            const imgData = (IMG.banners as Record<string, {uri:string;blurhash:string}>)[b.id];
            return (
              <TouchableOpacity key={b.id} activeOpacity={0.9} onPress={()=>{ if(b.targetType==='category'&&b.targetId) router.push('/category/'+b.targetId); else if(b.targetType==='search') router.push({pathname:'/search',params:{q:b.targetQuery}}); }}>
                <View style={s.banner}>
                  <CachedImage uri={imgData?.uri ?? b.imageUrl} blurhash={imgData?.blurhash} style={s.bannerImg}/>
                  <View style={s.bannerOvl}><Text style={s.bannerTitle}>{b.title}</Text>{b.subtitle&&<Text style={s.bannerSub}>{b.subtitle}</Text>}</View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={s.dots}>{BANNERS.map((_,i)=><View key={i} style={[s.dot,i===bannerIdx&&s.dotA]}/>)}</View>

        {/* ── Categories with CachedImage ── */}
        <SectionHeader title="Categories" onSeeAll={()=>router.push('/(tabs)/categories')}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {loadingCats
            ? Array.from({length:5}).map((_,i)=><View key={i} style={s.catItem}><View style={[s.catImgWrap,{width:56,height:56,borderRadius:28,backgroundColor:'#e0e0e0'}]}/></View>)
            : (categories??[]).map(cat=>{
              const imgData = (IMG.categories as Record<string, {uri:string;blurhash:string}>)[cat.id];
              return (
                <TouchableOpacity key={cat.id} style={s.catItem} onPress={()=>router.push('/category/'+cat.id)}>
                  <Surface style={s.catImgWrap} elevation={1}>
                    <CachedImage uri={imgData?.uri ?? cat.imageUrl} blurhash={imgData?.blurhash} style={s.catImg}/>
                  </Surface>
                  <Text variant="labelSmall" style={s.catLabel} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })
          }
        </ScrollView>

        {/* ── Fast Delivery with skeleton ── */}
        {(zoneId==='ktm_core'||zoneId==='ktm_outer')&&<>
          <SectionHeader title="⚡ Fast Delivery" onSeeAll={()=>router.push({pathname:'/search',params:{fastDelivery:'1'}})}/>
          {loadingFast
            ? <ProductRowSkeleton count={3}/>
            : <FlatList data={(fastProducts??[]).slice(0,6)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={i=>i.id} contentContainerStyle={s.pRow} renderItem={({item})=><View style={{width:160}}><ProductCard product={item} zoneId={zoneId} onPress={()=>router.push('/product/'+item.id)}/></View>}/>
          }
        </>}

        {/* ── Verified Sellers with skeleton ── */}
        <SectionHeader title="✅ Verified Sellers" onSeeAll={()=>router.push({pathname:'/search',params:{verified:'1'}})}/>
        {loadingVerified
          ? <ProductRowSkeleton count={3}/>
          : <FlatList data={(verifiedProducts??[]).slice(0,6)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={i=>i.id} contentContainerStyle={s.pRow} renderItem={({item})=><View style={{width:160}}><ProductCard product={item} zoneId={zoneId} onPress={()=>router.push('/product/'+item.id)}/></View>}/>
        }

        {/* ── Top Deals with skeleton ── */}
        <SectionHeader title="🔥 Top Deals" onSeeAll={()=>router.push({pathname:'/search',params:{sort:'price_asc'}})}/>
        {loadingDeals
          ? <ProductRowSkeleton count={3}/>
          : <FlatList data={(dealProducts??[]).slice(0,6)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={i=>i.id} contentContainerStyle={s.pRow} renderItem={({item})=><View style={{width:160}}><ProductCard product={item} zoneId={zoneId} onPress={()=>router.push('/product/'+item.id)}/></View>}/>
        }
        <View style={{height:SPACING.xl}}/>
      </ScrollView>
      {showZonePicker&&(
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={()=>setShowZonePicker(false)}>
          <TouchableOpacity style={s.zoneModal} activeOpacity={1} onPress={e=>e.stopPropagation()}>
            <Text variant="titleMedium" style={s.zoneModalTitle}>Select Delivery Zone</Text>
            {ZONES.map(zone=>(
              <TouchableOpacity key={zone.id} style={[s.zoneOpt,zoneId===zone.id&&s.zoneOptA]} onPress={async()=>{ await setZone(zone.id as ZoneId); setShowZonePicker(false); }}>
                <Ionicons name={zoneId===zone.id?'radio-button-on':'radio-button-off'} size={18} color={zoneId===zone.id?theme.colors.primary:'#ccc'}/>
                <View style={{marginLeft:SPACING.sm}}>
                  <Text variant="bodyMedium" style={s.zoneOptName}>{zone.name}</Text>
                  <Text variant="labelSmall" style={s.zoneOptSub}>{zone.codAvailable?'COD available':'Prepaid only'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.sm,backgroundColor:'#fff'},
  zoneBtn:{flexDirection:'row',alignItems:'center',flex:1,gap:4},
  zoneName:{color:'#333',fontWeight:'600',flex:1},
  searchWrap:{paddingHorizontal:SPACING.md,paddingVertical:SPACING.xs,backgroundColor:'#fff'},
  searchBar:{elevation:0,backgroundColor:'#f5f5f5',height:44},
  banner:{width:W-SPACING.lg*2,height:160,marginHorizontal:SPACING.lg,borderRadius:RADIUS.lg,overflow:'hidden'},
  bannerImg:{width:'100%',height:'100%'},
  bannerOvl:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.45)',padding:SPACING.md},
  bannerTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  bannerSub:{color:'rgba(255,255,255,0.85)',fontSize:13},
  dots:{flexDirection:'row',justifyContent:'center',gap:5,marginTop:SPACING.sm},
  dot:{width:6,height:6,borderRadius:3,backgroundColor:'#ddd'},
  dotA:{backgroundColor:theme.colors.primary,width:14},
  catRow:{paddingHorizontal:SPACING.md,gap:SPACING.sm},
  catItem:{alignItems:'center',width:70},
  catImgWrap:{borderRadius:999,overflow:'hidden',marginBottom:4},
  catImg:{width:56,height:56,borderRadius:999},
  catLabel:{color:'#444',textAlign:'center',lineHeight:14},
  pRow:{paddingHorizontal:SPACING.md},
  overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},
  zoneModal:{backgroundColor:'#fff',borderTopLeftRadius:RADIUS.xl,borderTopRightRadius:RADIUS.xl,padding:SPACING.xl,gap:SPACING.sm},
  zoneModalTitle:{fontWeight:'700',marginBottom:SPACING.sm},
  zoneOpt:{flexDirection:'row',alignItems:'center',padding:SPACING.md,borderRadius:RADIUS.md,borderWidth:1.5,borderColor:'#e0e0e0'},
  zoneOptA:{borderColor:theme.colors.primary,backgroundColor:'#FFF5F5'},
  zoneOptName:{fontWeight:'600',color:'#222'},
  zoneOptSub:{color:'#888'},
});
