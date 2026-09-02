import { createClient } from "@supabase/supabase-js";

import { getServerEnv, requirePublicEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const publicEnv = requirePublicEnv();
  const serverEnv = getServerEnv();

  if (!serverEnv) {
    return null;
  }

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
