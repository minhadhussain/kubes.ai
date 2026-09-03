import { NextRequest } from "next/server";

import { createTask, listTasks, updateTaskStatus } from "@/server/modules/tasks/tasks.service";
import { createTaskSchema, updateTaskStatusSchema } from "@/server/modules/tasks/tasks.validation";
import { fail, ok } from "@/server/shared/http";

export async function handleListTasks() {
  try {
    const tasks = await listTasks();
    return ok(tasks);
  } catch (error) {
    return fail(error);
  }
}

export async function handleCreateTask(request: NextRequest) {
  try {
    const body = createTaskSchema.parse(await request.json());
    const taskId = await createTask(body);
    return ok({ taskId }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleUpdateTaskStatus(request: NextRequest, taskId: string) {
  try {
    const body = updateTaskStatusSchema.parse(await request.json());
    await updateTaskStatus(taskId, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
