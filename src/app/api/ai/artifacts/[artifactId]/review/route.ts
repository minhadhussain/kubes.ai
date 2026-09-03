import { NextRequest } from "next/server";

import { handleReviewAiArtifact, handleUpdateAiArtifactAction } from "@/server/modules/ai/ai.controller";

type RouteContext = {
  params: Promise<{
    artifactId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { artifactId } = await params;
  return handleReviewAiArtifact(request, artifactId);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { artifactId } = await params;
  return handleUpdateAiArtifactAction(request, artifactId);
}
