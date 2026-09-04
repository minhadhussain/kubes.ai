import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listContacts, getContactDetail, createContactActivity } from "@/server/modules/contacts/contacts.service";
import { getDashboardSummary } from "@/server/modules/dashboard/dashboard.service";
import { listSeededDocuments } from "@/server/modules/documents/documents.service";
import { getSeededFinanceSummary } from "@/server/modules/finance/finance.service";
import { listLeads, updateLead } from "@/server/modules/leads/leads.service";
import { listSeededListings, getSeededListingDetail } from "@/server/modules/listings/listings.service";
import { listSeededProperties, getSeededPropertyDetail } from "@/server/modules/properties/properties.service";
import { listSeededShowings, getSeededShowingDetail } from "@/server/modules/showings/showings.service";
import { createTask, listTasks, updateTaskStatus } from "@/server/modules/tasks/tasks.service";
import { getSeededTransactionDetail, listSeededTransactions } from "@/server/modules/transactions/transactions.service";
import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

const isoDateTimeSchema = z.string().datetime();

type ToolReference = {
  id: string;
  entityType: string;
  label: string;
  href: string;
  meta: string;
};

type ToolResult = {
  toolName: string;
  summary: string;
  data: Record<string, unknown>;
  references: ToolReference[];
  basedOn?: string;
};

type ToolContext = {
  organizationId: string;
  userId: string;
};

type CopilotLeadRecord = {
  id: string;
  stage: string;
  disposition: string;
  score: number;
  source: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  contact: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    budget: number | null;
    locationRequirements: string | null;
    timeline: string | null;
    leadSource: string | null;
    lastContactedAt: string | null;
    nextFollowUpAt: string | null;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
  }>;
  activities: Array<{
    id: string;
    title: string;
    body: string | null;
    activityType: string;
    occurredAt: string;
  }>;
  aiArtifacts: Array<{
    id: string;
    artifactType?: string;
    summary?: string | null;
  }>;
};

type ToolDefinition<TSchema extends z.ZodTypeAny> = {
  description: string;
  schema: TSchema;
  execute: (args: z.infer<TSchema>, context: ToolContext) => Promise<ToolResult>;
};

