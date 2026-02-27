import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { useWishlistStore } from '../src/stores/wishlistStore';
import { useCartStore } from '../src/stores/cartStore';
import { useAuthStore } from '../src/stores/authStore';
import { useZoneStore } from '../src/stores/zoneStore';
import * as Haptics from 'expo-haptics';
import { useToast } from '../src/context/ToastContext';
import { PRODUCTS } from '../src/data/seed';
import { formatNPR, getDiscountPercent, getBestETA } from '../src/utils/helpers';
import ScreenHeader from '../src/components/common/ScreenHeader';
import { theme, SPACING, RADIUS } from '../src/theme';

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { zoneId } = useZoneStore();
  const { productIds, toggle } = useWishlistStore();
  const { addItem } = useCartStore();
  const { showSuccess } = useToast();

  const wishlistProducts = PRODUCTS.filter(p => productIds.includes(p.id));

  async function moveToCart(productId: string) {
    if (!user) return;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    await addItem(user.id, productId, product.variants[0].id, 1);
    await toggle(user.id, productId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Moved to cart');
  }

  async function moveAllToCart() {
    if (!user) return;
    for (const product of wishlistProducts) {
      await addItem(user.id, product.id, product.variants[0].id, 1);
      await toggle(user.id, product.id);
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/(tabs)/cart');
  }

  if (!user) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Wishlist" />
        <View style={s.empty}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text variant="titleMedium" style={s.emptyTitle}>Please login to view wishlist</Text>
          <Button mode="contained" onPress={() => router.push('/(auth)/login')}>Login</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={"Wishlist (" + wishlistProducts.length + ")"}
        right={
          wishlistProducts.length > 0 ? (
            <TouchableOpacity onPress={moveAllToCart} style={s.moveAllBtn}>
              <Ionicons name="bag-add" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {wishlistProducts.length > 0 && (
        <View style={s.topBar}>
          <Text variant="bodySmall" style={s.topBarTxt}>{wishlistProducts.length} saved items</Text>
          <TouchableOpacity onPress={moveAllToCart}>
            <Text variant="labelMedium" style={s.moveAllTxt}>Move all to Cart →</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={wishlistProducts}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={s.emptyTitle}>Your wishlist is empty</Text>
            <Text variant="bodySmall" style={s.emptySub}>Tap the heart on any product to save it</Text>
            <Button mode="contained" onPress={() => router.push('/(tabs)/home')}>Explore Products</Button>
          </View>
        }
        renderItem={({ item, index }) => {
          const discount = getDiscountPercent(item.basePrice, item.baseMrp);
          const eta = getBestETA(item, zoneId);
          const cod = item.codAvailableZones.includes(zoneId);

          return (
            <Animated.View entering={FadeInDown.delay(index * 60)} exiting={FadeOutLeft}>
              <Surface style={s.card} elevation={1}>
                <TouchableOpacity
                  style={s.cardInner}
                  onPress={() => router.push('/product/' + item.id)}
                  activeOpacity={0.85}
                >
                  <View style={s.imgWrap}>
                    <Image
                      source={{ uri: item.images[0] }}
                      style={s.img}
                      contentFit="cover"
                      transition={200}
                      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    />
                    {discount > 0 && (
                      <View style={s.discBadge}>
                        <Text style={s.discTxt}>{discount}% off</Text>
                      </View>
                    )}
                    {item.isAuthenticated && (
                      <View style={s.authBadge}>
                        <Ionicons name="shield-checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={s.info}>
                    <Text variant="labelMedium" numberOfLines={2} style={s.title}>{item.title}</Text>
                    <View style={s.priceRow}>
                      <Text variant="titleSmall" style={s.price}>{formatNPR(item.basePrice)}</Text>
                      {discount > 0 && <Text style={s.mrp}>{formatNPR(item.baseMrp)}</Text>}
                    </View>
                    <View style={s.metaRow}>
                      {cod && <View style={s.codBadge}><Text style={s.codTxt}>COD</Text></View>}
                      <Text variant="labelSmall" style={s.eta}>{eta}</Text>
                    </View>
                    <View style={s.actions}>
                      <Button
                        mode="contained"
                        compact
                        onPress={() => moveToCart(item.id)}
                        style={s.addBtn}
                        contentStyle={s.addBtnContent}
                        icon="bag-add"
                      >
                        Add to Cart
                      </Button>
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() =>
                          Alert.alert('Remove', 'Remove from wishlist?', [
                            { text: 'Cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => user && toggle(user.id, item.id) },
                          ])
                        }
                      >
                        <Ionicons name="heart" size={20} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Surface>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  topBarTxt: { color: '#888' },
  moveAllTxt: { color: theme.colors.primary },
  moveAllBtn: { padding: 4 },
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl },
  emptyTitle: { fontWeight: '600', color: '#555' },
  emptySub: { color: '#999', textAlign: 'center' },
  card: { borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#fff' },
  cardInner: { flexDirection: 'row' },
  imgWrap: { position: 'relative' },
  img: { width: 110, height: 110, backgroundColor: '#f0f0f0' },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  discTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  authBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#2E7D32', padding: 2, borderRadius: 999,
  },
  info: { flex: 1, padding: SPACING.sm, justifyContent: 'space-between' },
  title: { color: '#333', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { color: theme.colors.primary, fontWeight: '700' },
  mrp: { color: '#bbb', fontSize: 11, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#4CAF50',
  },
  codTxt: { color: '#2E7D32', fontSize: 9, fontWeight: '700' },
  eta: { color: '#888', fontSize: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  addBtn: { flex: 1 },
  addBtnContent: { paddingVertical: 2 },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
  },
});
