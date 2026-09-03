import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

type ContactListFilters = {
  q?: string;
  type?: "lead" | "buyer" | "seller" | "vendor" | "partner" | "tenant" | "landlord";
  sort?: "updated_desc" | "name_asc" | "last_contact_desc";
};

type ContactInput = {
  displayName: string;
  email?: string;
  phone?: string;
  contactTypes: Array<"lead" | "buyer" | "seller" | "vendor" | "partner" | "tenant" | "landlord">;
  leadSource?: string;
  budget?: number;
  locationRequirements?: string;
  timeline?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
};

type ContactActivityInput = {
  contactId: string;
  title: string;
  body: string;
  activityType: "note" | "call" | "email" | "message";
};

function buildContactPatch(input: ContactInput) {
  return {
    display_name: input.displayName,
    email: input.email || null,
    phone: input.phone || null,
    contact_types: input.contactTypes,
    lead_source: input.leadSource || null,
    budget: input.budget ?? null,
    location_requirements: input.locationRequirements || null,
    timeline: input.timeline || null,
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    city: input.city || null,
    state: input.state || null,
    country: input.country || null,
    next_follow_up_at: input.nextFollowUpAt ?? null,
    last_contacted_at: input.lastContactedAt ?? null
  };
}

export async function listContacts(filters: ContactListFilters = {}) {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  let query = supabase
    .from("contacts")
    .select(
      "id, display_name, email, phone, contact_types, lead_source, budget, timeline, last_contacted_at, next_follow_up_at, updated_at"
    )
    .eq("organization_id", organizationId);

  if (filters.q) {
    query = query.or(`display_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`);
  }

  if (filters.type) {
    query = query.contains("contact_types", [filters.type]);
  }

  if (filters.sort === "name_asc") {
    query = query.order("display_name", { ascending: true });
  } else if (filters.sort === "last_contact_desc") {
    query = query.order("last_contacted_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query.limit(100);

  if (error) {
    throw new AppError("Unable to load contacts.", 500, "CONTACTS_LOAD_FAILED");
  }

  return data ?? [];
}

export async function getContactDetail(contactId: string) {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const [contactResult, leadsResult, tasksResult, activitiesResult, showingsResult, transactionsResult, propertiesResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", contactId)
      .single(),
    supabase
      .from("leads")
      .select("id, stage, disposition, score, source, next_follow_up_at, created_at")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_at, related_entity_type, related_entity_id")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("activities")
      .select("id, title, body, activity_type, occurred_at, entity_type, entity_id")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("showings")
      .select("id, status, starts_at, ends_at, property:properties(address_line_1, city)")
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId)
      .order("starts_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, stage, closing_date, sale_price")
      .eq("organization_id", organizationId)
      .eq("seller_contact_id", contactId)
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select("id, property:properties(id, address_line_1, city, price), status")
      .eq("organization_id", organizationId)
      .eq("seller_contact_id", contactId)
      .order("created_at", { ascending: false })
  ]);

  if (contactResult.error || !contactResult.data) {
    throw new AppError("Contact not found.", 404, "CONTACT_NOT_FOUND");
  }

  if (leadsResult.error || tasksResult.error || activitiesResult.error || showingsResult.error || transactionsResult.error || propertiesResult.error) {
    throw new AppError("Unable to load contact detail.", 500, "CONTACT_DETAIL_LOAD_FAILED");
  }

  return {
    contact: contactResult.data,
    leads: leadsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    activities: activitiesResult.data ?? [],
    showings: showingsResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    properties: (propertiesResult.data ?? []).map((listing) => ({
      id: listing.id,
      status: listing.status,
      property: Array.isArray(listing.property) ? listing.property[0] ?? null : listing.property
    }))
  };
}

export async function createContact(input: ContactInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  if (input.email) {
    const { data: existingByEmail } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", input.email)
      .maybeSingle();

    if (existingByEmail) {
      throw new AppError("A contact with this email already exists.", 409, "CONTACT_DUPLICATE_EMAIL");
    }
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      assigned_user_id: user.id,
      created_by: user.id,
      ...buildContactPatch(input)
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError(error?.message ?? "Unable to create contact.", 400, "CONTACT_CREATE_FAILED");
  }

  return data.id;
}

export async function updateContact(contactId: string, input: ContactInput) {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const { error } = await supabase
    .from("contacts")
    .update(buildContactPatch(input))
    .eq("organization_id", organizationId)
    .eq("id", contactId);

  if (error) {
    throw new AppError(error.message, 400, "CONTACT_UPDATE_FAILED");
  }
}

export async function createContactActivity(input: ContactActivityInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  const { error } = await supabase.from("activities").insert({
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "contact",
    entity_id: input.contactId,
    contact_id: input.contactId,
    activity_type: input.activityType,
    title: input.title,
    body: input.body,
    metadata: {
      source: "contact_workspace"
    }
  });

  if (error) {
    throw new AppError(error.message, 400, "CONTACT_ACTIVITY_CREATE_FAILED");
  }
}
