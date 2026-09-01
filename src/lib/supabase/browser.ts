import { createBrowserClient } from "@supabase/ssr";

import { requirePublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const publicEnv = requirePublicEnv();

  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
