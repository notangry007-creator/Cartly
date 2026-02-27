import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
} from 'react-native-reanimated';
import { Product, ZoneId } from '../../types';
import { formatNPR, getDiscountPercent, getBestETA } from '../../utils/helpers';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuthStore } from '../../stores/authStore';
import { SPACING, RADIUS, theme } from '../../theme';

interface Props {
  product: Product;
  zoneId: ZoneId;
  onPress: () => void;
}

// Low-stock threshold: show urgency badge when ≤ 5 units across all variants
function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

function ProductCard({ product, zoneId, onPress }: Props) {
  const discount = getDiscountPercent(product.basePrice, product.baseMrp);
  const eta = getBestETA(product, zoneId);
  const cod = product.codAvailableZones.includes(zoneId);
  const totalStock = getTotalStock(product);
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const { user } = useAuthStore();
  const { isWishlisted, toggle } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  // Heart bounce animation
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  function handleWishlist() {
    if (!user) return;
    heartScale.value = withSequence(withSpring(1.5), withSpring(1));
    toggle(product.id);
  }

  const accessibilityHint = `${product.title}, ${formatNPR(product.basePrice)}${discount > 0 ? `, ${discount}% off` : ''}, rated ${product.rating} out of 5, ${cod ? 'COD available' : 'prepaid only'}, ${eta} delivery`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={s.wrap}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.title}`}
      accessibilityHint={accessibilityHint}
    >
      <Surface style={s.card} elevation={1}>
        <View style={s.imgWrap}>
          <Image
            source={{ uri: product.images[0] }}
            style={s.img}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            accessibilityLabel={`Product image for ${product.title}`}
            accessibilityRole="image"
          />
          {discount > 0 && (
            <View style={s.disc} accessibilityLabel={`${discount}% discount`}>
              <Text style={s.discTxt}>{discount}% off</Text>
            </View>
          )}
          {product.isAuthenticated && (
            <View style={s.auth} accessibilityLabel="Authenticity verified">
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
            </View>
          )}
          {/* Low-stock urgency badge */}
          {isLowStock && (
            <View style={s.urgency} accessibilityLabel={`Only ${totalStock} left in stock`}>
              <Text style={s.urgencyTxt}>Only {totalStock} left!</Text>
            </View>
          )}
          {/* Heart / Wishlist button — 44×44dp touch target */}
          <TouchableOpacity
            style={s.heartBtn}
            onPress={handleWishlist}
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            accessibilityState={{ selected: wishlisted }}
          >
            <Animated.View style={heartStyle}>
              <Ionicons
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={wishlisted ? '#E53935' : '#fff'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={s.info}>
          <Text
            variant="labelMedium"
            numberOfLines={2}
            style={s.title}
            accessibilityRole="text"
          >
            {product.title}
          </Text>
          <View style={s.priceRow}>
            <Text
              variant="titleSmall"
              style={s.price}
              accessibilityLabel={`Price: ${formatNPR(product.basePrice)}`}
            >
              {formatNPR(product.basePrice)}
            </Text>
            {discount > 0 && (
              <Text
                style={s.mrp}
                accessibilityLabel={`Original price: ${formatNPR(product.baseMrp)}`}
              >
                {formatNPR(product.baseMrp)}
              </Text>
            )}
          </View>
          <View style={s.ratingRow} accessibilityLabel={`Rating: ${product.rating} out of 5, ${product.totalReviews} reviews`}>
            <Ionicons name="star" size={12} color="#FFA000" accessibilityElementsHidden />
            <Text variant="labelSmall" style={s.rating}>{product.rating} ({product.totalReviews})</Text>
          </View>
          <View style={s.badges}>
            {cod && (
              <View style={s.codBadge} accessibilityLabel="Cash on delivery available">
                <Text style={s.codTxt}>COD</Text>
              </View>
            )}
            <Text variant="labelSmall" style={s.eta} accessibilityLabel={`Estimated delivery: ${eta}`}>
              {eta}
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, margin: SPACING.xs },
  card: { borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#fff' },
  imgWrap: { position: 'relative' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  disc: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  discTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  auth: {
    position: 'absolute', top: 6, right: 44,
    backgroundColor: '#2E7D32', padding: 3, borderRadius: 999,
  },
  urgency: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: '#FF6F00',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  urgencyTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  // 44×44dp minimum touch target
  heartBtn: {
    position: 'absolute', top: 0, right: 0,
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { padding: SPACING.sm },
  title: { color: '#333', lineHeight: 16, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  price: { color: theme.colors.primary, fontWeight: '700' },
  mrp: { color: '#bbb', fontSize: 11, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  rating: { color: '#666' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  codBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#4CAF50',
  },
  codTxt: { color: '#2E7D32', fontSize: 9, fontWeight: '700' },
  eta: { color: '#888', fontSize: 10 },
});

export default React.memo(ProductCard);
