type ContactType = "lead" | "buyer" | "seller" | "vendor" | "partner" | "tenant" | "landlord";
type LeadStage = "new" | "contacted" | "qualified" | "active" | "offer" | "closed";
type LeadDisposition = "open" | "nurture" | "cold" | "lost" | "converted";
type ListingStatus = "draft" | "coming_soon" | "active" | "under_contract" | "pending" | "sold" | "expired";
type ShowingStatus = "scheduled" | "completed" | "cancelled";
type TransactionStage = "offer_accepted" | "under_contract" | "inspection" | "appraisal" | "financing" | "finalization" | "closing" | "closed";
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

export type DevContact = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  city: string;
  state: string;
  country: string;
  contactTypes: ContactType[];
  leadSource: string | null;
  budget: number | null;
  locationRequirements: string | null;
  timeline: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DevLead = {
  id: string;
  contactId: string;
  stage: LeadStage;
  disposition: LeadDisposition;
  score: number;
  source: string | null;
  notes: string | null;
  requirements: string[];
  nextFollowUpAt: string | null;
  createdAt: string;
};

export type DevProperty = {
  id: string;
  title: string;
  addressLine1: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  parkingSpaces: number;
  furnishing: string;
  amenities: string[];
  description: string;
  status: string;
  listingStatus: ListingStatus | "unlisted";
  image: string;
  createdAt: string;
};

export type DevListing = {
  id: string;
  propertyId: string;
  sellerContactId: string;
  status: ListingStatus;
  listingType: "sale" | "rent";
  listPrice: number;
  daysOnMarket: number;
  publishedAt: string | null;
  expiresAt: string | null;
  description: string;
};

export type DevShowing = {
  id: string;
  propertyId: string;
  listingId: string | null;
  contactId: string;
  agentName: string;
  status: ShowingStatus;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  feedback: string | null;
  clientReaction: string | null;
};

export type DevOffer = {
  id: string;
  propertyId: string;
  listingId: string;
  buyerContactId: string;
  sellerContactId: string;
  status: "draft" | "sent" | "viewed" | "countered" | "accepted" | "rejected";
  offerPrice: number;
  closingDate: string | null;
  createdAt: string;
};

export type DevTransaction = {
  id: string;
  propertyId: string;
  listingId: string;
  offerId: string | null;
  buyerContactId: string;
  sellerContactId: string;
  stage: TransactionStage;
  salePrice: number;
  closingDate: string | null;
  commission: number;
  riskLevel: "normal" | "watch" | "high";
  summary: string;
  createdAt: string;
};

export type DevTransactionTask = {
  id: string;
  transactionId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
};

export type DevDocument = {
  id: string;
  transactionId: string | null;
  propertyId: string | null;
  contactId: string | null;
  fileName: string;
  category: string;
  status: string;
  createdAt: string;
};

export type DevTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueAt: string | null;
  status: TaskStatus;
  contactId: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
};

export type DevActivity = {
  id: string;
  entityType: string;
  entityId: string;
  contactId: string | null;
  title: string;
  body: string;
  activityType: string;
  occurredAt: string;
};

export type DevDataset = {
  contacts: DevContact[];
  leads: DevLead[];
  properties: DevProperty[];
  listings: DevListing[];
  showings: DevShowing[];
  offers: DevOffer[];
  transactions: DevTransaction[];
  transactionTasks: DevTransactionTask[];
  documents: DevDocument[];
  tasks: DevTask[];
  activities: DevActivity[];
};

