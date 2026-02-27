import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../src/stores/cartStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { theme } from '../../src/theme';
function Badge({ name, focused, count }: { name:string; focused:boolean; count?:number }) {
  return (
    <View>
      <Ionicons name={name as any} size={24} color={focused?theme.colors.primary:'#999'}/>
      {count&&count>0?<View style={s.badge}><Text style={s.badgeTxt}>{count>99?'99+':count}</Text></View>:null}
    </View>
  );
}
export default function TabsLayout() {
  const cartCount = useCartStore(s=>s.getItemCount());
  const unread = useNotificationStore(s=>s.unreadCount);
  return (
    <Tabs screenOptions={{ headerShown:false, tabBarActiveTintColor:theme.colors.primary, tabBarInactiveTintColor:'#999', tabBarStyle:{borderTopColor:'#f0f0f0',height:60,paddingBottom:8}, tabBarLabelStyle:{fontSize:11} }}>
      <Tabs.Screen name="home" options={{ title:'Home', tabBarIcon:({focused})=><Badge name={focused?'home':'home-outline'} focused={focused}/> }}/>
      <Tabs.Screen name="categories" options={{ title:'Categories', tabBarIcon:({focused})=><Badge name={focused?'grid':'grid-outline'} focused={focused}/> }}/>
      <Tabs.Screen name="cart" options={{ title:'Cart', tabBarIcon:({focused})=><Badge name={focused?'bag':'bag-outline'} focused={focused} count={cartCount}/> }}/>
      <Tabs.Screen name="orders" options={{ title:'Orders', tabBarIcon:({focused})=><Badge name={focused?'receipt':'receipt-outline'} focused={focused}/> }}/>
      <Tabs.Screen name="profile" options={{ title:'Profile', tabBarIcon:({focused})=><Badge name={focused?'person':'person-outline'} focused={focused} count={unread}/> }}/>
    </Tabs>
  );
}
const s = StyleSheet.create({
  badge:{ position:'absolute', top:-4, right:-8, backgroundColor:theme.colors.primary, borderRadius:999, minWidth:16, height:16, justifyContent:'center', alignItems:'center', paddingHorizontal:2 },
  badgeTxt:{ color:'#fff', fontSize:9, fontWeight:'700' },
});
