/**
 * React Query Offline-First Persister
 *
 * This sets up React Query's persistQueryClient to cache query results
 * in AsyncStorage, enabling true offline-first behavior.
 *
 * To activate:
 * 1. Install: npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
 * 2. In buy/app/_layout.tsx, replace QueryClientProvider with PersistQueryClientProvider:
 *
 *    import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
 *    import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
 *    import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 *    const persister = createAsyncStoragePersister({
 *      storage: AsyncStorage,
 *      key: 'buy_query_cache',
 *      throttleTime: 1000,
 *    });
 *
 *    // Replace <QueryClientProvider client={queryClient}>
 *    // with:
 *    <PersistQueryClientProvider
 *      client={queryClient}
 *      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }} // 24h cache
 *    >
 *
 * Benefits:
 * - Products, categories, and banners load instantly from cache on app open
 * - App works fully offline for browsing (not purchasing)
 * - Cache is automatically invalidated after 24 hours
 * - Stale data is shown while fresh data loads in background
 *
 * Current status: SCAFFOLD ONLY — packages not yet installed.
 * The current implementation uses React Query's in-memory cache only.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'buy_query_cache';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Manual cache save — use as a fallback until the persister package is installed.
 * Saves the current query cache to AsyncStorage.
 */
export async function saveQueryCache(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      savedAt: Date.now(),
    }));
  } catch {
    // Cache save failures should never crash the app
  }
}

/**
 * Manual cache load — use as a fallback until the persister package is installed.
 * Returns null if cache is expired or missing.
 */
export async function loadQueryCache(): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_MAX_AGE_MS) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Clear the query cache.
 */
export async function clearQueryCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

/**
 * Installation instructions for full offline-first support:
 *
 * npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
 *
 * Then follow the setup instructions at the top of this file.
 */
export const OFFLINE_FIRST_SETUP_INSTRUCTIONS = `
To enable full offline-first support:

1. Install packages:
   npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client

2. Update buy/app/_layout.tsx:
   - Import PersistQueryClientProvider and createAsyncStoragePersister
   - Create persister with AsyncStorage
   - Wrap app with PersistQueryClientProvider instead of QueryClientProvider

3. Configure queryClient with appropriate staleTime and gcTime values.

See buy/src/utils/queryPersister.ts for full implementation details.
`;