function id(prefix: string, index: number) {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function isoFrom(baseDayOffset: number, hour: number, minute = 0) {
  const now = new Date();
  const value = new Date(now);
  value.setDate(now.getDate() + baseDayOffset);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

const neighborhoods = [
  { city: "Bengaluru", state: "Karnataka", locality: "HSR Layout" },
  { city: "Bengaluru", state: "Karnataka", locality: "Koramangala" },
  { city: "Bengaluru", state: "Karnataka", locality: "Indiranagar" },
  { city: "Bengaluru", state: "Karnataka", locality: "Whitefield" },
  { city: "Bengaluru", state: "Karnataka", locality: "Jayanagar" },
  { city: "Bengaluru", state: "Karnataka", locality: "Sarjapur Road" },
  { city: "Bengaluru", state: "Karnataka", locality: "Bellandur" },
  { city: "Bengaluru", state: "Karnataka", locality: "Hebbal" }
] as const;

const propertyTemplates = [
  {
    title: "Green Avenue",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 1850,
    parkingSpaces: 2,
    furnishing: "Semi-furnished",
    amenities: ["Clubhouse", "Gym", "Power backup", "Children's play area"],
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
    description: "Bright family apartment with open living spaces, balcony views, and quick access to schools and tech parks."
  },
  {
    title: "Palm Residences",
    propertyType: "villa",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 2840,
    parkingSpaces: 2,
    furnishing: "Fully furnished",
    amenities: ["Private garden", "Home office", "Backup power", "Security"],
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80",
    description: "Premium villa suited to executive buyers looking for turnkey luxury in an established gated community."
  },
  {
    title: "Orchid Heights",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1240,
    parkingSpaces: 1,
    furnishing: "Move-in ready",
    amenities: ["Pool", "Gym", "Visitor parking", "24/7 maintenance"],
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    description: "Well-maintained mid-rise apartment popular with first-time buyers and investors seeking rental demand."
  },
  {
    title: "Maple Court",
    propertyType: "duplex",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2120,
    parkingSpaces: 2,
    furnishing: "Semi-furnished",
    amenities: ["Terrace", "Storage room", "Security", "Community hall"],
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description: "Spacious duplex for growing families, with multi-level living and strong connectivity to schools and retail."
  },
  {
    title: "Cedar Park",
    propertyType: "row house",
    bedrooms: 4,
    bathrooms: 3,
    areaSqft: 2360,
    parkingSpaces: 2,
    furnishing: "Unfurnished",
    amenities: ["Corner lot", "Garden", "Community pool", "Jogging track"],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
    description: "High-demand corner home with excellent natural light and strong appeal for upsizing owner-occupiers."
  }
] as const;

const contactBlueprints = [
  ["Sarah Khan", ["lead", "buyer"], 9800000, "3BHK in HSR or Koramangala with clubhouse", "30-45 days", "Referral"],
  ["Rahul Mehta", ["lead", "buyer"], 12400000, "Ready-to-move 3BHK near Sarjapur Road", "This month", "Portal"],
  ["Ananya Shah", ["buyer"], 18500000, "4BHK villa with home office in Whitefield", "60 days", "Past client referral"],
  ["Maya Rao", ["seller"], null, "Sell existing 3BHK and upgrade in Jayanagar", "90 days", "Walk-in"],
  ["Imran Khan", ["lead", "investor" as ContactType], 11000000, "High-rental-yield apartment in Bellandur", "45 days", "Portal"],
  ["Priya Nair", ["buyer"], 8700000, "2BHK apartment with metro access", "Immediate", "Instagram"],
  ["Kabir Sethi", ["seller"], null, "List family duplex in Indiranagar", "This month", "Referral"],
  ["Neha Sethi", ["seller"], null, "Co-owner for Indiranagar duplex sale", "This month", "Referral"],
  ["Rohan Arora", ["buyer"], 14500000, "4BHK row house with parking", "30 days", "Referral"],
  ["Aditi Verma", ["buyer"], 9600000, "3BHK near schools in HSR", "30 days", "Portal"],
  ["Mehul Jain", ["seller"], null, "Launch apartment in Koramangala", "2 weeks", "Past client"],
  ["Sonal Desai", ["lead", "buyer"], 7600000, "2BHK under 80L in Whitefield", "60 days", "Portal"],
  ["Arjun Shah", ["lead", "buyer"], 10200000, "3BHK with study near Indiranagar", "45 days", "Referral"],
  ["Devika Iyer", ["buyer"], 15500000, "Large family home in Jayanagar", "90 days", "Network"],
  ["Karan Bedi", ["seller"], null, "Need fast sale on rental apartment in Bellandur", "Immediate", "Broker network"],
  ["Nikhil Arora", ["lead", "buyer"], 9900000, "3BHK around 1Cr in HSR", "This month", "Portal"],
  ["Farah Ali", ["buyer"], 13100000, "Gated villa with office space", "60 days", "Referral"],
  ["Ashwin Rao", ["seller"], null, "Exit investor-owned apartment in Whitefield", "45 days", "Network"],
  ["Pooja Menon", ["buyer"], 8800000, "Move-in-ready 2BHK in Koramangala", "30 days", "Walk-in"],
  ["Vikram Patel", ["seller"], null, "List premium villa in HSR micro-market", "30 days", "Past client referral"]
] as const;

type ContactBlueprint = [
  string,
  ContactType[],
  number | null,
  string,
  string,
  string
];

const normalizedContactBlueprints: ContactBlueprint[] = contactBlueprints.map((blueprint) => [
  blueprint[0],
  [...blueprint[1]],
  blueprint[2],
  blueprint[3],
  blueprint[4],
  blueprint[5]
]);

function buildContacts() {
  return normalizedContactBlueprints.map((blueprint, index) => {
    const [displayName, contactTypes, budget, locationRequirements, timeline, leadSource] = blueprint;
    const neighborhood = neighborhoods[index % neighborhoods.length];
    const baseDate = isoFrom(-(index % 12) - 1, 10 + (index % 5), 15);
    const followUpDate = isoFrom((index % 6) - 2, 11 + (index % 4), 0);

    return {
      id: id("contact", index),
      displayName,
      email: `${displayName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/, "")}@example.com`,
      phone: `+91 98${String(10000000 + index * 7123).slice(-8)}`,
      city: neighborhood.city,
      state: neighborhood.state,
      country: "India",
      contactTypes: [...contactTypes],
      leadSource,
      budget,
      locationRequirements,
      timeline,
      lastContactedAt: index % 5 === 0 ? null : baseDate,
      nextFollowUpAt: index % 4 === 0 ? null : followUpDate,
      createdAt: isoFrom(-(index + 20), 9, 30),
      updatedAt: isoFrom(-(index % 7), 18, 0)
    } satisfies DevContact;
  });
}

function buildLeads(contacts: DevContact[]) {
  const buyerContacts = contacts.filter((contact) => contact.contactTypes.includes("lead") || contact.contactTypes.includes("buyer"));

  return buyerContacts.slice(0, 12).map((contact, index) => ({
    id: id("lead", index),
    contactId: contact.id,
    stage: (["new", "contacted", "qualified", "active", "offer", "qualified"] as const)[index % 6],
    disposition: (["open", "open", "open", "converted", "open", "nurture"] as const)[index % 6],
    score: 58 + (index % 5) * 9,
    source: contact.leadSource,
    notes: `${contact.displayName} is focused on ${contact.locationRequirements?.toLowerCase() ?? "a target area"}.`,
    requirements: [contact.locationRequirements ?? "Location flexibility", contact.timeline ?? "Timeline unknown"],
    nextFollowUpAt: index % 3 === 0 ? isoFrom(0, 16, 0) : contact.nextFollowUpAt,
    createdAt: isoFrom(-(index + 5), 12, 30)
  } satisfies DevLead));
}

function buildProperties() {
  const properties: DevProperty[] = [];

  for (let index = 0; index < 40; index += 1) {
    const template = propertyTemplates[index % propertyTemplates.length];
    const neighborhood = neighborhoods[index % neighborhoods.length];
    const number = 12 + index;
    const premiumFactor = index % 4;
    const price = template.propertyType === "villa"
      ? 18500000 + premiumFactor * 2200000 + index * 90000
      : template.propertyType === "apartment"
        ? 7600000 + premiumFactor * 1350000 + index * 65000
        : 11800000 + premiumFactor * 1750000 + index * 70000;

    properties.push({
      id: id("property", index),
      title: `${number} ${template.title}`,
      addressLine1: `${number} ${template.title}`,
      locality: neighborhood.locality,
      city: neighborhood.city,
      state: neighborhood.state,
      country: "India",
      propertyType: template.propertyType,
      price,
      bedrooms: template.bedrooms,
      bathrooms: template.bathrooms,
      areaSqft: template.areaSqft + premiumFactor * 65,
      parkingSpaces: template.parkingSpaces,
      furnishing: template.furnishing,
      amenities: [...template.amenities],
      description: `${template.description} Located in ${neighborhood.locality} with strong demand from active buyers.`,
      status: index % 7 === 0 ? "Needs media" : index % 6 === 0 ? "Pre-market" : "Ready",
      listingStatus: index % 5 === 0 ? "unlisted" : (["draft", "coming_soon", "active", "active", "pending", "under_contract", "sold", "expired"] as const)[index % 8],
      image: template.image,
      createdAt: isoFrom(-(index + 18), 10, 0)
    });
  }

  return properties;
}

function buildListings(properties: DevProperty[], contacts: DevContact[]) {
  const sellerContacts = contacts.filter((contact) => contact.contactTypes.includes("seller"));
  const historicalStatuses = ["sold", "expired"] as const;

  const listings = properties
    .filter((property) => property.listingStatus !== "unlisted")
    .slice(0, 28)
    .flatMap((property, index) => {
      const seller = sellerContacts[index % sellerContacts.length];
      const status = property.listingStatus === "unlisted" ? "draft" : property.listingStatus;
      const primaryListing = {
        id: id("listing", index),
        propertyId: property.id,
        sellerContactId: seller.id,
        status,
        listingType: "sale",
        listPrice: property.price,
        daysOnMarket: 4 + (index % 24),
        publishedAt: status === "draft" ? null : isoFrom(-(index % 20) - 2, 9, 0),
        expiresAt: isoFrom(45 + (index % 20), 18, 0),
        description: `Marketed ${property.propertyType} in ${property.locality} with strong family and investor demand.`
      } satisfies DevListing;

      if (index % 7 !== 0) {
        return [primaryListing];
      }

      const historicalStatus = historicalStatuses[index % historicalStatuses.length];
      const historicalListing = {
        id: `listing-history-${index + 1}`,
        propertyId: property.id,
        sellerContactId: seller.id,
        status: historicalStatus,
        listingType: "sale",
        listPrice: Math.round(property.price * (1.03 + (index % 3) * 0.01)),
        daysOnMarket: 22 + (index % 18),
        publishedAt: isoFrom(-(index % 20) - 70, 9, 0),
        expiresAt: isoFrom(-(index % 20) - 35, 18, 0),
        description: `Previous marketing cycle for ${property.title} before the current listing strategy.`
      } satisfies DevListing;

      return [primaryListing, historicalListing];
    });

  return listings;
}

function buildShowings(properties: DevProperty[], listings: DevListing[], contacts: DevContact[]) {
  const buyerContacts = contacts.filter((contact) => contact.contactTypes.includes("buyer") || contact.contactTypes.includes("lead"));
  const showings: DevShowing[] = [];

  for (let index = 0; index < 24; index += 1) {
    const listing = listings[index % listings.length];
    const property = properties.find((item) => item.id === listing.propertyId)!;
    const contact = buyerContacts[index % buyerContacts.length];
    const dayOffset = index < 6 ? 0 : index < 14 ? (index % 4) + 1 : -((index % 5) + 1);
    const status: ShowingStatus = dayOffset < 0 ? (index % 6 === 0 ? "cancelled" : "completed") : "scheduled";
    const startsAt = isoFrom(dayOffset, 10 + (index % 6), index % 2 === 0 ? 0 : 30);
    const endAt = new Date(startsAt);
    endAt.setMinutes(endAt.getMinutes() + 45);

    showings.push({
      id: id("showing", index),
      propertyId: property.id,
      listingId: listing.id,
      contactId: contact.id,
      agentName: index % 2 === 0 ? "Alex" : "Priya",
      status,
      startsAt,
      endsAt: endAt.toISOString(),
      notes: status === "scheduled" ? `Preview requested for ${contact.displayName}.` : `Tour completed for ${contact.displayName}.`,
      feedback: status === "completed" ? (index % 3 === 0 ? "Interested in making an offer after family review." : "Liked the layout but is comparing commute times.") : null,
      clientReaction: status === "completed" ? (index % 4 === 0 ? "positive" : "mixed") : null
    });
  }

  return showings;
}

function buildOffers(listings: DevListing[], showings: DevShowing[]) {
  const eligibleShowings = showings.filter((showing) => showing.status === "completed").slice(0, 10);

  return eligibleShowings.map((showing, index) => {
    const listing = listings.find((item) => item.id === showing.listingId)!;

    return {
      id: id("offer", index),
      propertyId: showing.propertyId,
      listingId: listing.id,
      buyerContactId: showing.contactId,
      sellerContactId: listing.sellerContactId,
      status: (["sent", "viewed", "countered", "accepted", "sent"] as const)[index % 5],
      offerPrice: Math.round(listing.listPrice * (0.96 + (index % 4) * 0.01)),
      closingDate: isoFrom(22 + index, 12, 0).slice(0, 10),
      createdAt: isoFrom(-(index + 3), 17, 0)
    } satisfies DevOffer;
  });
}

function buildTransactions(offers: DevOffer[]) {
  return offers.slice(0, 12).map((offer, index) => ({
    id: id("transaction", index),
    propertyId: offer.propertyId,
    listingId: offer.listingId,
    offerId: offer.id,
    buyerContactId: offer.buyerContactId,
    sellerContactId: offer.sellerContactId,
    stage: (["under_contract", "inspection", "appraisal", "financing", "closing", "finalization", "inspection", "closed"] as const)[index % 8],
    salePrice: offer.offerPrice,
    closingDate: isoFrom(7 + index * 2, 12, 0).slice(0, 10),
    commission: Math.round(offer.offerPrice * 0.018),
    riskLevel: (["normal", "watch", "normal", "high"] as const)[index % 4],
    summary:
      index % 4 === 0
        ? "Buyer financing is progressing, with final lender conditions due this week."
        : index % 4 === 1
          ? "Inspection follow-up is pending seller approval on repair items."
          : index % 4 === 2
            ? "Appraisal and document milestones are on track for target closing."
            : "Closing timeline is tight due to missing disclosures and lender turn time.",
    createdAt: isoFrom(-(index + 9), 14, 0)
  } satisfies DevTransaction));
}

function buildTransactionTasks(transactions: DevTransaction[]) {
  return transactions.flatMap((transaction, index) => {
    const templates = [
      ["Collect updated KYC documents", "Buyer paperwork must be complete before lender sign-off.", 2, "pending"],
      ["Confirm inspection resolution", "Seller response on requested repairs is still outstanding.", 1, index % 3 === 0 ? "in_progress" : "pending"],
      ["Schedule closing packet review", "Prepare final walkthrough, settlement statement, and signatures.", 6, index % 5 === 0 ? "completed" : "pending"]
    ] as const;

    return templates.map((template, taskIndex) => ({
      id: `${transaction.id}-task-${taskIndex + 1}`,
      transactionId: transaction.id,
      title: template[0],
      description: template[1],
      dueAt: isoFrom(taskIndex + index - 1, 15, 0),
      status: template[3],
    } satisfies DevTransactionTask));
  });
}

function buildDocuments(transactions: DevTransaction[], properties: DevProperty[], contacts: DevContact[]) {
  const docs: DevDocument[] = [];

  transactions.forEach((transaction, index) => {
    docs.push({
      id: `${transaction.id}-doc-1`,
      transactionId: transaction.id,
      propertyId: transaction.propertyId,
      contactId: transaction.buyerContactId,
      fileName: `Purchase Agreement ${index + 1}.pdf`,
      category: "contract",
      status: index % 4 === 0 ? "pending_signature" : "active",
      createdAt: isoFrom(-(index + 4), 11, 0)
    });
    docs.push({
      id: `${transaction.id}-doc-2`,
      transactionId: transaction.id,
      propertyId: transaction.propertyId,
      contactId: transaction.sellerContactId,
      fileName: `Disclosure Packet ${index + 1}.pdf`,
      category: "disclosure",
      status: "active",
      createdAt: isoFrom(-(index + 3), 16, 0)
    });
  });

  properties.slice(0, 6).forEach((property, index) => {
    docs.push({
      id: `property-doc-${index + 1}`,
      transactionId: null,
      propertyId: property.id,
      contactId: contacts[index % contacts.length]?.id ?? null,
      fileName: `${property.title} Marketing Pack.pdf`,
      category: "marketing",
      status: "active",
      createdAt: isoFrom(-(index + 2), 13, 0)
    });
  });

  return docs;
}

function buildTasks(leads: DevLead[], contacts: DevContact[], transactions: DevTransaction[]) {
  const tasks: DevTask[] = [];

  leads.slice(0, 10).forEach((lead, index) => {
    const contact = contacts.find((item) => item.id === lead.contactId)!;
    tasks.push({
      id: id("task", index),
      title: `Follow up with ${contact.displayName}`,
      description: `Advance ${contact.displayName}'s ${lead.stage} lead and confirm requirements.`,
      priority: (["high", "medium", "urgent", "medium"] as const)[index % 4],
      dueAt: isoFrom((index % 4) - 1, 10 + (index % 5), 0),
      status: (["pending", "in_progress", "pending", "completed"] as const)[index % 4],
      contactId: contact.id,
      relatedEntityType: "lead",
      relatedEntityId: lead.id,
      createdAt: isoFrom(-(index + 3), 9, 15)
    });
  });

  transactions.slice(0, 8).forEach((transaction, index) => {
    tasks.push({
      id: id("task", 10 + index),
      title: `Review ${transaction.stage.replace(/_/g, " ")} checklist`,
      description: `Move transaction milestones forward for ${transaction.id}.`,
      priority: transaction.riskLevel === "high" ? "urgent" : transaction.riskLevel === "watch" ? "high" : "medium",
      dueAt: isoFrom(index - 2, 14, 0),
      status: index % 5 === 0 ? "completed" : "pending",
      contactId: transaction.buyerContactId,
      relatedEntityType: "transaction",
      relatedEntityId: transaction.id,
      createdAt: isoFrom(-(index + 2), 12, 0)
    });
  });

  return tasks;
}

function buildActivities(leads: DevLead[], contacts: DevContact[], properties: DevProperty[], transactions: DevTransaction[]) {
  const activities: DevActivity[] = [];

  leads.slice(0, 8).forEach((lead, index) => {
    const contact = contacts.find((item) => item.id === lead.contactId)!;
    activities.push({
      id: `lead-activity-${index + 1}`,
      entityType: "lead",
      entityId: lead.id,
      contactId: contact.id,
      title: "Discovery call completed",
      body: `${contact.displayName} confirmed ${contact.locationRequirements?.toLowerCase() ?? "purchase criteria"} and asked for shortlist options.`,
      activityType: "call",
      occurredAt: isoFrom(-(index + 1), 16, 30)
    });
  });

  contacts.slice(0, 8).forEach((contact, index) => {
    activities.push({
      id: `contact-activity-${index + 1}`,
      entityType: "contact",
      entityId: contact.id,
      contactId: contact.id,
      title: "Follow-up note",
      body: `${contact.displayName} is responsive and available for follow-up this week.`,
      activityType: "note",
      occurredAt: isoFrom(-(index + 2), 11, 15)
    });
  });

  properties.slice(0, 6).forEach((property, index) => {
    activities.push({
      id: `property-activity-${index + 1}`,
      entityType: "property",
      entityId: property.id,
      contactId: null,
      title: "Property readiness updated",
      body: `${property.title} media and pricing notes were refreshed for active marketing.`,
      activityType: "property",
      occurredAt: isoFrom(-(index + 1), 13, 45)
    });
  });

  transactions.slice(0, 8).forEach((transaction, index) => {
    activities.push({
      id: `transaction-activity-${index + 1}`,
      entityType: "transaction",
      entityId: transaction.id,
      contactId: transaction.buyerContactId,
      title: "Transaction update",
      body: transaction.summary,
      activityType: "transaction",
      occurredAt: isoFrom(-(index + 1), 15, 0)
    });
  });

  return activities;
}

function buildDataset(): DevDataset {
  const contacts = buildContacts();
  const leads = buildLeads(contacts);
  const properties = buildProperties();
  const listings = buildListings(properties, contacts);
  const showings = buildShowings(properties, listings, contacts);
  const offers = buildOffers(listings, showings);
  const transactions = buildTransactions(offers);
  const transactionTasks = buildTransactionTasks(transactions);
  const documents = buildDocuments(transactions, properties, contacts);
  const tasks = buildTasks(leads, contacts, transactions);
  const activities = buildActivities(leads, contacts, properties, transactions);

  return {
    contacts,
    leads,
    properties,
    listings,
    showings,
    offers,
    transactions,
    transactionTasks,
    documents,
    tasks,
    activities
  };
}

let cachedDataset: DevDataset | null = null;

export function getRealEstateDevData() {
  if (!cachedDataset) {
    cachedDataset = buildDataset();
  }

  return cachedDataset;
}

export function resetRealEstateDevData() {
  cachedDataset = buildDataset();
  return cachedDataset;
}
