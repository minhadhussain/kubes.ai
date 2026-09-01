import { NextRequest } from "next/server";

import { handleCreateOrganization } from "@/server/modules/onboarding/onboarding.controller";

export async function POST(request: NextRequest) {
  return handleCreateOrganization(request);
}
