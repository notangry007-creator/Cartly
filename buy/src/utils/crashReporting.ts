/**
 * Crash Reporting utility — scaffold for Sentry / Bugsnag integration.
 *
 * To integrate Sentry:
 * 1. Install: npx expo install @sentry/react-native
 * 2. Run: npx @sentry/wizard@latest -i reactNative
 * 3. Initialize in _layout.tsx before the app renders:
 *    import * as Sentry from '@sentry/react-native';
 *    Sentry.init({ dsn: 'YOUR_DSN', environment: __DEV__ ? 'development' : 'production' });
 * 4. Replace the console.error calls below with Sentry calls
 *
 * To integrate Bugsnag:
 * 1. Install: npm install @bugsnag/react-native
 * 2. Initialize: Bugsnag.start('YOUR_API_KEY');
 */

/**
 * Report a non-fatal error to the crash reporter.
 * Use for caught errors that should be tracked but don't crash the app.
 */
export function reportError(error: Error | unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[CrashReporter]', error, context);
    return;
  }

  // In production with Sentry:
  // Sentry.captureException(error, { extra: context });

  // In production with Bugsnag:
  // Bugsnag.notify(error instanceof Error ? error : new Error(String(error)));
}

/**
 * Set user context for crash reports.
 * Call after login so crashes are associated with the user.
 */
export function setUserContext(userId: string, phone: string): void {
  if (__DEV__) {
    console.log('[CrashReporter] Set user:', userId);
    return;
  }

  // In production with Sentry:
  // Sentry.setUser({ id: userId, username: phone });

  // In production with Bugsnag:
  // Bugsnag.setUser(userId, phone, undefined);
}

/**
 * Clear user context on logout.
 */
export function clearUserContext(): void {
  if (__DEV__) {
    console.log('[CrashReporter] Clear user');
    return;
  }

  // In production with Sentry:
  // Sentry.setUser(null);

  // In production with Bugsnag:
  // Bugsnag.setUser(undefined, undefined, undefined);
}

/**
 * Add breadcrumb for debugging crash context.
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) return; // Skip in dev to reduce noise

  // In production with Sentry:
  // Sentry.addBreadcrumb({ message, data, level: 'info' });
}
