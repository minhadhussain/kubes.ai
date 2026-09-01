import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <section className="auth-card">
      <p className="eyebrow">Password reset</p>
      <h1>Send a secure reset link</h1>
      <p>We will email a password reset link using Supabase Auth.</p>
      <ResetPasswordForm />
      <p className="muted">
        Return to <Link href="/login" className="inline-link">sign in</Link>
      </p>
    </section>
  );
}
