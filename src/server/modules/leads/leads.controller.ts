import { NextRequest } from "next/server";

import {
  createLeadActivity,
  createLead,
  listLeads,
  updateLead
} from "@/server/modules/leads/leads.service";
import {
  createLeadNoteSchema,
  createLeadSchema,
  updateLeadSchema
} from "@/server/modules/leads/leads.validation";
import { fail, ok } from "@/server/shared/http";

export async function handleListLeads() {
  try {
    const leads = await listLeads();
    return ok(leads);
  } catch (error) {
    return fail(error);
  }
}

export async function handleCreateLead(request: NextRequest) {
  try {
    const body = createLeadSchema.parse(await request.json());
    const leadId = await createLead({
      displayName: body.displayName,
      email: body.email || undefined,
      phone: body.phone,
      contactId: body.contactId,
      leadSource: body.leadSource,
      budget: body.budget,
      locationRequirements: body.locationRequirements,
      timeline: body.timeline,
      notes: body.notes,
      requirements: body.requirements,
      priority: body.priority
    });

    return ok({ leadId }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleUpdateLead(request: NextRequest, leadId: string) {
  try {
    const body = updateLeadSchema.parse(await request.json());
    await updateLead(leadId, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function handleCreateLeadActivity(request: NextRequest, leadId: string) {
  try {
    const body = createLeadNoteSchema.parse(await request.json());
    await createLeadActivity({
      leadId,
      body: body.body,
      activityType: body.activityType
    });

    return ok({ success: true }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
