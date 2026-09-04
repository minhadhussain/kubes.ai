import assert from "node:assert/strict";
import test from "node:test";

import { derivePropertySearchArgsFromQuestion } from "@/server/modules/ai/ai-copilot.tools";
import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

test("property matcher extracts budget, bedrooms, locality, and market intent from natural language", () => {
  const args = derivePropertySearchArgsFromQuestion("Find properties under ₹1Cr in HSR with 3BHK that are active");

  assert.equal(args.maxPrice, 10000000);
  assert.equal(args.minBedrooms, 3);
  assert.equal(args.locality?.toLowerCase(), "hsr");
  assert.equal(args.marketState, "on_market");
});

test("seeded data exposes property-to-many-listings history for AI relationship reasoning", () => {
  const dataset = getRealEstateDevData();
  const listingsForPalm = dataset.listings.filter((listing) => listing.propertyId === "property-002");

  assert.ok(listingsForPalm.length >= 2);
  assert.ok(listingsForPalm.some((listing) => listing.status === "sold" || listing.status === "expired"));
  assert.ok(listingsForPalm.some((listing) => ["coming_soon", "active", "under_contract", "pending", "draft"].includes(listing.status)));
});

test("seeded client requirements can be matched to available properties", () => {
  const dataset = getRealEstateDevData();
  const sarah = dataset.contacts.find((contact) => contact.displayName === "Sarah Khan");

  assert.ok(sarah);
  assert.match(sarah!.locationRequirements ?? "", /HSR|Koramangala/i);

  const matches = dataset.properties.filter((property) => {
    const inTargetLocality = ["HSR Layout", "Koramangala"].includes(property.locality);
    const withinBudget = property.price <= (sarah!.budget ?? 0);
    const hasBedrooms = property.bedrooms >= 3;

    return inTargetLocality && withinBudget && hasBedrooms;
  });

  assert.ok(matches.length > 0);
});

test("seeded transactions expose commission and closing-soon aggregate facts", () => {
  const dataset = getRealEstateDevData();
  const totalCommission = dataset.transactions.reduce((sum, transaction) => sum + transaction.commission, 0);
  const closingSoon = dataset.transactions.filter((transaction) => transaction.closingDate != null);

  assert.ok(totalCommission > 0);
  assert.ok(closingSoon.length > 0);
});
