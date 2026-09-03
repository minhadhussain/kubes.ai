import type { ZodTypeAny } from "zod";

import {
  createAiArtifact,
  createAiRun,
  completeAiRun,
  updateAiArtifactActionStatus,
  updateAiArtifactReview
} from "@/server/modules/ai/ai.repository";
import { generateStructuredJson } from "@/server/modules/ai/ai.provider";
import {
  activitySummaryJsonSchema,
  activitySummarySchema,
  followUpDraftJsonSchema,
  followUpDraftSchema,
  leadQualificationJsonSchema,
  leadQualificationSchema,
  nextActionsJsonSchema,
  nextActionsSchema
} from "@/server/modules/ai/ai.validation";
import type { AiApprovalStatus, AiArtifactType, AiFeatureKey } from "@/server/modules/ai/ai.types";
import { listContacts } from "@/server/modules/contacts/contacts.service";
import { listLeads } from "@/server/modules/leads/leads.service";
import { listTasks } from "@/server/modules/tasks/tasks.service";
import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

async function runStructuredAi<T extends ZodTypeAny>(input: {
  featureKey: AiFeatureKey;
  artifactType: AiArtifactType;
  entityType: string;
  entityId?: string | null;
  title: string;
  system: string;
  user: string;
  schema: T;
  jsonSchema: Record<string, unknown>;
  sourceContext: Record<string, unknown>;
}) {
  const { organizationId, user } = await requireCurrentOrganizationContext();
  const runId = await createAiRun({
    organizationId,
    userId: user.id,
    featureKey: input.featureKey,
    entityType: input.entityType,
    entityId: input.entityId,
    sourceContext: input.sourceContext
  });

  try {
    const providerResult = await generateStructuredJson({
      system: input.system,
      user: input.user,
      jsonSchema: input.jsonSchema
    });

    const parsed = input.schema.parse(JSON.parse(providerResult.outputText));

    await completeAiRun({
      runId,
      status: parsed.confidence >= 0.55 || "items" in parsed ? "completed" : "needs_review",
      provider: providerResult.provider,
      model: providerResult.model,
      baseUrl: providerResult.baseUrl
    });

    const artifactId = await createAiArtifact({
      organizationId,
      runId,
      createdBy: user.id,
      artifactType: input.artifactType,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      summary: "summary" in parsed && typeof parsed.summary === "string" ? parsed.summary : undefined,
      content: parsed,
      confidence: "confidence" in parsed && typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      sourceContext: input.sourceContext,
      approvalStatus: "pending_review"
    });

    return {
      artifactId,
      runId,
      content: parsed
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error.";

    await completeAiRun({
      runId,
      status: "failed",
      errorMessage: message
    });

    throw error;
  }
}

export async function generateLeadQualification(leadId: string) {
  const leads = await listLeads();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
  }

  return runStructuredAi({
    featureKey: "lead_qualification",
    artifactType: "lead_qualification",
    entityType: "lead",
    entityId: lead.id,
    title: `Lead qualification for ${lead.contact.displayName}`,
    system:
      "You are an AI qualification assistant for a real-estate CRM. Use only provided data. Do not invent facts. If information is missing, say it is unknown. Keep recommendations operational and safe.",
    user: JSON.stringify({
      lead,
      instruction:
        "Return structured lead qualification with intent, budget, location preference, property requirements, timeline, urgency, score, summary, recommended next action, confidence, and exact source bullets."
    }),
    schema: leadQualificationSchema,
    jsonSchema: leadQualificationJsonSchema,
    sourceContext: {
      leadId: lead.id,
      contactId: lead.contact.id,
      activityCount: lead.activities.length,
      taskCount: lead.tasks.length
    }
  });
}

