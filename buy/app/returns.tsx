import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';
import { useReturns } from '../src/hooks/useOrders';
import { formatDate } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';
const STATUS_COLORS: Record<string,string> = { pending:'#FF8F00', approved:'#2E7D32', rejected:'#B71C1C', picked:'#00838F', refunded:'#37474F' };
export default function ReturnsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: returns=[] } = useReturns(user?.id??'');
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Returns & Refunds"/>
      <FlatList data={returns} keyExtractor={i=>i.id} contentContainerStyle={s.list}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="refresh-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>No return requests</Text></View>}
        renderItem={({item})=>(
          <Surface style={s.card} elevation={1}>
            <View style={s.cardHeader}><Text variant="labelMedium" style={s.orderId}>Order #{item.orderId.slice(-8).toUpperCase()}</Text><Chip style={{backgroundColor:STATUS_COLORS[item.status]+'20'}} textStyle={{color:STATUS_COLORS[item.status],fontSize:11,fontWeight:'700'}} compact>{item.status.toUpperCase()}</Chip></View>
            <Text variant="bodySmall" style={s.reason}>Reason: {item.reason.replace(/_/g,' ')}</Text>
            <Text variant="bodySmall" style={s.desc} numberOfLines={2}>{item.description}</Text>
            <Text variant="labelSmall" style={s.date}>Submitted: {formatDate(item.createdAt)}</Text>
          </Surface>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  list:{padding:SPACING.md,gap:SPACING.sm,flexGrow:1},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  emptyTxt:{color:'#555',fontWeight:'600'},
  card:{backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,gap:SPACING.xs},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.xs},
  orderId:{fontWeight:'700',color:'#333'},
  reason:{color:'#555',textTransform:'capitalize'},
  desc:{color:'#888'},
  date:{color:'#bbb'},
});
