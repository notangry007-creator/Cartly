import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, ViewToken,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { setItem, STORAGE_KEYS } from '@/src/utils/storage';
import { theme, SPACING, RADIUS } from '@/src/theme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────
interface Slide {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  highlights: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'bag',
    iconBg: '#FFEBEE',
    iconColor: '#E53935',
    title: 'Shop Nepal\'s Best',
    subtitle: 'Discover thousands of products from verified sellers across Nepal — delivered to your door.',
    highlights: ['Electronics, Fashion, Grocery & more', 'Authenticity-verified products', 'Trusted seller badges'],
  },
  {
    id: '2',
    icon: 'flash',
    iconBg: '#FFF8E1',
    iconColor: '#FF8F00',
    title: 'Fast Delivery',
    subtitle: 'Same-day and next-day delivery available in Kathmandu. Track your order in real time.',
    highlights: ['Same-day delivery in KTM Core', 'Live order tracking', 'Accurate ETAs by your zone'],
  },
  {
    id: '3',
    icon: 'cash',
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
    title: 'COD First',
    subtitle: 'Pay cash when your order arrives. No prepayment needed in most of Nepal.',
    highlights: ['Cash on Delivery in most zones', 'Buy Wallet for instant payments', 'Zero-fee COD in Kathmandu Core'],
  },
  {
    id: '4',
    icon: 'shield-checkmark',
    iconBg: '#E3F2FD',
    iconColor: '#1565C0',
    title: 'Shop with Trust',
    subtitle: 'Easy 7-day returns, direct seller contact, and 24/7 support — your satisfaction guaranteed.',
    highlights: ['Easy 7-day returns', 'One-tap call & WhatsApp support', 'Secure checkout every time'],
  },
];

// ─── Single slide ─────────────────────────────────────────────────────────────
function TourSlide({ slide, index, scrollX }: { slide: Slide; index: number; scrollX: Animated.SharedValue<number> }) {
  const inputRange = [(index - 1) * W, index * W, (index + 1) * W];

  const iconScale = useAnimatedStyle(() => ({
    transform: [{
      scale: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP),
    }],
    opacity: interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP),
  }));

  const textSlide = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP),
    }],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={slide_s.container}>
      {/* Illustration area */}
      <View style={slide_s.illustrationArea}>
        {/* Decorative circles */}
        <View style={[slide_s.circleLg, { backgroundColor: slide.iconBg }]} />
        <View style={[slide_s.circleMd, { backgroundColor: slide.iconBg, opacity: 0.5 }]} />
        <Animated.View style={[slide_s.iconWrap, { backgroundColor: slide.iconBg }, iconScale]}>
          <Ionicons name={slide.icon as any} size={72} color={slide.iconColor} />
        </Animated.View>
      </View>

      {/* Text content */}
      <Animated.View style={[slide_s.textWrap, textSlide]}>
        <Text variant="headlineMedium" style={slide_s.title}>{slide.title}</Text>
        <Text variant="bodyLarge" style={slide_s.subtitle}>{slide.subtitle}</Text>
        <View style={slide_s.highlights}>
          {slide.highlights.map((h, i) => (
            <View key={i} style={slide_s.highlightRow}>
              <View style={[slide_s.highlightDot, { backgroundColor: slide.iconColor }]} />
              <Text variant="bodyMedium" style={slide_s.highlightText}>{h}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const slide_s = StyleSheet.create({
  container: {
    width: W,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  illustrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  circleLg: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.35,
  },
  circleMd: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  iconWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 0,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
  },
  highlights: {
    gap: SPACING.sm,
    alignSelf: 'stretch',
    marginTop: SPACING.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightText: {
    color: '#444',
    flex: 1,
  },
});

// ─── Dot indicator ────────────────────────────────────────────────────────────
function Dots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={dot_s.row}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <Animated.View
            key={i}
            style={[dot_s.dot, active ? dot_s.dotActive : dot_s.dotInactive]}
          />
        );
      })}
    </View>
  );
}

const dot_s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: theme.colors.primary },
  dotInactive: { width: 8, backgroundColor: '#ddd' },
});

// ─── Main Tour Screen ─────────────────────────────────────────────────────────
export default function TourScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const isLast = activeIndex === SLIDES.length - 1;

  async function finish() {
    await setItem(STORAGE_KEYS.TOUR_SEEN, true);
    router.replace('/(auth)/login');
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    const nextIndex = activeIndex + 1;
    flatRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.md }]}>
      {/* Skip button */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }} />
        {!isLast && (
          <TouchableOpacity onPress={finish} style={s.skipBtn} hitSlop={12}>
            <Text variant="labelLarge" style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => { scrollX.value = e.nativeEvent.contentOffset.x; }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={s.flatList}
        renderItem={({ item, index }) => (
          <TourSlide slide={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Bottom controls */}
      <View style={s.bottom}>
        <Dots count={SLIDES.length} activeIndex={activeIndex} />

        <Button
          mode="contained"
          onPress={next}
          style={s.nextBtn}
          contentStyle={s.nextBtnContent}
          icon={isLast ? 'arrow-right' : undefined}
        >
          {isLast ? 'Get Started' : 'Next'}
        </Button>

        {activeIndex > 0 && (
          <TouchableOpacity
            onPress={() => {
              const prev = activeIndex - 1;
              flatRef.current?.scrollToIndex({ index: prev, animated: true });
              setActiveIndex(prev);
            }}
            style={s.backBtn}
            hitSlop={8}
          >
            <Text variant="labelMedium" style={s.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  skipBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: '#f5f5f5',
  },
  skipText: {
    color: '#888',
  },
  flatList: {
    flex: 1,
  },
  bottom: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
  },
  nextBtn: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
  },
  nextBtnContent: {
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    paddingVertical: SPACING.xs,
  },
  backText: {
    color: '#aaa',
  },
});
