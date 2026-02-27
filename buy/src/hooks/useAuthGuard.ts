import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

/**
 * Redirects to login if user is not authenticated.
 * Use at the top of any protected screen.
 *
 * Returns `true` if authenticated (safe to render), `false` if redirecting.
 *
 * Note: The redirect happens synchronously on the first render via useEffect,
 * but the component still renders once before the redirect fires. To prevent
 * a flash of protected content, return `null` when `!isAuthenticated`.
 *
 * Usage:
 *   const auth = useAuthGuard();
 *   if (!auth) return null;
 */
export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return isAuthenticated;
}

/**
 * Synchronous auth check — does NOT redirect, just returns the auth state.
 * Use this when you want to conditionally render content without a redirect.
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore(s => s.isAuthenticated);
}
