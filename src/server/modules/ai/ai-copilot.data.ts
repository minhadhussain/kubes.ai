import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSeededDocuments } from "@/server/modules/documents/documents.service";
import { getSeededFinanceSummary } from "@/server/modules/finance/finance.service";
import { listSeededListings } from "@/server/modules/listings/listings.service";
import { listSeededProperties } from "@/server/modules/properties/properties.service";
import { listSeededShowings } from "@/server/modules/showings/showings.service";
import { listSeededTransactions } from "@/server/modules/transactions/transactions.service";
import { getDashboardSummary } from "@/server/modules/dashboard/dashboard.service";
import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

type CopilotDatasetKey =
  | "dashboard"
  | "leads"
  | "tasks"
  | "contacts"
  | "properties"
  | "listings"
  | "showings"
  | "transactions"
  | "documents"
  | "finance";

type CopilotPageContext = {
  pathname: string;
  entityType?: "lead" | "contact" | "task" | "property" | "listing" | "showing" | "transaction" | null;
  entityId?: string | null;
};

export type CopilotReference = {
  id: string;
  entityType: string;
  label: string;
  href: string;
  meta: string;
};

export type CopilotResolvedContext = {
  page: {
    pathname: string;
    label: string;
  };
  datasets: CopilotDatasetKey[];
  entityContext: Record<string, unknown> | null;
  datasetContext: Record<string, unknown>;
  references: CopilotReference[];
};

function toPageLabel(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "dashboard";
  return last.replace(/-/g, " ");
}

function inferDatasets(question: string, pathname: string) {
  const normalized = `${pathname} ${question}`.toLowerCase();
  const datasets = new Set<CopilotDatasetKey>();

  datasets.add("dashboard");

  if (/lead|prospect|pipeline|qualification/.test(normalized)) {
    datasets.add("leads");
    datasets.add("tasks");
  }

  if (/task|follow-?up|overdue|due/.test(normalized)) {
    datasets.add("tasks");
  }

  if (/contact|client|buyer|seller|who should i contact/.test(normalized)) {
    datasets.add("contacts");
  }

  if (/propert|inventory|home|unit/.test(normalized)) {
    datasets.add("properties");
  }

  if (/listing|listed|market/.test(normalized)) {
    datasets.add("listings");
  }

  if (/showing|tour|appointment|today|calendar/.test(normalized)) {
    datasets.add("showings");
  }

  if (/transaction|deal|closing|contract|escrow/.test(normalized)) {
    datasets.add("transactions");
  }

  if (/document|file|disclosure|signature/.test(normalized)) {
    datasets.add("documents");
  }

  if (/commission|finance|income|revenue|expense/.test(normalized)) {
    datasets.add("finance");
    datasets.add("transactions");
  }

  if (pathname.startsWith("/leads")) {
    datasets.add("leads");
  } else if (pathname.startsWith("/contacts")) {
    datasets.add("contacts");
  } else if (pathname.startsWith("/tasks")) {
    datasets.add("tasks");
  } else if (pathname.startsWith("/properties")) {
    datasets.add("properties");
  } else if (pathname.startsWith("/listings")) {
    datasets.add("listings");
  } else if (pathname.startsWith("/showings") || pathname.startsWith("/calendar")) {
    datasets.add("showings");
  } else if (pathname.startsWith("/transactions")) {
    datasets.add("transactions");
    datasets.add("finance");
  } else if (pathname.startsWith("/documents")) {
    datasets.add("documents");
  } else if (pathname.startsWith("/finance")) {
    datasets.add("finance");
  }

  return Array.from(datasets);
}

