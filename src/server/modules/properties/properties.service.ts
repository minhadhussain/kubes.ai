import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

type PropertyListFilters = {
  q?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  listingStatus?: string;
  maxPrice?: number;
  minBedrooms?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc";
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export async function listSeededProperties(filters: PropertyListFilters = {}) {
  const dataset = getRealEstateDevData();
  const showingsByProperty = new Map<string, number>();
  const offersByProperty = new Map<string, number>();
  const transactionByProperty = new Map(dataset.transactions.map((transaction) => [transaction.propertyId, transaction]));

  for (const showing of dataset.showings) {
    showingsByProperty.set(showing.propertyId, (showingsByProperty.get(showing.propertyId) ?? 0) + 1);
  }

  for (const offer of dataset.offers) {
    offersByProperty.set(offer.propertyId, (offersByProperty.get(offer.propertyId) ?? 0) + 1);
  }

  let properties = dataset.properties.map((property) => {
    const listing = dataset.listings.find((item) => item.propertyId === property.id) ?? null;

    return {
      ...property,
      displayPrice: formatCurrency(property.price),
      showingCount: showingsByProperty.get(property.id) ?? 0,
      offerCount: offersByProperty.get(property.id) ?? 0,
      listing,
      transaction: transactionByProperty.get(property.id) ?? null
    };
  });

  const query = filters.q?.trim().toLowerCase();
  if (query) {
    properties = properties.filter((property) =>
      `${property.title} ${property.addressLine1} ${property.locality} ${property.city}`.toLowerCase().includes(query)
    );
  }

  if (filters.city) {
    properties = properties.filter((property) => property.city === filters.city);
  }

  if (filters.locality) {
    properties = properties.filter((property) => property.locality === filters.locality);
  }

  if (filters.propertyType) {
    properties = properties.filter((property) => property.propertyType === filters.propertyType);
  }

  if (filters.listingStatus) {
    properties = properties.filter((property) => property.listingStatus === filters.listingStatus);
  }

  if (typeof filters.maxPrice === "number") {
    const maxPrice = filters.maxPrice;
    properties = properties.filter((property) => property.price <= maxPrice);
  }

  if (typeof filters.minBedrooms === "number") {
    const minBedrooms = filters.minBedrooms;
    properties = properties.filter((property) => property.bedrooms >= minBedrooms);
  }

  if (filters.sort === "price_asc") {
    properties.sort((left, right) => left.price - right.price);
  } else if (filters.sort === "price_desc") {
    properties.sort((left, right) => right.price - left.price);
  } else if (filters.sort === "area_desc") {
    properties.sort((left, right) => right.areaSqft - left.areaSqft);
  } else {
    properties.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  return properties;
}

export async function getSeededPropertyDetail(propertyId: string) {
  const dataset = getRealEstateDevData();
  const property = dataset.properties.find((item) => item.id === propertyId);

  if (!property) {
    return null;
  }

  const listing = dataset.listings.find((item) => item.propertyId === propertyId) ?? null;
  const showings = dataset.showings.filter((item) => item.propertyId === propertyId);
  const offers = dataset.offers.filter((item) => item.propertyId === propertyId);
  const transaction = dataset.transactions.find((item) => item.propertyId === propertyId) ?? null;
  const documents = dataset.documents.filter((item) => item.propertyId === propertyId);
  const activities = dataset.activities.filter((item) => item.entityType === "property" && item.entityId === propertyId);

  return {
    property,
    listing,
    showings: showings.map((showing) => ({
      ...showing,
      contact: dataset.contacts.find((contact) => contact.id === showing.contactId) ?? null
    })),
    offers: offers.map((offer) => ({
      ...offer,
      buyer: dataset.contacts.find((contact) => contact.id === offer.buyerContactId) ?? null,
      seller: dataset.contacts.find((contact) => contact.id === offer.sellerContactId) ?? null
    })),
    transaction:
      transaction == null
        ? null
        : {
            ...transaction,
            buyer: dataset.contacts.find((contact) => contact.id === transaction.buyerContactId) ?? null,
            seller: dataset.contacts.find((contact) => contact.id === transaction.sellerContactId) ?? null,
            tasks: dataset.transactionTasks.filter((task) => task.transactionId === transaction.id),
            documents: dataset.documents.filter((document) => document.transactionId === transaction.id)
          },
    documents,
    activities
  };
}
