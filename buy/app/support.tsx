import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';
export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Help & Support"/>
      <View style={s.content}>
        <Text variant="titleMedium" style={s.title}>We're here to help</Text>
        <Text variant="bodyMedium" style={s.sub}>Reach us anytime via call, WhatsApp, or email.</Text>
        {[
          {icon:'call',label:'Call Support',sub:'Available 9AM–6PM daily',color:'#1565C0',action:()=>Linking.openURL('tel:+97714567890')},
          {icon:'logo-whatsapp',label:'WhatsApp',sub:'Chat with us instantly',color:'#25D366',action:()=>Linking.openURL('https://wa.me/9779801234567?text=Hi Buy Support')},
          {icon:'mail',label:'Email Support',sub:'support@buy.com.np',color:'#FF8F00',action:()=>Linking.openURL('mailto:support@buy.com.np')},
        ].map(item=>(
          <TouchableOpacity key={item.label} onPress={item.action} activeOpacity={0.8}>
            <Surface style={s.card} elevation={1}>
              <View style={[s.iconWrap,{backgroundColor:item.color+'20'}]}><Ionicons name={item.icon as any} size={28} color={item.color}/></View>
              <View style={s.cardInfo}><Text variant="titleSmall" style={s.cardLabel}>{item.label}</Text><Text variant="bodySmall" style={s.cardSub}>{item.sub}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#ccc"/>
            </Surface>
          </TouchableOpacity>
        ))}
        <Surface style={s.faqCard} elevation={1}>
          <Text variant="titleSmall" style={s.faqTitle}>Frequently Asked Questions</Text>
          {[['How do I track my order?','Go to Orders tab and tap your order to see real-time tracking.'],['Can I change my address after ordering?','Address changes are allowed only if the order is still in Pending status.'],['How long does delivery take?','Same day in Kathmandu Core, next day in Kathmandu Outer, 3-5 days in major cities.'],['How do returns work?','You can request a return within 7 days of delivery from the order details page.']].map(([q,a])=>(
            <View key={q} style={s.faqItem}><Text variant="labelMedium" style={s.faqQ}>{q}</Text><Text variant="bodySmall" style={s.faqA}>{a}</Text></View>
          ))}
        </Surface>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  content:{padding:SPACING.lg,gap:SPACING.md},
  title:{fontWeight:'700',color:'#222',textAlign:'center'},
  sub:{color:'#666',textAlign:'center'},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:RADIUS.lg,padding:SPACING.md,gap:SPACING.md},
  iconWrap:{width:52,height:52,borderRadius:999,justifyContent:'center',alignItems:'center'},
  cardInfo:{flex:1},
  cardLabel:{fontWeight:'700',color:'#222'},
  cardSub:{color:'#888'},
  faqCard:{backgroundColor:'#fff',borderRadius:RADIUS.lg,padding:SPACING.md,gap:SPACING.md},
  faqTitle:{fontWeight:'700',color:'#222',marginBottom:SPACING.sm},
  faqItem:{gap:4},
  faqQ:{fontWeight:'600',color:'#333'},
  faqA:{color:'#666',lineHeight:20},
});
