import { redirect } from "next/navigation";

import { OrganizationForm } from "@/components/forms/organization-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateCurrentUserProfile } from "@/server/shared/user-profile";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getOrCreateCurrentUserProfile(user);

  if (profile?.default_organization_id) {
    redirect("/dashboard");
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Workspace setup</p>
        <h1>Create your organization</h1>
        <p>Every record is isolated by organization, so this is the first step before using the platform.</p>
        <OrganizationForm />
      </section>
    </div>
  );
}
