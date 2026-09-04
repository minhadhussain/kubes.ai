"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  title?: string;
  basedOn?: string | null;
  linkedRecords?: Array<{
    id: string;
    entityType: string;
    label: string;
    href: string;
    meta: string;
  }>;
  followUpSuggestions?: string[];
  caution?: string | null;
  pendingAction?: {
    artifactId: string;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
  } | null;
  actionArtifactId?: string | null;
};

function getStarterPrompts(pathname: string, entityType?: string | null) {
  if (pathname.startsWith("/leads") || entityType === "lead") {
    return ["Who needs attention?", "Show hot leads", "Analyze this lead"];
  }

  if (pathname.startsWith("/contacts") || entityType === "contact") {
    return ["Summarize this contact", "What does this client want?", "Find matching properties"];
  }

  if (pathname.startsWith("/properties") || entityType === "property") {
    return ["Find properties", "Find buyers for this property", "Summarize property"];
  }

  if (pathname.startsWith("/transactions") || entityType === "transaction") {
    return ["What's the status?", "What's missing?", "Which deadline is next?"];
  }

  return ["What's important today?", "Show overdue tasks", "Summarize my pipeline"];
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function FloatingCopilot() {
  const pathname = usePathname();
  const { pageContext } = useCopilotPageContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const starterPrompts = useMemo(() => getStarterPrompts(pathname, pageContext.entityType), [pageContext.entityType, pathname]);

  const canSend = draft.trim().length > 0 && !loading;

  useEffect(() => {
    setError(null);
  }, [pathname]);

  const emptyState = useMemo(() => messages.length === 0, [messages.length]);

  async function sendMessage(content: string) {
    const userMessage: CopilotMessage = {
      id: createId("user"),
      role: "user",
      content
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);
    setRetryMessage(content);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content
          })),
          pageContext: {
            pathname,
            entityType: pageContext.entityType ?? null,
            entityId: pageContext.entityId ?? null
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to reach Kubes AI.");
      }

      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          title: result.data.title,
          content: result.data.answer,
          basedOn: result.data.basedOn ?? null,
          linkedRecords: result.data.linkedRecords ?? [],
          followUpSuggestions: result.data.followUpSuggestions ?? [],
          caution: result.data.caution ?? null,
          pendingAction: result.data.pendingAction ?? null,
          actionArtifactId: result.data.actionArtifactId ?? null
        }
      ]);
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to reach Kubes AI.");
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction(artifactId: string, decision: "confirm" | "cancel") {
    const actionMessage: CopilotMessage = {
      id: createId("user"),
      role: "user",
      content: decision === "confirm" ? "Confirm action" : "Cancel action",
      actionArtifactId: artifactId
    };

    const nextMessages = [...messages, actionMessage];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            linkedRecords: message.linkedRecords,
            actionArtifactId: message.actionArtifactId ?? null
          })),
          pageContext: {
            pathname,
            entityType: pageContext.entityType ?? null,
            entityId: pageContext.entityId ?? null
          },
          actionConfirmation: {
            artifactId,
            decision
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to complete Kubes AI action.");
      }

      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          title: result.data.title,
          content: result.data.answer,
          basedOn: result.data.basedOn ?? null,
          linkedRecords: result.data.linkedRecords ?? [],
          followUpSuggestions: result.data.followUpSuggestions ?? [],
          caution: result.data.caution ?? null,
          pendingAction: null,
          actionArtifactId: result.data.actionArtifactId ?? null
        }
      ]);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete Kubes AI action.");
      setMessages((current) => current.filter((message) => message.id !== actionMessage.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="copilot-fab" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="kubes-copilot-panel">
        <span className="copilot-fab-mark">✦</span>
        <span>Kubes AI</span>
      </button>

      {open ? (
        <aside id="kubes-copilot-panel" className="copilot-panel" aria-label="Kubes AI chat panel">
          <div className="copilot-panel-header">
            <div>
              <p className="section-label section-label-accent">Kubes AI</p>
              <h2>Your real estate copilot</h2>
            </div>
            <button type="button" className="button-secondary button-compact" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div className="copilot-messages">
            {emptyState ? (
              <div className="copilot-empty-state">
                <h3>Kubes AI</h3>
                <p>Ask anything about your real estate business.</p>
                <div className="copilot-suggestions">
                  {starterPrompts.map((prompt) => (
                    <button key={prompt} type="button" className="copilot-suggestion" onClick={() => void sendMessage(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article key={message.id} className={`copilot-message copilot-message-${message.role}`}>
                  <div className="copilot-message-body">
                    {message.title ? <strong>{message.title}</strong> : null}
                    <p>{message.content}</p>
                    {message.basedOn ? <p className="table-meta">{message.basedOn}</p> : null}
                    {message.caution ? <p className="table-meta">{message.caution}</p> : null}
                    {message.linkedRecords?.length ? (
                      <div className="copilot-records">
                        {message.linkedRecords.map((record) => (
                          <a key={`${record.entityType}-${record.id}`} href={record.href} className="copilot-record-link">
                            <strong>{record.label}</strong>
                            <span>{record.meta}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {message.pendingAction ? (
                      <div className="helper-row">
                        <button type="button" className="button button-compact" onClick={() => void confirmAction(message.pendingAction!.artifactId, "confirm")} disabled={loading}>
                          {message.pendingAction.confirmLabel}
                        </button>
                        <button type="button" className="button-secondary button-compact" onClick={() => void confirmAction(message.pendingAction!.artifactId, "cancel")} disabled={loading}>
                          {message.pendingAction.cancelLabel}
                        </button>
                      </div>
                    ) : null}
                    {message.followUpSuggestions?.length ? (
                      <div className="copilot-suggestions-inline">
                        {message.followUpSuggestions.map((suggestion) => (
                          <button key={suggestion} type="button" className="copilot-suggestion" onClick={() => void sendMessage(suggestion)}>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}

            {loading ? <p className="table-meta">Kubes AI is reviewing your workspace...</p> : null}
            {error ? (
              <div className="message message-error">
                <p>{error}</p>
                {retryMessage ? (
                  <div className="helper-row">
                    <button type="button" className="button-secondary button-compact" onClick={() => void sendMessage(retryMessage)}>
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="copilot-panel-footer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Kubes anything..."
              rows={3}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) {
                    void sendMessage(draft.trim());
                  }
                }
              }}
            />
            <div className="helper-row">
              <button type="button" className="button-secondary button-compact" onClick={() => setMessages([])} disabled={messages.length === 0 || loading}>
                Clear conversation
              </button>
              <button type="button" className="button button-compact" onClick={() => void sendMessage(draft.trim())} disabled={!canSend}>
                Send
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
