import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/server/shared/auth";
import { AppError } from "@/server/shared/errors";
import { getOrCreateCurrentUserProfile } from "@/server/shared/user-profile";

async function resolveOrganizationId(profile: { default_organization_id: string | null }, userId: string, supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  if (profile.default_organization_id) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("organization_id", profile.default_organization_id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      return profile.default_organization_id;
    }
  }

  const { data: fallbackMembership, error: fallbackMembershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackMembershipError || !fallbackMembership) {
    throw new AppError("No organization has been configured for this user.", 400, "NO_ORGANIZATION");
  }

  if (profile.default_organization_id !== fallbackMembership.organization_id) {
    const { error: profileUpdateError } = await supabase
      .from("user_profiles")
      .update({ default_organization_id: fallbackMembership.organization_id })
      .eq("id", userId);

    if (!profileUpdateError) {
      profile.default_organization_id = fallbackMembership.organization_id;
    }
  }

  return fallbackMembership.organization_id;
}

export async function requireCurrentOrganizationContext() {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();
  const profile = await getOrCreateCurrentUserProfile(user);
  const organizationId = await resolveOrganizationId(profile, user.id, supabase);

  return {
    supabase,
    user,
    organizationId,
    profile
  };
}
