import { NextRequest } from "next/server";

import { handleCopilotConversation } from "@/server/modules/ai/ai.controller";

export async function POST(request: NextRequest) {
  return handleCopilotConversation(request);
}
