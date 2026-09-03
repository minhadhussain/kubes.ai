import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

type CreateLeadInput = {
  displayName: string;
  email?: string;
  phone?: string;
  contactId?: string | null;
  leadSource?: string;
  budget?: number;
  locationRequirements?: string;
  timeline?: string;
  notes?: string;
  requirements?: string;
  priority: "low" | "medium" | "high" | "urgent";
};

type UpdateLeadInput = {
  stage: "new" | "contacted" | "qualified" | "active" | "offer" | "closed";
  disposition: "open" | "nurture" | "cold" | "lost" | "converted";
  score: number;
  nextFollowUpAt?: string | null;
  notes?: string | null;
};

type CreateLeadNoteInput = {
  leadId: string;
  body: string;
  activityType: "note" | "call" | "email" | "message";
};

export async function listLeads() {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const [{ data: leads, error: leadError }, { data: contacts, error: contactError }, { data: tasks, error: taskError }, { data: notes, error: notesError }, { data: artifacts, error: artifactsError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, contact_id, stage, disposition, score, source, notes, next_follow_up_at, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("contacts")
        .select("id, display_name, email, phone, budget, location_requirements, timeline, lead_source, last_contacted_at, next_follow_up_at")
        .eq("organization_id", organizationId),
      supabase
        .from("tasks")
        .select("id, title, status, due_at, related_entity_id")
        .eq("organization_id", organizationId)
        .eq("related_entity_type", "lead")
        .order("created_at", { ascending: false }),
      supabase
        .from("activities")
        .select("id, entity_id, activity_type, title, body, occurred_at")
        .eq("organization_id", organizationId)
        .eq("entity_type", "lead")
        .order("occurred_at", { ascending: false }),
      supabase
        .from("ai_artifacts")
        .select("id, artifact_type, entity_id, summary, content, confidence, approval_status, action_status, created_at")
        .eq("organization_id", organizationId)
        .in("artifact_type", ["lead_qualification", "activity_summary", "follow_up_draft"])
        .eq("entity_type", "lead")
        .order("created_at", { ascending: false })
    ]);

  if (leadError || contactError || taskError || notesError || artifactsError) {
    throw new AppError("Unable to load leads workspace.", 500, "LEADS_LOAD_FAILED");
  }

  const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

  const tasksByLead = new Map<string, Array<(typeof tasks)[number]>>();
  for (const task of tasks ?? []) {
    const key = task.related_entity_id;
    if (!key) {
      continue;
    }

    const existing = tasksByLead.get(key) ?? [];
    existing.push(task);
    tasksByLead.set(key, existing);
  }

  const notesByLead = new Map<string, Array<(typeof notes)[number]>>();
  for (const note of notes ?? []) {
    const existing = notesByLead.get(note.entity_id) ?? [];
    existing.push(note);
    notesByLead.set(note.entity_id, existing);
  }

  const aiByLead = new Map<string, Array<(typeof artifacts)[number]>>();
  for (const artifact of artifacts ?? []) {
    if (!artifact.entity_id) {
      continue;
    }

    const existing = aiByLead.get(artifact.entity_id) ?? [];
    existing.push(artifact);
    aiByLead.set(artifact.entity_id, existing);
  }

  return (leads ?? []).map((lead) => ({
    id: lead.id,
    stage: lead.stage,
    disposition: lead.disposition,
    score: lead.score,
    source: lead.source,
    notes: lead.notes,
    nextFollowUpAt: lead.next_follow_up_at,
    createdAt: lead.created_at,
    contact: (() => {
      const contact = contactsById.get(lead.contact_id);

      if (!contact) {
        throw new AppError("Lead contact is missing.", 500, "LEAD_CONTACT_MISSING");
      }

      return {
        id: contact.id,
        displayName: contact.display_name,
        email: contact.email,
        phone: contact.phone,
        budget: contact.budget,
        locationRequirements: contact.location_requirements,
        timeline: contact.timeline,
        leadSource: contact.lead_source,
        lastContactedAt: contact.last_contacted_at,
        nextFollowUpAt: contact.next_follow_up_at
      };
    })(),
    tasks: tasksByLead.get(lead.id) ?? [],
    activities: notesByLead.get(lead.id) ?? [],
    aiArtifacts: aiByLead.get(lead.id) ?? []
  }));
}

