import { z } from "zod";

const contactTypeSchema = z.enum(["lead", "buyer", "seller", "vendor", "partner", "tenant", "landlord"]);

export const listContactsQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: contactTypeSchema.optional(),
  sort: z.enum(["updated_desc", "name_asc", "last_contact_desc"]).default("updated_desc")
});

export const createContactSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required."),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  contactTypes: z.array(contactTypeSchema).min(1, "Select at least one contact type."),
  leadSource: z.string().trim().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  locationRequirements: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional()
});

export const updateContactSchema = createContactSchema.extend({
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  lastContactedAt: z.string().datetime().optional().nullable()
});

export const createContactActivitySchema = z.object({
  title: z.string().trim().min(2, "Activity title is required."),
  body: z.string().trim().min(3, "Add more detail to the activity."),
  activityType: z.enum(["note", "call", "email", "message"]).default("note")
});
