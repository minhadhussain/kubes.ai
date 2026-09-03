import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { listSeededDocuments } from "@/server/modules/documents/documents.service";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await listSeededDocuments();

  return <DocumentsWorkspace documents={documents} />;
}
