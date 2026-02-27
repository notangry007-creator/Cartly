import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { DEFAULT_BLURHASH } from '../../data/images';

interface Props {
  uri: string;
  blurhash?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

/**
 * CachedImage wraps expo-image with:
 * - blurhash placeholder (colour preview before load)
 * - memory + disk caching
 * - smooth 300ms fade transition
 */
export default function CachedImage({ uri, blurhash, style, contentFit = 'cover' }: Props) {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      placeholder={{ blurhash: blurhash ?? DEFAULT_BLURHASH }}
      transition={300}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}
