"use client";

import { FormEvent, useState } from "react";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error?.message ?? "Unable to send password reset email.");
      setSubmitting(false);
      return;
    }

    setSuccess("Password reset email sent. Check your inbox.");
    setSubmitting(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      {error ? <p className="message message-error">{error}</p> : null}
      {success ? <p className="message message-success">{success}</p> : null}
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
