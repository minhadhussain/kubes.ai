import { NextRequest } from "next/server";

import { handleGenerateLeadActivitySummary } from "@/server/modules/ai/ai.controller";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { leadId } = await params;
  return handleGenerateLeadActivitySummary(request, leadId);
}
