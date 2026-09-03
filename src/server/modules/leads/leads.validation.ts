import { z } from "zod";

const optionalString = z.string().trim().min(1).optional();

export const leadStageSchema = z.enum(["new", "contacted", "qualified", "active", "offer", "closed"]);
export const leadDispositionSchema = z.enum(["open", "nurture", "cold", "lost", "converted"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const createLeadSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  phone: optionalString,
  contactId: z.string().uuid().optional().nullable(),
  leadSource: optionalString,
  budget: z.coerce.number().nonnegative("Budget must be zero or higher.").optional(),
  locationRequirements: optionalString,
  timeline: optionalString,
  notes: optionalString,
  requirements: optionalString,
  priority: taskPrioritySchema.default("medium")
});

export const updateLeadSchema = z.object({
  stage: leadStageSchema,
  disposition: leadDispositionSchema,
  score: z.coerce.number().int().min(0).max(100),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

export const createLeadNoteSchema = z.object({
  body: z.string().trim().min(3, "Add a meaningful note."),
  activityType: z.enum(["note", "call", "email", "message"]).default("note")
});
