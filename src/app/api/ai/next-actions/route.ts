import { handleGenerateNextActions } from "@/server/modules/ai/ai.controller";

export async function POST() {
  return handleGenerateNextActions();
}
