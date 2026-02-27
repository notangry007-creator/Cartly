import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
export const AUTH_TOKEN_KEY = 'buy_auth_token';
export const USER_ID_KEY = 'buy_user_id';
export async function saveAuthToken(t: string) { await SecureStore.setItemAsync(AUTH_TOKEN_KEY, t); }
export async function getAuthToken() { return SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
export async function clearAuthToken() { await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); await SecureStore.deleteItemAsync(USER_ID_KEY); }
export async function saveUserId(id: string) { await SecureStore.setItemAsync(USER_ID_KEY, id); }
export async function getSavedUserId() { return SecureStore.getItemAsync(USER_ID_KEY); }
export const STORAGE_KEYS = {
  USERS:'buy_users', ADDRESSES:'buy_addresses', CART:'buy_cart', ORDERS:'buy_orders',
  RETURN_REQUESTS:'buy_returns', WALLET_TXS:'buy_wallet', NOTIFICATIONS:'buy_notifs',
  RECENT_SEARCHES:'buy_searches', REVIEWS:'buy_reviews', ZONE:'buy_zone', FIRST_RUN:'buy_first_run',
} as const;
export async function getItem<T>(key: string): Promise<T|null> {
  try { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) as T : null; } catch { return null; }
}
export async function setItem<T>(key: string, value: T) { await AsyncStorage.setItem(key, JSON.stringify(value)); }
export async function removeItem(key: string) { await AsyncStorage.removeItem(key); }
