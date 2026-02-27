import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../src/stores/authStore';
import { useOrder } from '../../src/hooks/useOrders';
import { useAddReview } from '../../src/hooks/useProducts';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING } from '../../src/theme';
const schema = z.object({ rating: z.number().min(1).max(5), comment: z.string().min(5,'Write at least 5 characters') });
type F = z.infer<typeof schema>;
export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{orderId:string}>();
  const { user } = useAuthStore();
  const { data: order } = useOrder(user?.id??'', orderId);
  const { mutateAsync: addReview, isPending } = useAddReview();
  const { control, handleSubmit, formState:{errors}, setValue, watch } = useForm<F>({ resolver:zodResolver(schema), defaultValues:{rating:5,comment:''} });
  const rating = watch('rating');
  const onSubmit = async (data: F) => {
    if(!user||!order) return;
    for(const item of order.items) {
      await addReview({ productId:item.productId, userId:user.id, userName:user.name, rating:data.rating, comment:data.comment, orderId });
    }
    router.back();
  };
  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <ScreenHeader title="Write a Review"/>
      <ScrollView style={s.scroll}>
        <View style={s.content}>
          <Text variant="titleMedium" style={s.title}>How was your order?</Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(n=>(
              <TouchableOpacity key={n} onPress={()=>setValue('rating',n)}>
                <Ionicons name={n<=rating?'star':'star-outline'} size={40} color={n<=rating?'#FFA000':'#ddd'}/>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.ratingLabel}>{['','Very Bad','Bad','OK','Good','Excellent'][rating]}</Text>
          <Controller control={control} name="comment" render={({field:{onChange,value}})=><TextInput label="Your Review" value={value} onChangeText={onChange} mode="outlined" multiline numberOfLines={5} placeholder="Tell us about your experience..." error={!!errors.comment}/>}/>
          {errors.comment&&<HelperText type="error">{errors.comment.message}</HelperText>}
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isPending} style={s.btn} contentStyle={{paddingVertical:SPACING.xs}}>Submit Review</Button>
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff'},
  scroll:{flex:1},
  content:{padding:SPACING.xl,gap:SPACING.md},
  title:{fontWeight:'700',color:'#222',textAlign:'center'},
  starsRow:{flexDirection:'row',justifyContent:'center',gap:SPACING.sm,marginVertical:SPACING.md},
  ratingLabel:{textAlign:'center',color:'#888',fontSize:16},
  btn:{marginTop:SPACING.sm},
});
