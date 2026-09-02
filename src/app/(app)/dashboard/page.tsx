import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { OnboardingCta } from "@/components/dashboard/onboarding-cta";
import { getDashboardSummary } from "@/server/modules/dashboard/dashboard.service";
import { AppError } from "@/server/shared/errors";

export default async function DashboardPage() {
  try {
    const data = await getDashboardSummary();

    return <DashboardOverview data={data} />;
  } catch (error) {
    if (error instanceof AppError && error.code === "NO_ORGANIZATION") {
      return <OnboardingCta />;
    }

    throw error;
  }
}
