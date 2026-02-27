import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

const FAQ_ITEMS = [
  { q: 'How do I track my order?', a: 'Go to Orders tab and tap on your order to see the real-time tracking timeline.' },
  { q: 'Can I change my address after ordering?', a: 'Address changes are allowed only while the order is in Pending or Confirmed status.' },
  { q: 'How long does delivery take?', a: 'Same day in Kathmandu Core, next day in Kathmandu Outer, 3–5 days in major cities, 5–8 days elsewhere.' },
  { q: 'How do returns work?', a: 'Request a return within 7 days of delivery from the Order Details page. We\'ll pick up and process your refund within 5-7 business days.' },
  { q: 'Is COD available everywhere?', a: 'COD is available in Kathmandu Core, Outer, and major cities. Rest of Nepal requires prepaid orders.' },
  { q: 'How do I use wallet balance?', a: 'Select "Buy Wallet" as payment method at checkout. Your wallet balance will be deducted.' },
];

function FaqAccordion() {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <Surface style={faqS.card} elevation={1}>
      <Text variant="titleSmall" style={faqS.title}>Frequently Asked Questions</Text>
      {FAQ_ITEMS.map((item, i) => (
        <TouchableOpacity key={i} onPress={() => setOpen(open === i ? null : i)} style={faqS.item}>
          <View style={faqS.itemHeader}>
            <Text variant="labelMedium" style={faqS.q}>{item.q}</Text>
            <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
          </View>
          {open === i && <Text variant="bodySmall" style={faqS.a}>{item.a}</Text>}
        </TouchableOpacity>
      ))}
    </Surface>
  );
}
const faqS = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: '#fff', gap: SPACING.sm },
  title: { fontWeight: '700', color: '#222', marginBottom: SPACING.sm },
  item: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingVertical: SPACING.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  q: { flex: 1, fontWeight: '600', color: '#333' },
  a: { color: '#666', lineHeight: 20, marginTop: SPACING.xs },
});

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Help & Support"/>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
        <FaqAccordion />
      </View>
      </ScrollView>

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
