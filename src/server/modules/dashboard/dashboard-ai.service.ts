import { AppError } from "@/server/shared/errors";
import { listLatestNextActionArtifact } from "@/server/modules/ai/ai.service";

export async function getDashboardAiSnapshot() {
  let artifact = null;

  try {
    artifact = await listLatestNextActionArtifact();
  } catch (error) {
    if (error instanceof AppError && error.code === "AI_NEXT_ACTIONS_LOAD_FAILED") {
      return null;
    }

    throw error;
  }

  if (!artifact) {
    return null;
  }

  const content = artifact.content as {
    items?: Array<{
      priority: "high" | "medium" | "low";
      entityType: "lead" | "task" | "transaction" | "contact";
      entityId: string;
      title: string;
      reason: string;
      recommendedAction: string;
      ctaLabel: string;
      confidence: number;
      sources: string[];
    }>;
  };

  return {
    artifactId: artifact.id,
    generatedAt: artifact.created_at,
    approvalStatus: artifact.approval_status,
    actionStatus: artifact.action_status,
    items: content.items ?? []
  };
}