export async function generateLeadActivitySummary(leadId: string) {
  const leads = await listLeads();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
  }

  return runStructuredAi({
    featureKey: "activity_summary",
    artifactType: "activity_summary",
    entityType: "lead",
    entityId: lead.id,
    title: `Activity summary for ${lead.contact.displayName}`,
    system:
      "You summarize CRM notes and activity for a real-estate agent. Treat notes and activities as the only source of truth. Do not imply there were emails, texts, or calls unless the activity explicitly says so.",
    user: JSON.stringify({
      lead,
      instruction:
        "Summarize the available lead activities. Extract requirements, objections, important dates, and suggested next steps."
    }),
    schema: activitySummarySchema,
    jsonSchema: activitySummaryJsonSchema,
    sourceContext: {
      leadId: lead.id,
      activityIds: lead.activities.map((activity) => activity.id)
    }
  });
}

export async function generateLeadFollowUpDraft(leadId: string) {
  const leads = await listLeads();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
  }

  return runStructuredAi({
    featureKey: "follow_up_generator",
    artifactType: "follow_up_draft",
    entityType: "lead",
    entityId: lead.id,
    title: `Follow-up draft for ${lead.contact.displayName}`,
    system:
      "You draft professional follow-up messages for real-estate agents. Use only provided CRM context. Do not claim actions already happened. This is a draft only; do not describe sending behavior.",
    user: JSON.stringify({
      lead,
      instruction:
        "Draft a follow-up message using the lead context. Include rationale, confidence, and exact sources. Default to email unless a better option is clearly supported by the context."
    }),
    schema: followUpDraftSchema,
    jsonSchema: followUpDraftJsonSchema,
    sourceContext: {
      leadId: lead.id,
      activityIds: lead.activities.map((activity) => activity.id),
      taskIds: lead.tasks.map((task) => task.id)
    }
  });
}

export async function generateNextActions() {
  const [leads, tasks, contacts] = await Promise.all([listLeads(), listTasks(), listContacts()]);
  const { organizationId } = await requireCurrentOrganizationContext();

  return runStructuredAi({
    featureKey: "next_action_engine",
    artifactType: "next_actions",
    entityType: "organization",
    entityId: organizationId,
    title: "AI next actions",
    system:
      "You are a task-prioritization engine for a real-estate operating system. Use only supplied leads and tasks. Do not invent deadlines or records. Recommend concrete next actions with priority and reasons.",
    user: JSON.stringify({
      leads: leads.slice(0, 20),
      tasks: tasks.slice(0, 20),
      contacts: contacts.slice(0, 20),
      instruction:
        "Return the top priority next actions for the agent based on stale leads, contact follow-up timing, upcoming tasks, and operational risk."
    }),
    schema: nextActionsSchema,
    jsonSchema: nextActionsJsonSchema,
    sourceContext: {
      leadIds: leads.map((lead) => lead.id),
      taskIds: tasks.map((task) => task.id),
      contactIds: contacts.map((contact) => contact.id)
    }
  });
}

export async function listAiArtifactsForEntity(entityType: string, entityId: string) {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const { data, error } = await supabase
    .from("ai_artifacts")
    .select("id, artifact_type, title, summary, content, confidence, approval_status, action_status, created_at")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load AI outputs.", 500, "AI_ARTIFACTS_LOAD_FAILED");
  }

  return data ?? [];
}

export async function listLatestNextActionArtifact() {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const { data, error } = await supabase
    .from("ai_artifacts")
    .select("id, title, summary, content, confidence, approval_status, action_status, created_at")
    .eq("organization_id", organizationId)
    .eq("artifact_type", "next_actions")
    .eq("entity_type", "organization")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to load next actions.", 500, "AI_NEXT_ACTIONS_LOAD_FAILED");
  }

  return data;
}

export async function reviewAiArtifact(artifactId: string, approvalStatus: AiApprovalStatus) {
  const { user } = await requireCurrentOrganizationContext();

  await updateAiArtifactReview(
    artifactId,
    user.id,
    approvalStatus,
    approvalStatus === "approved" ? "approved" : approvalStatus === "rejected" ? "cancelled" : "saved"
  );
}

export async function markAiArtifactPending(artifactId: string) {
  await updateAiArtifactActionStatus(artifactId, "pending");
}

export async function markAiArtifactSaved(artifactId: string) {
  await updateAiArtifactActionStatus(artifactId, "saved");
}
