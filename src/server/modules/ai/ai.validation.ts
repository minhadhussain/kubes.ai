import { z } from "zod";

export const leadQualificationSchema = z.object({
  intent: z.string().min(1),
  budget: z.string().min(1),
  locationPreference: z.string().min(1),
  propertyRequirements: z.array(z.string().min(1)).min(1),
  timeline: z.string().min(1),
  urgency: z.string().min(1),
  leadScore: z.number().min(0).max(100),
  qualificationSummary: z.string().min(1),
  recommendedNextAction: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)).min(1)
});

export const nextActionItemSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  entityType: z.enum(["lead", "task", "transaction", "contact"]),
  entityId: z.string().uuid(),
  title: z.string().min(1),
  reason: z.string().min(1),
  recommendedAction: z.string().min(1),
  ctaLabel: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)).min(1)
});

export const nextActionsSchema = z.object({
  items: z.array(nextActionItemSchema).max(8)
});

export const activitySummarySchema = z.object({
  summary: z.string().min(1),
  requirements: z.array(z.string().min(1)),
  objections: z.array(z.string().min(1)),
  dates: z.array(z.string().min(1)),
  nextSteps: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)).min(1)
});

export const followUpDraftSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp", "call_script"]),
  subject: z.string().optional(),
  message: z.string().min(1),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)).min(1)
});

export const leadQualificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string" },
    budget: { type: "string" },
    locationPreference: { type: "string" },
    propertyRequirements: {
      type: "array",
      items: { type: "string" }
    },
    timeline: { type: "string" },
    urgency: { type: "string" },
    leadScore: { type: "number" },
    qualificationSummary: { type: "string" },
    recommendedNextAction: { type: "string" },
    confidence: { type: "number" },
    sources: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "intent",
    "budget",
    "locationPreference",
    "propertyRequirements",
    "timeline",
    "urgency",
    "leadScore",
    "qualificationSummary",
    "recommendedNextAction",
    "confidence",
    "sources"
  ]
} as const;

export const nextActionsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] },
          entityType: { type: "string", enum: ["lead", "task", "transaction", "contact"] },
          entityId: { type: "string" },
          title: { type: "string" },
          reason: { type: "string" },
          recommendedAction: { type: "string" },
          ctaLabel: { type: "string" },
          confidence: { type: "number" },
          sources: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["priority", "entityType", "entityId", "title", "reason", "recommendedAction", "ctaLabel", "confidence", "sources"]
      }
    }
  },
  required: ["items"]
} as const;

export const activitySummaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    requirements: { type: "array", items: { type: "string" } },
    objections: { type: "array", items: { type: "string" } },
    dates: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    sources: { type: "array", items: { type: "string" } }
  },
  required: ["summary", "requirements", "objections", "dates", "nextSteps", "confidence", "sources"]
} as const;

export const followUpDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    channel: { type: "string", enum: ["email", "sms", "whatsapp", "call_script"] },
    subject: { type: "string" },
    message: { type: "string" },
    rationale: { type: "string" },
    confidence: { type: "number" },
    sources: { type: "array", items: { type: "string" } }
  },
  required: ["channel", "message", "rationale", "confidence", "sources"]
} as const;

export const copilotMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
  linkedRecords: z
    .array(
      z.object({
        id: z.string().min(1),
        entityType: z.string().min(1),
        label: z.string().min(1),
        href: z.string().min(1),
        meta: z.string().min(1)
      })
    )
    .max(12)
    .optional(),
  actionArtifactId: z.string().uuid().optional().nullable()
});

export const copilotPageContextSchema = z.object({
  pathname: z.string().min(1),
  entityType: z.enum(["lead", "contact", "task", "property", "listing", "showing", "transaction"]).nullable().optional(),
  entityId: z.string().min(1).nullable().optional()
});

export const copilotActionConfirmationSchema = z.object({
  artifactId: z.string().uuid(),
  decision: z.enum(["confirm", "cancel"])
});

export const copilotRequestSchema = z.object({
  messages: z.array(copilotMessageSchema).min(1).max(20),
  pageContext: copilotPageContextSchema.optional(),
  actionConfirmation: copilotActionConfirmationSchema.optional()
});

