import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';
import { useWalletTransactions } from '../src/hooks/useWallet';
import { formatNPR, formatDateTime } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: txs=[] } = useWalletTransactions(user?.id??'');
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Buy Wallet"/>
      <Surface style={s.balCard} elevation={2}>
        <Ionicons name="wallet" size={40} color="#fff"/>
        <Text variant="labelLarge" style={s.balLabel}>Available Balance</Text>
        <Text variant="displaySmall" style={s.balance}>{formatNPR(user?.walletBalance??0)}</Text>
      </Surface>
      <Text variant="labelSmall" style={s.txHeader}>TRANSACTIONS</Text>
      <FlatList data={txs} keyExtractor={i=>i.id} contentContainerStyle={s.list}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="receipt-outline" size={48} color="#ccc"/><Text variant="bodyMedium" style={{color:'#888'}}>No transactions yet</Text></View>}
        renderItem={({item})=>(
          <Surface style={s.txCard} elevation={1}>
            <View style={[s.txIcon,{backgroundColor:item.type==='credit'?'#E8F5E9':'#FFEBEE'}]}><Ionicons name={item.type==='credit'?'arrow-down':'arrow-up'} size={18} color={item.type==='credit'?'#2E7D32':'#B71C1C'}/></View>
            <View style={s.txInfo}><Text variant="labelMedium" style={s.txDesc} numberOfLines={1}>{item.description}</Text><Text variant="labelSmall" style={s.txDate}>{formatDateTime(item.createdAt)}</Text></View>
            <View style={s.txAmount}><Text variant="titleSmall" style={{fontWeight:'700',color:item.type==='credit'?'#2E7D32':'#B71C1C'}}>{item.type==='credit'?'+':'-'}{formatNPR(item.amount)}</Text><Text variant="labelSmall" style={{color:'#888'}}>Bal: {formatNPR(item.balance)}</Text></View>
          </Surface>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  balCard:{margin:SPACING.md,borderRadius:RADIUS.xl,padding:SPACING.xxl,backgroundColor:theme.colors.primary,alignItems:'center',gap:SPACING.sm},
  balLabel:{color:'rgba(255,255,255,0.8)'},
  balance:{color:'#fff',fontWeight:'800'},
  txHeader:{paddingHorizontal:SPACING.lg,paddingVertical:SPACING.sm,color:'#999',fontWeight:'700'},
  list:{paddingHorizontal:SPACING.md,gap:SPACING.sm},
  empty:{flex:1,justifyContent:'center',alignItems:'center',gap:SPACING.md,padding:SPACING.xxl},
  txCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.md,gap:SPACING.md},
  txIcon:{width:40,height:40,borderRadius:999,justifyContent:'center',alignItems:'center'},
  txInfo:{flex:1},
  txDesc:{color:'#333'},
  txDate:{color:'#888'},
  txAmount:{alignItems:'flex-end'},
});
