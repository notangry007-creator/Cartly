import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../../src/hooks/useProducts';
import { IMG } from '../../src/data/images';
import CachedImage from '../../src/components/common/CachedImage';
import { SPACING, RADIUS, theme } from '../../src/theme';
import { SkeletonBox } from '../../src/components/common/SkeletonLoader';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cats = [], isLoading, isError, refetch } = useCategories();

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Categories</Text></View>
        <View style={s.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={s.cardWrap}>
              <SkeletonBox height={120} borderRadius={RADIUS.lg} style={{ marginBottom: 6 }} />
              <SkeletonBox width="60%" height={12} style={{ alignSelf: 'center' }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Categories</Text></View>
        <View style={s.errorState}>
          <Text variant="bodyMedium" style={{ color: '#888' }}>Failed to load categories</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text variant="headlineSmall" style={s.headerTitle}>Categories</Text></View>
      <FlatList
        data={cats}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.col}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />}
        renderItem={({ item }) => {
          const imgData = (IMG.categories as Record<string, { uri: string; blurhash: string }>)[item.id];
          return (
            <TouchableOpacity style={s.cardWrap} onPress={() => router.push(`/category/${item.id}`)} activeOpacity={0.8}>
              <Surface style={s.card} elevation={1}>
                <CachedImage uri={imgData?.uri ?? item.imageUrl} blurhash={imgData?.blurhash} style={s.img} />
                <View style={s.label}>
                  <Text variant="titleSmall" style={s.labelTxt}>{item.name}</Text>
                </View>
              </Surface>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: '#fff', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontWeight: '700', color: '#222' },
  grid: { padding: SPACING.md },
  col: { gap: SPACING.md },
  cardWrap: { flex: 1, marginBottom: SPACING.md },
  card: { borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#fff' },
  img: { width: '100%', aspectRatio: 1.5 },
  label: { padding: SPACING.sm, backgroundColor: '#fff' },
  labelTxt: { fontWeight: '600', color: '#222', textAlign: 'center' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  retryBtn: { padding: SPACING.md },
});
