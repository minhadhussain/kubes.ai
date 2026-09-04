import {
  completeAiRun,
  createAiArtifact,
  createAiRun,
  getAiArtifactDetail,
  updateAiArtifactActionStatus
} from "@/server/modules/ai/ai.repository";
import {
  copilotPendingActionSchema,
  copilotPlannerJsonSchema,
  copilotPlannerSchema,
  copilotResponseJsonSchema,
  copilotResponseSchema
} from "@/server/modules/ai/ai.validation";
import { executeCopilotAction, executeCopilotTool, listCopilotTools } from "@/server/modules/ai/ai-copilot.tools";
import { generateStructuredJson } from "@/server/modules/ai/ai.provider";
import { AppError } from "@/server/shared/errors";
import { requireCurrentOrganizationContext } from "@/server/shared/organization";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  linkedRecords?: Array<{
    id: string;
    entityType: string;
    label: string;
    href: string;
    meta: string;
  }>;
  actionArtifactId?: string | null;
};

type CopilotPageContext = {
  pathname: string;
  entityType?: "lead" | "contact" | "task" | "property" | "listing" | "showing" | "transaction" | null;
  entityId?: string | null;
};

type CopilotActionConfirmation = {
  artifactId: string;
  decision: "confirm" | "cancel";
};

type ToolRun = {
  toolName: string;
  summary: string;
  basedOn?: string;
  references: Array<{
    id: string;
    entityType: string;
    label: string;
    href: string;
    meta: string;
  }>;
  data: Record<string, unknown>;
};

function parsePlannerJsonField(fieldName: string, rawValue: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawValue);

    if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
      throw new Error("Parsed value is not an object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new AppError(`AI planner returned invalid ${fieldName}.`, 502, "AI_INVALID_RESPONSE");
  }
}

function mapProviderError(error: unknown) {
  if (!(error instanceof AppError)) {
    return error;
  }

  if (error.code === "AI_NOT_CONFIGURED") {
    return new AppError("AI is not configured. Add the required server AI environment variables.", 503, error.code);
  }

  if (error.code === "AI_PROVIDER_ERROR") {
    const message = error.message.toLowerCase();

    if (message.includes("rate") || message.includes("429")) {
      return new AppError("The AI provider is rate limited right now. Please try again shortly.", 429, "AI_RATE_LIMITED");
    }

    if (message.includes("401") || message.includes("unauthorized") || message.includes("invalid api key")) {
      return new AppError("The AI provider credentials are invalid on the server.", 502, "AI_PROVIDER_AUTH_FAILED");
    }

    if (message.includes("404") || message.includes("deployment") || message.includes("resource not found")) {
      return new AppError("The configured AI model or deployment could not be found.", 502, "AI_PROVIDER_DEPLOYMENT_NOT_FOUND");
    }

    if (message.includes("400") || message.includes("invalid_request_error") || message.includes("unsupported")) {
      return new AppError("The AI provider rejected the request format for the configured model.", 502, "AI_PROVIDER_REQUEST_REJECTED");
    }

    if (message.includes("timeout")) {
      return new AppError("The AI provider timed out. Please try again.", 504, "AI_TIMEOUT");
    }

    return new AppError("The AI provider is unavailable right now. Please try again.", 502, "AI_PROVIDER_UNAVAILABLE");
  }

  if (error.code === "AI_INVALID_RESPONSE") {
    return new AppError("The AI provider returned an invalid response. Please try again.", 502, error.code);
  }

  return error;
}

