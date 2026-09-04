import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

type PropertyListFilters = {
  q?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  marketState?: "on_market" | "off_market";
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

function getListingSortTimestamp(value: { publishedAt: string | null; expiresAt: string | null }) {
  return new Date(value.publishedAt ?? value.expiresAt ?? 0).getTime();
}

export async function listSeededProperties(filters: PropertyListFilters = {}) {
  const dataset = getRealEstateDevData();
  const listingsByProperty = new Map<string, typeof dataset.listings>();
  const showingsByProperty = new Map<string, number>();
  const offersByProperty = new Map<string, number>();
  const transactionsByProperty = new Map<string, typeof dataset.transactions>();

  for (const listing of dataset.listings) {
    const existing = listingsByProperty.get(listing.propertyId) ?? [];
    existing.push(listing);
    listingsByProperty.set(listing.propertyId, existing);
  }

  for (const showing of dataset.showings) {
    showingsByProperty.set(showing.propertyId, (showingsByProperty.get(showing.propertyId) ?? 0) + 1);
  }

  for (const offer of dataset.offers) {
    offersByProperty.set(offer.propertyId, (offersByProperty.get(offer.propertyId) ?? 0) + 1);
  }

  for (const transaction of dataset.transactions) {
    const existing = transactionsByProperty.get(transaction.propertyId) ?? [];
    existing.push(transaction);
    transactionsByProperty.set(transaction.propertyId, existing);
  }

  let properties = dataset.properties.map((property) => {
    const relatedListings = [...(listingsByProperty.get(property.id) ?? [])].sort(
      (left, right) => getListingSortTimestamp(right) - getListingSortTimestamp(left)
    );
    const activeListings = relatedListings.filter((listing) =>
      ["coming_soon", "active", "under_contract", "pending"].includes(listing.status)
    );
    const latestListing = relatedListings[0] ?? null;
    const currentMarketState: "on_market" | "off_market" = activeListings.length > 0 ? "on_market" : "off_market";

    return {
      id: property.id,
      title: property.title,
      addressLine1: property.addressLine1,
      locality: property.locality,
      city: property.city,
      state: property.state,
      country: property.country,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      parkingSpaces: property.parkingSpaces,
      furnishing: property.furnishing,
      amenities: property.amenities,
      description: property.description,
      status: property.status,
      image: property.image,
      createdAt: property.createdAt,
      listingCount: relatedListings.length,
      activeListingCount: activeListings.length,
      latestListingStatus: latestListing?.status ?? null,
      latestListingPrice: latestListing?.listPrice ?? null,
      latestListingPriceDisplay: latestListing ? formatCurrency(latestListing.listPrice) : null,
      currentMarketState,
      showingCount: showingsByProperty.get(property.id) ?? 0,
      offerCount: offersByProperty.get(property.id) ?? 0,
      transactionCount: (transactionsByProperty.get(property.id) ?? []).length,
      latestListing: latestListing
        ? {
            id: latestListing.id,
            status: latestListing.status,
            listPrice: latestListing.listPrice,
            daysOnMarket: latestListing.daysOnMarket,
            listingType: latestListing.listingType,
            publishedAt: latestListing.publishedAt,
            expiresAt: latestListing.expiresAt
          }
        : null
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

  if (filters.marketState) {
    properties = properties.filter((property) => property.currentMarketState === filters.marketState);
  }

  if (typeof filters.maxPrice === "number") {
    const maxPrice = filters.maxPrice;
    properties = properties.filter((property) => (property.latestListingPrice ?? Number.POSITIVE_INFINITY) <= maxPrice);
  }

  if (typeof filters.minBedrooms === "number") {
    const minBedrooms = filters.minBedrooms;
    properties = properties.filter((property) => property.bedrooms >= minBedrooms);
  }

  if (filters.sort === "price_asc") {
    properties.sort((left, right) => (left.latestListingPrice ?? Number.POSITIVE_INFINITY) - (right.latestListingPrice ?? Number.POSITIVE_INFINITY));
  } else if (filters.sort === "price_desc") {
    properties.sort((left, right) => (right.latestListingPrice ?? 0) - (left.latestListingPrice ?? 0));
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

  const listings = dataset.listings
    .filter((item) => item.propertyId === propertyId)
    .sort((left, right) => getListingSortTimestamp(right) - getListingSortTimestamp(left));
  const showings = dataset.showings.filter((item) => item.propertyId === propertyId);
  const offers = dataset.offers.filter((item) => item.propertyId === propertyId);
  const transactions = dataset.transactions.filter((item) => item.propertyId === propertyId);
  const documents = dataset.documents.filter((item) => item.propertyId === propertyId);
  const activities = dataset.activities.filter((item) => item.entityType === "property" && item.entityId === propertyId);

  return {
    property,
    listings: listings.map((listing) => ({
      ...listing,
      seller: dataset.contacts.find((contact) => contact.id === listing.sellerContactId) ?? null,
      showingCount: dataset.showings.filter((showing) => showing.listingId === listing.id).length,
      offerCount: dataset.offers.filter((offer) => offer.listingId === listing.id).length,
      transaction: dataset.transactions.find((transaction) => transaction.listingId === listing.id) ?? null
    })),
    showings: showings.map((showing) => ({
      ...showing,
      contact: dataset.contacts.find((contact) => contact.id === showing.contactId) ?? null
    })),
    offers: offers.map((offer) => ({
      ...offer,
      buyer: dataset.contacts.find((contact) => contact.id === offer.buyerContactId) ?? null,
      seller: dataset.contacts.find((contact) => contact.id === offer.sellerContactId) ?? null
    })),
    transactions: transactions.map((transaction) => ({
      ...transaction,
      buyer: dataset.contacts.find((contact) => contact.id === transaction.buyerContactId) ?? null,
      seller: dataset.contacts.find((contact) => contact.id === transaction.sellerContactId) ?? null,
      tasks: dataset.transactionTasks.filter((task) => task.transactionId === transaction.id),
      documents: dataset.documents.filter((document) => document.transactionId === transaction.id)
    })),
    documents,
    activities
  };
}
