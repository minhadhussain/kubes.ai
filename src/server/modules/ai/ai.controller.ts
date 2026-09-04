import { NextRequest } from "next/server";

import {
  generateLeadActivitySummary,
  generateLeadFollowUpDraft,
  generateLeadQualification,
  markAiArtifactPending,
  markAiArtifactSaved,
  generateNextActions,
  reviewAiArtifact
} from "@/server/modules/ai/ai.service";
import { runCopilotConversation } from "@/server/modules/ai/ai-copilot.service";
import { fail, ok } from "@/server/shared/http";
import { z } from "zod";
import { copilotApiResponseSchema, copilotRequestSchema } from "@/server/modules/ai/ai.validation";

const reviewSchema = z.object({
  approvalStatus: z.enum(["approved", "rejected"])
});

const actionSchema = z.object({
  actionStatus: z.enum(["pending", "saved"])
});

export async function handleGenerateLeadQualification(_request: NextRequest, leadId: string) {
  try {
    const result = await generateLeadQualification(leadId);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleGenerateLeadActivitySummary(_request: NextRequest, leadId: string) {
  try {
    const result = await generateLeadActivitySummary(leadId);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleGenerateLeadFollowUpDraft(_request: NextRequest, leadId: string) {
  try {
    const result = await generateLeadFollowUpDraft(leadId);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleGenerateNextActions() {
  try {
    const result = await generateNextActions();
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleReviewAiArtifact(request: NextRequest, artifactId: string) {
  try {
    const body = reviewSchema.parse(await request.json());
    await reviewAiArtifact(artifactId, body.approvalStatus);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function handleUpdateAiArtifactAction(request: NextRequest, artifactId: string) {
  try {
    const body = actionSchema.parse(await request.json());

    if (body.actionStatus === "pending") {
      await markAiArtifactPending(artifactId);
    } else {
      await markAiArtifactSaved(artifactId);
    }

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function handleCopilotConversation(request: NextRequest) {
  try {
    const body = copilotRequestSchema.parse(await request.json());
    const result = copilotApiResponseSchema.parse(await runCopilotConversation(body));
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
