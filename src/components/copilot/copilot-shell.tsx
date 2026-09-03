"use client";

import { CopilotContextProvider } from "@/components/copilot/copilot-context";
import { FloatingCopilot } from "@/components/copilot/floating-copilot";

export function CopilotShell({ children }: { children: React.ReactNode }) {
  return (
    <CopilotContextProvider>
      {children}
      <FloatingCopilot />
    </CopilotContextProvider>
  );
}
