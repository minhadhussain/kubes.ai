import {
  completeAiRun,
  createAiArtifact,
  createAiRun
} from "@/server/modules/ai/ai.repository";
import { resolveCopilotContext } from "@/server/modules/ai/ai-copilot.data";
import { generateStructuredJson } from "@/server/modules/ai/ai.provider";
import {
  copilotResponseJsonSchema,
  copilotResponseSchema
} from "@/server/modules/ai/ai.validation";
import { AppError } from "@/server/shared/errors";
import { requireCurrentOrganizationContext } from "@/server/shared/organization";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type CopilotPageContext = {
  pathname: string;
  entityType?: "lead" | "contact" | "task" | "property" | "listing" | "showing" | "transaction" | null;
  entityId?: string | null;
};

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

function buildConversationTranscript(messages: CopilotMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");
}

export async function runCopilotConversation(input: {
  messages: CopilotMessage[];
  pageContext?: CopilotPageContext;
}) {
  const { organizationId, user } = await requireCurrentOrganizationContext();
  const latestUserMessage = [...input.messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage) {
    throw new AppError("A user message is required.", 400, "AI_COPILOT_MESSAGE_REQUIRED");
  }

  const resolvedContext = await resolveCopilotContext({
    question: latestUserMessage.content,
    pageContext: input.pageContext
  });

  const runId = await createAiRun({
    organizationId,
    userId: user.id,
    featureKey: "copilot_assistant",
    entityType: input.pageContext?.entityType ?? "workspace",
    entityId: input.pageContext?.entityId ?? null,
    sourceContext: {
      pathname: resolvedContext.page.pathname,
      datasets: resolvedContext.datasets,
      messageCount: input.messages.length,
      hasEntityContext: Boolean(resolvedContext.entityContext)
    }
  });

  try {
    const providerResult = await generateStructuredJson({
      system:
        "You are Kubes AI, a real estate operations copilot inside an authenticated CRM. Use only the provided Kubes workspace data. Do not invent records, counts, dates, or statuses. Respect ambiguity. If data is missing, say so clearly. Answer the user's question directly, reference the most relevant records, and suggest practical follow-up questions. Never claim to have executed an action unless the system explicitly confirms it. Keep answers concise but useful for working agents.",
      user: JSON.stringify({
        instruction:
          "Answer the latest user question using only the supplied Kubes workspace context. Use conversation history for follow-up references. Include only referenced record IDs that appear in the provided references list. If the request would require an action, explain what can be done next without claiming it was executed.",
        currentPage: resolvedContext.page,
        availableDatasets: resolvedContext.datasets,
        entityContext: resolvedContext.entityContext,
        workspaceContext: resolvedContext.datasetContext,
        references: resolvedContext.references,
        conversation: buildConversationTranscript(input.messages)
      }),
      jsonSchema: copilotResponseJsonSchema
    });

    const parsed = copilotResponseSchema.parse(JSON.parse(providerResult.outputText));
    const allowedReferenceIds = new Set(resolvedContext.references.map((reference) => reference.id));
    const linkedRecords = resolvedContext.references.filter((reference) =>
      parsed.referencedRecordIds.some((id) => id === reference.id) && allowedReferenceIds.has(reference.id)
    );

    await completeAiRun({
      runId,
      status: "completed",
      provider: providerResult.provider,
      model: providerResult.model,
      baseUrl: providerResult.baseUrl
    });

    const artifactId = await createAiArtifact({
      organizationId,
      runId,
      createdBy: user.id,
      artifactType: "copilot_response",
      entityType: input.pageContext?.entityType ?? "workspace",
      entityId: input.pageContext?.entityId ?? null,
      title: parsed.title,
      summary: parsed.answer,
      content: {
        page: resolvedContext.page,
        datasets: resolvedContext.datasets,
        caution: parsed.caution,
        followUpSuggestions: parsed.followUpSuggestions,
        linkedRecordIds: linkedRecords.map((record) => record.id),
        answer: parsed.answer
      },
      confidence: 0.7,
      sourceContext: {
        pathname: resolvedContext.page.pathname,
        messageCount: input.messages.length,
        datasets: resolvedContext.datasets,
        linkedRecordIds: linkedRecords.map((record) => record.id)
      },
      approvalStatus: "approved",
      actionStatus: "saved"
    });

    return {
      artifactId,
      title: parsed.title,
      answer: parsed.answer,
      caution: parsed.caution ?? null,
      followUpSuggestions: parsed.followUpSuggestions,
      linkedRecords
    };
  } catch (error) {
    const mappedError = mapProviderError(error);
    const message = mappedError instanceof Error ? mappedError.message : "Unknown AI error.";

    await completeAiRun({
      runId,
      status: "failed",
      errorMessage: message
    });

    throw mappedError;
  }
}
