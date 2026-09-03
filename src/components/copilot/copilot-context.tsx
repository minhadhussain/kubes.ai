"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CopilotPageContext = {
  entityType?: "lead" | "contact" | "task" | "property" | "listing" | "showing" | "transaction" | null;
  entityId?: string | null;
};

type CopilotContextValue = {
  pageContext: CopilotPageContext;
  setPageContext: (value: CopilotPageContext) => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotContextProvider({ children }: { children: React.ReactNode }) {
  const [pageContext, setPageContext] = useState<CopilotPageContext>({});
  const value = useMemo(() => ({ pageContext, setPageContext }), [pageContext]);

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilotPageContext() {
  const value = useContext(CopilotContext);

  if (!value) {
    throw new Error("Copilot context is not available.");
  }

  return value;
}
