import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { generateOTP } from '../../src/utils/otp';
import { validateNepalPhone } from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
const schema = z.object({ phone: z.string().refine(validateNepalPhone, { message:'Enter a valid Nepal mobile number (97/98XXXXXXXX)' }) });
type F = z.infer<typeof schema>;
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState:{errors,isSubmitting} } = useForm<F>({ resolver: zodResolver(schema) });
  const onSubmit = async (data: F) => {
    const phone = data.phone.replace(/[\s\-+]/g, '');
    const otp = generateOTP(phone);
    router.push({ pathname:'/(auth)/otp', params:{ phone, otp } });
  };
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={[s.container,{paddingTop:insets.top+SPACING.xl,paddingBottom:insets.bottom+SPACING.lg}]} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.logo}><Ionicons name="bag" size={40} color="#fff" /></View>
          <Text variant="displaySmall" style={s.appName}>Buy</Text>
          <Text variant="bodyMedium" style={s.tagline}>Nepal's trusted shopping platform</Text>
        </View>
        <View style={s.card}>
          <Text variant="headlineSmall" style={s.title}>Sign In</Text>
          <Text variant="bodyMedium" style={s.sub}>Enter your Nepal mobile number</Text>
          <Controller control={control} name="phone" render={({field:{onChange,value}})=>(
            <TextInput label="Phone Number" value={value} onChangeText={onChange} keyboardType="phone-pad" left={<TextInput.Affix text="+977 "/>} placeholder="98XXXXXXXX" mode="outlined" error={!!errors.phone} style={s.input} />
          )}/>
          {errors.phone&&<HelperText type="error">{errors.phone.message}</HelperText>}
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={s.btn} contentStyle={s.btnC}>Get OTP</Button>
          <Text variant="labelSmall" style={s.terms}>By continuing you agree to our Terms of Service.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  container:{flexGrow:1,backgroundColor:theme.colors.primary,paddingHorizontal:SPACING.lg},
  header:{alignItems:'center',marginBottom:SPACING.xl,gap:SPACING.sm},
  logo:{width:80,height:80,borderRadius:999,backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center',alignItems:'center'},
  appName:{color:'#fff',fontWeight:'800',fontSize:40},
  tagline:{color:'rgba(255,255,255,0.8)'},
  card:{backgroundColor:'#fff',borderRadius:RADIUS.xl,padding:SPACING.xl,gap:SPACING.sm},
  title:{fontWeight:'700',color:'#222'},
  sub:{color:'#666',marginBottom:SPACING.sm},
  input:{backgroundColor:'#fff'},
  btn:{marginTop:SPACING.sm},
  btnC:{paddingVertical:SPACING.xs},
  terms:{color:'#999',textAlign:'center',marginTop:SPACING.sm},
});
