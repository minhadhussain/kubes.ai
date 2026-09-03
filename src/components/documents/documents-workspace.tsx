import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";

type DocumentRecord = {
  id: string;
  fileName: string;
  category: string;
  status: string;
  property: { addressLine1: string } | null;
  contact: { displayName: string } | null;
  transaction: { id: string; stage: string } | null;
};

export function DocumentsWorkspace({ documents }: { documents: DocumentRecord[] }) {
  return (
    <div className="section-stack">
      <PageHeader
        label="Documents"
        title="Connected transaction and property files"
        description="Review the seeded development document layer attached to properties, contacts, and transactions."
      />

      <SystemPanel label="Documents" title="Document register">
        <DataTable
          columns={[
            { key: "name", header: "File", render: (row) => <strong>{row.fileName}</strong> },
            { key: "category", header: "Category", render: (row) => <span>{row.category}</span> },
            { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.status === "active" ? "accent" : "warning"} /> },
            { key: "property", header: "Property", render: (row) => <span>{row.property?.addressLine1 ?? "-"}</span> },
            { key: "contact", header: "Contact", render: (row) => <span>{row.contact?.displayName ?? "-"}</span> }
          ]}
          rows={documents}
        />
      </SystemPanel>
    </div>
  );
}
