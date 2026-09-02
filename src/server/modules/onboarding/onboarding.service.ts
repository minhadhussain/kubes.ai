import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/server/shared/errors";
import { requireCurrentUser } from "@/server/shared/auth";

type WorkspaceType = "solo" | "team" | "brokerage";

const WORKSPACE_ROLE_SEED = [
  {
    key: "owner",
    name: "Owner",
    description: "Workspace owner with full access"
  },
  {
    key: "broker_admin",
    name: "Broker Admin",
    description: "Brokerage administrator"
  },
  {
    key: "team_admin",
    name: "Team Admin",
    description: "Team manager with elevated access"
  },
  {
    key: "agent",
    name: "Agent",
    description: "Standard producing agent"
  },
  {
    key: "coordinator",
    name: "Coordinator",
    description: "Operations and transaction coordinator"
  },
  {
    key: "assistant",
    name: "Assistant",
    description: "Support user with limited access"
  }
] as const;

async function getOwnerRoleId() {
  const supabase = await createSupabaseServerClient();

  const { data: ownerRole } = await supabase.from("roles").select("id").eq("key", "owner").maybeSingle();

  if (ownerRole) {
    return ownerRole.id;
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new AppError(
      "Workspace roles are missing in Supabase. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for automatic seeding, or run docs/seed-workspace-roles.sql in the Supabase SQL Editor.",
      500,
      "ROLE_LOOKUP_FAILED"
    );
  }

  const { error: seedError } = await adminClient.from("roles").upsert(WORKSPACE_ROLE_SEED, {
    onConflict: "key",
    ignoreDuplicates: false
  });

  if (seedError) {
    throw new AppError(
      `Unable to seed workspace roles automatically: ${seedError.message}`,
      500,
      "ROLE_SEED_FAILED"
    );
  }

  const { data: seededOwnerRole, error: seededOwnerRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("key", "owner")
    .single();

  if (seededOwnerRoleError || !seededOwnerRole) {
    throw new AppError(
      "Workspace roles were seeded, but the owner role is still unavailable to the current session. Refresh and try again.",
      500,
      "ROLE_LOOKUP_FAILED"
    );
  }

  return seededOwnerRole.id;
}

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

  const ownerRoleId = await getOwnerRoleId();

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
    role_id: ownerRoleId,
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
