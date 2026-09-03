import { NextRequest } from "next/server";

import { handleCreateContactActivity } from "@/server/modules/contacts/contacts.controller";

type RouteContext = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { contactId } = await params;
  return handleCreateContactActivity(request, contactId);
}
