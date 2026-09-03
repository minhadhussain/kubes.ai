import { NextRequest } from "next/server";

import { handleUpdateLead } from "@/server/modules/leads/leads.controller";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { leadId } = await params;
  return handleUpdateLead(request, leadId);
}
