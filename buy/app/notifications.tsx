import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useNotificationStore } from '../src/stores/notificationStore';
import { timeAgo } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';
const ICONS: Record<string,string> = { order:'receipt', wallet:'wallet', return:'return-up-back', promo:'pricetag', system:'notifications' };
const COLORS: Record<string,string> = { order:'#1565C0', wallet:'#2E7D32', return:'#F57F17', promo:theme.colors.primary, system:'#666' };
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, markRead, markAllRead } = useNotificationStore();
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Notifications" right={<TouchableOpacity onPress={()=>user&&markAllRead(user.id)}><Text variant="labelSmall" style={{color:theme.colors.primary}}>Mark all read</Text></TouchableOpacity>}/>
      <FlatList data={notifications} keyExtractor={i=>i.id} contentContainerStyle={s.list}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="notifications-outline" size={64} color="#ccc"/><Text variant="titleMedium" style={s.emptyTxt}>No notifications</Text></View>}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>{ user&&markRead(user.id,item.id); if(item.referenceId&&item.type==='order') router.push('/order/'+item.referenceId); }} activeOpacity={0.8}>
            <Surface style={[s.card,!item.read&&s.cardUnread]} elevation={1}>
              <View style={[s.iconWrap,{backgroundColor:COLORS[item.type]+'20'}]}><Ionicons name={ICONS[item.type] as any} size={22} color={COLORS[item.type]}/></View>
              <View style={s.info}>
                <View style={s.row}><Text variant="labelMedium" style={[s.title,!item.read&&s.titleBold]}>{item.title}</Text>{!item.read&&<View style={s.unreadDot}/>}</View>
                <Text variant="bodySmall" style={s.body} numberOfLines={2}>{item.body}</Text>
                <Text variant="labelSmall" style={s.date}>{timeAgo(item.createdAt)}</Text>
              </View>
            </Surface>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  list:{padding:SPACING.md,gap:SPACING.sm},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  emptyTxt:{color:'#555',fontWeight:'600'},
  card:{flexDirection:'row',backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,gap:SPACING.md},
  cardUnread:{backgroundColor:'#FFFBF5'},
  iconWrap:{width:44,height:44,borderRadius:999,justifyContent:'center',alignItems:'center'},
  info:{flex:1},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  title:{color:'#333'},
  titleBold:{fontWeight:'700',color:'#111'},
  body:{color:'#666',marginTop:2},
  date:{color:'#bbb',marginTop:4},
  unreadDot:{width:8,height:8,borderRadius:4,backgroundColor:theme.colors.primary},
});
