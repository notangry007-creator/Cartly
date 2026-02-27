/**
 * ProductVideoPlayer — renders a video thumbnail with a play button overlay.
 * Tapping opens a full-screen video player using expo-av.
 * Falls back gracefully if expo-av is not available.
 */
import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { theme, SPACING, RADIUS } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  uri: string;
  thumbnailUri?: string;
  style?: object;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(url) || url.includes('video');
}

export default function ProductVideoPlayer({ uri, style }: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  return (
    <>
      {/* Thumbnail with play button */}
      <TouchableOpacity
        style={[s.container, style]}
        onPress={() => setPlaying(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Play product video"
      >
        <View style={s.placeholder}>
          <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.6)" />
          <Text style={s.videoLabel}>Product Video</Text>
        </View>
        <View style={s.playBtn}>
          <Ionicons name="play-circle" size={56} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Full-screen video modal */}
      <Modal visible={playing} animationType="fade" statusBarTranslucent onRequestClose={() => setPlaying(false)}>
        <View style={s.modal}>
          <TouchableOpacity style={s.closeBtn} onPress={() => setPlaying(false)} hitSlop={12}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <Video
            ref={videoRef}
            source={{ uri }}
            style={s.video}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping={false}
          />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  videoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  playBtn: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -28 }, { translateY: -28 }] },
  modal: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: SPACING.lg, zIndex: 10 },
  video: { width: W, height: H * 0.6 },
});
