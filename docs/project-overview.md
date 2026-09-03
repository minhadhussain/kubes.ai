# Project Overview

## Product

This project is a production-oriented web application for real estate agents. It is designed to support the lifecycle:

Lead -> Contact -> Client -> Property -> Showing -> Offer -> Transaction -> Closing -> Commission -> Follow-up

## Technology stack

- Node.js
- Next.js App Router
- React
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Zod
- TypeScript

## Current application status

Implemented today:

- Public landing page with premium dark SaaS layout
- Signup, login, logout, password reset, and auth callback routes
- Protected app layout and route gating
- Organization onboarding form and backend flow
- Dashboard foundation powered by real service queries
- Shared app shell with sidebar and top bar
- Reusable UI components for page headers, metrics, tables, badges, timelines, and system panels
- Initial Supabase schema and RLS migration
- Floating Kubes AI copilot with server-side AI routing and current-session chat state
- Seeded development workflow for properties, listings, showings, transactions, documents, and finance
- Centralized development data layer for realistic connected real-estate records

Partially implemented:

- Onboarding can automatically recover missing role seeds when `SUPABASE_SERVICE_ROLE_KEY` is configured
- The application now mixes live Supabase-backed modules and realistic seeded workflow modules during product validation
- Page-aware copilot context is wired for leads, contacts, tasks, properties, listings, showings, and transactions

Not yet fully implemented:

- CRM overview refinements
- Full mutation flows for seeded properties, listings, showings, and transactions
- Calendar scheduling workflows
- Analytics backed by production data
- Seeded workflow replacement with full live Supabase services

## Route inventory

### Public pages

- `/`
- `/login`
- `/signup`
- `/reset-password`

### Auth and API routes

- `/auth/callback`
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/reset-password`
- `/api/onboarding/organization`
- `/api/ai/copilot`

### Protected app routes

- `/onboarding`
- `/dashboard`
- `/crm`
- `/leads`
- `/contacts`
- `/properties`
- `/listings`
- `/calendar`
- `/showings`
- `/tasks`
- `/transactions`
- `/documents`
- `/finance`
- `/analytics`
- `/client-portal`
- `/settings`

## Code structure

### App router

- `src/app/page.tsx` - landing page
- `src/app/(auth)` - auth pages
- `src/app/(app)` - protected application routes
- `src/app/api` - route handlers

### Shared libraries

- `src/lib/env.ts` - environment parsing
- `src/lib/supabase/browser.ts` - browser client
- `src/lib/supabase/server.ts` - server client
- `src/lib/supabase/middleware.ts` - session refresh middleware
- `src/lib/supabase/admin.ts` - optional server-side admin client

### Server modules

- `src/server/modules/auth` - auth validation, controllers, services
- `src/server/modules/onboarding` - organization creation flow
- `src/server/modules/dashboard` - dashboard summary queries
- `src/server/modules/ai` - AI provider integration, lead AI flows, and floating copilot orchestration
- `src/server/modules/properties` - seeded property service layer
- `src/server/modules/listings` - seeded listing service layer
- `src/server/modules/showings` - seeded showing service layer
- `src/server/modules/transactions` - seeded transaction service layer
- `src/server/modules/documents` - seeded document service layer
- `src/server/modules/finance` - seeded finance summary service layer
- `src/server/dev-data` - centralized realistic development dataset and relationship tests
- `src/server/shared` - app errors, response helpers, auth helpers

### Components

- `src/components/forms` - signup, login, reset password, onboarding
- `src/components/navigation` - sidebar and top bar
- `src/components/ui` - shared UI building blocks
- `src/components/dashboard` - dashboard presentation
- `src/components/copilot` - floating assistant shell, UI, and page context plumbing
- `src/components/properties` - property workspace
- `src/components/listings` - listing workspace
- `src/components/showings` - showing workspace
- `src/components/transactions` - transaction workspace
- `src/components/documents` - document workspace
- `src/components/finance` - finance workspace

## Current known dependencies on Supabase state

- `public.roles` must exist for onboarding
- `user_profiles` records are expected to exist for signed-in users
- protected app pages require a valid authenticated Supabase session
- dashboard queries require the base schema tables to exist

## Current known operational caveats

- Missing or stale `.next` artifacts can break local dev until the dev server is restarted and `.next` is cleared
- Onboarding can fail if Supabase role seed data is missing and no service role key is configured
- Protected routes redirect to `/login` when not authenticated
- New workflow modules currently use centralized seeded development data by design and are not yet live-Supabase-backed
- The floating copilot uses both live Supabase data and seeded workflow data depending on the module being queried
