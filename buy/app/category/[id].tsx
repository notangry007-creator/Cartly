import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories, useProducts } from '../../src/hooks/useProducts';
import { useZoneStore } from '../../src/stores/zoneStore';
import { CATEGORIES } from '../../src/data/seed';
import ProductCard from '../../src/components/common/ProductCard';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING } from '../../src/theme';
export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{id:string}>();
  const { zoneId } = useZoneStore();
  const [selectedSub, setSelectedSub] = useState<string|null>(null);
  const category = CATEGORIES.find(c=>c.id===id);
  const { data: subcats=[] } = useCategories(id);
  const { data: products=[], isLoading } = useProducts({ categoryId:id, subcategoryId:selectedSub??undefined, zoneId, inStock:true });
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title={category?.name??'Category'}/>
      {subcats.length>0&&(
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.subcatRow} contentContainerStyle={s.subcatContent}>
          <Chip selected={!selectedSub} onPress={()=>setSelectedSub(null)} style={[s.chip,!selectedSub&&s.chipA]} compact>All</Chip>
          {subcats.map(sub=><Chip key={sub.id} selected={selectedSub===sub.id} onPress={()=>setSelectedSub(selectedSub===sub.id?null:sub.id)} style={[s.chip,selectedSub===sub.id&&s.chipA]} compact>{sub.name}</Chip>)}
        </ScrollView>
      )}
      {isLoading?<View style={s.loading}><ActivityIndicator size="large" color={theme.colors.primary}/></View>:(
        <FlatList data={products} keyExtractor={i=>i.id} numColumns={2} contentContainerStyle={s.grid} columnWrapperStyle={s.row} ListEmptyComponent={<View style={s.empty}><Text variant="bodyMedium" style={{color:'#888'}}>No products found</Text></View>} renderItem={({item})=><ProductCard product={item} zoneId={zoneId} onPress={()=>router.push('/product/'+item.id)}/>}/>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  subcatRow:{backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  subcatContent:{padding:SPACING.sm,gap:SPACING.xs},
  chip:{backgroundColor:'#f0f0f0'},
  chipA:{backgroundColor:theme.colors.primaryContainer},
  loading:{flex:1,justifyContent:'center',alignItems:'center'},
  grid:{padding:SPACING.sm},
  row:{gap:0},
  empty:{flex:1,justifyContent:'center',alignItems:'center',padding:SPACING.xxl},
});
