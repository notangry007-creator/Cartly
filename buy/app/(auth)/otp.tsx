import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { verifyOTP, generateOTP } from '../../src/utils/otp';
import { theme, SPACING, RADIUS } from '../../src/theme';
export default function OTPScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, otp: initialOtp } = useLocalSearchParams<{phone:string;otp:string}>();
  const [currentOtp, setCurrentOtp] = useState(initialOtp??'');
  const [digits, setDigits] = useState(['','','','','','']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<(RNTextInput|null)[]>([]);
  useEffect(() => {
    if (countdown>0) { const t = setTimeout(()=>setCountdown(c=>c-1),1000); return ()=>clearTimeout(t); }
  }, [countdown]);
  function handleDigit(val:string, idx:number) {
    const d = val.replace(/\D/g, '').slice(-1);
    const nd = [...digits]; nd[idx]=d; setDigits(nd); setError('');
    if (d&&idx<5) inputs.current[idx+1]?.focus();
  }
  function handleKey(key:string, idx:number) { if (key==='Backspace'&&!digits[idx]&&idx>0) inputs.current[idx-1]?.focus(); }
  async function verify() {
    const entered = digits.join('');
    if (entered.length!==6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      if (!verifyOTP(phone, entered)) { setError('Invalid OTP. Please try again.'); return; }
      router.replace({ pathname:'/(auth)/profile-complete', params:{ phone } });
    } finally { setLoading(false); }
  }
  function resend() {
    const o = generateOTP(phone); setCurrentOtp(o);
    setDigits(['','','','','','']); setCountdown(30);
    inputs.current[0]?.focus();
  }
  return (
    <View style={[s.container,{paddingTop:insets.top,paddingBottom:insets.bottom+SPACING.lg}]}>
      <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={24} color={theme.colors.primary}/></TouchableOpacity>
      <View style={s.content}>
        <Ionicons name="shield-checkmark" size={64} color={theme.colors.primary}/>
        <Text variant="headlineSmall" style={s.title}>Verify OTP</Text>
        <Text variant="bodyMedium" style={s.sub}>We sent a code to <Text style={s.phone}>+977 {phone}</Text></Text>
        <Surface style={s.otpBox} elevation={1}>
          <Ionicons name="information-circle" size={16} color={theme.colors.secondary}/>
          <Text variant="labelMedium" style={s.otpLabel}>Simulation OTP: <Text style={s.otpCode}>{currentOtp}</Text></Text>
        </Surface>
        <View style={s.otpRow}>
          {digits.map((d,i)=>(
            <RNTextInput key={i} ref={r=>{inputs.current[i]=r;}} value={d} onChangeText={v=>handleDigit(v,i)} onKeyPress={({nativeEvent})=>handleKey(nativeEvent.key,i)} keyboardType="number-pad" maxLength={1} style={[s.digit,error?s.digitErr:null]} selectionColor={theme.colors.primary}/>
          ))}
        </View>
        {error?<Text style={s.error}>{error}</Text>:null}
        <Button mode="contained" onPress={verify} loading={loading} style={s.btn} contentStyle={s.btnC}>Verify & Continue</Button>
        <View style={s.resendRow}>
          <Text variant="bodySmall" style={s.resendTxt}>Didn't receive? </Text>
          {countdown>0?<Text variant="bodySmall" style={s.cd}>Resend in {countdown}s</Text>:<TouchableOpacity onPress={resend}><Text variant="bodySmall" style={s.rl}>Resend OTP</Text></TouchableOpacity>}
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff'},
  back:{padding:SPACING.lg},
  content:{flex:1,alignItems:'center',paddingHorizontal:SPACING.xl,gap:SPACING.md},
  title:{fontWeight:'700',color:'#222'},
  sub:{color:'#666',textAlign:'center'},
  phone:{color:theme.colors.primary,fontWeight:'600'},
  otpBox:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,padding:SPACING.md,borderRadius:RADIUS.md,backgroundColor:'#FFF8E1',alignSelf:'stretch'},
  otpLabel:{color:'#666'},
  otpCode:{color:'#FF8F00',fontWeight:'800',letterSpacing:2,fontSize:16},
  otpRow:{flexDirection:'row',gap:SPACING.sm,marginVertical:SPACING.sm},
  digit:{width:46,height:54,borderWidth:2,borderColor:'#e0e0e0',borderRadius:RADIUS.md,textAlign:'center',fontSize:22,fontWeight:'700',color:'#222',backgroundColor:'#fafafa'},
  digitErr:{borderColor:theme.colors.error},
  error:{color:theme.colors.error,fontSize:13},
  btn:{alignSelf:'stretch'},
  btnC:{paddingVertical:SPACING.xs},
  resendRow:{flexDirection:'row',alignItems:'center'},
  resendTxt:{color:'#666'},
  cd:{color:'#999'},
  rl:{color:theme.colors.primary,fontWeight:'600'},
});
