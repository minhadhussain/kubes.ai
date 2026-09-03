import { NextRequest } from "next/server";

import { handleCreateLeadActivity } from "@/server/modules/leads/leads.controller";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { leadId } = await params;
  return handleCreateLeadActivity(request, leadId);
}
