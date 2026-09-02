import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateCurrentUserProfile } from "@/server/shared/user-profile";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getOrCreateCurrentUserProfile(user);

  const { data: organization } = profile?.default_organization_id
    ? await supabase.from("organizations").select("name").eq("id", profile.default_organization_id).single()
    : { data: null };

  return (
    <AppShell organizationName={organization?.name ?? "Workspace"} userName={profile?.full_name ?? user.email ?? "Agent"}>
      <div className="content-panel">{children}</div>
    </AppShell>
  );
}
