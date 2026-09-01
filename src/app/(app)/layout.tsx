import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, default_organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.default_organization_id) {
    redirect("/onboarding");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.default_organization_id)
    .single();

  return (
    <AppShell organizationName={organization?.name ?? "Workspace"} userName={profile.full_name ?? user.email ?? "Agent"}>
      <div className="content-panel">{children}</div>
    </AppShell>
  );
}
