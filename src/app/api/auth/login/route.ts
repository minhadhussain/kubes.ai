import { NextRequest } from "next/server";

import { handleSignIn } from "@/server/modules/auth/auth.controller";

export async function POST(request: NextRequest) {
  return handleSignIn(request);
}
