import { ContactsWorkspace } from "@/components/contacts/contacts-workspace";
import { listContacts } from "@/server/modules/contacts/contacts.service";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return <ContactsWorkspace initialContacts={contacts} />;
}
