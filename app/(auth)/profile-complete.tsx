import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { useZoneStore } from '@/src/stores/zoneStore';
import { useCartStore } from '@/src/stores/cartStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { theme, SPACING, RADIUS } from '@/src/theme';
const schema = z.object({
  name: z.string().min(2,'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type F = z.infer<typeof schema>;
export default function ProfileCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{phone:string}>();
  const { login } = useAuthStore();
  const { hasSelectedZone } = useZoneStore();
  const { loadCart } = useCartStore();
  const { loadNotifications, addNotification } = useNotificationStore();
  const { control, handleSubmit, formState:{errors,isSubmitting} } = useForm<F>({ resolver:zodResolver(schema), defaultValues:{name:'',email:''} });
  const onSubmit = async (data: F) => {
    await login(phone, data.name, data.email||undefined);
    const { user } = useAuthStore.getState();
    if (user) {
      await loadCart(user.id);
      await loadNotifications(user.id);
      await addNotification({ title:'Welcome to Buy!', body:'You have NPR 500 wallet bonus. Start shopping!', type:'wallet' });
    }
    if (!hasSelectedZone) router.replace('/onboarding');
    else router.replace('/(tabs)/home');
  };
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={[s.container,{paddingTop:insets.top+SPACING.xl,paddingBottom:insets.bottom+SPACING.lg}]} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.avatar}><Ionicons name="person" size={40} color={theme.colors.primary}/></View>
          <Text variant="headlineSmall" style={s.title}>Complete Profile</Text>
          <Text variant="bodyMedium" style={s.sub}>Tell us your name to personalize your experience</Text>
        </View>
        <View style={s.form}>
          <Controller control={control} name="name" render={({field:{onChange,value}})=>(
            <TextInput label="Full Name *" value={value} onChangeText={onChange} mode="outlined" error={!!errors.name} left={<TextInput.Icon icon="account"/>}/>
          )}/>
          {errors.name&&<HelperText type="error">{errors.name.message}</HelperText>}
          <Controller control={control} name="email" render={({field:{onChange,value}})=>(
            <TextInput label="Email (optional)" value={value} onChangeText={onChange} mode="outlined" keyboardType="email-address" autoCapitalize="none" error={!!errors.email} left={<TextInput.Icon icon="email"/>}/>
          )}/>
          {errors.email&&<HelperText type="error">{errors.email.message}</HelperText>}
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={s.btn} contentStyle={s.btnC}>Continue Shopping</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  container:{flexGrow:1,backgroundColor:'#fff',paddingHorizontal:SPACING.xl},
  header:{alignItems:'center',marginBottom:SPACING.xl,gap:SPACING.sm},
  avatar:{width:80,height:80,borderRadius:999,backgroundColor:'#FFEBEE',justifyContent:'center',alignItems:'center',marginBottom:SPACING.sm},
  title:{fontWeight:'700',color:'#222'},
  sub:{color:'#666',textAlign:'center'},
  form:{gap:SPACING.md},
  btn:{marginTop:SPACING.md},
  btnC:{paddingVertical:SPACING.xs},
});
