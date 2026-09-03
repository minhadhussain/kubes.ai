# Project Documentation Index

This folder contains the current project documentation for the real estate agent operating system.

## Documents

- `docs/blueprint.md` - product requirements, architecture, MVP plan, database model, and implementation sequence
- `docs/project-overview.md` - current project status, implemented modules, routes, and code structure
- `docs/local-development.md` - local setup, environment variables, development workflow, and verification commands
- `docs/frontend-design-system.md` - frontend visual system, tokens, layout principles, and reusable UI components
- `docs/supabase-setup.md` - current Supabase connection status and configuration notes
- `docs/supabase-troubleshooting.md` - common Supabase issues and recovery guidance
- `docs/seed-workspace-roles.sql` - SQL seed for required workspace roles when onboarding fails on missing role data

## Recommended reading order

1. `docs/project-overview.md`
2. `docs/local-development.md`
3. `docs/blueprint.md`
4. `docs/frontend-design-system.md`
5. `docs/supabase-setup.md`

## Current implementation summary

- Next.js web app on Node.js
- Supabase integration for auth and data access
- Auth flows, onboarding flow, app shell, landing page, and dashboard foundation implemented
- Live CRM foundations implemented for dashboard, leads, contacts, and tasks
- Seeded product workflow implemented for properties, listings, showings, transactions, documents, and finance
- Floating Kubes AI copilot implemented across the authenticated app shell
- Calendar, analytics, client portal, CRM overview, and some secondary modules still use placeholder or summary views
