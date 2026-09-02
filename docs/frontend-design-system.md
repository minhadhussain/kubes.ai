# Frontend Design System

## Visual direction

The frontend uses a dark premium SaaS aesthetic for real estate operations. The interface keeps the black/gray palette and green accent, but avoids blueprint or Kubes-like marketing composition.

- Product-first layouts with practical information density
- Green accent used sparingly for state, focus, metrics, and primary actions
- Thin borders, compact labels, and structured layouts
- Landing page built as a SaaS product site with centered hero and realistic product preview
- Operational screens use cards, tables, lists, and workflow surfaces rather than marketing diagrams

## Core tokens

Defined globally in `src/app/globals.css`.

- Backgrounds: `--background`, `--background-secondary`, `--surface`, `--surface-elevated`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Borders: `--border`, `--border-subtle`, `--border-strong`
- Accent: `--accent`, `--accent-bright`, `--accent-dark`, `--accent-muted`
- Feedback: `--danger`, `--warning`, `--success`
- Radius, spacing, transitions, and typography tokens are also centralized

## Typography

- Display font: `Satoshi`
- Interface font: `Satoshi`
- Hero and section titles use readable SaaS-scale typography rather than giant editorial composition
- Small labels use restrained uppercase tracking only where useful

## Component foundation

Reusable UI components now cover the first frontend slice:

- `AppShell`
- `SidebarNav`
- `TopBar`
- `PageHeader`
- `SectionLabel`
- `SystemPanel`
- `Metric`
- `StatusBadge`
- `DataTable`
- `Timeline`
- `WorkflowStep`
- `ModulePlaceholder`

## Landing page principles

- Centered hero with practical heading scale
- Large product preview showing a realistic application dashboard
- Feature grid, workflow strip, value section, AI summaries, and clear CTA/footer structure
- No blueprint panels, numbered workflow cards, or split hero composition

## Dashboard principles

- Present the workspace as a productivity dashboard for agents
- Emphasize actionable information, operational data, and clean hierarchy
- Keep color restrained; green highlights only meaningful values and states

## Responsive behavior

- Sidebar collapses into stacked navigation on narrower viewports
- Tables degrade cleanly into horizontally scrollable operational views
- Primary actions remain available in the top bar on desktop and mobile
- Heading hierarchy and compact metadata remain intact across breakpoints

## Implementation rule

New frontend work should continue using the shared tokens and system components before introducing page-specific styling. Product documentation should continue to live under `docs/`.
