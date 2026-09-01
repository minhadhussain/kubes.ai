import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/server/shared/errors";
import { requireCurrentUser } from "@/server/shared/auth";

type WorkspaceType = "solo" | "team" | "brokerage";

export async function createOrganization(input: { name: string; workspaceType: WorkspaceType }) {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();

  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingMembership) {
    throw new AppError("This user already belongs to an active organization.", 409, "ORGANIZATION_EXISTS");
  }

  const { data: ownerRole, error: ownerRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("key", "owner")
    .single();

  if (ownerRoleError || !ownerRole) {
    throw new AppError("Owner role is not configured.", 500, "ROLE_LOOKUP_FAILED");
  }

  const { data: slugData, error: slugError } = await supabase.rpc("ensure_unique_organization_slug", {
    base_name: input.name
  });

  if (slugError || !slugData) {
    throw new AppError("Unable to generate organization slug.", 500, "SLUG_GENERATION_FAILED");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug: slugData,
      workspace_type: input.workspaceType,
      owner_user_id: user.id
    })
    .select("id, name, slug, workspace_type")
    .single();

  if (organizationError || !organization) {
    throw new AppError(organizationError?.message ?? "Unable to create organization.", 400, "ORGANIZATION_CREATE_FAILED");
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role_id: ownerRole.id,
    status: "active"
  });

  if (memberError) {
    throw new AppError(memberError.message, 400, "MEMBERSHIP_CREATE_FAILED");
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ default_organization_id: organization.id })
    .eq("id", user.id);

  if (profileError) {
    throw new AppError(profileError.message, 400, "PROFILE_UPDATE_FAILED");
  }

  return organization;
}
