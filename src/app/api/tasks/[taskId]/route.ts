import { NextRequest } from "next/server";

import { handleUpdateTaskStatus } from "@/server/modules/tasks/tasks.controller";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { taskId } = await params;
  return handleUpdateTaskStatus(request, taskId);
}
