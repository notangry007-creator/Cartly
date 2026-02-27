import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

/**
 * Returns a <Redirect> element when the user is not authenticated,
 * or null when they are. Render the return value at the top of any
 * protected screen before any other output:
 *
 *   const guard = useAuthGuard();
 *   if (guard) return guard;
 *
 * Using a synchronous Redirect avoids the one-frame flash that a
 * useEffect-based navigation causes, because the redirect is resolved
 * during the render phase rather than after commit.
 */
export function useAuthGuard(): React.ReactElement | null {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return null;
}

// React is needed for JSX — import here to avoid missing-import lint errors
// when this hook is consumed without a top-level React import in the caller.
import React from 'react';