export async function createLead(input: CreateLeadInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  let contactId = input.contactId ?? null;

  if (!contactId && input.email) {
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", input.email)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    }
  }

  if (!contactId && input.phone) {
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("phone", input.phone)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    }
  }

  if (!contactId) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        organization_id: organizationId,
        assigned_user_id: user.id,
        created_by: user.id,
        display_name: input.displayName,
        email: input.email || null,
        phone: input.phone || null,
        lead_source: input.leadSource || null,
        budget: input.budget ?? null,
        location_requirements: input.locationRequirements || null,
        timeline: input.timeline || null,
        contact_types: ["lead"]
      })
      .select("id")
      .single();

    if (contactError || !contact) {
      throw new AppError(contactError?.message ?? "Unable to create contact.", 400, "CONTACT_CREATE_FAILED");
    }

    contactId = contact.id;
  } else {
    const { error: contactUpdateError } = await supabase
      .from("contacts")
      .update({
        display_name: input.displayName,
        email: input.email || null,
        phone: input.phone || null,
        lead_source: input.leadSource || null,
        budget: input.budget ?? null,
        location_requirements: input.locationRequirements || null,
        timeline: input.timeline || null
      })
      .eq("organization_id", organizationId)
      .eq("id", contactId);

    if (contactUpdateError) {
      throw new AppError(contactUpdateError.message, 400, "CONTACT_UPDATE_FAILED");
    }
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      organization_id: organizationId,
      contact_id: contactId,
      owner_user_id: user.id,
      source: input.leadSource || null,
      notes: input.notes || null,
      requirements: input.requirements ? { freeform: input.requirements } : {}
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    throw new AppError(leadError?.message ?? "Unable to create lead.", 400, "LEAD_CREATE_FAILED");
  }

  if (input.notes) {
    const { error: activityError } = await supabase.from("activities").insert({
        organization_id: organizationId,
        actor_user_id: user.id,
        entity_type: "lead",
        entity_id: lead.id,
        contact_id: contactId,
        activity_type: "note",
      title: "Lead note added",
      body: input.notes,
      metadata: {
        source: "lead_create"
      }
    });

    if (activityError) {
      throw new AppError(activityError.message, 400, "LEAD_ACTIVITY_CREATE_FAILED");
    }
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 1);
  dueAt.setHours(10, 0, 0, 0);

  const { error: taskError } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    assigned_user_id: user.id,
    created_by: user.id,
    contact_id: contactId,
    title: `Follow up with ${input.displayName}`,
    description: "Respond to the new lead and confirm requirements.",
    priority: input.priority,
    due_at: dueAt.toISOString(),
    status: "pending",
    automation_source: "lead_intake",
    related_entity_type: "lead",
    related_entity_id: lead.id
  });

  if (taskError) {
    throw new AppError(taskError.message, 400, "TASK_CREATE_FAILED");
  }

  return lead.id;
}

export async function updateLead(leadId: string, input: UpdateLeadInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  const { data: lead, error: existingError } = await supabase
    .from("leads")
    .select("id, contact_id")
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .single();

  if (existingError || !lead) {
    throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
  }

  const { error: leadError } = await supabase
    .from("leads")
    .update({
      stage: input.stage,
      disposition: input.disposition,
      score: input.score,
      next_follow_up_at: input.nextFollowUpAt ?? null,
      notes: input.notes ?? null
    })
    .eq("id", leadId);

  if (leadError) {
    throw new AppError(leadError.message, 400, "LEAD_UPDATE_FAILED");
  }

  const { error: activityError } = await supabase.from("activities").insert({
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "lead",
    entity_id: leadId,
    contact_id: lead.contact_id,
    activity_type: "status_change",
    title: "Lead updated",
    body: `Stage changed to ${input.stage} with disposition ${input.disposition}.`,
    metadata: {
      score: input.score,
      nextFollowUpAt: input.nextFollowUpAt ?? null
    }
  });

  if (activityError) {
    throw new AppError(activityError.message, 400, "LEAD_ACTIVITY_CREATE_FAILED");
  }
}

export async function createLeadActivity(input: CreateLeadNoteInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, contact_id")
    .eq("organization_id", organizationId)
    .eq("id", input.leadId)
    .single();

  if (leadError || !lead) {
    throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
  }

  const { error: activityError } = await supabase.from("activities").insert({
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "lead",
    entity_id: input.leadId,
    contact_id: lead.contact_id,
    activity_type: input.activityType,
    title: input.activityType === "note" ? "Lead note" : `Lead ${input.activityType}`,
    body: input.body,
    metadata: {
      source: "manual_entry"
    }
  });

  if (activityError) {
    throw new AppError(activityError.message, 400, "LEAD_ACTIVITY_CREATE_FAILED");
  }
}
