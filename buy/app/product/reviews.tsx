import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReviews } from '../../src/hooks/useProducts';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { timeAgo } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{id:string}>();
  const { data: reviews=[] } = useReviews(id);
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title={"Reviews ("+reviews.length+")"}/>
      <FlatList data={reviews} keyExtractor={i=>i.id} contentContainerStyle={s.list}
        renderItem={({item})=>(
          <Surface style={s.card} elevation={1}>
            <View style={s.header}><View style={s.avatar}><Text style={s.avatarTxt}>{item.userName.charAt(0)}</Text></View><View style={s.meta}><Text variant="labelMedium" style={s.name}>{item.userName}</Text><View style={s.stars}>{[1,2,3,4,5].map(n=><Ionicons key={n} name="star" size={13} color={n<=item.rating?'#FFA000':'#e0e0e0'}/>)}</View></View><Text variant="labelSmall" style={s.date}>{timeAgo(item.createdAt)}</Text></View>
            <Text variant="bodySmall" style={s.comment}>{item.comment}</Text>
          </Surface>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  list:{padding:SPACING.md,gap:SPACING.sm},
  card:{borderRadius:RADIUS.md,padding:SPACING.md,backgroundColor:'#fff'},
  header:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:SPACING.sm},
  avatar:{width:36,height:36,borderRadius:999,backgroundColor:theme.colors.primary,justifyContent:'center',alignItems:'center'},
  avatarTxt:{color:'#fff',fontWeight:'700'},
  meta:{flex:1},
  name:{fontWeight:'600',color:'#333'},
  stars:{flexDirection:'row',gap:2},
  date:{color:'#bbb'},
  comment:{color:'#555',lineHeight:20},
});
