import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <section className="auth-card">
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in to your workspace</h1>
      <p>Access your pipeline, daily tasks, and active deals.</p>
      <LoginForm />
      <p className="muted">
        Need an account? <Link href="/signup" className="inline-link">Create one</Link>
      </p>
    </section>
  );
}
