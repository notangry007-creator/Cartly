import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useZoneStore } from '../src/stores/zoneStore';
import { ZONES } from '../src/data/zones';
import { ZoneId } from '../src/types';
import { SPACING, RADIUS, theme } from '../src/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setZone } = useZoneStore();
  const [detecting, setDetecting] = useState(false);
  const [selected, setSelected] = useState<ZoneId|null>(null);

  async function detectLocation() {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      let zone: ZoneId;
      if (latitude>=27.65&&latitude<=27.75&&longitude>=85.28&&longitude<=85.42) zone='ktm_core';
      else if (latitude>=27.5&&latitude<=27.9&&longitude>=85.1&&longitude<=85.6) zone='ktm_outer';
      else if (latitude>=26&&latitude<=29&&longitude>=80&&longitude<=89) zone='major_city';
      else zone='rest_nepal';
      await setZone(zone);
      router.replace('/(tabs)/home');
    } finally { setDetecting(false); }
  }

  async function confirmManual() {
    if (!selected) return;
    await setZone(selected);
    router.replace('/(tabs)/home');
  }

  return (
    <View style={[s.container, { paddingTop:insets.top, paddingBottom:insets.bottom+SPACING.lg }]}>
      <View style={s.hero}>
        <Ionicons name="location" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={s.title}>Where are you?</Text>
        <Text variant="bodyMedium" style={s.sub}>We use your location to show accurate delivery times and available options.</Text>
      </View>
      <Button mode="contained" icon="crosshairs-gps" onPress={detectLocation} loading={detecting} style={s.detectBtn} contentStyle={s.btnContent}>Detect My Location</Button>
      <View style={s.divider}><View style={s.line}/><Text variant="labelSmall" style={s.or}>or choose manually</Text><View style={s.line}/></View>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {ZONES.map(zone => (
          <TouchableOpacity key={zone.id} style={[s.zoneCard, selected===zone.id&&s.zoneCardSel]} onPress={()=>setSelected(zone.id)} activeOpacity={0.7}>
            <View style={s.zoneLeft}>
              <Ionicons name={selected===zone.id?'radio-button-on':'radio-button-off'} size={20} color={selected===zone.id?theme.colors.primary:'#ccc'} />
              <View style={{marginLeft:SPACING.md}}>
                <Text variant="titleSmall" style={s.zoneName}>{zone.name}</Text>
                <Text variant="labelSmall" style={s.zoneDetail}>{zone.codAvailable?'COD available':'Prepaid only'} · From NPR {zone.shippingBase}</Text>
              </View>
            </View>
            {zone.codAvailable&&<View style={s.chip}><Text style={s.chipTxt}>COD</Text></View>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Button mode="outlined" onPress={confirmManual} disabled={!selected} style={s.confirmBtn}>Confirm Zone</Button>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff',paddingHorizontal:SPACING.lg},
  hero:{alignItems:'center',paddingVertical:SPACING.xl,gap:SPACING.sm},
  title:{fontWeight:'700',color:'#222',textAlign:'center'},
  sub:{color:'#666',textAlign:'center',lineHeight:22},
  detectBtn:{marginBottom:SPACING.lg},
  btnContent:{paddingVertical:SPACING.xs},
  divider:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:SPACING.lg},
  line:{flex:1,height:1,backgroundColor:'#e0e0e0'},
  or:{color:'#999'},
  list:{flex:1},
  zoneCard:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:SPACING.md,borderRadius:RADIUS.md,borderWidth:1.5,borderColor:'#e0e0e0',marginBottom:SPACING.sm},
  zoneCardSel:{borderColor:theme.colors.primary,backgroundColor:'#FFF5F5'},
  zoneLeft:{flexDirection:'row',alignItems:'center',flex:1},
  zoneName:{fontWeight:'600',color:'#222'},
  zoneDetail:{color:'#888',marginTop:2},
  chip:{backgroundColor:'#E8F5E9',paddingHorizontal:8,paddingVertical:3,borderRadius:999,borderWidth:1,borderColor:'#4CAF50'},
  chipTxt:{color:'#2E7D32',fontSize:11,fontWeight:'700'},
  confirmBtn:{marginTop:SPACING.md},
});
