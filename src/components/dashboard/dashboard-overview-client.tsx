"use client";

import { useState } from "react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

type DashboardOverviewClientProps = {
  initialData: Parameters<typeof DashboardOverview>[0]["data"];
};

export function DashboardOverviewClient({ initialData }: DashboardOverviewClientProps) {
  const [data, setData] = useState(initialData);

  async function refreshAiPriorities() {
    const response = await fetch("/api/ai/next-actions", { method: "POST" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? "Unable to generate AI priorities.");
    }

    const dashboardResponse = await fetch("/api/dashboard", { cache: "no-store" });
    const dashboardResult = await dashboardResponse.json();

    if (!dashboardResponse.ok) {
      throw new Error(dashboardResult.error?.message ?? "Unable to refresh dashboard.");
    }

    setData(dashboardResult.data);
  }

  return <DashboardOverview data={data} onRefreshAiPriorities={refreshAiPriorities} />;
}
