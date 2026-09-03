import { NextRequest } from "next/server";

import { handleCreateTask, handleListTasks } from "@/server/modules/tasks/tasks.controller";

export async function GET() {
  return handleListTasks();
}

export async function POST(request: NextRequest) {
  return handleCreateTask(request);
}