export const copilotPendingActionSchema = z.object({
  artifactId: z.string().uuid(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(400),
  confirmLabel: z.string().min(1).max(40),
  cancelLabel: z.string().min(1).max(40)
});

export const copilotResponseSchema = z.object({
  title: z.string().min(1).max(80),
  answer: z.string().min(1),
  basedOn: z.string().min(1).max(160).nullable().optional(),
  referencedRecordIds: z.array(z.string().min(1)).max(8),
  followUpSuggestions: z.array(z.string().min(1).max(120)).max(4),
  caution: z.string().min(1).max(240).nullable().optional()
});

export const copilotApiResponseSchema = z.object({
  title: z.string().min(1).max(120),
  answer: z.string().min(1),
  basedOn: z.string().nullable().optional(),
  caution: z.string().nullable().optional(),
  followUpSuggestions: z.array(z.string().min(1).max(120)).max(6),
  linkedRecords: z
    .array(
      z.object({
        id: z.string().min(1),
        entityType: z.string().min(1),
        label: z.string().min(1),
        href: z.string().min(1),
        meta: z.string().min(1)
      })
    )
    .max(12),
  pendingAction: copilotPendingActionSchema.nullable().optional(),
  actionArtifactId: z.string().uuid().nullable().optional()
});

export const copilotResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    answer: { type: "string" },
    basedOn: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    referencedRecordIds: {
      type: "array",
      items: { type: "string" }
    },
    followUpSuggestions: {
      type: "array",
      items: { type: "string" }
    },
    caution: {
      anyOf: [{ type: "string" }, { type: "null" }]
    }
  },
  required: ["title", "answer", "basedOn", "referencedRecordIds", "followUpSuggestions", "caution"]
} as const;

export const copilotPlannerSchema = z.object({
  stepType: z.enum(["tool_calls", "answer", "propose_action"]),
  rationale: z.string().min(1),
  toolCalls: z
    .array(
      z.object({
        toolName: z.string().min(1),
        reason: z.string().min(1),
        argumentsJson: z.string().min(2)
      })
    )
    .max(4)
    .default([]),
  title: z.string().nullable().default(null),
  answer: z.string().nullable().default(null),
  basedOn: z.string().nullable().default(null),
  caution: z.string().nullable().default(null),
  referencedRecordIds: z.array(z.string().min(1)).max(12).default([]),
  followUpSuggestions: z.array(z.string().min(1).max(120)).max(4).default([]),
  actionType: z.string().nullable().default(null),
  actionTitle: z.string().nullable().default(null),
  actionMessage: z.string().nullable().default(null),
  actionPayloadJson: z.string().nullable().default(null)
});

export const copilotPlannerJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    stepType: { type: "string", enum: ["tool_calls", "answer", "propose_action"] },
    rationale: { type: "string" },
    toolCalls: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          toolName: { type: "string" },
          reason: { type: "string" },
          argumentsJson: { type: "string" }
        },
        required: ["toolName", "reason", "argumentsJson"]
      }
    },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    answer: { anyOf: [{ type: "string" }, { type: "null" }] },
    basedOn: { anyOf: [{ type: "string" }, { type: "null" }] },
    caution: { anyOf: [{ type: "string" }, { type: "null" }] },
    referencedRecordIds: {
      type: "array",
      items: { type: "string" }
    },
    followUpSuggestions: {
      type: "array",
      items: { type: "string" }
    },
    actionType: { anyOf: [{ type: "string" }, { type: "null" }] },
    actionTitle: { anyOf: [{ type: "string" }, { type: "null" }] },
    actionMessage: { anyOf: [{ type: "string" }, { type: "null" }] },
    actionPayloadJson: { anyOf: [{ type: "string" }, { type: "null" }] }
  },
  required: [
    "stepType",
    "rationale",
    "toolCalls",
    "title",
    "answer",
    "basedOn",
    "caution",
    "referencedRecordIds",
    "followUpSuggestions",
    "actionType",
    "actionTitle",
    "actionMessage",
    "actionPayloadJson"
  ]
} as const;
