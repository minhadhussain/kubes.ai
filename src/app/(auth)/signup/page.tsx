import Link from "next/link";

import { SignupForm } from "@/components/forms/signup-form";

export default function SignupPage() {
  return (
    <section className="auth-card">
      <p className="eyebrow">Get started</p>
      <h1>Create your agent workspace</h1>
      <p>Start with secure authentication and create your organization after verification.</p>
      <SignupForm />
      <p className="muted">
        Already have an account? <Link href="/login" className="inline-link">Sign in</Link>
      </p>
    </section>
  );
}
