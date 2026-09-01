# Real Estate Agent Operating System Blueprint

## 1. Product Requirements

### Vision

Build the daily operating system for a real estate agent so leads, contacts, listings, showings, offers, transactions, commissions, and follow-up live in one connected workflow.

### Target users

- Solo residential agent
- Buyer agent
- Listing agent
- Rental agent
- Team lead and team member
- Brokerage admin or operations user

### Main problems

- Lead, client, property, and transaction data are spread across disconnected tools.
- Agents re-enter the same information in spreadsheets, messaging tools, calendars, and document folders.
- Follow-ups, deadlines, and missing documents are easy to miss.
- Pipeline visibility is weak across leads, offers, active transactions, and expected commission.
- Team collaboration and permission boundaries break down when records are shared informally.

### Jobs to be done

- Capture and qualify incoming leads quickly.
- Turn a lead into a client without duplicate entry.
- Match clients to properties and coordinate showings.
- Move an accepted offer into a transaction with checklist automation.
- Keep documents, deadlines, tasks, and financial records attached to the same deal.
- Understand what needs attention today and where revenue is coming from.

### Core modules

- Authentication and organization management
- Dashboard
- CRM and contacts
- Leads
- Properties and listings
- Calendar and showings
- Tasks
- Offers
- Transactions and checklist workflow
- Documents and storage
- Commissions and expenses
- Basic analytics

### MVP scope

- P0: authentication, onboarding, dashboard, contacts, leads, properties, listings, calendar, showings, tasks, offers, transactions, documents, commissions, basic analytics
- P1: expenses, activity timeline expansion, notifications center, brokerage/team views, saved property comparisons, client portal foundation, CSV import/export foundation
- P2: external integrations, MLS sync, messaging sync, AI features, advanced automation builder, deeper brokerage administration

### Future scope

- MLS ingestion and listing synchronization
- Email, SMS, WhatsApp, and calendar integrations
- E-signature and accounting integrations
- AI-powered summaries, recommendations, and risk scoring
- Deeper client portal collaboration

## 2. User Personas

### Solo agent

- Needs a single workspace to run pipeline, showings, deals, and income without admin overhead.

### Buyer agent

- Focuses on leads, qualification, property matching, tours, offers, and buyer-side transaction tracking.

### Listing agent

- Focuses on seller contacts, listing prep, showings, offer comparison, marketing documents, and closing coordination.

### Rental agent

- Needs fast contact handling, property tracking, appointments, and lease-oriented deal flow.

### Team lead

- Needs assignment, record visibility, workload balancing, and team-level pipeline visibility.

### Brokerage admin

- Needs organizational oversight, permission boundaries, auditability, and financial rollups without an enterprise-heavy MVP.

## 3. Core User Workflows

### Buyer-side workflow

1. Lead is created from a source.
2. Lead is qualified and linked to a contact.
3. Contact is converted to a buyer client profile.
4. Preferences and budget are recorded once.
5. Properties are attached, shortlisted, and discussed.
6. Showing or tour is scheduled.
7. Feedback is logged.
8. Offer is created.
9. Accepted offer creates a transaction.
10. Checklist, documents, deadlines, and commission are managed through closing.

### Seller-side workflow

1. Seller contact is created.
2. Property is created independently from the listing record.
3. Listing is created and activated.
4. Showings, notes, feedback, and offer activity are tracked.
5. Accepted offer converts to transaction.
6. Documents, deadlines, and closing progress are managed through the same workspace.

### Team workflow

1. Organization owner invites or adds users.
2. Records are assigned to agents.
3. Shared records remain organization-scoped.
4. Audit logs track critical actions and financial changes.

## 4. System Architecture

### Technology decisions

- Web application: Next.js on Node.js
- Backend platform: Supabase for Postgres, Auth, Storage, and RLS
- Validation: Zod
- API style: Next.js route handlers calling modular controllers and services

### High-level architecture

- Browser UI uses server-rendered pages and client components for forms and interactivity.
- Route handlers expose server-side operations for auth, onboarding, and domain actions.
- Service layer contains workflow logic and Supabase queries.
- Postgres is the system of record.
- Supabase Storage handles documents and media, keyed by organization folder.
- RLS enforces tenant isolation and permission boundaries at the database layer.

### Application layers

- `src/app`: pages, layouts, route handlers
- `src/components`: reusable UI
- `src/config`: navigation and module metadata
- `src/lib`: environment, Supabase clients, shared helpers
- `src/server/modules`: controllers, services, validation, workflow logic
- `src/server/shared`: API helpers and shared server utilities
- `supabase/migrations`: schema and policies

### Authentication architecture

- Supabase Auth handles signup, login, logout, verification, password reset, and sessions.
- Middleware refreshes sessions on each request.
- Protected layouts redirect unauthenticated users.
- Onboarding creates an organization and membership before workspace access.

### Authorization architecture

- Every business table includes `organization_id`.
- Membership and role checks are enforced with RLS helpers.
- Sensitive operations are logged in `audit_logs`.
- Storage object paths must be namespaced by organization UUID.

