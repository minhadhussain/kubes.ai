import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/server/shared/auth";
import { AppError } from "@/server/shared/errors";
import { getOrCreateCurrentUserProfile } from "@/server/shared/user-profile";

export async function requireCurrentOrganizationContext() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateCurrentUserProfile(user);

  if (!profile.default_organization_id) {
    throw new AppError("No organization has been configured for this user.", 400, "NO_ORGANIZATION");
  }

  const supabase = await createSupabaseServerClient();

  return {
    supabase,
    user,
    organizationId: profile.default_organization_id,
    profile
  };
}
