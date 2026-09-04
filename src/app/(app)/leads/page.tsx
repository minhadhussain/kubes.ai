import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { OnboardingCta } from "@/components/dashboard/onboarding-cta";
import { listLeads } from "@/server/modules/leads/leads.service";
import { AppError } from "@/server/shared/errors";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  try {
    const leads = await listLeads();

    return <LeadsWorkspace initialLeads={leads} />;
  } catch (error) {
    if (error instanceof AppError && error.code === "NO_ORGANIZATION") {
      return <OnboardingCta />;
    }

    throw error;
  }
}
