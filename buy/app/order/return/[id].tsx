import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image as RNImage } from 'react-native';
import { Text, TextInput, Button, HelperText, RadioButton, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/src/stores/authStore';
import { useCreateReturn } from '@/src/hooks/useOrders';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { ReturnReason } from '@/src/types';
import ScreenHeader from '@/src/components/common/ScreenHeader';
import { useToast } from '@/src/context/ToastContext';
import { theme, SPACING, RADIUS } from '@/src/theme';
const schema = z.object({ reason: z.enum(['wrong_item','damaged','not_as_described','changed_mind','other']), description: z.string().min(10,'Please provide at least 10 characters') });
type F = z.infer<typeof schema>;
const REASONS: {v:ReturnReason;l:string;d:string}[] = [
  {v:'wrong_item',l:'Wrong Item',d:'Received a different product'},
  {v:'damaged',l:'Damaged',d:'Item is broken or damaged'},
  {v:'not_as_described',l:'Not as Described',d:'Product differs from listing'},
  {v:'changed_mind',l:'Changed Mind',d:'I no longer need this'},
  {v:'other',l:'Other',d:'Other reason'},
];
export default function ReturnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: orderId } = useLocalSearchParams<{id:string}>();
  const { user } = useAuthStore();
  const { mutateAsync: createReturn, isPending } = useCreateReturn();
  const { showError } = useToast();
  const { addNotification } = useNotificationStore();
  const [photos, setPhotos] = useState<string[]>([]);
  const { control, handleSubmit, formState:{errors}, setValue, watch } = useForm<F>({ resolver:zodResolver(schema), defaultValues:{reason:'damaged',description:''} });
  const reason = watch('reason');
  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality:0.7 });
    if(!r.canceled) setPhotos(p=>[...p,...r.assets.map(a=>a.uri)].slice(0,4));
  }
  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('Camera permission is required to take photos');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled) setPhotos(p => [...p, r.assets[0].uri].slice(0, 4));
  }
  const onSubmit = async (data: F) => {
    if(!user) return;
    await createReturn({ orderId, userId:user.id, reason:data.reason, description:data.description, photos });
    await addNotification(user.id,{title:'Return Request Submitted',body:'We will process your return within 24 hours.',type:'return',referenceId:orderId});
    Alert.alert('Return Requested','Your return request has been submitted successfully.',[{text:'OK',onPress:()=>router.back()}]);
  };
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Request Return"/>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Text variant="bodyMedium" style={s.intro}>Tell us what's wrong with your order. We'll review and get back to you within 24 hours.</Text>
          <Text variant="titleSmall" style={s.secTitle}>Reason for Return *</Text>
          {REASONS.map(r=>(
            <TouchableOpacity key={r.v} onPress={()=>setValue('reason',r.v)} style={[s.reasonCard,reason===r.v&&s.reasonCardSel]}>
              <RadioButton.Android value={r.v} status={reason===r.v?'checked':'unchecked'} onPress={()=>setValue('reason',r.v)} color={theme.colors.primary}/>
              <View style={s.reasonInfo}><Text variant="labelMedium" style={s.reasonLabel}>{r.l}</Text><Text variant="labelSmall" style={s.reasonDesc}>{r.d}</Text></View>
            </TouchableOpacity>
          ))}
          <Text variant="titleSmall" style={s.secTitle}>Description *</Text>
          <Controller control={control} name="description" render={({field:{onChange,value}})=><TextInput value={value} onChangeText={onChange} mode="outlined" multiline numberOfLines={4} placeholder="Describe the issue in detail..." error={!!errors.description}/>}/>
          {errors.description&&<HelperText type="error">{errors.description.message}</HelperText>}
          <Text variant="titleSmall" style={s.secTitle}>Photos (optional, up to 4)</Text>
          <View style={s.photoGrid}>
            {photos.map((uri,i)=>(<View key={i} style={s.photoWrap}><RNImage source={{uri}} style={s.photo} resizeMode="cover"/><TouchableOpacity style={s.removePhoto} onPress={()=>setPhotos(p=>p.filter((_,idx)=>idx!==i))}><Ionicons name="close-circle" size={20} color="#fff"/></TouchableOpacity></View>))}
            {photos.length<4&&<View style={s.photoAdd}><TouchableOpacity style={s.addBtn} onPress={takePhoto}><Ionicons name="camera" size={24} color="#888"/><Text variant="labelSmall" style={{color:'#888'}}>Camera</Text></TouchableOpacity><TouchableOpacity style={s.addBtn} onPress={pickPhoto}><Ionicons name="image" size={24} color="#888"/><Text variant="labelSmall" style={{color:'#888'}}>Gallery</Text></TouchableOpacity></View>}
          </View>
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isPending} style={s.submitBtn} contentStyle={{paddingVertical:SPACING.xs}}>Submit Return Request</Button>
        </View>
        <View style={{height:SPACING.xl}}/>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.background},
  scroll:{flex:1},
  content:{padding:SPACING.lg,gap:SPACING.md},
  intro:{color:'#666',lineHeight:22},
  secTitle:{fontWeight:'700',color:'#222'},
  reasonCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:RADIUS.md,padding:SPACING.sm,borderWidth:1.5,borderColor:'transparent'},
  reasonCardSel:{borderColor:theme.colors.primary,backgroundColor:'#FFF5F5'},
  reasonInfo:{flex:1},
  reasonLabel:{fontWeight:'600',color:'#222'},
  reasonDesc:{color:'#888'},
  photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:SPACING.sm},
  photoWrap:{position:'relative'},
  photo:{width:80,height:80,borderRadius:RADIUS.md},
  removePhoto:{position:'absolute',top:-6,right:-6},
  photoAdd:{flexDirection:'row',gap:SPACING.sm},
  addBtn:{width:80,height:80,borderRadius:RADIUS.md,borderWidth:1.5,borderColor:'#e0e0e0',borderStyle:'dashed',justifyContent:'center',alignItems:'center',gap:3,backgroundColor:'#fafafa'},
  submitBtn:{marginTop:SPACING.sm},
});