function logAiPersistenceWarning(step: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[copilot] ${step} failed: ${message}`);
}

function buildConversationTranscript(messages: CopilotMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");
}

function buildSuggestedPrompts(pathname: string, entityType?: string | null) {
  if (pathname.startsWith("/leads") || entityType === "lead") {
    return ["Find hot leads", "Who needs follow-up?", "Analyze this lead"];
  }

  if (pathname.startsWith("/contacts") || entityType === "contact") {
    return ["Summarize this contact", "What does this client want?", "Find matching properties"];
  }

  if (pathname.startsWith("/properties") || entityType === "property") {
    return ["Summarize property", "Find matching buyers", "Show listing activity"];
  }

  if (pathname.startsWith("/transactions") || entityType === "transaction") {
    return ["What's missing?", "What needs attention?", "Summarize this deal"];
  }

  return ["What's important today?", "Show overdue tasks", "Summarize my pipeline"];
}

function buildPageContextLabel(pageContext?: CopilotPageContext) {
  if (!pageContext) {
    return "dashboard";
  }

  return `${pageContext.pathname}${pageContext.entityType ? ` · ${pageContext.entityType}` : ""}`;
}

function buildPlannerPrompt(input: {
  latestUserMessage: string;
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
  toolRuns: ToolRun[];
}) {
  return JSON.stringify({
    instruction:
      "You are planning the next step for Kubes AI, a natural conversational assistant connected to an authenticated real-estate workspace. First decide whether the user is asking a general question, a Kubes workspace question, or a mixed question. For normal greetings, casual chat, writing help, math, explanations, and general knowledge, answer naturally without calling any tools. Use tool_calls only when workspace data is actually needed. Use answer when the available tool results are sufficient or when the question can be answered from general knowledge without any tool calls. Use propose_action when the user is asking to create or update something. Never invent Kubes data. Do not ask tools for irrelevant data. Use follow-up context from the conversation when pronouns like 'this', 'which one', 'her', or 'that one' appear. For every tool call, argumentsJson must be a valid JSON string representing an object. For every proposed action, actionPayloadJson must be a valid JSON string representing an object. Do not return nested objects in those fields.",
    latestUserMessage: input.latestUserMessage,
    pageContext: input.pageContext ?? null,
    conversation: buildConversationTranscript(input.messages),
    availableTools: listCopilotTools(),
    completedToolRuns: input.toolRuns.map((run) => ({
      toolName: run.toolName,
      summary: run.summary,
      basedOn: run.basedOn ?? null,
      references: run.references,
      data: run.data
    }))
  });
}

function buildAnswerPrompt(input: {
  latestUserMessage: string;
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
  toolRuns: ToolRun[];
}) {
  return JSON.stringify({
    instruction:
      "You are Kubes AI, a friendly and professional conversational assistant. If the user's question is general and does not require Kubes workspace data, answer naturally using normal model knowledge. If the question requires Kubes data, use only the validated tool outputs provided here. If the question is mixed, combine general reasoning with the provided tool outputs. Never invent Kubes facts. If workspace information is missing, say so clearly. Keep the answer concise, helpful, and easy to scan. Use short paragraphs and line breaks. When returning multiple records, format them as a numbered list in the answer text. Only mention that something is based on Kubes data when that context is actually relevant. referencedRecordIds must only contain IDs from the provided references. basedOn should be a short traceability note like 'Based on 4 active leads.' or null.",
    latestUserMessage: input.latestUserMessage,
    pageContext: input.pageContext ?? null,
    conversation: buildConversationTranscript(input.messages),
    toolResults: input.toolRuns.map((run) => ({
      toolName: run.toolName,
      summary: run.summary,
      basedOn: run.basedOn ?? null,
      references: run.references,
      data: run.data
    }))
  });
}

async function planNextStep(input: {
  latestUserMessage: string;
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
  toolRuns: ToolRun[];
}) {
  const providerResult = await generateStructuredJson({
    system:
      "You are Kubes AI's planning engine. Behave like a normal conversational assistant first, and use safe minimal tool usage only when workspace data or actions are actually needed. Never invent records or ask for unauthorized data. Use only the supplied tool list.",
    user: buildPlannerPrompt(input),
    jsonSchema: copilotPlannerJsonSchema
  });

  return {
    providerResult,
    plan: copilotPlannerSchema.parse(JSON.parse(providerResult.outputText))
  };
}

async function synthesizeAnswer(input: {
  latestUserMessage: string;
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
  toolRuns: ToolRun[];
}) {
  const providerResult = await generateStructuredJson({
    system:
      "You are Kubes AI, a natural ChatGPT-style assistant connected to a real-estate workspace. Use normal model knowledge for general questions. Use the provided tool outputs only for workspace-specific facts. Never invent workspace data. If information is missing from Kubes, say so clearly.",
    user: buildAnswerPrompt(input),
    jsonSchema: copilotResponseJsonSchema
  });

  return {
    providerResult,
    response: copilotResponseSchema.parse(JSON.parse(providerResult.outputText))
  };
}

async function resolveToolRuns(input: {
  latestUserMessage: string;
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
}) {
  const toolRuns: ToolRun[] = [];
  let plannerMeta: { provider: string; model: string; baseUrl: string } | null = null;

  for (let step = 0; step < 4; step += 1) {
    const { providerResult, plan } = await planNextStep({
      latestUserMessage: input.latestUserMessage,
      messages: input.messages,
      pageContext: input.pageContext,
      toolRuns
    });

    plannerMeta = {
      provider: providerResult.provider,
      model: providerResult.model,
      baseUrl: providerResult.baseUrl
    };

    if (plan.stepType === "tool_calls") {
      if (plan.toolCalls.length === 0) {
        throw new AppError("AI planner did not provide tool calls.", 502, "AI_INVALID_RESPONSE");
      }

      for (const toolCall of plan.toolCalls) {
        const result = await executeCopilotTool(toolCall.toolName, parsePlannerJsonField("tool arguments", toolCall.argumentsJson));
        toolRuns.push({
          toolName: result.toolName,
          summary: result.summary,
          data: result.data,
          references: result.references,
          basedOn: result.basedOn
        });
      }

      continue;
    }

    if (plan.stepType === "propose_action") {
      if (!plan.actionType || !plan.actionPayloadJson || !plan.actionTitle || !plan.actionMessage) {
        throw new AppError("AI planner returned an incomplete action proposal.", 502, "AI_INVALID_RESPONSE");
      }

      return {
        plannerMeta,
        toolRuns,
        pendingAction: {
          actionType: plan.actionType,
          actionTitle: plan.actionTitle,
          actionMessage: plan.actionMessage,
          actionPayload: parsePlannerJsonField("action payload", plan.actionPayloadJson),
          references: toolRuns.flatMap((run) => run.references).slice(0, 8),
          followUpSuggestions: plan.followUpSuggestions
        }
      };
    }

    return {
      plannerMeta,
      toolRuns,
      pendingAction: null
    };
  }

  return {
    plannerMeta,
    toolRuns,
    pendingAction: null
  };
}

async function persistPendingAction(input: {
  organizationId: string;
  userId: string;
  runId: string;
  pageContext?: CopilotPageContext;
  pathname: string;
  pendingAction: {
    actionType: string;
    actionTitle: string;
    actionMessage: string;
    actionPayload: Record<string, unknown>;
    references: Array<{ id: string; entityType: string; label: string; href: string; meta: string }>;
    followUpSuggestions: string[];
  };
  toolRuns: ToolRun[];
}) {
  const artifactId = await createAiArtifact({
    organizationId: input.organizationId,
    runId: input.runId,
    createdBy: input.userId,
    artifactType: "copilot_response",
    entityType: input.pageContext?.entityType ?? "workspace",
    entityId: input.pageContext?.entityId ?? null,
    title: input.pendingAction.actionTitle,
    summary: input.pendingAction.actionMessage,
    content: {
      actionType: input.pendingAction.actionType,
      actionPayload: input.pendingAction.actionPayload,
      pendingAction: {
        title: input.pendingAction.actionTitle,
        message: input.pendingAction.actionMessage,
        confirmLabel: "Confirm",
        cancelLabel: "Cancel"
      },
      linkedRecords: input.pendingAction.references,
      toolRuns: input.toolRuns.map((run) => ({
        toolName: run.toolName,
        summary: run.summary,
        basedOn: run.basedOn ?? null
      }))
    },
    confidence: 0.7,
    sourceContext: {
      pathname: input.pathname,
      pendingAction: input.pendingAction.actionType,
      toolCalls: input.toolRuns.map((run) => run.toolName)
    },
    approvalStatus: "approved",
    actionStatus: "pending"
  });

  return copilotPendingActionSchema.parse({
    artifactId,
    title: input.pendingAction.actionTitle,
    message: input.pendingAction.actionMessage,
    confirmLabel: "Confirm",
    cancelLabel: "Cancel"
  });
}

async function handleActionConfirmation(input: {
  organizationId: string;
  userId: string;
  pageContext?: CopilotPageContext;
  confirmation: CopilotActionConfirmation;
}) {
  const artifact = await getAiArtifactDetail(input.confirmation.artifactId);

  if (artifact.organization_id !== input.organizationId) {
    throw new AppError("AI action not found in this workspace.", 404, "AI_ACTION_NOT_FOUND");
  }

  const content = artifact.content as Record<string, unknown>;
  const actionType = content.actionType;
  const actionPayload = content.actionPayload;

  if (typeof actionType !== "string" || typeof actionPayload !== "object" || actionPayload == null) {
    throw new AppError("AI action payload is invalid.", 400, "AI_ACTION_INVALID");
  }

  if (input.confirmation.decision === "cancel") {
    await updateAiArtifactActionStatus(input.confirmation.artifactId, "cancelled");

    return {
      title: "Action cancelled",
      answer: "I cancelled that action. No changes were made.",
      basedOn: null,
      caution: null,
      linkedRecords: [],
      followUpSuggestions: ["Show overdue tasks", "Summarize my pipeline"],
      pendingAction: null,
      actionArtifactId: input.confirmation.artifactId
    };
  }

  const result = await executeCopilotAction(actionType, actionPayload as Record<string, unknown>);
  await updateAiArtifactActionStatus(input.confirmation.artifactId, "executed");

  return {
    title: "Action completed",
    answer: result.message,
    basedOn: null,
    caution: null,
    linkedRecords: result.references,
    followUpSuggestions: buildSuggestedPrompts(input.pageContext?.pathname ?? "/dashboard", input.pageContext?.entityType),
    pendingAction: null,
    actionArtifactId: input.confirmation.artifactId
  };
}

export async function runCopilotConversation(input: {
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
  actionConfirmation?: CopilotActionConfirmation;
}) {
  const { organizationId, user } = await requireCurrentOrganizationContext();

  if (input.actionConfirmation) {
    return handleActionConfirmation({
      organizationId,
      userId: user.id,
      pageContext: input.pageContext,
      confirmation: input.actionConfirmation
    });
  }

  const latestUserMessage = [...input.messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage) {
    throw new AppError("A user message is required.", 400, "AI_COPILOT_MESSAGE_REQUIRED");
  }

  let runId: string | null = null;

  try {
    runId = await createAiRun({
      organizationId,
      userId: user.id,
      featureKey: "copilot_assistant",
      entityType: input.pageContext?.entityType ?? "workspace",
      entityId: input.pageContext?.entityId ?? null,
      sourceContext: {
        pathname: input.pageContext?.pathname ?? "/dashboard",
        messageCount: input.messages.length,
        contextLabel: buildPageContextLabel(input.pageContext)
      }
    });
  } catch (error) {
    logAiPersistenceWarning("createAiRun", error);
  }

  try {
    const resolved = await resolveToolRuns({
      latestUserMessage: latestUserMessage.content,
      messages: input.messages,
      pageContext: input.pageContext
    });

    const providerMeta = resolved.plannerMeta ?? {
      provider: "unknown",
      model: "unknown",
      baseUrl: "unknown"
    };

    if (resolved.pendingAction) {
      let pendingAction = null;

      if (runId) {
        try {
          pendingAction = await persistPendingAction({
            organizationId,
            userId: user.id,
            runId,
            pageContext: input.pageContext,
            pathname: input.pageContext?.pathname ?? "/dashboard",
            pendingAction: resolved.pendingAction,
            toolRuns: resolved.toolRuns
          });
        } catch (error) {
          logAiPersistenceWarning("persistPendingAction", error);
        }
      }

      if (runId) {
        try {
          await completeAiRun({
            runId,
            status: "completed",
            provider: providerMeta.provider,
            model: providerMeta.model,
            baseUrl: providerMeta.baseUrl
          });
        } catch (error) {
          logAiPersistenceWarning("completeAiRun", error);
        }
      }

      return {
        title: resolved.pendingAction.actionTitle,
        answer: resolved.pendingAction.actionMessage,
        basedOn: resolved.toolRuns.find((run) => run.basedOn)?.basedOn ?? null,
        caution: "This action requires confirmation before anything is changed.",
        linkedRecords: resolved.pendingAction.references,
        followUpSuggestions: resolved.pendingAction.followUpSuggestions,
        pendingAction,
        actionArtifactId: pendingAction?.artifactId ?? null
      };
    }

    const { providerResult, response } = await synthesizeAnswer({
      latestUserMessage: latestUserMessage.content,
      messages: input.messages,
      pageContext: input.pageContext,
      toolRuns: resolved.toolRuns
    });

    const linkedRecords = resolved.toolRuns
      .flatMap((run) => run.references)
      .filter((reference, index, array) => array.findIndex((candidate) => candidate.id === reference.id && candidate.entityType === reference.entityType) === index)
      .filter((reference) => response.referencedRecordIds.includes(reference.id))
      .slice(0, 8);

    if (runId) {
      try {
        await completeAiRun({
          runId,
          status: "completed",
          provider: providerResult.provider,
          model: providerResult.model,
          baseUrl: providerResult.baseUrl
        });
      } catch (error) {
        logAiPersistenceWarning("completeAiRun", error);
      }

      try {
        await createAiArtifact({
          organizationId,
          runId,
          createdBy: user.id,
          artifactType: "copilot_response",
          entityType: input.pageContext?.entityType ?? "workspace",
          entityId: input.pageContext?.entityId ?? null,
          title: response.title,
          summary: response.answer,
          content: {
            answer: response.answer,
            basedOn: response.basedOn,
            caution: response.caution,
            followUpSuggestions: response.followUpSuggestions,
            linkedRecordIds: linkedRecords.map((record) => record.id),
            toolRuns: resolved.toolRuns.map((run) => ({
              toolName: run.toolName,
              summary: run.summary,
              basedOn: run.basedOn ?? null
            }))
          },
          confidence: 0.78,
          sourceContext: {
            pathname: input.pageContext?.pathname ?? "/dashboard",
            messageCount: input.messages.length,
            toolCalls: resolved.toolRuns.map((run) => run.toolName),
            linkedRecordIds: linkedRecords.map((record) => record.id)
          },
          approvalStatus: "approved",
          actionStatus: "saved"
        });
      } catch (error) {
        logAiPersistenceWarning("createAiArtifact", error);
      }
    }

    return {
      title: response.title,
      answer: response.answer,
      basedOn: response.basedOn ?? null,
      caution: response.caution ?? null,
      linkedRecords,
      followUpSuggestions: response.followUpSuggestions.length > 0 ? response.followUpSuggestions : buildSuggestedPrompts(input.pageContext?.pathname ?? "/dashboard", input.pageContext?.entityType),
      pendingAction: null,
      actionArtifactId: null
    };
  } catch (error) {
    const mappedError = mapProviderError(error);
    const message = mappedError instanceof Error ? mappedError.message : "Unknown AI error.";

    if (runId) {
      try {
        await completeAiRun({
          runId,
          status: "failed",
          errorMessage: message
        });
      } catch (completeError) {
        logAiPersistenceWarning("completeAiRun", completeError);
      }
    }

    throw mappedError;
  }
}
