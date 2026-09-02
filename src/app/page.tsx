import Link from "next/link";

export default function HomePage() {
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

  const productPillars = [
    {
      title: "Lead capture and follow-up",
      text: "Collect enquiries, organize conversations, and make sure every prospect gets a timely next step."
    },
    {
      title: "Client and property coordination",
      text: "Keep buyer needs, seller expectations, property details, and internal notes connected in one place."
    },
    {
      title: "Scheduling and execution",
      text: "Manage showings, meetings, tasks, and transaction milestones without juggling separate tools."
    }
  ];

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
        <div className="landing-preview landing-preview-simple">
          <div className="landing-preview-main">
            <div className="landing-preview-top">
              <div>
                <h2>Built for the full real estate workflow.</h2>
                <p>
                  The landing page now stays focused on what the platform does. Detailed dashboard views remain inside the
                  app experience after sign-in.
                </p>
              </div>
            </div>

            <div className="landing-preview-metrics">
              <article className="landing-preview-card">
                <span>CRM</span>
                <p>Leads and contacts</p>
              </article>
              <article className="landing-preview-card">
                <span>Ops</span>
                <p>Tasks and calendar</p>
              </article>
              <article className="landing-preview-card">
                <span>Deals</span>
                <p>Listings and transactions</p>
              </article>
              <article className="landing-preview-card landing-preview-card-accent">
                <span>AI</span>
                <p>Smarter follow-through</p>
              </article>
            </div>

            <div className="landing-preview-content">
              {productPillars.map((pillar) => (
                <section key={pillar.title} className="landing-preview-panel">
                  <div className="landing-preview-panel-header">
                    <h3>{pillar.title}</h3>
                  </div>
                  <p>{pillar.text}</p>
                </section>
              ))}
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

        <div className="landing-workflow" aria-label="Product journey">
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
