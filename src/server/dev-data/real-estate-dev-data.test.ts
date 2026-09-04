import assert from "node:assert/strict";
import test from "node:test";

import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

test("seeded real-estate workflow keeps property relationships consistent", () => {
  const dataset = getRealEstateDevData();
  const propertyIds = new Set(dataset.properties.map((property) => property.id));
  const contactIds = new Set(dataset.contacts.map((contact) => contact.id));
  const listingIds = new Set(dataset.listings.map((listing) => listing.id));
  const offerIds = new Set(dataset.offers.map((offer) => offer.id));
  const transactionIds = new Set(dataset.transactions.map((transaction) => transaction.id));
  const listingsByProperty = new Map<string, number>();

  assert.ok(dataset.properties.length >= 30);
  assert.ok(dataset.transactions.length >= 8);

  for (const listing of dataset.listings) {
    assert.ok(propertyIds.has(listing.propertyId));
    assert.ok(contactIds.has(listing.sellerContactId));
    listingsByProperty.set(listing.propertyId, (listingsByProperty.get(listing.propertyId) ?? 0) + 1);
  }

  assert.ok(Array.from(listingsByProperty.values()).some((count) => count > 1));

  for (const showing of dataset.showings) {
    assert.ok(propertyIds.has(showing.propertyId));
    assert.ok(contactIds.has(showing.contactId));
    assert.ok(showing.listingId == null || listingIds.has(showing.listingId));
  }

  for (const offer of dataset.offers) {
    assert.ok(propertyIds.has(offer.propertyId));
    assert.ok(listingIds.has(offer.listingId));
    assert.ok(contactIds.has(offer.buyerContactId));
    assert.ok(contactIds.has(offer.sellerContactId));
  }

  for (const transaction of dataset.transactions) {
    assert.ok(propertyIds.has(transaction.propertyId));
    assert.ok(listingIds.has(transaction.listingId));
    assert.ok(contactIds.has(transaction.buyerContactId));
    assert.ok(contactIds.has(transaction.sellerContactId));
    assert.ok(transaction.offerId == null || offerIds.has(transaction.offerId));
  }

  for (const document of dataset.documents) {
    assert.ok(document.propertyId == null || propertyIds.has(document.propertyId));
    assert.ok(document.contactId == null || contactIds.has(document.contactId));
    assert.ok(document.transactionId == null || transactionIds.has(document.transactionId));
  }
});

test("seeded workflow supports buyer-showing-transaction continuity", () => {
  const dataset = getRealEstateDevData();
  const showing = dataset.showings.find((item) => item.status === "completed");

  assert.ok(showing);

  const offer = dataset.offers.find(
    (item) => item.propertyId === showing!.propertyId && item.buyerContactId === showing!.contactId
  );

  assert.ok(offer);

  const transaction = dataset.transactions.find((item) => item.offerId === offer!.id);
  assert.ok(transaction);
});
