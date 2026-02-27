import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProducts } from '../src/hooks/useProducts';
import { useZoneStore } from '../src/stores/zoneStore';
import { getItem, setItem, STORAGE_KEYS } from '../src/utils/storage';
import ProductCard from '../src/components/common/ProductCard';
import { ProductGridSkeleton } from '../src/components/common/SkeletonLoader';
import { theme, SPACING, RADIUS } from '../src/theme';
type Sort = 'relevance'|'price_asc'|'price_desc'|'rating'|'fastest';
export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{q?:string;fastDelivery?:string;verified?:string;sort?:string}>();
  const { zoneId } = useZoneStore();
  const [query, setQuery] = useState(params.q??'');
  const [debQ, setDebQ] = useState(params.q??'');
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [codOnly, setCodOnly] = useState(false);
  const [fast, setFast] = useState(params.fastDelivery==='1');
  const [verified, setVerified] = useState(params.verified==='1');
  const [inStock, setInStock] = useState(true);
  const [minRating, setMinRating] = useState<number|undefined>();
  const [sortBy, setSortBy] = useState<Sort>((params.sort as Sort)??'relevance');
  useEffect(()=>{ const t=setTimeout(()=>setDebQ(query),400); return ()=>clearTimeout(t); },[query]);
  useEffect(()=>{ getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES).then(r=>setRecent(r??[])); },[]);
  const { data: products=[], isLoading } = useProducts({ search:debQ||undefined, zoneId, isFastDelivery:fast||undefined, isAuthenticated:verified||undefined, inStock:inStock||undefined, minRating, codAvailable:codOnly||undefined, sortBy });
  async function doSearch(q: string) {
    setQuery(q); setDebQ(q);
    if(q.trim()){const u=[q,...recent.filter(r=>r!==q)].slice(0,8);setRecent(u);await setItem(STORAGE_KEYS.RECENT_SEARCHES,u);}
  }
  const SORTS: {v:Sort;l:string}[] = [{v:'relevance',l:'Relevance'},{v:'price_asc',l:'Price Low-High'},{v:'price_desc',l:'Price High-Low'},{v:'rating',l:'Top Rated'},{v:'fastest',l:'Fastest'}];
  const showSug = !debQ;
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.searchHeader}>
        <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color="#333"/></TouchableOpacity>
        <Searchbar placeholder="Search products..." value={query} onChangeText={setQuery} onSubmitEditing={()=>doSearch(query)} style={s.searchBar} autoFocus onClearIconPress={()=>{setQuery('');setDebQ('');}}/>
        <TouchableOpacity onPress={()=>setShowFilters(!showFilters)} style={s.filterBtn}><Ionicons name="options" size={22} color={showFilters?theme.colors.primary:'#333'}/></TouchableOpacity>
      </View>
      {showFilters&&(
        <View style={s.filtersPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fScroll}>
            <Chip selected={codOnly} onPress={()=>setCodOnly(!codOnly)} style={[s.fc,codOnly&&s.fcA]} compact icon="cash">COD Only</Chip>
            <Chip selected={fast} onPress={()=>setFast(!fast)} style={[s.fc,fast&&s.fcA]} compact icon="flash">Fast</Chip>
            <Chip selected={verified} onPress={()=>setVerified(!verified)} style={[s.fc,verified&&s.fcA]} compact icon="shield-checkmark">Verified</Chip>
            <Chip selected={inStock} onPress={()=>setInStock(!inStock)} style={[s.fc,inStock&&s.fcA]} compact>In Stock</Chip>
            {[4,3].map(r=><Chip key={r} selected={minRating===r} onPress={()=>setMinRating(minRating===r?undefined:r)} style={[s.fc,minRating===r&&s.fcA]} compact>{r}★+</Chip>)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fScroll}>
            {SORTS.map(opt=><Chip key={opt.v} selected={sortBy===opt.v} onPress={()=>setSortBy(opt.v)} style={[s.fc,sortBy===opt.v&&s.fcA]} compact>{opt.l}</Chip>)}
          </ScrollView>
        </View>
      )}
      {showSug?(
        <ScrollView style={s.suggestions}>
          {recent.length>0&&<><View style={s.sugHeader}><Text variant="labelMedium" style={s.sugTitle}>Recent</Text><TouchableOpacity onPress={async()=>{setRecent([]);await setItem(STORAGE_KEYS.RECENT_SEARCHES,[]);}}><Text variant="labelSmall" style={{color:theme.colors.primary}}>Clear</Text></TouchableOpacity></View>{recent.map(r=><TouchableOpacity key={r} style={s.sugItem} onPress={()=>doSearch(r)}><Ionicons name="time-outline" size={16} color="#999"/><Text variant="bodyMedium" style={s.sugTxt}>{r}</Text></TouchableOpacity>)}</>}
          <View style={s.sugHeader}><Text variant="labelMedium" style={s.sugTitle}>Popular</Text></View>
          {['Samsung phone','Sony headphones','Organic honey','iPhone 15','Yoga mat'].map(p=><TouchableOpacity key={p} style={s.sugItem} onPress={()=>doSearch(p)}><Ionicons name="trending-up" size={16} color={theme.colors.primary}/><Text variant="bodyMedium" style={s.sugTxt}>{p}</Text></TouchableOpacity>)}
        </ScrollView>
      ):isLoading?(
        <ProductGridSkeleton count={6}/>
      ):products.length===0?(
        <View style={s.empty}><Ionicons name="search-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>No results for "{debQ}"</Text></View>
      ):(
        <>
          <View style={s.resHeader}><Text variant="labelMedium" style={{color:'#888'}}>{products.length} results</Text></View>
          <FlatList data={products} keyExtractor={i=>i.id} numColumns={2} contentContainerStyle={s.grid} columnWrapperStyle={s.row} renderItem={({item})=><ProductCard product={item} zoneId={zoneId} onPress={()=>router.push('/product/'+item.id)}/>}/>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  searchHeader:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',paddingHorizontal:SPACING.sm,paddingVertical:SPACING.sm,gap:SPACING.xs,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  backBtn:{padding:SPACING.xs},
  searchBar:{flex:1,elevation:0,backgroundColor:'#f5f5f5',height:44},
  filterBtn:{padding:SPACING.xs},
  filtersPanel:{backgroundColor:'#fff',paddingVertical:SPACING.sm,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  fScroll:{paddingHorizontal:SPACING.md,marginBottom:SPACING.xs},
  fc:{marginRight:SPACING.xs,backgroundColor:'#f0f0f0'},
  fcA:{backgroundColor:theme.colors.primaryContainer},
  suggestions:{flex:1,backgroundColor:'#fff'},
  sugHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:SPACING.lg,paddingTop:SPACING.md,paddingBottom:SPACING.xs},
  sugTitle:{color:'#888',fontWeight:'700',textTransform:'uppercase'},
  sugItem:{flexDirection:'row',alignItems:'center',gap:SPACING.md,paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md},
  sugTxt:{color:'#333'},
  loading:{flex:1,justifyContent:'center',alignItems:'center'},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  emptyTxt:{color:'#555',fontWeight:'600',textAlign:'center'},
  resHeader:{paddingHorizontal:SPACING.lg,paddingVertical:SPACING.sm,backgroundColor:'#fff'},
  grid:{padding:SPACING.sm},
  row:{gap:0},
});
