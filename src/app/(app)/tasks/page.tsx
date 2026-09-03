import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { listTasks } from "@/server/modules/tasks/tasks.service";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await listTasks();

  return <TasksWorkspace initialTasks={tasks} />;
}
