import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { SPACING } from '../src/theme';
const schema = z.object({ name: z.string().min(2,'Name required'), email: z.string().email('Invalid email').optional().or(z.literal('')) });
type F = z.infer<typeof schema>;
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { control, handleSubmit, formState:{errors,isSubmitting} } = useForm<F>({ resolver:zodResolver(schema), defaultValues:{name:user?.name??'',email:user?.email??''} });
  const onSubmit = async (data: F) => { await updateProfile({name:data.name,email:data.email||undefined}); router.back(); };
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={[s.container,{paddingTop:insets.top}]}>
        <ScreenHeader title="Edit Profile"/>
        <ScrollView contentContainerStyle={s.content}>
          <Controller control={control} name="name" render={({field:{onChange,value}})=><TextInput label="Full Name *" value={value} onChangeText={onChange} mode="outlined" error={!!errors.name} left={<TextInput.Icon icon="account"/>}/>}/>
          {errors.name&&<HelperText type="error">{errors.name.message}</HelperText>}
          <Controller control={control} name="email" render={({field:{onChange,value}})=><TextInput label="Email" value={value} onChangeText={onChange} mode="outlined" keyboardType="email-address" autoCapitalize="none" error={!!errors.email} left={<TextInput.Icon icon="email"/>}/>}/>
          {errors.email&&<HelperText type="error">{errors.email.message}</HelperText>}
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={{marginTop:SPACING.md}} contentStyle={{paddingVertical:SPACING.xs}}>Save Changes</Button>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({ container:{flex:1,backgroundColor:'#fff'}, content:{padding:SPACING.xl,gap:SPACING.md} });
