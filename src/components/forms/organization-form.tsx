"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function OrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [workspaceType, setWorkspaceType] = useState<"solo" | "team" | "brokerage">("solo");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/onboarding/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, workspaceType })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error?.message ?? "Unable to create organization.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="organizationName">Organization name</label>
        <input id="organizationName" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="workspaceType">Workspace type</label>
        <select
          id="workspaceType"
          value={workspaceType}
          onChange={(event) => setWorkspaceType(event.target.value as "solo" | "team" | "brokerage")}
        >
          <option value="solo">Solo agent</option>
          <option value="team">Team</option>
          <option value="brokerage">Brokerage</option>
        </select>
      </div>
      {error ? <p className="message message-error">{error}</p> : null}
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
