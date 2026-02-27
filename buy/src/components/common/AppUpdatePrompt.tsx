/**
 * App Update Prompt — uses expo-updates for OTA updates.
 *
 * To activate:
 * 1. Install: npx expo install expo-updates
 * 2. Add to app.json plugins: ["expo-updates", { "launchWaitMs": 0 }]
 * 3. Uncomment the expo-updates import below
 * 4. Remove the mock implementation
 *
 * Current status: SCAFFOLD — expo-updates not yet installed.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme, SPACING, RADIUS } from '../../theme';

// Uncomment when expo-updates is installed:
// import * as Updates from 'expo-updates';

interface UpdateState {
  isAvailable: boolean;
  isDownloading: boolean;
  isReady: boolean;
}

/**
 * AppUpdatePrompt checks for OTA updates and shows a banner when one is available.
 * Place this inside AppInitializer in _layout.tsx.
 *
 * Usage:
 *   <AppUpdatePrompt />
 */
export default function AppUpdatePrompt() {
  const [update, setUpdate] = useState<UpdateState>({
    isAvailable: false,
    isDownloading: false,
    isReady: false,
  });

  useEffect(() => {
    checkForUpdate();
  }, []);

  async function checkForUpdate() {
    // Skip in development
    if (__DEV__) return;

    try {
      // With expo-updates:
      // const result = await Updates.checkForUpdateAsync();
      // if (result.isAvailable) {
      //   setUpdate(prev => ({ ...prev, isAvailable: true }));
      //   await downloadUpdate();
      // }

      // Mock: no update available in scaffold mode
    } catch {
      // Update check failures should never crash the app
    }
  }

  async function downloadUpdate() {
    setUpdate(prev => ({ ...prev, isDownloading: true }));
    try {
      // With expo-updates:
      // await Updates.fetchUpdateAsync();
      setUpdate({ isAvailable: true, isDownloading: false, isReady: true });
    } catch {
      setUpdate(prev => ({ ...prev, isDownloading: false }));
    }
  }

  async function applyUpdate() {
    try {
      // With expo-updates:
      // await Updates.reloadAsync();
    } catch {
      // Reload failed — user can manually restart
    }
  }

  if (!update.isAvailable && !update.isReady) return null;

  return (
    <Surface style={s.banner} elevation={4}>
      <Ionicons name="cloud-download" size={20} color={theme.colors.primary} />
      <View style={s.info}>
        <Text variant="labelMedium" style={s.title}>
          {update.isReady ? 'Update Ready!' : 'Downloading update...'}
        </Text>
        <Text variant="labelSmall" style={s.sub}>
          {update.isReady
            ? 'Restart the app to apply the latest improvements'
            : 'A new version of Buy is being downloaded'
          }
        </Text>
      </View>
      {update.isReady && (
        <Button mode="contained" compact onPress={applyUpdate} style={s.btn}>
          Restart
        </Button>
      )}
    </Surface>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#fff',
    zIndex: 998,
  },
  info: { flex: 1 },
  title: { fontWeight: '700', color: '#222' },
  sub: { color: '#888', marginTop: 2 },
  btn: { flexShrink: 0 },
});