async function loadLeadEntity(organizationId: string, entityId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: lead, error: leadError }, { data: tasks, error: taskError }, { data: activities, error: activityError }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, stage, disposition, score, source, notes, next_follow_up_at, created_at, contact:contacts(id, display_name, email, phone, budget, location_requirements, timeline, lead_source, last_contacted_at, next_follow_up_at)"
      )
      .eq("organization_id", organizationId)
      .eq("id", entityId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, due_at")
      .eq("organization_id", organizationId)
      .eq("related_entity_type", "lead")
      .eq("related_entity_id", entityId)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("activities")
      .select("id, title, body, activity_type, occurred_at")
      .eq("organization_id", organizationId)
      .eq("entity_type", "lead")
      .eq("entity_id", entityId)
      .order("occurred_at", { ascending: false })
      .limit(8)
  ]);

  if (leadError) {
    throw new AppError("Unable to load lead context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  if (!lead) {
    return null;
  }

  if (taskError || activityError) {
    throw new AppError("Unable to load lead context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  const contact = Array.isArray(lead.contact) ? lead.contact[0] ?? null : lead.contact;

  return {
    entityType: "lead",
    id: lead.id,
    title: contact?.display_name ?? "Lead",
    href: `/leads`,
    detail: {
      ...lead,
      contact,
      tasks: tasks ?? [],
      activities: activities ?? []
    },
    reference: {
      id: lead.id,
      entityType: "lead",
      label: contact?.display_name ?? "Lead",
      href: "/leads",
      meta: `${lead.stage} - score ${lead.score}`
    } satisfies CopilotReference
  };
}

async function loadContactEntity(organizationId: string, entityId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: contact, error: contactError }, { data: tasks, error: taskError }, { data: activities, error: activityError }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, display_name, email, phone, city, state, country, contact_types, lead_source, budget, location_requirements, timeline, last_contacted_at, next_follow_up_at")
      .eq("organization_id", organizationId)
      .eq("id", entityId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, due_at, priority")
      .eq("organization_id", organizationId)
      .eq("contact_id", entityId)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("activities")
      .select("id, title, body, activity_type, occurred_at")
      .eq("organization_id", organizationId)
      .eq("contact_id", entityId)
      .order("occurred_at", { ascending: false })
      .limit(8)
  ]);

  if (contactError) {
    throw new AppError("Unable to load contact context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  if (!contact) {
    return null;
  }

  if (taskError || activityError) {
    throw new AppError("Unable to load contact context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  return {
    entityType: "contact",
    id: contact.id,
    title: contact.display_name,
    href: `/contacts`,
    detail: {
      contact,
      tasks: tasks ?? [],
      activities: activities ?? []
    },
    reference: {
      id: contact.id,
      entityType: "contact",
      label: contact.display_name,
      href: "/contacts",
      meta: (contact.contact_types ?? []).join(", ") || "Contact"
    } satisfies CopilotReference
  };
}

async function loadTaskEntity(organizationId: string, entityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, priority, due_at, status, related_entity_type, related_entity_id, contact:contacts(id, display_name)")
    .eq("organization_id", organizationId)
    .eq("id", entityId)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to load task context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  if (!data) {
    return null;
  }

  const contact = Array.isArray(data.contact) ? data.contact[0] ?? null : data.contact;

  return {
    entityType: "task",
    id: data.id,
    title: data.title,
    href: "/tasks",
    detail: {
      ...data,
      contact
    },
    reference: {
      id: data.id,
      entityType: "task",
      label: data.title,
      href: "/tasks",
      meta: `${data.status} - ${data.priority}`
    } satisfies CopilotReference
  };
}

async function loadPropertyEntity(_organizationId: string, entityId: string) {
  const properties = await listSeededProperties();
  const property = properties.find((item) => item.id === entityId);

  if (!property) {
    return null;
  }

  return {
    entityType: "property",
    id: property.id,
    title: `${property.addressLine1}, ${property.city}`,
    href: "/properties",
    detail: {
      property,
      latestListing: property.latestListing,
      listingCount: property.listingCount,
      currentMarketState: property.currentMarketState,
      showingCount: property.showingCount,
      offerCount: property.offerCount
    },
    reference: {
      id: property.id,
      entityType: "property",
      label: `${property.addressLine1}, ${property.city}`,
      href: "/properties",
      meta: `${property.propertyType} · ${property.currentMarketState === "on_market" ? "on market" : "off market"}`
    } satisfies CopilotReference
  };
}

async function loadListingEntity(_organizationId: string, entityId: string) {
  const listings = await listSeededListings();
  const data = listings.find((item) => item.id === entityId);

  if (!data) {
    return null;
  }

  return {
    entityType: "listing",
    id: data.id,
    title: data.property ? `${data.property.addressLine1}, ${data.property.city}` : "Listing",
    href: "/listings",
    detail: data,
    reference: {
      id: data.id,
      entityType: "listing",
      label: data.property ? `${data.property.addressLine1}, ${data.property.city}` : "Listing",
      href: "/listings",
      meta: data.status
    } satisfies CopilotReference
  };
}

async function loadShowingEntity(_organizationId: string, entityId: string) {
  const showings = await listSeededShowings();
  const data = showings.find((item) => item.id === entityId);

  if (!data) {
    return null;
  }

  return {
    entityType: "showing",
    id: data.id,
    title: data.property ? `${data.property.addressLine1}, ${data.property.city}` : "Showing",
    href: "/showings",
    detail: data,
    reference: {
      id: data.id,
      entityType: "showing",
      label: data.property ? `${data.property.addressLine1}, ${data.property.city}` : "Showing",
      href: "/showings",
      meta: data.status
    } satisfies CopilotReference
  };
}

async function loadTransactionEntity(_organizationId: string, entityId: string) {
  const transactions = await listSeededTransactions();
  const transaction = transactions.find((item) => item.id === entityId);

  if (!transaction) {
    return null;
  }

  return {
    entityType: "transaction",
    id: transaction.id,
    title: transaction.property ? `${transaction.property.addressLine1}, ${transaction.property.city}` : "Transaction",
    href: "/transactions",
    detail: transaction,
    reference: {
      id: transaction.id,
      entityType: "transaction",
      label: transaction.property ? `${transaction.property.addressLine1}, ${transaction.property.city}` : "Transaction",
      href: "/transactions",
      meta: transaction.stage
    } satisfies CopilotReference
  };
}

async function loadEntityContext(organizationId: string, pageContext?: CopilotPageContext) {
  if (!pageContext?.entityType || !pageContext.entityId) {
    return null;
  }

  switch (pageContext.entityType) {
    case "lead":
      return loadLeadEntity(organizationId, pageContext.entityId);
    case "contact":
      return loadContactEntity(organizationId, pageContext.entityId);
    case "task":
      return loadTaskEntity(organizationId, pageContext.entityId);
    case "property":
      return loadPropertyEntity(organizationId, pageContext.entityId);
    case "listing":
      return loadListingEntity(organizationId, pageContext.entityId);
    case "showing":
      return loadShowingEntity(organizationId, pageContext.entityId);
    case "transaction":
      return loadTransactionEntity(organizationId, pageContext.entityId);
    default:
      return null;
  }
}

async function loadDashboardDataset() {
  const summary = await getDashboardSummary();
  return {
    organization: summary.organization,
    today: summary.today,
    business: summary.business
  };
}

async function loadLeadsDataset(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, stage, disposition, score, source, next_follow_up_at, created_at, contact:contacts(id, display_name, last_contacted_at)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new AppError("Unable to load leads context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  const items = (data ?? []).map((lead) => {
    const contact = Array.isArray(lead.contact) ? lead.contact[0] ?? null : lead.contact;

    return {
      id: lead.id,
      stage: lead.stage,
      disposition: lead.disposition,
      score: lead.score,
      source: lead.source,
      nextFollowUpAt: lead.next_follow_up_at,
      createdAt: lead.created_at,
      contactName: contact?.display_name ?? "Lead",
      lastContactedAt: contact?.last_contacted_at ?? null
    };
  });

  return {
    total: items.length,
    items
  };
}

async function loadTasksDataset(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, priority, due_at, status, related_entity_type, related_entity_id, contact:contacts(id, display_name)")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(15);

  if (error) {
    throw new AppError("Unable to load tasks context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  const now = Date.now();
  const items = (data ?? []).map((task) => {
    const contact = Array.isArray(task.contact) ? task.contact[0] ?? null : task.contact;
    const overdue = Boolean(task.due_at && task.status !== "completed" && task.status !== "cancelled" && new Date(task.due_at).getTime() < now);

    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueAt: task.due_at,
      status: task.status,
      relatedEntityType: task.related_entity_type,
      relatedEntityId: task.related_entity_id,
      contactName: contact?.display_name ?? null,
      overdue
    };
  });

  return {
    total: items.length,
    overdueCount: items.filter((item) => item.overdue).length,
    items
  };
}

async function loadContactsDataset(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, display_name, contact_types, last_contacted_at, next_follow_up_at, lead_source")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new AppError("Unable to load contacts context.", 500, "AI_CONTEXT_LOAD_FAILED");
  }

  return {
    total: (data ?? []).length,
    items: data ?? []
  };
}

async function loadPropertiesDataset(_organizationId: string) {
  const data = await listSeededProperties();

  return {
    total: data.length,
    items: data.slice(0, 12).map((property) => ({
      id: property.id,
      title: property.title,
      addressLine1: property.addressLine1,
      city: property.city,
      locality: property.locality,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      listingCount: property.listingCount,
      activeListingCount: property.activeListingCount,
      currentMarketState: property.currentMarketState,
      latestListingStatus: property.latestListingStatus
    }))
  };
}

async function loadListingsDataset(_organizationId: string) {
  const items = (await listSeededListings()).slice(0, 12);

  return {
    total: items.length,
    activeCount: items.filter((item) => ["coming_soon", "active", "under_contract", "pending"].includes(item.status)).length,
    items
  };
}

async function loadShowingsDataset(_organizationId: string) {
  const items = (await listSeededShowings()).slice(0, 12);

  return {
    total: items.length,
    items
  };
}

async function loadTransactionsDataset(_organizationId: string) {
  const items = (await listSeededTransactions()).slice(0, 12);

  return {
    total: items.length,
    items
  };
}

async function loadDocumentsDataset(_organizationId: string) {
  const data = await listSeededDocuments();

  return {
    total: data.length,
    items: data.slice(0, 12)
  };
}

async function loadFinanceDataset(_organizationId: string) {
  return getSeededFinanceSummary();
}

function buildDatasetReferences(datasetContext: Record<string, unknown>) {
  const references: CopilotReference[] = [];

  const pushRecord = (record: CopilotReference) => {
    if (references.some((item) => item.id === record.id && item.entityType === record.entityType)) {
      return;
    }

    references.push(record);
  };

  const leads = (datasetContext.leads as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const lead of leads.slice(0, 6)) {
    pushRecord({
      id: String(lead.id),
      entityType: "lead",
      label: String(lead.contactName ?? "Lead"),
      href: "/leads",
      meta: `${String(lead.stage ?? "unknown")} - score ${String(lead.score ?? 0)}`
    });
  }

  const tasks = (datasetContext.tasks as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const task of tasks.slice(0, 6)) {
    pushRecord({
      id: String(task.id),
      entityType: "task",
      label: String(task.title ?? "Task"),
      href: "/tasks",
      meta: `${String(task.status ?? "pending")} - ${String(task.priority ?? "medium")}`
    });
  }

  const contacts = (datasetContext.contacts as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const contact of contacts.slice(0, 6)) {
    pushRecord({
      id: String(contact.id),
      entityType: "contact",
      label: String(contact.display_name ?? "Contact"),
      href: "/contacts",
      meta: Array.isArray(contact.contact_types) ? contact.contact_types.join(", ") : "Contact"
    });
  }

  const properties = (datasetContext.properties as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const property of properties.slice(0, 4)) {
    pushRecord({
      id: String(property.id),
      entityType: "property",
      label: `${String(property.addressLine1 ?? "Property")}, ${String(property.city ?? "")}`.trim(),
      href: "/properties",
      meta: String(property.listingStatus ?? "active")
    });
  }

  const listings = (datasetContext.listings as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const listing of listings.slice(0, 4)) {
    const property = (listing.property as Record<string, unknown> | null | undefined) ?? null;
    pushRecord({
      id: String(listing.id),
      entityType: "listing",
      label: property ? `${String(property.addressLine1 ?? "Listing")}, ${String(property.city ?? "")}`.trim() : "Listing",
      href: "/listings",
      meta: String(listing.status ?? "draft")
    });
  }

  const transactions = (datasetContext.transactions as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const transaction of transactions.slice(0, 6)) {
    const property = (transaction.property as Record<string, unknown> | null | undefined) ?? null;
    pushRecord({
      id: String(transaction.id),
      entityType: "transaction",
      label: property ? `${String(property.addressLine1 ?? "Transaction")}, ${String(property.city ?? "")}`.trim() : "Transaction",
      href: "/transactions",
      meta: String(transaction.stage ?? "active")
    });
  }

  const showings = (datasetContext.showings as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  for (const showing of showings.slice(0, 4)) {
    const property = (showing.property as Record<string, unknown> | null | undefined) ?? null;
    pushRecord({
      id: String(showing.id),
      entityType: "showing",
      label: property ? `${String(property.addressLine1 ?? "Showing")}, ${String(property.city ?? "")}`.trim() : "Showing",
      href: "/showings",
      meta: String(showing.status ?? "scheduled")
    });
  }

  return references.slice(0, 12);
}

export async function resolveCopilotContext(input: { question: string; pageContext?: CopilotPageContext }) {
  const { organizationId } = await requireCurrentOrganizationContext();

  const pathname = input.pageContext?.pathname ?? "/dashboard";
  const datasets = inferDatasets(input.question, pathname);
  const entityContext = await loadEntityContext(organizationId, input.pageContext);

  const datasetContext: Record<string, unknown> = {};

  for (const dataset of datasets) {
    if (dataset === "dashboard") {
      datasetContext.dashboard = await loadDashboardDataset();
    } else if (dataset === "leads") {
      datasetContext.leads = await loadLeadsDataset(organizationId);
    } else if (dataset === "tasks") {
      datasetContext.tasks = await loadTasksDataset(organizationId);
    } else if (dataset === "contacts") {
      datasetContext.contacts = await loadContactsDataset(organizationId);
    } else if (dataset === "properties") {
      datasetContext.properties = await loadPropertiesDataset(organizationId);
    } else if (dataset === "listings") {
      datasetContext.listings = await loadListingsDataset(organizationId);
    } else if (dataset === "showings") {
      datasetContext.showings = await loadShowingsDataset(organizationId);
    } else if (dataset === "transactions") {
      datasetContext.transactions = await loadTransactionsDataset(organizationId);
    } else if (dataset === "documents") {
      datasetContext.documents = await loadDocumentsDataset(organizationId);
    } else if (dataset === "finance") {
      datasetContext.finance = await loadFinanceDataset(organizationId);
    }
  }

  const references = buildDatasetReferences(datasetContext);

  if (entityContext?.reference) {
    references.unshift(entityContext.reference);
  }

  return {
    page: {
      pathname,
      label: toPageLabel(pathname)
    },
    datasets,
    entityContext: entityContext?.detail ?? null,
    datasetContext,
    references: references.slice(0, 12)
  } satisfies CopilotResolvedContext;
}
