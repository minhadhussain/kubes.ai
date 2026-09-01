import { NextRequest } from "next/server";

import { handlePasswordReset } from "@/server/modules/auth/auth.controller";

export async function POST(request: NextRequest) {
  return handlePasswordReset(request);
}
