import Link from "next/link";

export default function HomePage() {
  const previewNavigation = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Leads", href: "/leads" },
    { label: "Contacts", href: "/contacts" },
    { label: "Properties", href: "/properties" },
    { label: "Listings", href: "/listings" },
    { label: "Calendar", href: "/calendar" },
    { label: "Showings", href: "/showings" },
    { label: "Tasks", href: "/tasks" },
    { label: "Transactions", href: "/transactions" },
    { label: "Documents", href: "/documents" },
    { label: "Finance", href: "/finance" }
  ] as const;

  const features = [
    {
      title: "Lead Management",
      description: "Manage every prospect from first contact through qualification and conversion."
    },
    {
      title: "Client CRM",
      description: "Keep every relationship, note, follow-up, and requirement organized in one place."
    },
    {
      title: "Properties & Listings",
      description: "Track inventory, active listings, buyer interest, and seller-side execution together."
    },
    {
      title: "Showings & Calendar",
      description: "Schedule tours, appointments, and client activity without switching between tools."
    },
    {
      title: "Transactions",
      description: "Move every deal from offer to closing with deadlines, tasks, and participants attached."
    },
    {
      title: "Documents & Finance",
      description: "Keep paperwork, commissions, and operating records connected to the actual workflow."
    }
  ];

  const workflow = ["Lead", "Client", "Property", "Showing", "Offer", "Transaction", "Closed"];

  const aiCards = [
    {
      label: "Follow-up",
      text: "3 leads need attention today."
    },
    {
      label: "Next action",
      text: "Schedule a showing with Rahul."
    },
    {
      label: "Transaction alert",
      text: "Inspection deadline is tomorrow."
    },
    {
      label: "Summary",
      text: "5 new client interactions this morning."
    }
  ];

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          kubes.ai
        </Link>

        <nav className="landing-nav" aria-label="Marketing">
          <a href="#product">Product</a>
          <a href="#features">Features</a>
          <a href="#workflow">How It Works</a>
          <a href="#agents">For Agents</a>
        </nav>

        <div className="landing-header-actions">
          <Link href="/login" className="landing-link-button">
            Sign In
          </Link>
          <Link href="/signup" className="button">
            Get Started
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <p className="landing-eyebrow">Real estate operating system</p>
        <h1>
          Everything you need
          <br />
          to run your <span className="text-accent">real estate</span> business.
        </h1>
        <p className="landing-hero-copy">
          Manage leads, clients, properties, showings, transactions and commissions from one connected workspace.
        </p>
        <div className="landing-hero-actions">
          <Link href="/signup" className="button">
            Get Started
          </Link>
          <Link href="/login" className="button-secondary">
            Sign In
          </Link>
        </div>
      </section>

      <section className="landing-section" id="product">
        <div className="landing-preview">
          <aside className="landing-preview-sidebar">
            <div>
              <p className="landing-preview-kicker">Workspace</p>
              <strong>Agent OS</strong>
            </div>

            <nav className="landing-preview-nav" aria-label="Product preview">
              {previewNavigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`landing-preview-nav-item ${index === 0 ? "landing-preview-nav-item-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="landing-preview-main">
            <div className="landing-preview-top">
              <div>
                <p className="landing-preview-kicker">Dashboard</p>
                <h2>Good morning, Alex</h2>
                <p>Here&apos;s what needs attention today.</p>
              </div>
            </div>

            <div className="landing-preview-metrics">
              <article className="landing-preview-card">
                <span>24</span>
                <p>Leads</p>
              </article>
              <article className="landing-preview-card">
                <span>6</span>
                <p>Showings</p>
              </article>
              <article className="landing-preview-card">
                <span>8</span>
                <p>Transactions</p>
              </article>
              <article className="landing-preview-card landing-preview-card-accent">
                <span>Rs 4.8L</span>
                <p>Expected</p>
              </article>
            </div>

            <div className="landing-preview-content">
              <section className="landing-preview-panel">
                <div className="landing-preview-panel-header">
                  <h3>Today&apos;s Schedule</h3>
                </div>
                <ul className="landing-preview-list">
                  <li>
                    <strong>09:30</strong>
                    <span>Client call</span>
                  </li>
                  <li>
                    <strong>11:00</strong>
                    <span>Property showing</span>
                  </li>
                  <li>
                    <strong>14:30</strong>
                    <span>Seller meeting</span>
                  </li>
                </ul>
              </section>

              <section className="landing-preview-panel">
                <div className="landing-preview-panel-header">
                  <h3>Lead Pipeline</h3>
                </div>
                <div className="landing-preview-pipeline">
                  {["New", "Contacted", "Qualified", "Active", "Offer", "Closed"].map((stage, index) => (
                    <div key={stage} className="landing-preview-stage">
                      <span>{stage}</span>
                      {index < 5 ? <i aria-hidden="true" /> : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-heading">
          <h2>Everything in one workspace.</h2>
          <p>Run the complete agent workflow from a single product instead of disconnected spreadsheets, chats, and folders.</p>
        </div>

        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="landing-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="workflow">
        <div className="landing-section-heading">
          <h2>From lead to closing.</h2>
        </div>

        <div className="landing-workflow">
          {workflow.map((step, index) => (
            <div key={step} className="landing-workflow-step">
              <span>{step}</span>
              {index < workflow.length - 1 ? <i aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-value-section" id="agents">
        <div>
          <p className="landing-eyebrow">For agents</p>
          <h2>Stop managing your business across scattered tools.</h2>
        </div>

        <div className="landing-value-list-wrap">
          <ul className="landing-value-list">
            <li>CRM</li>
            <li>Properties</li>
            <li>Calendar</li>
            <li>Transactions</li>
            <li>Documents</li>
            <li>Commissions</li>
          </ul>
          <p>Everything connected.</p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <h2>Your operating system gets smarter.</h2>
        </div>

        <div className="landing-ai-grid">
          {aiCards.map((card) => (
            <article key={card.label} className="landing-ai-card">
              <p className="landing-ai-label">{card.label}</p>
              <h3>{card.text}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2>
          Run your entire real estate
          <br />
          business from one place.
        </h2>
        <Link href="/signup" className="button">
          Get Started
        </Link>
      </section>

      <footer className="landing-footer">
        <Link href="/">Product</Link>
        <a href="#features">Features</a>
        <a href="#agents">For Agents</a>
        <a href="mailto:hello@kubes.ai">Contact</a>
        <Link href="/login">Sign In</Link>
        <Link href="/signup">Get Started</Link>
      </footer>
    </main>
  );
}
