import Link from "next/link";

export default function HomePage() {
  return (
    <main className="marketing-layout">
      <section className="marketing-card">
        <div className="marketing-copy">
          <p className="eyebrow">Production-ready foundation</p>
          <h1>Run the full real estate workflow from first lead to post-close follow-up.</h1>
          <p>
            This application is structured as an operating system for agents, not a disconnected admin shell. The current build
            establishes the production foundation for auth, organizations, RLS, and the command-center dashboard.
          </p>

          <div className="helper-row">
            <Link href="/login" className="button">
              Sign in
            </Link>
            <Link href="/signup" className="button-secondary">
              Create account
            </Link>
          </div>

          <ul className="marketing-list">
            <li>Single source of truth across contacts, leads, properties, offers, and transactions</li>
            <li>Supabase-backed auth, storage, PostgreSQL schema, and RLS tenant isolation</li>
            <li>Module-by-module implementation sequence aligned to real agent workflows</li>
          </ul>
        </div>

        <div className="marketing-side">
          <div>
            <p className="eyebrow">Core workflow</p>
            <p>
              Lead {"->"} Contact {"->"} Client {"->"} Property {"->"} Showing {"->"} Offer {"->"} Transaction {"->"} Closing {"->"} Commission {"->"} Follow-up
            </p>
          </div>
          <div>
            <p className="eyebrow">MVP progress</p>
            <p>Auth, onboarding, dashboard foundation, schema, and app shell are in place for iterative delivery.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
