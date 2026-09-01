import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/server/shared/auth";
import { AppError } from "@/server/shared/errors";

type DashboardSummary = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  today: {
    appointments: number;
    showings: number;
    tasksDue: number;
    overdueTasks: number;
  };
  business: {
    newLeads: number;
    activeClients: number;
    activeListings: number;
    activeTransactions: number;
    pendingOffers: number;
    expectedCommission: number;
  };
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("default_organization_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new AppError("Unable to load user profile.", 500, "PROFILE_LOAD_FAILED");
  }

  if (!profile.default_organization_id) {
    throw new AppError("No organization has been configured for this user.", 400, "NO_ORGANIZATION");
  }

  const organizationId = profile.default_organization_id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const nowIso = new Date().toISOString();

  const [organizationResult, appointmentsResult, showingsResult, tasksDueResult, overdueTasksResult, leadsResult, clientsResult, listingsResult, transactionsResult, offersResult, commissionsResult] =
    await Promise.all([
      supabase.from("organizations").select("id, name, slug").eq("id", organizationId).single(),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("starts_at", startOfDay.toISOString())
        .lte("starts_at", endOfDay.toISOString()),
      supabase
        .from("showings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("starts_at", startOfDay.toISOString())
        .lte("starts_at", endOfDay.toISOString()),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", ["pending", "in_progress"])
        .gte("due_at", startOfDay.toISOString())
        .lte("due_at", endOfDay.toISOString()),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", ["pending", "in_progress"])
        .lt("due_at", nowIso),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("stage", "new"),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("stage", "active"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", ["coming_soon", "active", "under_contract", "pending"]),
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("stage", "closed"),
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", ["sent", "viewed", "countered"]),
      supabase.from("commissions").select("expected_income").eq("organization_id", organizationId)
    ]);

  if (organizationResult.error || !organizationResult.data) {
    throw new AppError("Unable to load organization.", 500, "ORGANIZATION_LOAD_FAILED");
  }

  const expectedCommission =
    commissionsResult.data?.reduce((sum, row) => sum + Number(row.expected_income ?? 0), 0) ?? 0;

  return {
    organization: organizationResult.data,
    today: {
      appointments: appointmentsResult.count ?? 0,
      showings: showingsResult.count ?? 0,
      tasksDue: tasksDueResult.count ?? 0,
      overdueTasks: overdueTasksResult.count ?? 0
    },
    business: {
      newLeads: leadsResult.count ?? 0,
      activeClients: clientsResult.count ?? 0,
      activeListings: listingsResult.count ?? 0,
      activeTransactions: transactionsResult.count ?? 0,
      pendingOffers: offersResult.count ?? 0,
      expectedCommission
    }
  };
}
