import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Text, Surface, Divider, Button, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { useThemeStore } from '../../src/stores/themeStore';
import { useWishlistStore } from '../../src/stores/wishlistStore';
import { formatNPR } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
function MI({ icon, label, subtitle, onPress, badge, danger }: { icon:string; label:string; subtitle?:string; onPress:()=>void; badge?:number; danger?:boolean }) {
  return (
    <TouchableOpacity style={ms.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[ms.ic,danger&&ms.icD]}><Ionicons name={icon as any} size={20} color={danger?'#B71C1C':theme.colors.primary}/></View>
      <View style={ms.lw}><Text variant="bodyMedium" style={[ms.label,danger&&ms.dLabel]}>{label}</Text>{subtitle&&<Text variant="labelSmall" style={ms.sub}>{subtitle}</Text>}</View>
      {badge&&badge>0?<View style={ms.badge}><Text style={ms.badgeTxt}>{badge}</Text></View>:null}
      <Ionicons name="chevron-forward" size={16} color="#ccc"/>
    </TouchableOpacity>
  );
}
const ms = StyleSheet.create({ item:{flexDirection:'row',alignItems:'center',padding:SPACING.md,gap:SPACING.md}, ic:{width:40,height:40,borderRadius:RADIUS.md,backgroundColor:'#FFF5F5',justifyContent:'center',alignItems:'center'}, icD:{backgroundColor:'#FFEBEE'}, lw:{flex:1}, label:{color:'#222',fontWeight:'500'}, dLabel:{color:'#B71C1C'}, sub:{color:'#888'}, badge:{backgroundColor:theme.colors.primary,borderRadius:99,minWidth:20,height:20,justifyContent:'center',alignItems:'center',paddingHorizontal:4}, badgeTxt:{color:'#fff',fontSize:10,fontWeight:'700'} });
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { productIds: wishlistIds } = useWishlistStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  function handleLogout() {
    Alert.alert('Logout','Are you sure?',[{text:'Cancel'},{text:'Logout',style:'destructive',onPress:async()=>{ await logout(); router.replace('/(auth)/login'); }}]);
  }
  if (!user) return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Profile</Text></View>
      <View style={s.loginPrompt}><Ionicons name="person-circle-outline" size={80} color="#ccc"/><Text variant="titleMedium" style={{color:'#555',fontWeight:'600'}}>Not logged in</Text><Button mode="contained" onPress={()=>router.push('/(auth)/login')}>Login / Sign Up</Button></View>
    </View>
  );
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Profile</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={s.userCard} elevation={1}>
          <Avatar.Text size={60} label={user.name.charAt(0).toUpperCase()} style={{backgroundColor:theme.colors.primary}} color="#fff"/>
          <View style={s.userInfo}>
            <Text variant="titleMedium" style={s.userName}>{user.name}</Text>
            <Text variant="bodySmall" style={s.userPhone}>+977 {user.phone}</Text>
            {user.email&&<Text variant="bodySmall" style={s.userEmail}>{user.email}</Text>}
          </View>
          <TouchableOpacity onPress={()=>router.push('/edit-profile')} style={s.editBtn}><Ionicons name="pencil" size={18} color={theme.colors.primary}/></TouchableOpacity>
        </Surface>
        <TouchableOpacity onPress={()=>router.push('/wallet')} activeOpacity={0.85}>
          <Surface style={s.walletCard} elevation={1}>
            <View style={s.walletLeft}><Ionicons name="wallet" size={28} color="#fff"/><View><Text variant="labelMedium" style={s.walletLabel}>Buy Wallet</Text><Text variant="headlineSmall" style={s.walletBal}>{formatNPR(user.walletBalance)}</Text></View></View>
            <Text style={s.walletArrow}>View →</Text>
          </Surface>
        </TouchableOpacity>
        <Surface style={s.menuSec} elevation={1}>
          <Text variant="labelSmall" style={s.secLabel}>SHOPPING</Text>
          <Divider/>
          <MI icon="receipt-outline" label="My Orders" onPress={()=>router.push('/(tabs)/orders')}/>
          <Divider/>
          <MI icon="heart-outline" label="Wishlist" onPress={()=>router.push('/wishlist')} badge={wishlistIds.length}/>
          <Divider/>
          <MI icon="pricetag-outline" label="Offers & Coupons" onPress={()=>router.push('/offers')}/>
          <Divider/>
          <MI icon="refresh-outline" label="Returns & Refunds" onPress={()=>router.push('/returns')}/>
          <Divider/>
          <MI icon="location-outline" label="Saved Addresses" onPress={()=>router.push('/addresses')}/>
        </Surface>
        <Surface style={s.menuSec} elevation={1}>
          <Text variant="labelSmall" style={s.secLabel}>ACCOUNT</Text>
          <Divider/>
          <MI icon="notifications-outline" label="Notifications" onPress={()=>router.push('/notifications')} badge={unreadCount}/>
          <Divider/>
          <MI icon="help-circle-outline" label="Help & Support" subtitle="Call, chat, or WhatsApp" onPress={()=>router.push('/support')}/>
          <Divider/>
          <MI icon="shield-outline" label="Privacy & Security" onPress={()=>router.push('/privacy')}/>
          <Divider/>
          <View style={ms.item}>
            <View style={[ms.ic]}><Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={theme.colors.primary}/></View>
            <View style={ms.lw}><Text variant="bodyMedium" style={ms.label}>Dark Mode</Text></View>
            <Switch value={isDark} onValueChange={toggleTheme} thumbColor={isDark ? theme.colors.primary : '#f4f3f4'} trackColor={{ false: '#767577', true: theme.colors.primaryContainer }}/>
          </View>
        </Surface>
        <Surface style={s.menuSec} elevation={1}>
          <MI icon="log-out-outline" label="Logout" onPress={handleLogout} danger/>
        </Surface>
        <View style={{height:SPACING.xl}}/>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  header:{backgroundColor:'#fff',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  headerTitle:{fontWeight:'700',color:'#222'},
  loginPrompt:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.lg},
  userCard:{flexDirection:'row',alignItems:'center',margin:SPACING.md,padding:SPACING.md,borderRadius:RADIUS.lg,backgroundColor:'#fff',gap:SPACING.md},
  userInfo:{flex:1,gap:2},
  userName:{fontWeight:'700',color:'#222'},
  userPhone:{color:'#666'},
  userEmail:{color:'#888'},
  editBtn:{width:36,height:36,borderRadius:999,backgroundColor:'#FFF5F5',justifyContent:'center',alignItems:'center'},
  walletCard:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:SPACING.md,marginBottom:SPACING.md,padding:SPACING.lg,borderRadius:RADIUS.lg,backgroundColor:theme.colors.primary},
  walletLeft:{flexDirection:'row',alignItems:'center',gap:SPACING.md},
  walletLabel:{color:'rgba(255,255,255,0.7)'},
  walletBal:{color:'#fff',fontWeight:'800'},
  walletArrow:{color:'rgba(255,255,255,0.8)',fontSize:13},
  menuSec:{backgroundColor:'#fff',borderRadius:RADIUS.lg,marginHorizontal:SPACING.md,marginBottom:SPACING.md,overflow:'hidden'},
  secLabel:{color:'#999',fontWeight:'700',paddingHorizontal:SPACING.md,paddingTop:SPACING.md,paddingBottom:SPACING.xs},
});
