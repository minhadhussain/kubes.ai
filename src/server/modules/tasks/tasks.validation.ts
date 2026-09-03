import { z } from "zod";

export const taskStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Task title is required."),
  description: z.string().trim().optional(),
  priority: taskPrioritySchema.default("medium"),
  dueAt: z.string().datetime().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  relatedEntityType: z.enum(["lead", "contact", "task", "transaction"]).default("task"),
  relatedEntityId: z.string().uuid().optional().nullable()
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
  notes: z.string().trim().optional().nullable()
});
