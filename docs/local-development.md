# Local Development Guide

## Requirements

- Node.js
- npm
- A Supabase project

## Environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_PROVIDER=azure
AI_API_KEY=your-ai-api-key
AI_MODEL=gpt-5.4
AI_BASE_URL=https://your-resource.cognitiveservices.azure.com/openai/v1/
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is optional for the app to boot
- it is recommended for automatic onboarding role recovery
- it must remain server-only
- AI provider variables are required for Kubes AI copilot and other server-side AI flows
- supported `AI_PROVIDER` values currently include `openai`, `deepseek`, and `azure`

## Install dependencies

```bash
npm install
```

## Start the app

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Local URLs:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## If local runtime breaks with missing Next chunks

Symptoms:

- `Cannot find module './xxx.js'`
- route loads fail after code changes

Recovery steps:

1. stop all running Node/Next processes
2. remove `.next`
3. restart the dev server

## Authentication flow

- public routes: `/`, `/login`, `/signup`, `/reset-password`
- after login, protected routes redirect through session-aware layouts
- `/onboarding` is required until a default organization is set

## Onboarding flow

1. user signs in
2. onboarding form submits organization name and workspace type
3. backend checks membership state
4. backend resolves the `owner` role
5. backend creates organization, membership, and profile default organization

If role resolution fails:

- add `SUPABASE_SERVICE_ROLE_KEY` and retry, or
- run `docs/seed-workspace-roles.sql` in Supabase SQL Editor

## Database setup

Primary schema file:

- `supabase/migrations/0001_initial_schema.sql`

If the full schema is not applied, many protected flows will not work correctly.

## Seeded workflow modules

The current product-validation pass intentionally uses centralized realistic seed data for these authenticated modules:

- `/properties`
- `/listings`
- `/showings`
- `/transactions`
- `/documents`
- `/finance`

Seeded data source:

- `src/server/dev-data/real-estate-dev-data.ts`

Key behavior:

- the UI reads these modules through service layers, not raw arrays in components
- the floating Kubes AI copilot can query this seeded workflow data through the server-side copilot resolver
- live Supabase-backed modules still include dashboard, leads, contacts, and tasks

## Copilot development notes

- floating copilot route: `/api/ai/copilot`
- shell UI: `src/components/copilot/`
- server orchestration: `src/server/modules/ai/ai-copilot.service.ts`
- seeded workflow context resolution: `src/server/modules/ai/ai-copilot.data.ts`

Recommended local verification after changes:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
