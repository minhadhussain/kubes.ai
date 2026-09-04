import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AiActionStatus,
  AiApprovalStatus,
  AiArtifactType,
  AiFeatureKey,
  AiRunStatus
} from "@/server/modules/ai/ai.types";
import { AppError } from "@/server/shared/errors";

type CreateAiRunInput = {
  organizationId: string;
  userId: string;
  featureKey: AiFeatureKey;
  entityType: string;
  entityId?: string | null;
  sourceContext: Record<string, unknown>;
};

type CompleteAiRunInput = {
  runId: string;
  status: AiRunStatus;
  provider?: string;
  model?: string;
  baseUrl?: string;
  errorMessage?: string;
};

type CreateAiArtifactInput = {
  organizationId: string;
  runId: string;
  createdBy: string;
  artifactType: AiArtifactType;
  entityType: string;
  entityId?: string | null;
  title?: string;
  summary?: string;
  content: Record<string, unknown>;
  confidence?: number;
  sourceContext: Record<string, unknown>;
  approvalStatus?: AiApprovalStatus;
  actionStatus?: AiActionStatus;
};

export async function createAiRun(input: CreateAiRunInput) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("ai_runs")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      feature_key: input.featureKey,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      source_context: input.sourceContext,
      status: "processing"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError("Unable to create AI run record.", 500, "AI_RUN_CREATE_FAILED");
  }

  return data.id as string;
}

export async function completeAiRun(input: CompleteAiRunInput) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("ai_runs")
    .update({
      status: input.status,
      provider: input.provider,
      model: input.model,
      prompt_version: input.baseUrl,
      error_message: input.errorMessage ?? null,
      completed_at: new Date().toISOString()
    })
    .eq("id", input.runId);

  if (error) {
    throw new AppError("Unable to update AI run status.", 500, "AI_RUN_UPDATE_FAILED");
  }
}

export async function createAiArtifact(input: CreateAiArtifactInput) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("ai_artifacts")
    .insert({
      organization_id: input.organizationId,
      run_id: input.runId,
      created_by: input.createdBy,
      artifact_type: input.artifactType,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      title: input.title ?? null,
      summary: input.summary ?? null,
      content: input.content,
      confidence: input.confidence ?? null,
      source_context: input.sourceContext,
      approval_status: input.approvalStatus ?? "pending_review",
      action_status: input.actionStatus ?? "draft"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError("Unable to save AI output.", 500, "AI_ARTIFACT_CREATE_FAILED");
  }

  return data.id as string;
}

export async function updateAiArtifactReview(
  artifactId: string,
  userId: string,
  approvalStatus: AiApprovalStatus,
  actionStatus: AiActionStatus
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("ai_artifacts")
    .update({
      approval_status: approvalStatus,
      action_status: actionStatus,
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq("id", artifactId);

  if (error) {
    throw new AppError("Unable to update AI artifact review state.", 500, "AI_ARTIFACT_UPDATE_FAILED");
  }
}

export async function updateAiArtifactActionStatus(artifactId: string, actionStatus: AiActionStatus) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("ai_artifacts")
    .update({
      action_status: actionStatus
    })
    .eq("id", artifactId);

  if (error) {
    throw new AppError("Unable to update AI artifact action state.", 500, "AI_ARTIFACT_UPDATE_FAILED");
  }
}

export async function getAiArtifactDetail(artifactId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("ai_artifacts")
    .select("id, organization_id, created_by, entity_type, entity_id, content, approval_status, action_status")
    .eq("id", artifactId)
    .single();

  if (error || !data) {
    throw new AppError("AI artifact not found.", 404, "AI_ARTIFACT_NOT_FOUND");
  }

  return data;
}
