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
