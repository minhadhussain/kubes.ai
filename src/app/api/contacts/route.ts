import { NextRequest } from "next/server";

import { handleCreateContact, handleListContacts } from "@/server/modules/contacts/contacts.controller";

export async function GET(request: NextRequest) {
  return handleListContacts(request);
}

export async function POST(request: NextRequest) {
  return handleCreateContact(request);
}
