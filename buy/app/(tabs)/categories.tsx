import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../../src/hooks/useProducts';
import { SPACING, RADIUS, theme } from '../../src/theme';
export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cats = [] } = useCategories();
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Categories</Text></View>
      <FlatList data={cats} keyExtractor={i=>i.id} numColumns={2} contentContainerStyle={s.grid} columnWrapperStyle={s.col}
        renderItem={({item})=>(
          <TouchableOpacity style={s.cardWrap} onPress={()=>router.push('/category/'+item.id)} activeOpacity={0.8}>
            <Surface style={s.card} elevation={1}>
              <Image source={{uri:item.imageUrl}} style={s.img} contentFit="cover"/>
              <View style={s.label}><Text variant="titleSmall" style={s.labelTxt}>{item.name}</Text></View>
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
  grid:{padding:SPACING.md},
  col:{gap:SPACING.md},
  cardWrap:{flex:1,marginBottom:SPACING.md},
  card:{borderRadius:RADIUS.lg,overflow:'hidden',backgroundColor:'#fff'},
  img:{width:'100%',aspectRatio:1.5},
  label:{padding:SPACING.sm,backgroundColor:'#fff'},
  labelTxt:{fontWeight:'600',color:'#222',textAlign:'center'},
});