### Data flow

1. UI submits to an API route.
2. Controller validates input.
3. Service executes business logic and database operations.
4. Supabase applies RLS and constraints.
5. UI updates using server render or client-side refresh.

### Error handling

- Services throw structured application errors.
- Controllers return human-readable messages.
- UI surfaces user-safe errors and preserves field context.

### Notification and automation foundation

- Domain services create activity and notification records.
- Workflow transitions trigger reusable service functions rather than UI-side side effects.
- Initial automation targets: lead follow-up task creation, showing follow-up, accepted-offer transaction creation, commission creation on close.

## 5. Project Folder Structure

```text
docs/
  blueprint.md
supabase/
  migrations/
    0001_initial_schema.sql
src/
  app/
    (marketing)/
    (auth)/
    (app)/
    api/
    auth/callback/
  components/
  config/
  lib/
    supabase/
  server/
    modules/
      auth/
      dashboard/
      onboarding/
      organizations/
    shared/
```

## 6. Database ERD / Data Model

### Tenant and identity

- `user_profiles` -> one per `auth.users`
- `organizations` -> top-level tenant
- `roles` -> role catalog
- `organization_members` -> user membership and role assignment

### CRM and pipeline

- `contacts` -> central person/company record
- `leads` -> lead qualification and conversion layer attached to contacts
- `clients` -> client-specific workspace attached to contacts
- `notes`, `tags`, `entity_tags`, `activities` -> shared relational context

### Property and scheduling

- `properties` -> canonical property record
- `listings` -> market-facing listing record attached to property
- `appointments` -> unified calendar objects
- `showing_tours` and `showings` -> buyer tours and showing instances
- `tasks` -> generic task layer linked to contacts, properties, and transactions

### Deal execution

- `offers` -> offer negotiation state
- `transactions` -> post-acceptance deal workspace
- `transaction_participants` -> humans and roles connected to a transaction
- `transaction_tasks` -> generated checklist items

### Files and finance

- `documents` -> metadata for Supabase Storage files
- `commissions` -> transaction revenue modeling
- `expenses` -> operating or transaction-level expense tracking

### Operations

- `notifications` -> in-app notification feed
- `audit_logs` -> immutable audit trail for sensitive changes

## 7. Complete Supabase Schema

- The full executable schema, constraints, indexes, helper functions, storage bucket setup, and RLS policies live in `supabase/migrations/0001_initial_schema.sql`.
- All primary keys use UUIDs.
- All mutable tables include `created_at` and `updated_at`.
- Business records are organization-scoped.

## 8. RLS Strategy

- All authenticated access is organization-scoped.
- Helper functions:
  - `is_organization_member(organization_id)`
  - `has_org_role(organization_id, allowed_roles)`
  - `shares_organization_with_user(user_id)`
- Common policy pattern:
  - select: active organization members only
  - insert: active members for their own organization
  - update: active members within organization
  - delete: admins or owners where appropriate
- Storage policies require the first folder segment to equal the organization UUID.

## 9. API / Service Architecture

### Route handlers

- `/api/auth/*`
- `/api/onboarding/organization`
- domain routes will follow `/api/{module}` with nested actions where needed

### Module structure

- `*.validation.ts` -> request schemas
- `*.service.ts` -> business logic and Supabase access
- `*.controller.ts` -> HTTP orchestration and response mapping

### Service rules

- Business workflows live in services, not React components.
- Controllers remain thin.
- Validation runs before persistence.
- Multi-record writes use database transactions where required.

## 10. MVP Feature Breakdown

### P0

- Auth and onboarding
- Dashboard command center
- Contacts and CRM timeline foundation
- Lead management and conversion
- Properties and listings
- Unified calendar
- Showings and tours
- Tasks
- Offers
- Transactions and checklist generation
- Documents
- Commissions
- Basic analytics

### P1

- Expenses
- Notifications inbox
- Team reporting
- Client portal base experience
- Import/export foundation

### P2

- Advanced automation editor
- MLS and communication integrations
- AI assistance

## 11. Implementation Sequence

1. Foundation: Next.js app shell, environment, Supabase clients, auth flows, onboarding, protected layout
2. Dashboard: daily command center backed by real queries
3. Contacts / CRM: central contact record, notes, tags, timeline foundation
4. Leads: pipeline views, scoring, conversion to client
5. Properties: canonical property record and media
6. Listings: listing lifecycle separated from property
7. Calendar and showings: appointments, tours, showing feedback
8. Tasks: manual and automated tasks
9. Offers: creation, negotiation states, accepted-offer transition
10. Transactions: workspace, checklist generation, deadlines, risks
11. Documents: upload, metadata, linking, permissions
12. Commissions and expenses: finance tracking
13. Basic analytics: operational and financial metrics

## Current implementation in this workspace

- Product blueprint documented
- Supabase schema and RLS foundation added
- Auth, onboarding, protected shell, and dashboard foundation implemented
- Module routes scaffolded in MVP order so subsequent work can plug into real services cleanly
