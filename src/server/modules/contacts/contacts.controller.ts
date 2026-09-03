import { NextRequest } from "next/server";

import {
  createContactActivity,
  createContact,
  getContactDetail,
  listContacts,
  updateContact
} from "@/server/modules/contacts/contacts.service";
import {
  createContactActivitySchema,
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema
} from "@/server/modules/contacts/contacts.validation";
import { fail, ok } from "@/server/shared/http";

export async function handleListContacts(request: NextRequest) {
  try {
    const filters = listContactsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const contacts = await listContacts(filters);
    return ok(contacts);
  } catch (error) {
    return fail(error);
  }
}

export async function handleCreateContact(request: NextRequest) {
  try {
    const body = createContactSchema.parse(await request.json());
    const contactId = await createContact({
      ...body,
      email: body.email || undefined
    });
    return ok({ contactId }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleGetContact(contactId: string) {
  try {
    const detail = await getContactDetail(contactId);
    return ok(detail);
  } catch (error) {
    return fail(error);
  }
}

export async function handleUpdateContact(request: NextRequest, contactId: string) {
  try {
    const body = updateContactSchema.parse(await request.json());
    await updateContact(contactId, {
      ...body,
      email: body.email || undefined
    });
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function handleCreateContactActivity(request: NextRequest, contactId: string) {
  try {
    const body = createContactActivitySchema.parse(await request.json());
    await createContactActivity({
      contactId,
      title: body.title,
      body: body.body,
      activityType: body.activityType
    });
    return ok({ success: true }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