function currency(value: number | null | undefined) {
  if (value == null) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function dateLabel(value: string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString();
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildLeadReference(lead: { id: string; contact: { displayName: string }; stage: string; score: number }) {
  return {
    id: lead.id,
    entityType: "lead",
    label: lead.contact.displayName,
    href: "/leads",
    meta: `${lead.stage} · score ${lead.score}`
  } satisfies ToolReference;
}

function buildContactReference(contact: { id: string; display_name?: string | null; displayName?: string | null; contact_types?: string[] | null; contactTypes?: string[] | null }) {
  const label = contact.display_name ?? contact.displayName ?? "Contact";
  const types = contact.contact_types ?? contact.contactTypes ?? [];

  return {
    id: contact.id,
    entityType: "contact",
    label,
    href: "/contacts",
    meta: types.length > 0 ? types.join(" · ") : "Contact"
  } satisfies ToolReference;
}

function buildPropertyReference(property: { id: string; addressLine1: string; city: string; propertyType?: string; bedrooms?: number }) {
  return {
    id: property.id,
    entityType: "property",
    label: property.addressLine1,
    href: "/properties",
    meta: `${property.city}${property.bedrooms ? ` · ${property.bedrooms} BHK` : ""}${property.propertyType ? ` · ${property.propertyType}` : ""}`
  } satisfies ToolReference;
}

function buildListingReference(listing: { id: string; status: string; property: { addressLine1: string; city: string } }) {
  return {
    id: listing.id,
    entityType: "listing",
    label: listing.property.addressLine1,
    href: "/listings",
    meta: `${listing.status.replace(/_/g, " ")} · ${listing.property.city}`
  } satisfies ToolReference;
}

function buildShowingReference(showing: { id: string; status: string; startsAt: string; property: { addressLine1: string } | null }) {
  return {
    id: showing.id,
    entityType: "showing",
    label: showing.property?.addressLine1 ?? "Showing",
    href: "/calendar",
    meta: `${showing.status} · ${new Date(showing.startsAt).toLocaleString()}`
  } satisfies ToolReference;
}

function buildTaskReference(task: { id: string; title: string; status: string; dueAt?: string | null; due_at?: string | null }) {
  return {
    id: task.id,
    entityType: "task",
    label: task.title,
    href: "/tasks",
    meta: `${task.status} · ${dateLabel(task.dueAt ?? task.due_at ?? null)}`
  } satisfies ToolReference;
}

function buildTransactionReference(transaction: { id: string; stage: string; property: { addressLine1: string } | null; closingDate?: string | null; closing_date?: string | null }) {
  return {
    id: transaction.id,
    entityType: "transaction",
    label: transaction.property?.addressLine1 ?? "Transaction",
    href: "/transactions",
    meta: `${transaction.stage.replace(/_/g, " ")} · ${dateLabel(transaction.closingDate ?? transaction.closing_date ?? null)}`
  } satisfies ToolReference;
}

function buildDocumentReference(document: { id: string; fileName: string; category: string; status: string }) {
  return {
    id: document.id,
    entityType: "document",
    label: document.fileName,
    href: "/documents",
    meta: `${document.category} · ${document.status}`
  } satisfies ToolReference;
}

function parseBudgetText(question: string) {
  const normalized = question.toLowerCase().replace(/,/g, "");
  const croreMatch = normalized.match(/(?:under|below|less than|max)?\s*₹?\s*(\d+(?:\.\d+)?)\s*cr/);
  if (croreMatch) {
    return Math.round(Number(croreMatch[1]) * 10000000);
  }

  const lakhMatch = normalized.match(/(?:under|below|less than|max)?\s*₹?\s*(\d+(?:\.\d+)?)\s*l/);
  if (lakhMatch) {
    return Math.round(Number(lakhMatch[1]) * 100000);
  }

  const rupeeMatch = normalized.match(/(?:under|below|less than|max)?\s*₹\s*(\d+(?:\.\d+)?)/);
  if (rupeeMatch) {
    return Math.round(Number(rupeeMatch[1]));
  }

  return null;
}

function parseBedroomsText(question: string) {
  const match = question.toLowerCase().match(/(\d+)\s*bhk/);
  return match ? Number(match[1]) : null;
}

function parseLocalityText(question: string) {
  const match = question.match(/in\s+([a-zA-Z\s]+?)(?:\s+with|\s+that|\s+under|\?|$|\.|,)/i);
  return match?.[1]?.trim() ?? null;
}

function getDateRange(frame: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (frame) {
    case "today": {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "tomorrow": {
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "this_week": {
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      end.setDate(start.getDate() + 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "closing_soon": {
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default:
      throw new AppError("Unsupported time frame.", 400, "AI_TOOL_TIMEFRAME_INVALID");
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function matchesSearch(value: string, search: string) {
  return normalizeText(value).includes(normalizeText(search));
}

async function getOrganizationContext(): Promise<ToolContext> {
  const { organizationId, user } = await requireCurrentOrganizationContext();

  return {
    organizationId,
    userId: user.id
  };
}

async function getCopilotLeads(): Promise<CopilotLeadRecord[]> {
  const leads = await listLeads();

  return leads.map((lead) => {
    const tasks = (lead.tasks as Array<Record<string, unknown>>).map((task) => ({
      id: String(task.id),
      title: String(task.title),
      status: String(task.status),
      dueAt: (task.dueAt as string | null | undefined) ?? (task.due_at as string | null | undefined) ?? null
    }));

    const activities = (lead.activities as Array<Record<string, unknown>>).map((activity) => ({
      id: String(activity.id),
      title: String(activity.title),
      body: (activity.body as string | null | undefined) ?? null,
      activityType: String((activity.activityType as string | undefined) ?? (activity.activity_type as string | undefined) ?? "note"),
      occurredAt: String((activity.occurredAt as string | undefined) ?? (activity.occurred_at as string | undefined) ?? new Date().toISOString())
    }));

    const aiArtifacts = (lead.aiArtifacts as Array<Record<string, unknown>>).map((artifact) => ({
      id: String(artifact.id),
      artifactType: (artifact.artifactType as string | undefined) ?? (artifact.artifact_type as string | undefined),
      summary: (artifact.summary as string | null | undefined) ?? null
    }));

    return {
      id: lead.id,
      stage: lead.stage,
      disposition: lead.disposition,
    score: lead.score,
    source: lead.source,
    notes: lead.notes,
    nextFollowUpAt: lead.nextFollowUpAt,
    createdAt: lead.createdAt,
    contact: {
      id: lead.contact.id,
      displayName: lead.contact.displayName,
      email: lead.contact.email,
      phone: lead.contact.phone,
      budget: lead.contact.budget,
      locationRequirements: lead.contact.locationRequirements,
      timeline: lead.contact.timeline,
      leadSource: lead.contact.leadSource,
      lastContactedAt: lead.contact.lastContactedAt,
      nextFollowUpAt: lead.contact.nextFollowUpAt
    },
      tasks,
      activities,
      aiArtifacts
    };
  });
}

const toolDefinitions = {
  search_contacts: {
    description: "Search contacts by name, type, location, or requirements.",
    schema: z.object({
      q: z.string().trim().optional(),
      type: z.enum(["lead", "buyer", "seller", "vendor", "partner", "tenant", "landlord"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      const contacts = await listContacts({ q: args.q, type: args.type, sort: "updated_desc" });
      const items = contacts.slice(0, args.limit);

      return {
        toolName: "search_contacts",
        summary: `Found ${items.length} contacts${args.q ? ` matching ${args.q}` : ""}.`,
        data: {
          contacts: items
        },
        references: items.map((contact) => buildContactReference(contact)),
        basedOn: `${items.length} contacts`
      };
    }
  },
  get_contact: {
    description: "Load a contact with related leads, tasks, activities, properties, and transactions.",
    schema: z.object({
      contactId: z.string().min(1)
    }),
    async execute(args) {
      const detail = await getContactDetail(args.contactId);

      return {
        toolName: "get_contact",
        summary: `Loaded full contact detail for ${detail.contact.display_name}.`,
        data: detail,
        references: [buildContactReference(detail.contact)],
        basedOn: `${detail.activities.length} activities · ${detail.tasks.length} tasks`
      };
    }
  },
  get_contact_memory: {
    description: "Load contact memory from activities and CRM notes.",
    schema: z.object({
      contactId: z.string().min(1),
      limit: z.number().int().min(1).max(20).default(8)
    }),
    async execute(args, context) {
      const supabase = await createSupabaseServerClient();
      const [activitiesResult, notesResult] = await Promise.all([
        supabase
          .from("activities")
          .select("id, title, body, activity_type, occurred_at")
          .eq("organization_id", context.organizationId)
          .eq("contact_id", args.contactId)
          .order("occurred_at", { ascending: false })
          .limit(args.limit),
        supabase
          .from("notes")
          .select("id, body, pinned, created_at")
          .eq("organization_id", context.organizationId)
          .eq("contact_id", args.contactId)
          .order("created_at", { ascending: false })
          .limit(args.limit)
      ]);

      if (activitiesResult.error || notesResult.error) {
        throw new AppError("Unable to load contact memory.", 500, "AI_CONTACT_MEMORY_LOAD_FAILED");
      }

      return {
        toolName: "get_contact_memory",
        summary: `Loaded contact memory from activities and notes.`,
        data: {
          activities: activitiesResult.data ?? [],
          notes: notesResult.data ?? []
        },
        references: [],
        basedOn: `${(activitiesResult.data ?? []).length} activities · ${(notesResult.data ?? []).length} notes`
      };
    }
  },
  search_leads: {
    description: "Search or filter leads by contact name, stage, score, or source.",
    schema: z.object({
      q: z.string().trim().optional(),
      stage: z.enum(["new", "contacted", "qualified", "active", "offer", "closed"]).optional(),
      minScore: z.number().int().min(0).max(100).optional(),
      hotOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let leads = await getCopilotLeads();

      if (args.q) {
        leads = leads.filter((lead) =>
          `${lead.contact.displayName} ${lead.contact.email ?? ""} ${lead.contact.phone ?? ""}`.toLowerCase().includes(args.q!.toLowerCase())
        );
      }

      if (args.stage) {
        leads = leads.filter((lead) => lead.stage === args.stage);
      }

      if (typeof args.minScore === "number") {
        leads = leads.filter((lead) => lead.score >= args.minScore!);
      }

      if (args.hotOnly) {
        leads = leads.filter((lead) => lead.score >= 75 || lead.stage === "qualified" || lead.stage === "active");
      }

      const items = leads.slice(0, args.limit);

      return {
        toolName: "search_leads",
        summary: `Found ${items.length} leads.`,
        data: {
          leads: items
        },
        references: items.map((lead) => buildLeadReference(lead)),
        basedOn: `${items.length} leads`
      };
    }
  },
  get_lead: {
    description: "Load a single lead with contact, tasks, activities, and AI artifacts.",
    schema: z.object({
      leadId: z.string().min(1)
    }),
    async execute(args) {
      const lead = (await getCopilotLeads()).find((item) => item.id === args.leadId);

      if (!lead) {
        throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
      }

      return {
        toolName: "get_lead",
        summary: `Loaded lead detail for ${lead.contact.displayName}.`,
        data: { lead },
        references: [buildLeadReference(lead)],
        basedOn: `${lead.activities.length} activities · ${lead.tasks.length} tasks`
      };
    }
  },
  search_properties: {
    description: "Search canonical properties by location, bedrooms, price, or market state.",
    schema: z.object({
      q: z.string().trim().optional(),
      locality: z.string().trim().optional(),
      maxPrice: z.number().positive().optional(),
      minBedrooms: z.number().int().positive().optional(),
      marketState: z.enum(["on_market", "off_market"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      const properties = await listSeededProperties({
        q: args.q,
        locality: args.locality,
        maxPrice: args.maxPrice,
        minBedrooms: args.minBedrooms,
        marketState: args.marketState
      });
      const items = properties.slice(0, args.limit);

      return {
        toolName: "search_properties",
        summary: `Found ${items.length} properties.`,
        data: { properties: items },
        references: items.map((property) => buildPropertyReference(property)),
        basedOn: `${items.length} properties`
      };
    }
  },
  get_property: {
    description: "Load a property with listing history and connected workflow records.",
    schema: z.object({
      propertyId: z.string().min(1)
    }),
    async execute(args) {
      const detail = await getSeededPropertyDetail(args.propertyId);

      if (!detail) {
        throw new AppError("Property not found.", 404, "PROPERTY_NOT_FOUND");
      }

      return {
        toolName: "get_property",
        summary: `Loaded property detail for ${detail.property.addressLine1}.`,
        data: detail,
        references: [buildPropertyReference(detail.property)],
        basedOn: `${detail.listings.length} listings · ${detail.showings.length} showings`
      };
    }
  },
  search_listings: {
    description: "Search listing records by status, listing type, property name, or price.",
    schema: z.object({
      q: z.string().trim().optional(),
      status: z.enum(["draft", "coming_soon", "active", "under_contract", "pending", "sold", "expired"]).optional(),
      listingType: z.enum(["sale", "rent"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let listings = await listSeededListings();

      if (args.q) {
        listings = listings.filter((listing) =>
          `${listing.property.addressLine1} ${listing.property.locality} ${listing.property.city}`.toLowerCase().includes(args.q!.toLowerCase())
        );
      }

      if (args.status) {
        listings = listings.filter((listing) => listing.status === args.status);
      }

      if (args.listingType) {
        listings = listings.filter((listing) => listing.listingType === args.listingType);
      }

      const items = listings.slice(0, args.limit);

      return {
        toolName: "search_listings",
        summary: `Found ${items.length} listings.`,
        data: { listings: items },
        references: items.map((listing) => buildListingReference(listing)),
        basedOn: `${items.length} listings`
      };
    }
  },
  get_listing: {
    description: "Load a listing with property, seller, showings, offers, and transaction.",
    schema: z.object({
      listingId: z.string().min(1)
    }),
    async execute(args) {
      const detail = await getSeededListingDetail(args.listingId);

      if (!detail) {
        throw new AppError("Listing not found.", 404, "LISTING_NOT_FOUND");
      }

      return {
        toolName: "get_listing",
        summary: `Loaded listing detail for ${detail.property?.addressLine1 ?? "listing"}.`,
        data: detail,
        references: detail.property ? [buildListingReference({ id: detail.listing.id, status: detail.listing.status, property: detail.property })] : [],
        basedOn: `${detail.showings.length} showings · ${detail.offers.length} offers`
      };
    }
  },
  search_showings: {
    description: "Search showings by contact, property, status, or time range.",
    schema: z.object({
      q: z.string().trim().optional(),
      timeframe: z.enum(["today", "tomorrow", "this_week"]).optional(),
      status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let showings = await listSeededShowings();

      if (args.q) {
        showings = showings.filter((showing) =>
          `${showing.property?.addressLine1 ?? ""} ${showing.contact?.displayName ?? ""}`.toLowerCase().includes(args.q!.toLowerCase())
        );
      }

      if (args.status) {
        showings = showings.filter((showing) => showing.status === args.status);
      }

      if (args.timeframe) {
        const range = getDateRange(args.timeframe);
        showings = showings.filter((showing) => showing.startsAt >= range.startIso && showing.startsAt <= range.endIso);
      }

      const items = showings.slice(0, args.limit);

      return {
        toolName: "search_showings",
        summary: `Found ${items.length} showings.`,
        data: { showings: items },
        references: items.map((showing) => buildShowingReference(showing)),
        basedOn: `${items.length} showings`
      };
    }
  },
  get_showing: {
    description: "Load showing details with property, listing, contact, and related offer/transaction.",
    schema: z.object({
      showingId: z.string().min(1)
    }),
    async execute(args) {
      const detail = await getSeededShowingDetail(args.showingId);

      if (!detail) {
        throw new AppError("Showing not found.", 404, "SHOWING_NOT_FOUND");
      }

      return {
        toolName: "get_showing",
        summary: `Loaded showing detail.`,
        data: detail,
        references: [buildShowingReference({ id: detail.showing.id, status: detail.showing.status, startsAt: detail.showing.startsAt, property: detail.property })],
        basedOn: detail.transaction ? "Connected transaction found" : "No connected transaction"
      };
    }
  },
  search_tasks: {
    description: "Search tasks by title, overdue state, status, or contact.",
    schema: z.object({
      q: z.string().trim().optional(),
      overdueOnly: z.boolean().default(false),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let tasks = await listTasks();
      const now = Date.now();

      if (args.q) {
        tasks = tasks.filter((task) => `${task.title} ${task.description ?? ""} ${task.contact?.display_name ?? ""}`.toLowerCase().includes(args.q!.toLowerCase()));
      }

      if (args.status) {
        tasks = tasks.filter((task) => task.status === args.status);
      }

      if (args.overdueOnly) {
        tasks = tasks.filter((task) => Boolean(task.dueAt && task.status !== "completed" && task.status !== "cancelled" && new Date(task.dueAt).getTime() < now));
      }

      const items = tasks.slice(0, args.limit);

      return {
        toolName: "search_tasks",
        summary: `Found ${items.length} tasks.`,
        data: { tasks: items },
        references: items.map((task) => buildTaskReference(task)),
        basedOn: `${items.length} tasks`
      };
    }
  },
  get_task: {
    description: "Load a single task.",
    schema: z.object({
      taskId: z.string().min(1)
    }),
    async execute(args) {
      const task = (await listTasks()).find((item) => item.id === args.taskId);

      if (!task) {
        throw new AppError("Task not found.", 404, "TASK_NOT_FOUND");
      }

      return {
        toolName: "get_task",
        summary: `Loaded task ${task.title}.`,
        data: { task },
        references: [buildTaskReference(task)],
        basedOn: task.contact ? `Linked to ${task.contact.display_name}` : "No linked contact"
      };
    }
  },
  search_offers: {
    description: "Search offer records from seeded deal data.",
    schema: z.object({
      q: z.string().trim().optional(),
      status: z.enum(["draft", "sent", "viewed", "countered", "accepted", "rejected"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      const transactions = await listSeededTransactions();
      let offers = transactions
        .map((transaction) => transaction.offer)
        .filter((offer): offer is NonNullable<typeof offer> => offer != null)
        .map((offer) => ({
          ...offer,
          property: transactions.find((transaction) => transaction.offer?.id === offer.id)?.property ?? null
        }));

      if (args.q) {
        offers = offers.filter((offer) => `${offer.property?.addressLine1 ?? ""} ${offer.status}`.toLowerCase().includes(args.q!.toLowerCase()));
      }

      if (args.status) {
        offers = offers.filter((offer) => offer.status === args.status);
      }

      const items = offers.slice(0, args.limit);

      return {
        toolName: "search_offers",
        summary: `Found ${items.length} offers.`,
        data: { offers: items },
        references: items.map((offer) => ({
          id: offer.id,
          entityType: "offer",
          label: offer.property?.addressLine1 ?? "Offer",
          href: "/transactions",
          meta: `${offer.status} · ${currency(offer.offerPrice)}`
        })),
        basedOn: `${items.length} offers`
      };
    }
  },
  get_offer: {
    description: "Load a single offer via related transaction detail.",
    schema: z.object({
      offerId: z.string().min(1)
    }),
    async execute(args) {
      const transactions = await listSeededTransactions();
      const transaction = transactions.find((item) => item.offer?.id === args.offerId);

      if (!transaction?.offer) {
        throw new AppError("Offer not found.", 404, "OFFER_NOT_FOUND");
      }

      return {
        toolName: "get_offer",
        summary: `Loaded offer detail.`,
        data: {
          offer: transaction.offer,
          property: transaction.property,
          buyer: transaction.buyer,
          seller: transaction.seller,
          transaction
        },
        references: transaction.property ? [buildTransactionReference(transaction)] : [],
        basedOn: transaction.property ? `Linked to ${transaction.property.addressLine1}` : "Offer detail"
      };
    }
  },
  search_transactions: {
    description: "Search transactions by property, stage, closing timeframe, or party names.",
    schema: z.object({
      q: z.string().trim().optional(),
      stage: z.string().trim().optional(),
      timeframe: z.enum(["today", "this_week", "closing_soon"]).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let transactions = await listSeededTransactions();

      if (args.q) {
        transactions = transactions.filter((transaction) =>
          `${transaction.property?.addressLine1 ?? ""} ${transaction.buyer?.displayName ?? ""} ${transaction.seller?.displayName ?? ""}`.toLowerCase().includes(args.q!.toLowerCase())
        );
      }

      if (args.stage) {
        transactions = transactions.filter((transaction) => transaction.stage === args.stage);
      }

      if (args.timeframe) {
        const range = getDateRange(args.timeframe);
        transactions = transactions.filter((transaction) => Boolean(transaction.closingDate && `${transaction.closingDate}T00:00:00.000Z` >= range.startIso && `${transaction.closingDate}T23:59:59.999Z` <= range.endIso));
      }

      const items = transactions.slice(0, args.limit);

      return {
        toolName: "search_transactions",
        summary: `Found ${items.length} transactions.`,
        data: { transactions: items },
        references: items.map((transaction) => buildTransactionReference(transaction)),
        basedOn: `${items.length} transactions`
      };
    }
  },
  get_transaction: {
    description: "Load a transaction with linked property, parties, offer, tasks, documents, and activities.",
    schema: z.object({
      transactionId: z.string().min(1)
    }),
    async execute(args) {
      const detail = await getSeededTransactionDetail(args.transactionId);

      if (!detail) {
        throw new AppError("Transaction not found.", 404, "TRANSACTION_NOT_FOUND");
      }

      return {
        toolName: "get_transaction",
        summary: `Loaded transaction detail.`,
        data: detail,
        references: [buildTransactionReference({ id: detail.transaction.id, stage: detail.transaction.stage, property: detail.property, closingDate: detail.transaction.closingDate })],
        basedOn: `${detail.tasks.length} tasks · ${detail.documents.length} documents`
      };
    }
  },
  search_documents: {
    description: "Search document metadata by name, category, status, or related record.",
    schema: z.object({
      q: z.string().trim().optional(),
      status: z.string().trim().optional(),
      transactionId: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(25).default(10)
    }),
    async execute(args) {
      let documents = await listSeededDocuments();

      if (args.q) {
        documents = documents.filter((document) => `${document.fileName} ${document.category}`.toLowerCase().includes(args.q!.toLowerCase()));
      }

      if (args.status) {
        documents = documents.filter((document) => document.status === args.status);
      }

      if (args.transactionId) {
        documents = documents.filter((document) => document.transactionId === args.transactionId);
      }

      const items = documents.slice(0, args.limit);

      return {
        toolName: "search_documents",
        summary: `Found ${items.length} documents.`,
        data: { documents: items },
        references: items.map((document) => buildDocumentReference(document)),
        basedOn: `${items.length} documents`
      };
    }
  },
  get_document_metadata: {
    description: "Load a document metadata record.",
    schema: z.object({
      documentId: z.string().min(1)
    }),
    async execute(args) {
      const document = (await listSeededDocuments()).find((item) => item.id === args.documentId);

      if (!document) {
        throw new AppError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
      }

      return {
        toolName: "get_document_metadata",
        summary: `Loaded document metadata for ${document.fileName}.`,
        data: { document },
        references: [buildDocumentReference(document)],
        basedOn: document.transaction ? "Linked to transaction" : "Standalone document"
      };
    }
  },
  get_activities: {
    description: "Load CRM activities by entity or contact.",
    schema: z.object({
      entityType: z.string().trim().optional(),
      entityId: z.string().min(1).optional(),
      contactId: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(20).default(10)
    }),
    async execute(args, context) {
      const supabase = await createSupabaseServerClient();
      let query = supabase
        .from("activities")
        .select("id, title, body, activity_type, occurred_at, entity_type, entity_id, contact_id")
        .eq("organization_id", context.organizationId)
        .order("occurred_at", { ascending: false })
        .limit(args.limit);

      if (args.entityType) {
        query = query.eq("entity_type", args.entityType);
      }

      if (args.entityId) {
        query = query.eq("entity_id", args.entityId);
      }

      if (args.contactId) {
        query = query.eq("contact_id", args.contactId);
      }

      const { data, error } = await query;

      if (error) {
        throw new AppError("Unable to load activities.", 500, "AI_ACTIVITIES_LOAD_FAILED");
      }

      return {
        toolName: "get_activities",
        summary: `Loaded ${(data ?? []).length} activities.`,
        data: { activities: data ?? [] },
        references: [],
        basedOn: `${(data ?? []).length} activities`
      };
    }
  },
  get_notes: {
    description: "Load notes by entity relationship.",
    schema: z.object({
      contactId: z.string().min(1).optional(),
      propertyId: z.string().min(1).optional(),
      listingId: z.string().min(1).optional(),
      showingId: z.string().min(1).optional(),
      offerId: z.string().min(1).optional(),
      transactionId: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(20).default(10)
    }),
    async execute(args, context) {
      const supabase = await createSupabaseServerClient();
      let query = supabase.from("notes").select("id, body, pinned, created_at").eq("organization_id", context.organizationId).order("created_at", { ascending: false }).limit(args.limit);

      if (args.contactId) query = query.eq("contact_id", args.contactId);
      if (args.propertyId) query = query.eq("property_id", args.propertyId);
      if (args.listingId) query = query.eq("listing_id", args.listingId);
      if (args.showingId) query = query.eq("showing_id", args.showingId);
      if (args.offerId) query = query.eq("offer_id", args.offerId);
      if (args.transactionId) query = query.eq("transaction_id", args.transactionId);

      const { data, error } = await query;

      if (error) {
        throw new AppError("Unable to load notes.", 500, "AI_NOTES_LOAD_FAILED");
      }

      return {
        toolName: "get_notes",
        summary: `Loaded ${(data ?? []).length} notes.`,
        data: { notes: data ?? [] },
        references: [],
        basedOn: `${(data ?? []).length} notes`
      };
    }
  },
  get_commission_summary: {
    description: "Load commission totals and closing-soon summary.",
    schema: z.object({}),
    async execute() {
      const dashboard = await getDashboardSummary();
      const finance = await getSeededFinanceSummary();

      return {
        toolName: "get_commission_summary",
        summary: `Expected commission is ${currency(dashboard.business.expectedCommission)}.`,
        data: {
          expectedCommission: dashboard.business.expectedCommission,
          seededAverageCommission: finance.averageCommission,
          transactionCount: finance.transactionCount,
          closingsSoon: finance.closingsSoon
        },
        references: [],
        basedOn: `${finance.transactionCount} transactions`
      };
    }
  },
  get_expense_summary: {
    description: "Load expense totals from the authenticated organization.",
    schema: z.object({}),
    async execute(_args, context) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.from("expenses").select("amount, category, occurred_on").eq("organization_id", context.organizationId);

      if (error) {
        throw new AppError("Unable to load expenses.", 500, "AI_EXPENSES_LOAD_FAILED");
      }

      const totalAmount = (data ?? []).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

      return {
        toolName: "get_expense_summary",
        summary: `Total tracked expenses are ${currency(totalAmount)}.`,
        data: {
          totalAmount,
          expenseCount: (data ?? []).length,
          expenses: data ?? []
        },
        references: [],
        basedOn: `${(data ?? []).length} expenses`
      };
    }
  },
  get_dashboard_summary: {
    description: "Load today's operating summary and business totals.",
    schema: z.object({}),
    async execute() {
      const summary = await getDashboardSummary();

      return {
        toolName: "get_dashboard_summary",
        summary: `Loaded dashboard summary for ${summary.organization.name}.`,
        data: summary,
        references: [],
        basedOn: `${summary.business.activeTransactions} active transactions · ${summary.business.newLeads} new leads`
      };
    }
  },
  propose_create_task: {
    description: "Prepare a task creation action for user confirmation.",
    schema: z.object({
      title: z.string().trim().min(3),
      dueAt: isoDateTimeSchema.optional().nullable(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      description: z.string().trim().optional(),
      contactId: z.string().min(1).optional().nullable(),
      relatedEntityType: z.enum(["lead", "contact", "task", "transaction"]).default("task"),
      relatedEntityId: z.string().min(1).optional().nullable()
    }),
    async execute(args) {
      return {
        toolName: "propose_create_task",
        summary: `Prepared task action ${args.title}.`,
        data: {
          actionType: "create_task",
          payload: args
        },
        references: [],
        basedOn: "Task action prepared"
      };
    }
  },
  propose_add_note: {
    description: "Prepare a note/activity action for contact or lead confirmation.",
    schema: z.object({
      targetType: z.enum(["contact", "lead"]),
      targetId: z.string().min(1),
      title: z.string().trim().min(2),
      body: z.string().trim().min(3),
      activityType: z.enum(["note", "call", "email", "message"]).default("note")
    }),
    async execute(args) {
      return {
        toolName: "propose_add_note",
        summary: `Prepared ${args.targetType} note action.`,
        data: {
          actionType: "add_note",
          payload: args
        },
        references: [],
        basedOn: "Note action prepared"
      };
    }
  },
  propose_update_lead_status: {
    description: "Prepare a lead status update for confirmation.",
    schema: z.object({
      leadId: z.string().min(1),
      stage: z.enum(["new", "contacted", "qualified", "active", "offer", "closed"]),
      disposition: z.enum(["open", "nurture", "cold", "lost", "converted"]),
      score: z.number().int().min(0).max(100),
      nextFollowUpAt: isoDateTimeSchema.optional().nullable(),
      notes: z.string().trim().optional().nullable()
    }),
    async execute(args) {
      return {
        toolName: "propose_update_lead_status",
        summary: `Prepared lead status update.`,
        data: {
          actionType: "update_lead_status",
          payload: args
        },
        references: [],
        basedOn: "Lead update prepared"
      };
    }
  },
  propose_update_task_status: {
    description: "Prepare a task status update for confirmation.",
    schema: z.object({
      taskId: z.string().min(1),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      notes: z.string().trim().optional().nullable()
    }),
    async execute(args) {
      return {
        toolName: "propose_update_task_status",
        summary: `Prepared task status update.`,
        data: {
          actionType: "update_task_status",
          payload: args
        },
        references: [],
        basedOn: "Task update prepared"
      };
    }
  }
} satisfies Record<string, ToolDefinition<z.ZodTypeAny>>;

export type CopilotToolName = keyof typeof toolDefinitions;

export function listCopilotTools() {
  return Object.entries(toolDefinitions).map(([name, tool]) => ({
    name,
    description: tool.description
  }));
}

export async function executeCopilotTool(name: string, rawArgs: unknown): Promise<ToolResult> {
  const tool = toolDefinitions[name as CopilotToolName];

  if (!tool) {
    throw new AppError(`Unknown AI tool: ${name}`, 400, "AI_TOOL_UNKNOWN");
  }

  const parsedArgs = tool.schema.parse(rawArgs ?? {});
  const context = await getOrganizationContext();
  return tool.execute(parsedArgs, context);
}

export async function executeCopilotAction(actionType: string, payload: Record<string, unknown>) {
  if (actionType === "create_task") {
    const parsed = toolDefinitions.propose_create_task.schema.parse(payload);
    const taskId = await createTask({
      title: parsed.title,
      dueAt: parsed.dueAt ?? null,
      priority: parsed.priority,
      description: parsed.description,
      contactId: parsed.contactId ?? null,
      relatedEntityType: parsed.relatedEntityType,
      relatedEntityId: parsed.relatedEntityId ?? null
    });

    return {
      message: `Task created: ${parsed.title}.`,
      references: [buildTaskReference({ id: taskId, title: parsed.title, status: "pending", dueAt: parsed.dueAt ?? null })]
    };
  }

  if (actionType === "add_note") {
    const parsed = toolDefinitions.propose_add_note.schema.parse(payload);

    if (parsed.targetType === "contact") {
      await createContactActivity({
        contactId: parsed.targetId,
        title: parsed.title,
        body: parsed.body,
        activityType: parsed.activityType
      });

      return {
        message: `Added note to contact.`,
        references: []
      };
    }

    const lead = (await getCopilotLeads()).find((item) => item.id === parsed.targetId);
    if (!lead) {
      throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
    }

    const { createLeadActivity } = await import("@/server/modules/leads/leads.service");
    await createLeadActivity({
      leadId: parsed.targetId,
      body: parsed.body,
      activityType: parsed.activityType
    });

    return {
      message: `Added note to ${lead.contact.displayName}.`,
      references: [buildLeadReference(lead)]
    };
  }

  if (actionType === "update_lead_status") {
    const parsed = toolDefinitions.propose_update_lead_status.schema.parse(payload);
    await updateLead(parsed.leadId, {
      stage: parsed.stage,
      disposition: parsed.disposition,
      score: parsed.score,
      nextFollowUpAt: parsed.nextFollowUpAt ?? null,
      notes: parsed.notes ?? null
    });

    const lead = (await getCopilotLeads()).find((item) => item.id === parsed.leadId);

    return {
      message: `Lead updated to ${parsed.stage}.`,
      references: lead ? [buildLeadReference(lead)] : []
    };
  }

  if (actionType === "update_task_status") {
    const parsed = toolDefinitions.propose_update_task_status.schema.parse(payload);
    await updateTaskStatus(parsed.taskId, {
      status: parsed.status,
      notes: parsed.notes ?? null
    });

    const task = (await listTasks()).find((item) => item.id === parsed.taskId);

    return {
      message: `Task marked ${parsed.status.replace(/_/g, " ")}.`,
      references: task ? [buildTaskReference(task)] : []
    };
  }

  throw new AppError(`Unsupported AI action: ${actionType}`, 400, "AI_ACTION_UNSUPPORTED");
}

export function derivePropertySearchArgsFromQuestion(question: string) {
  return {
    q: undefined,
    locality: parseLocalityText(question) ?? undefined,
    maxPrice: parseBudgetText(question) ?? undefined,
    minBedrooms: parseBedroomsText(question) ?? undefined,
    marketState: /active|available|on market/i.test(question) ? ("on_market" as const) : undefined,
    limit: 10
  };
}
