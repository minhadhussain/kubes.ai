# Frontend Design System

## Visual direction

The frontend uses a dark operating-system aesthetic inspired by Kubes and adapted to real estate operations.

- Background-first interface with subtle tonal layering
- Green accent used sparingly for state, focus, metrics, and primary actions
- Thin borders, compact labels, and structured layouts
- Blueprint-style grid surfaces for dashboard, analytics, and workflow modules
- Strong uppercase metadata paired with large, technical headings

## Core tokens

Defined globally in `src/app/globals.css`.

- Backgrounds: `--background`, `--background-secondary`, `--surface`, `--surface-elevated`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Borders: `--border`, `--border-subtle`, `--border-strong`
- Accent: `--accent`, `--accent-bright`, `--accent-dark`, `--accent-muted`
- Feedback: `--danger`, `--warning`, `--success`
- Radius, spacing, transitions, and typography tokens are also centralized

## Typography

- Display font: `Space Grotesk`
- Interface font: `IBM Plex Sans`
- Large page titles use dense line-height and high weight
- Small labels use uppercase tracking to preserve the technical control-layer aesthetic

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

## Dashboard principles

- Present the workspace as mission control rather than a card-heavy CRM
- Show operational state, attention items, workflow blueprint, and timeline structure
- Keep color restrained; green highlights only meaningful values and states

## Responsive behavior

- Sidebar collapses into stacked navigation on narrower viewports
- Tables degrade cleanly into horizontally scrollable operational views
- Primary actions remain available in the top bar on desktop and mobile
- Heading hierarchy and compact metadata remain intact across breakpoints

## Implementation rule

New frontend work should continue using the shared tokens and system components before introducing page-specific styling. Product documentation should continue to live under `docs/`.
