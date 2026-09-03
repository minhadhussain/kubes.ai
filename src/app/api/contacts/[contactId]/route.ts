import { NextRequest } from "next/server";

import { handleGetContact, handleUpdateContact } from "@/server/modules/contacts/contacts.controller";

type RouteContext = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { contactId } = await params;
  return handleGetContact(contactId);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { contactId } = await params;
  return handleUpdateContact(request, contactId);
}
