import { NextRequest } from "next/server";

import { handleSignUp } from "@/server/modules/auth/auth.controller";

export async function POST(request: NextRequest) {
  return handleSignUp(request);
}
