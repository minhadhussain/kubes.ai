import { NextRequest } from "next/server";

import { handleCreateLead, handleListLeads } from "@/server/modules/leads/leads.controller";

export async function GET() {
  return handleListLeads();
}

export async function POST(request: NextRequest) {
  return handleCreateLead(request);
}
