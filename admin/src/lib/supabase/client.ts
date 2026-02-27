import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client for use in Client Components.
 *
 * Usage:
 *   import { createClient } from '@/src/lib/supabase/client';
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
