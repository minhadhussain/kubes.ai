import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardSummary } from "@/server/modules/dashboard/dashboard.service";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  return <DashboardOverview data={data} />;
}
