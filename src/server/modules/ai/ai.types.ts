export type AiRunStatus = "processing" | "completed" | "needs_review" | "failed";

export type AiArtifactType = "lead_qualification" | "next_actions" | "activity_summary" | "follow_up_draft" | "copilot_response";

export type AiApprovalStatus = "pending_review" | "approved" | "rejected";

export type AiActionStatus = "draft" | "pending" | "saved" | "approved" | "executed" | "failed" | "cancelled";

export type AiFeatureKey =
  | "lead_qualification"
  | "next_action_engine"
  | "activity_summary"
  | "follow_up_generator"
  | "copilot_assistant";
