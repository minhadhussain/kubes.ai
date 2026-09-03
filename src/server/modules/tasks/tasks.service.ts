import { requireCurrentOrganizationContext } from "@/server/shared/organization";
import { AppError } from "@/server/shared/errors";

type CreateTaskInput = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueAt?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  relatedEntityType: "lead" | "contact" | "task" | "transaction";
  relatedEntityId?: string | null;
};

type UpdateTaskStatusInput = {
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
};

export async function listTasks() {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
        id,
        title,
        description,
        priority,
        due_at,
        status,
        notes,
        related_entity_type,
        related_entity_id,
        created_at,
        contact:contacts(id, display_name),
        ai_artifacts(id, artifact_type, title, approval_status, action_status, created_at)
      `
    )
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Unable to load tasks.", 500, "TASKS_LOAD_FAILED");
  }

  return (data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueAt: task.due_at,
    status: task.status,
    notes: task.notes,
    relatedEntityType: task.related_entity_type,
    relatedEntityId: task.related_entity_id,
    createdAt: task.created_at,
    contact: Array.isArray(task.contact) ? task.contact[0] ?? null : task.contact,
    aiArtifacts: Array.isArray(task.ai_artifacts) ? task.ai_artifacts : []
  }));
}

export async function createTask(input: CreateTaskInput) {
  const { supabase, organizationId, user } = await requireCurrentOrganizationContext();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      organization_id: organizationId,
      assigned_user_id: user.id,
      created_by: user.id,
      contact_id: input.contactId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      due_at: input.dueAt ?? null,
      status: "pending",
      related_entity_type: input.relatedEntityType,
      related_entity_id: input.relatedEntityId ?? input.leadId ?? null
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError(error?.message ?? "Unable to create task.", 400, "TASK_CREATE_FAILED");
  }

  return data.id;
}

export async function updateTaskStatus(taskId: string, input: UpdateTaskStatusInput) {
  const { supabase, organizationId } = await requireCurrentOrganizationContext();

  const patch = {
    status: input.status,
    notes: input.notes ?? null,
    completed_at: input.status === "completed" ? new Date().toISOString() : null
  };

  const { error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", taskId);

  if (error) {
    throw new AppError(error.message, 400, "TASK_UPDATE_FAILED");
  }
}
