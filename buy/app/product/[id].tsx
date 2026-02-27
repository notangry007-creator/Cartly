import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Linking, Share, Modal, FlatList,
  RefreshControl,
} from 'react-native';
import { Text, Button, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useProduct, useSeller, useReviews } from '../../src/hooks/useProducts';
import { useCartStore } from '../../src/stores/cartStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useZoneStore } from '../../src/stores/zoneStore';
import { useWishlistStore } from '../../src/stores/wishlistStore';
import { useRecentlyViewedStore } from '../../src/stores/recentlyViewedStore';
import { useToast } from '../../src/context/ToastContext';
import {
  formatNPR, getDiscountPercent, getBestETA,
  getAvailableDeliveryOptions, getDeliveryFee, getETA, timeAgo,
} from '../../src/utils/helpers';
import { theme, SPACING, RADIUS } from '../../src/theme';
import { IMG } from '../../src/data/images';

const { width: W } = Dimensions.get('window');

function TrustItem({ icon, text, ok }: { icon: string; text: string; ok: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 }}>
      <Ionicons name={(ok ? icon : 'close-circle') as any} size={16} color={ok ? '#2E7D32' : '#B71C1C'} />
      <Text variant="bodySmall" style={{ color: ok ? '#444' : '#B71C1C' }}>{text}</Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { zoneId } = useZoneStore();
  const { addItem } = useCartStore();
  const { isWishlisted, toggle: toggleWishlist } = useWishlistStore();
  const { addProduct: addRecentlyViewed } = useRecentlyViewedStore();
  const { showSuccess, showError } = useToast();

  const { data: product, isLoading, refetch } = useProduct(id);
  const { data: seller } = useSeller(product?.sellerId ?? '');
  const { data: reviews = [] } = useReviews(id);

  // State
  const [attrSelection, setAttrSelection] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const imgScrollRef = useRef<ScrollView>(null);

  // Heart bounce animation
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  // Track recently viewed
  React.useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product?.id]);

  // Derived
  const attrKeys = useMemo(
    () => [...new Set((product?.variants ?? []).flatMap(v => Object.keys(v.attributes)))],
    [product]
  );

  // Resolve selected variant from attribute selections
  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    // Find a variant where ALL selected attributes match
    const match = product.variants.find(v =>
      attrKeys.every(key => !attrSelection[key] || v.attributes[key] === attrSelection[key])
    );
    return match ?? product.variants[0];
  }, [product, attrSelection, attrKeys]);

  const curVariantId = selectedVariant?.id ?? '';

  function selectAttribute(key: string, value: string) {
    setAttrSelection(prev => ({ ...prev, [key]: value }));
    Haptics.selectionAsync();
  }

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color="#ccc" />
          <Text variant="titleMedium" style={{ color: '#666' }}>Product not found</Text>
          <Button mode="outlined" onPress={() => router.back()}>Go Back</Button>
        </View>
      </View>
    );
  }

  const p = product; // non-null alias after guard
  const variant = selectedVariant ?? p.variants[0];
  const discount = getDiscountPercent(variant?.price ?? 0, variant?.mrp ?? 0);
  const codAvail = p.codAvailableZones.includes(zoneId);
  const dOpts = getAvailableDeliveryOptions(p, zoneId);
  const wishlisted = isWishlisted(p.id);
  const inStock = p.inStock && (variant?.stock ?? 0) > 0;

  async function handleAddToCart() {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!inStock) return;
    setAdding(true);
    try {
      await addItem(user.id, p.id, curVariantId, qty);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`"${p.title.slice(0, 25)}..." added to cart`);
    } catch {
      showError('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (!user) { router.push('/(auth)/login'); return; }
    await addItem(user.id, p.id, curVariantId, qty);
    router.push('/checkout');
  }

  function handleWishlist() {
    if (!user) { router.push('/(auth)/login'); return; }
    heartScale.value = withSequence(withSpring(1.4, { damping: 4 }), withSpring(1));
    toggleWishlist(user.id, p.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openGallery(index: number) {
    setGalleryStart(index);
    setGalleryVisible(true);
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Floating header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.xs }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.hBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <View style={s.hActions}>
          <Animated.View style={heartStyle}>
            <TouchableOpacity onPress={handleWishlist} style={s.hBtn} accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
              <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={22} color={wishlisted ? '#E53935' : '#333'} />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            onPress={() => {
              const deepLink = `buy://product/${product.id}`;
              const webFallback = `https://buy.app/product/${product.id}`;
              Share.share({
                title: product.title,
                message: `Check out "${product.title}" on Buy!\nPrice: ${formatNPR(variant?.price ?? 0)}${(getDiscountPercent(variant?.price ?? 0, variant?.mrp ?? 0)) > 0 ? ` (${getDiscountPercent(variant?.price ?? 0, variant?.mrp ?? 0)}% off)` : ''}\n\nOpen in Buy app: ${deepLink}\nOr visit: ${webFallback}`,
                url: webFallback,
              });
            }}
            style={s.hBtn} accessibilityRole="button" accessibilityLabel={`Share ${product.title}`}
          >
            <Ionicons name="share-social-outline" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={s.hBtn} accessibilityLabel="View cart">
            <Ionicons name="bag-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} colors={[theme.colors.primary]} />}
      >
        {/* Image carousel — tap to open full gallery */}
        <View style={s.carousel}>
          <ScrollView
            ref={imgScrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            scrollEventThrottle={16}
          >
            {product.images.map((img, i) => {
              const productImgs = (IMG.products as unknown as Record<string, {uri:string;blurhash:string}[]>)[product.id];
              const imgData = productImgs?.[i];
              return (
                <TouchableOpacity key={i} onPress={() => openGallery(i)} activeOpacity={0.95}>
                  <Image
                    source={{ uri: imgData?.uri ?? img }}
                    style={s.mainImg}
                    contentFit="cover"
                    placeholder={{ blurhash: imgData?.blurhash }}
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={s.dots}>
            {product.images.map((_, i) => <View key={i} style={[s.dot, i === imgIdx && s.dotA]} />)}
          </View>
          <View style={s.imgCount}>
            <Text style={s.imgCountTxt}>{imgIdx + 1}/{product.images.length}</Text>
          </View>
          {product.isAuthenticated && (
            <View style={s.authBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
              <Text style={s.authTxt}>Authenticity Verified</Text>
            </View>
          )}
        </View>

        <View style={s.content}>
          {/* Title + brand */}
          <Text variant="headlineSmall" style={s.title}>{product.title}</Text>
          {product.brand && <Text variant="labelMedium" style={s.brand}>by {product.brand}</Text>}

          {/* Rating */}
          <View style={s.ratingRow}>
            <Ionicons name="star" size={16} color="#FFA000" />
            <Text variant="titleSmall" style={s.ratingVal}>{product.rating}</Text>
            <Text variant="bodySmall" style={s.ratingCnt}>({product.totalReviews} reviews)</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/product/reviews', params: { id: product.id } })}>
              <Text variant="labelSmall" style={s.seeReviews}>See all →</Text>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={s.priceRow}>
            <Text variant="headlineMedium" style={s.price}>{formatNPR(variant?.price ?? product.basePrice)}</Text>
            {discount > 0 && (
              <>
                <Text style={s.mrp}>{formatNPR(variant?.mrp ?? product.baseMrp)}</Text>
                <View style={s.discTag}><Text style={s.discTxt}>{discount}% OFF</Text></View>
              </>
            )}
          </View>

          {/* Low stock urgency */}
          {(variant?.stock ?? 0) <= 5 && (variant?.stock ?? 0) > 0 && (
            <Text style={s.lowStock}>⚠ Only {variant?.stock} left in stock!</Text>
          )}

          <Divider style={s.divider} />

          {/* Delivery */}
          <View style={s.section}>
            <Text variant="titleSmall" style={s.secTitle}>Delivery Options</Text>
            {!dOpts.length
              ? <Text variant="bodySmall" style={s.unavailTxt}>Not available in your zone</Text>
              : dOpts.map(opt => (
                  <View key={opt} style={s.dOpt}>
                    <Ionicons name={opt === 'same_day' ? 'flash' : opt === 'next_day' ? 'bicycle' : 'cube'} size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={s.dOptTxt}>{getETA(zoneId, opt)} · {formatNPR(getDeliveryFee(zoneId, opt))}</Text>
                  </View>
                ))
            }
            <View style={s.codRow}>
              <Ionicons name={codAvail ? 'cash' : 'close-circle'} size={14} color={codAvail ? '#2E7D32' : '#B71C1C'} />
              <Text style={[s.codTxt, !codAvail && { color: '#B71C1C' }]}>
                {codAvail ? 'Cash on Delivery available' : 'COD not available in your zone'}
              </Text>
            </View>
          </View>

          <Divider style={s.divider} />

          {/* Variant picker — PER ATTRIBUTE KEY */}
          {attrKeys.length > 0 && (
            <View style={s.section}>
              {attrKeys.map(key => {
                const uniqueValues = [...new Set(product.variants.map(v => v.attributes[key]).filter(Boolean))];
                const currentVal = attrSelection[key] ?? (selectedVariant?.attributes[key] ?? uniqueValues[0]);
                return (
                  <View key={key} style={{ marginBottom: SPACING.md }}>
                    <Text variant="titleSmall" style={s.varKey}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:{' '}
                      <Text style={s.varSel}>{currentVal}</Text>
                    </Text>
                    <View style={s.varRow}>
                      {uniqueValues.map(val => {
                        const isSelected = currentVal === val;
                        const hasStock = product.variants.some(v => v.attributes[key] === val && v.stock > 0);
                        return (
                          <TouchableOpacity
                            key={val}
                            onPress={() => selectAttribute(key, val)}
                            style={[s.vChip, isSelected && s.vChipSel, !hasStock && s.vChipOOS]}
                            disabled={!hasStock}
                            accessibilityLabel={`${key}: ${val}${!hasStock ? ', out of stock' : ''}`}
                          >
                            <Text style={[s.vChipTxt, isSelected && s.vChipTxtSel, !hasStock && s.vChipTxtOOS]}>
                              {val}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Quantity */}
          <View style={s.qtyRow}>
            <Text variant="titleSmall" style={s.secTitle}>Qty</Text>
            <View style={s.qtyCtrl}>
              <TouchableOpacity style={s.qBtn} onPress={() => setQty(Math.max(1, qty - 1))} accessibilityLabel="Decrease quantity">
                <Ionicons name="remove" size={18} color="#333" />
              </TouchableOpacity>
              <Text variant="titleMedium" style={s.qVal}>{qty}</Text>
              <TouchableOpacity
                style={s.qBtn}
                onPress={() => { if (qty < (variant?.stock ?? 1)) setQty(qty + 1); }}
                disabled={qty >= (variant?.stock ?? 1)}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color={qty >= (variant?.stock ?? 1) ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
            <Text variant="labelSmall" style={s.stockTxt}>{variant?.stock ?? 0} available</Text>
          </View>

          <Divider style={s.divider} />

          {/* Seller card */}
          {seller && (
            <TouchableOpacity onPress={() => router.push(`/seller/${seller.id}`)} activeOpacity={0.85}>
              <Surface style={s.sellerCard} elevation={1}>
                <View style={s.sellerHeader}>
                  <Image source={{ uri: seller.logoUrl }} style={s.sellerLogo} contentFit="cover" />
                  <View style={s.sellerInfo}>
                    <View style={s.sellerNameRow}>
                      <Text variant="titleSmall" style={s.sellerName}>{seller.name}</Text>
                      {seller.isVerified && (
                        <View style={s.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#1565C0" />
                          <Text style={s.verTxt}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text variant="labelSmall" style={s.fulfill}>
                      {seller.fulfillmentType === 'buy_fulfilled' ? '✅ Buy Fulfilled' : '📦 Seller Fulfilled'}
                    </Text>
                    <View style={s.sRating}>
                      <Ionicons name="star" size={12} color="#FFA000" />
                      <Text variant="labelSmall" style={{ color: '#666' }}>{seller.rating} · {seller.totalReviews} ratings</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </View>
                <View style={s.sellerActions}>
                  <TouchableOpacity style={s.sABtn} onPress={e => { e.stopPropagation(); Linking.openURL('tel:' + seller.phone); }}>
                    <Ionicons name="call" size={16} color={theme.colors.primary} />
                    <Text style={s.sABtnTxt}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.sABtn} onPress={e => { e.stopPropagation(); Linking.openURL('https://wa.me/977' + seller.whatsapp + '?text=Hi about ' + encodeURIComponent(product.title)); }}>
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={s.sABtnTxt}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </Surface>
            </TouchableOpacity>
          )}

          {/* Trust section */}
          <Surface style={s.trustSection} elevation={1}>
            <Text variant="titleSmall" style={s.secTitle}>Why Buy with Trust</Text>
            <TrustItem icon="shield-checkmark" text={product.isAuthenticated ? 'Authenticity Verified' : 'Authenticity Not Verified'} ok={product.isAuthenticated} />
            <TrustItem icon="refresh-circle" text={seller?.returnPolicy?.split('.')[0] ?? 'Easy Returns'} ok />
            <TrustItem icon="headset" text="24/7 Customer Support" ok />
            <TrustItem icon="cash" text={codAvail ? 'COD Available' : 'Prepaid Only'} ok={codAvail} />
            <View style={s.retPolicy}>
              <Text variant="labelSmall" style={{ color: '#555', fontWeight: '600' }}>Return Policy</Text>
              <Text variant="bodySmall" style={{ color: '#666', lineHeight: 18, marginTop: 2 }}>
                {seller?.returnPolicy ?? 'Standard 7-day return policy applies.'}
              </Text>
            </View>
          </Surface>

          {/* Description */}
          <View style={s.section}>
            <Text variant="titleSmall" style={s.secTitle}>Description</Text>
            <Text variant="bodySmall" style={s.descTxt}>{product.description}</Text>
          </View>

          {/* Reviews preview */}
          <View style={s.section}>
            <View style={s.reviewsHeader}>
              <Text variant="titleSmall" style={s.secTitle}>Reviews ({reviews.length})</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/product/reviews', params: { id: product.id } })}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>See all →</Text>
              </TouchableOpacity>
            </View>
            {reviews.length === 0 && (
              <Text variant="bodySmall" style={{ color: '#888' }}>No reviews yet. Be the first!</Text>
            )}
            {reviews.slice(0, 3).map(rev => (
              <Surface key={rev.id} style={s.revCard} elevation={0}>
                <View style={s.revHeader}>
                  <View style={s.revAvatar}><Text style={s.revAvatarTxt}>{rev.userName.charAt(0)}</Text></View>
                  <View style={s.revMeta}>
                    <Text variant="labelMedium" style={{ fontWeight: '600', color: '#333' }}>{rev.userName}</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1,2,3,4,5].map(n => <Ionicons key={n} name="star" size={12} color={n <= rev.rating ? '#FFA000' : '#e0e0e0'} />)}
                    </View>
                  </View>
                  <Text variant="labelSmall" style={{ color: '#bbb' }}>{timeAgo(rev.createdAt)}</Text>
                </View>
                <Text variant="bodySmall" style={{ color: '#555', lineHeight: 18 }}>{rev.comment}</Text>
              </Surface>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <Button
          mode="outlined" onPress={handleAddToCart}
          style={s.addBtn} loading={adding}
          disabled={!inStock}
          accessibilityLabel="Add to cart"
        >
          Add to Cart
        </Button>
        <Button
          mode="contained" onPress={handleBuyNow}
          style={s.buyBtn} disabled={!inStock}
          accessibilityLabel={inStock ? 'Buy now' : 'Out of stock'}
        >
          {inStock ? 'Buy Now' : 'Out of Stock'}
        </Button>
      </View>

      {/* Full-screen image gallery */}
      <Modal visible={galleryVisible} animationType="fade" statusBarTranslucent>
        <View style={s.galleryBg}>
          <TouchableOpacity style={s.galleryClose} onPress={() => setGalleryVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={product.images}
            keyExtractor={(_, i) => String(i)}
            horizontal pagingEnabled
            initialScrollIndex={galleryStart}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const galleryImgs = (IMG.products as unknown as Record<string, {uri:string;blurhash:string}[]>)[product.id];
              const imgData = galleryImgs?.[index];
              return (
                <View style={{ width: W, justifyContent: 'center' }}>
                  <Image
                    source={{ uri: imgData?.uri ?? item }}
                    style={{ width: W, height: W * 1.2 }}
                    contentFit="contain"
                    placeholder={{ blurhash: imgData?.blurhash }}
                  />
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm,
  },
  hBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  hActions: { flexDirection: 'row', gap: SPACING.xs },
  carousel: { width: W, position: 'relative' },
  mainImg: { width: W, height: W, backgroundColor: '#f0f0f0' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginVertical: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd' },
  dotA: { backgroundColor: theme.colors.primary, width: 14 },
  imgCount: { position: 'absolute', bottom: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  imgCountTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  authBadge: { position: 'absolute', bottom: 36, left: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2E7D32', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 999 },
  authTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  content: { padding: SPACING.lg },
  title: { fontWeight: '700', color: '#222', lineHeight: 30 },
  brand: { color: '#888', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: SPACING.sm },
  ratingVal: { fontWeight: '700', color: '#333' },
  ratingCnt: { color: '#888' },
  seeReviews: { color: theme.colors.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  price: { fontWeight: '800', color: theme.colors.primary },
  mrp: { color: '#bbb', fontSize: 16, textDecorationLine: 'line-through' },
  discTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  discTxt: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  lowStock: { color: '#FF8F00', fontSize: 12, fontWeight: '600', marginBottom: SPACING.sm },
  divider: { marginVertical: SPACING.sm },
  section: { paddingVertical: SPACING.sm, marginBottom: SPACING.sm },
  secTitle: { fontWeight: '700', color: '#222', marginBottom: SPACING.sm },
  unavailTxt: { color: '#B71C1C' },
  dOpt: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  dOptTxt: { color: '#444' },
  codRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  codTxt: { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  varKey: { color: '#555', marginBottom: 8 },
  varSel: { color: '#222', fontWeight: '700' },
  varRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  vChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: '#e0e0e0' },
  vChipSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
  vChipOOS: { borderColor: '#f0f0f0', backgroundColor: '#fafafa' },
  vChipTxt: { color: '#444', fontSize: 13 },
  vChipTxtSel: { color: theme.colors.primary, fontWeight: '700' },
  vChipTxtOOS: { color: '#ccc' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qBtn: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  qVal: { fontWeight: '700', minWidth: 28, textAlign: 'center' },
  stockTxt: { color: '#888', marginLeft: 'auto' as const },
  sellerCard: { borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: '#FAFAFA', marginVertical: SPACING.sm },
  sellerHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  sellerLogo: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: '#f0f0f0' },
  sellerInfo: { flex: 1, gap: 2 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  sellerName: { fontWeight: '700', color: '#222' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verTxt: { color: '#1565C0', fontSize: 11, fontWeight: '600' },
  fulfill: { color: '#666' },
  sRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sellerActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  sABtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e0e0e0' },
  sABtnTxt: { color: '#444', fontSize: 13, fontWeight: '600' },
  trustSection: { borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: '#F8FFF8', marginVertical: SPACING.sm },
  retPolicy: { marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#e8f5e9', paddingTop: SPACING.sm },
  descTxt: { color: '#555', lineHeight: 22 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  revCard: { marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: '#fafafa' },
  revHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  revAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  revAvatarTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  revMeta: { flex: 1 },
  bottomBar: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  addBtn: { flex: 1 },
  buyBtn: { flex: 1 },
  galleryBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  galleryClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: SPACING.sm },
});
