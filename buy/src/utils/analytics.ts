/**
 * Analytics utility — scaffold for Mixpanel / Amplitude integration.
 *
 * To integrate a real analytics provider:
 * 1. Install: npx expo install @segment/analytics-react-native
 *    OR: npm install mixpanel-react-native
 * 2. Initialize in _layout.tsx AppInitializer
 * 3. Replace the console.log calls below with real SDK calls
 *
 * All events are typed via AnalyticsEvent in src/types/index.ts
 */

import { AnalyticsEvent } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_ENABLED_KEY = 'buy_privacy_prefs';
const ANALYTICS_QUEUE_KEY = 'buy_analytics_queue';

async function isAnalyticsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_ENABLED_KEY);
    if (!raw) return true; // default enabled
    const prefs = JSON.parse(raw);
    return prefs.analytics !== false;
  } catch {
    return true;
  }
}

/**
 * Track an analytics event.
 * Respects the user's analytics privacy preference.
 */
export async function track(event: AnalyticsEvent): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  // In development: log to console
  if (__DEV__) {
    console.log('[Analytics]', event.name, event);
    return;
  }

  // In production: send to analytics provider
  // Example with Mixpanel:
  // Mixpanel.track(event.name, event);

  // Example with Segment:
  // Analytics.track(event.name, event);

  // For now: queue events locally (useful for offline scenarios)
  try {
    const queue = (await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY));
    const events = queue ? JSON.parse(queue) : [];
    events.push({ ...event, timestamp: new Date().toISOString() });
    // Keep only last 100 events to avoid storage bloat
    const trimmed = events.slice(-100);
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Analytics failures should never crash the app
  }
}

/**
 * Flush queued events to the analytics provider.
 * Call this when the app comes online or on app foreground.
 */
export async function flushAnalyticsQueue(): Promise<void> {
  try {
    const queue = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!queue) return;
    const events = JSON.parse(queue);
    if (events.length === 0) return;

    // In production: batch send to analytics provider
    if (__DEV__) {
      console.log('[Analytics] Flushing', events.length, 'queued events');
    }

    // Clear queue after successful flush
    await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Identify the current user for analytics.
 * Call after login.
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log('[Analytics] Identify:', userId, traits);
    return;
  }
  // In production:
  // Mixpanel.identify(userId);
  // Mixpanel.getPeople().set(traits);
}

/**
 * Reset analytics identity.
 * Call on logout.
 */
export function reset(): void {
  if (__DEV__) {
    console.log('[Analytics] Reset');
    return;
  }
  // In production:
  // Mixpanel.reset();
}
