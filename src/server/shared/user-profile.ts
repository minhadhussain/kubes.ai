import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CurrentUserProfile = {
  full_name: string | null;
  default_organization_id: string | null;
};

function getFallbackProfile(user: User): CurrentUserProfile {
  return {
    full_name: getFallbackFullName(user),
    default_organization_id: null
  };
}

function getFallbackFullName(user: User) {
  const metadataName = user.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  return user.email?.split("@")[0] ?? null;
}

export async function getOrCreateCurrentUserProfile(user: User): Promise<CurrentUserProfile> {
  const supabase = await createSupabaseServerClient();
  const fallbackProfile = getFallbackProfile(user);

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, default_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return fallbackProfile;
  }

  if (profile) {
    return profile;
  }

  const { error: profileInitError } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: getFallbackFullName(user)
    },
    { onConflict: "id" }
  );

  if (profileInitError) {
    return fallbackProfile;
  }

  const { data: initializedProfile, error: initializedProfileError } = await supabase
    .from("user_profiles")
    .select("full_name, default_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (initializedProfileError || !initializedProfile) {
    return fallbackProfile;
  }

  return initializedProfile;
}
