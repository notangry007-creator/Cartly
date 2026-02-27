import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image as RNImage } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useOrder } from '../../src/hooks/useOrders';
import { useAddReview } from '../../src/hooks/useProducts';
import { useToast } from '../../src/context/ToastContext';
import ScreenHeader from '../../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../../src/theme';

const schema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Write at least 10 characters'),
});
type F = z.infer<typeof schema>;

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, productId, productTitle } = useLocalSearchParams<{
    orderId: string;
    productId: string;
    productTitle: string;
  }>();
  const { user } = useAuthStore();
  const { data: order } = useOrder(user?.id ?? '', orderId);
  const { mutateAsync: addReview, isPending } = useAddReview();
  const { showSuccess, showError } = useToast();
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewVideo, setReviewVideo] = useState<string | null>(null);
  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const [completedReviews, setCompletedReviews] = useState<string[]>([]);

  const items = order?.items.filter(i => productId ? i.productId === productId : true) ?? [];
  const currentItem = items[currentProductIdx];
  const isLastItem = currentProductIdx >= items.length - 1;

  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, comment: '' },
  });
  const rating = watch('rating');

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled) setReviewPhotos(p => [...p, r.assets[0].uri].slice(0, 4));
  }

  async function pickVideo() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
      videoMaxDuration: 60, // 60 seconds max
    });
    if (!r.canceled) setReviewVideo(r.assets[0].uri);
  }

  const onSubmit = async (data: F) => {
    if (!user || !currentItem) return;
    try {
      await addReview({
        productId: currentItem.productId,
        userId: user.id,
        userName: user.name,
        rating: data.rating,
        comment: data.comment,
        images: reviewPhotos,
        videoUri: reviewVideo ?? undefined,
        orderId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompletedReviews(prev => [...prev, currentItem.productId]);

      if (isLastItem) {
        showSuccess('Review submitted! Thank you.');
        router.back();
      } else {
        // Move to next product
        setCurrentProductIdx(prev => prev + 1);
        setReviewPhotos([]);
        reset({ rating: 0, comment: '' });
      }
    } catch {
      showError('Failed to submit review. Please try again.');
    }
  };

  const LABELS = ['', 'Very Bad', 'Bad', 'Okay', 'Good', 'Excellent!'];
  const COLORS = ['', '#B71C1C', '#E65100', '#F9A825', '#43A047', '#1B5E20'];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Write a Review" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Progress if multiple items */}
          {items.length > 1 && (
            <View style={s.progress}>
              <Text variant="labelMedium" style={s.progressTxt}>
                Product {currentProductIdx + 1} of {items.length}
              </Text>
              <View style={s.progressBar}>
                {items.map((item, i) => (
                  <View
                    key={item.productId}
                    style={[
                      s.progressSegment,
                      i < currentProductIdx && s.progressDone,
                      i === currentProductIdx && s.progressActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Current product */}
          {currentItem && (
            <View style={s.productBadge}>
              {currentItem.imageUrl ? (
                <RNImage source={{ uri: currentItem.imageUrl }} style={s.productImg} resizeMode="cover" />
              ) : null}
              <View style={s.productInfo}>
                <Text variant="titleSmall" style={s.productTitle} numberOfLines={2}>
                  {currentItem.title}
                </Text>
                <Text variant="labelSmall" style={s.productVariant}>{currentItem.variantLabel}</Text>
              </View>
            </View>
          )}

          <Text variant="titleMedium" style={s.sectionTitle}>How was this product?</Text>

          {/* Star rating */}
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => { setValue('rating', n); Haptics.selectionAsync(); }}
                hitSlop={6}
                accessibilityLabel={`Rate ${n} stars`}
              >
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={44} color={n <= rating ? '#FFA000' : '#ddd'} />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={[s.ratingLabel, { color: COLORS[rating] }]}>{LABELS[rating]}</Text>
          )}
          {errors.rating && <HelperText type="error">Please select a rating</HelperText>}

          {/* Comment */}
          <Text variant="titleSmall" style={s.sectionTitle}>Your Review</Text>
          <Controller control={control} name="comment" render={({ field: { onChange, value } }) => (
            <TextInput
              value={value} onChangeText={onChange} mode="outlined"
              multiline numberOfLines={5}
              placeholder="Share your experience — quality, packaging, delivery..."
              error={!!errors.comment}
            />
          )} />
          {errors.comment && <HelperText type="error">{errors.comment.message}</HelperText>}

          {/* Photo upload */}
          <Text variant="titleSmall" style={s.sectionTitle}>Add Photos (optional)</Text>
          <View style={s.photoRow}>
            {reviewPhotos.map((uri, i) => (
              <View key={i} style={s.photoWrap}>
                <RNImage source={{ uri }} style={s.photo} resizeMode="cover" />
                <TouchableOpacity style={s.removePhoto} onPress={() => setReviewPhotos(p => p.filter((_,idx) => idx !== i))}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {reviewPhotos.length < 4 && (
              <TouchableOpacity style={s.addPhoto} onPress={pickPhoto}>
                <Ionicons name="camera" size={22} color="#888" />
                <Text variant="labelSmall" style={{ color: '#888' }}>Add photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Video review */}
          <Text variant="titleSmall" style={s.sectionTitle}>Add Video Review (optional, max 60s)</Text>
          {reviewVideo ? (
            <View style={s.videoWrap}>
              <Video
                source={{ uri: reviewVideo }}
                style={s.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
              />
              <TouchableOpacity style={s.removeVideo} onPress={() => setReviewVideo(null)}>
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.addVideo} onPress={pickVideo}>
              <Ionicons name="videocam" size={24} color="#888" />
              <Text variant="labelSmall" style={{ color: '#888' }}>Add video review</Text>
            </TouchableOpacity>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            style={s.submitBtn}
            contentStyle={{ paddingVertical: SPACING.xs }}
          >
            {isLastItem ? 'Submit Review' : `Submit & Review Next (${items.length - currentProductIdx - 1} more)`}
          </Button>
        </View>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: SPACING.xl, gap: SPACING.md },
  progress: { gap: SPACING.xs },
  progressTxt: { color: '#888' },
  progressBar: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0' },
  progressDone: { backgroundColor: '#2E7D32' },
  progressActive: { backgroundColor: theme.colors.primary },
  productBadge: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, backgroundColor: '#fafafa', borderRadius: RADIUS.md, alignItems: 'center' },
  productImg: { width: 56, height: 56, borderRadius: RADIUS.sm },
  productInfo: { flex: 1 },
  productTitle: { fontWeight: '600', color: '#222' },
  productVariant: { color: '#888', marginTop: 2 },
  sectionTitle: { fontWeight: '700', color: '#222' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginVertical: SPACING.sm },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoWrap: { position: 'relative' },
  photo: { width: 80, height: 80, borderRadius: RADIUS.md },
  removePhoto: { position: 'absolute', top: -6, right: -6 },
  addPhoto: { width: 80, height: 80, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  videoWrap: { position: 'relative', borderRadius: RADIUS.md, overflow: 'hidden' },
  video: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: RADIUS.md },
  removeVideo: { position: 'absolute', top: 8, right: 8 },
  addVideo: { height: 80, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e0e0e0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4, flexDirection: 'row' },
  submitBtn: { marginTop: SPACING.sm },
});
