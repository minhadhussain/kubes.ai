"use client";

import { FormEvent, useMemo, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueAt: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  contact: {
    id: string;
    display_name: string;
  } | null;
};

type TasksWorkspaceProps = {
  initialTasks: Task[];
};

const emptyTaskForm = {
  title: "",
  description: "",
  dueAt: ""
};

export function TasksWorkspace({ initialTasks }: TasksWorkspaceProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(
    () => ({
      open: tasks.filter((task) => task.status === "pending" || task.status === "in_progress").length,
      dueToday: tasks.filter((task) => {
        if (!task.dueAt) {
          return false;
        }

        const due = new Date(task.dueAt);
        const now = new Date();

        return due.toDateString() === now.toDateString();
      }).length,
      overdue: tasks.filter((task) => {
        if (!task.dueAt || task.status === "completed" || task.status === "cancelled") {
          return false;
        }

        return new Date(task.dueAt).getTime() < Date.now();
      }).length,
      completed: tasks.filter((task) => task.status === "completed").length
    }),
    [tasks]
  );

  async function refreshTasks() {
    const response = await fetch("/api/tasks", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? "Unable to reload tasks.");
    }

    setTasks(result.data);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
          priority: "medium",
          relatedEntityType: "task"
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to create task.");
      }

      setTaskForm(emptyTaskForm);
      await refreshTasks();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId: string, status: Task["status"]) {
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to update task.");
      }

      await refreshTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    }
  }

  return (
    <div className="section-stack">
      <PageHeader
        label="Tasks"
        title="Operational task queue"
        description="Track real follow-ups and execution work from one task list backed by Supabase records."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Queue</p>
              <strong>{tasks.length} total tasks</strong>
            </div>
            <div>
              <p className="section-label">Health</p>
              <StatusBadge label={metrics.overdue > 0 ? "Needs attention" : "On track"} tone={metrics.overdue > 0 ? "warning" : "accent"} />
            </div>
          </div>
        }
      />

      <div className="metrics-grid">
        <Metric label="Open" value={metrics.open} meta="Pending and in-progress work" tone="accent" status="Live" />
        <Metric label="Due today" value={metrics.dueToday} meta="Tasks due before close of business" />
        <Metric label="Overdue" value={metrics.overdue} meta="Past-due operational work" status={metrics.overdue > 0 ? "Watch" : "Stable"} />
        <Metric label="Completed" value={metrics.completed} meta="Tasks already cleared" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-5">
          <SystemPanel label="Create task" title="Add operational work">
            <form className="section-stack compact-stack" onSubmit={handleCreateTask}>
              <div className="field">
                <label htmlFor="task-title">Title</label>
                <input id="task-title" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              <div className="field">
                <label htmlFor="task-description">Description</label>
                <textarea id="task-description" rows={4} value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="task-due">Due at</label>
                <input id="task-due" type="datetime-local" value={taskForm.dueAt} onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))} />
              </div>
              {error ? <p className="message message-error">{error}</p> : null}
              <button className="button" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create task"}
              </button>
            </form>
          </SystemPanel>
        </section>

        <section className="dashboard-span-7">
          <SystemPanel label="Task list" title="Real execution queue">
            {tasks.length === 0 ? (
              <p>No tasks yet. New leads and manual entries will start filling this queue.</p>
            ) : (
              <DataTable
                columns={[
                  {
                    key: "task",
                    header: "Task",
                    render: (row) => (
                      <div>
                        <strong>{row.title}</strong>
                        <p className="table-meta">{row.description ?? "No description provided."}</p>
                      </div>
                    )
                  },
                  {
                    key: "priority",
                    header: "Priority",
                    render: (row) => (
                      <StatusBadge
                        label={row.priority}
                        tone={row.priority === "urgent" || row.priority === "high" ? "warning" : "neutral"}
                      />
                    )
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge label={row.status} tone={row.status === "completed" ? "accent" : "neutral"} />
                  },
                  {
                    key: "due",
                    header: "Due",
                    render: (row) => <span>{row.dueAt ? new Date(row.dueAt).toLocaleString() : "Unscheduled"}</span>
                  },
                  {
                    key: "action",
                    header: "Action",
                    render: (row) => (
                      <div className="helper-row">
                        {row.status !== "completed" ? (
                          <button className="button-secondary button-compact" type="button" onClick={() => handleStatusChange(row.id, "completed")}>
                            Complete
                          </button>
                        ) : null}
                        {row.status === "pending" ? (
                          <button className="button-secondary button-compact" type="button" onClick={() => handleStatusChange(row.id, "in_progress")}>
                            Start
                          </button>
                        ) : null}
                      </div>
                    )
                  }
                ]}
                rows={tasks}
              />
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
