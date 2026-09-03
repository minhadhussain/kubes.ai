# AGENTS.md

Repository guidance for coding agents working in `D:\kubesai`.

## Project Summary

- Stack: Next.js App Router, React 19, TypeScript, Supabase SSR, Zod, ESLint.
- App domain: real-estate SaaS / agent operating system.
- Key directories:
- `src/app`: pages, layouts, route handlers.
- `src/components`: reusable UI and feature components.
- `src/server`: controllers, services, validation, shared server helpers.
- `src/lib`: env and Supabase utilities.
- `supabase/migrations`: SQL schema, triggers, and RLS policies.

## Rule Files

- No `AGENTS.md` existed before this file.
- No `.cursorrules` file exists.
- No `.cursor/rules/` directory exists.
- No `.github/copilot-instructions.md` exists.
- If any of those files are added later, fold their repo-specific rules into this file and follow the stricter rule if instructions conflict.

## Package Manager

- Use `npm` in this repository.
- Do not switch to `pnpm`, `yarn`, or `bun` unless the repo is explicitly migrated.

## Core Commands

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build production app: `npm run build`
- Start production server: `npm run start`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`

## Test Status

- There is currently no test runner configured in `package.json`.
- There is no `npm test` script.
- Current validation baseline is lint + typecheck + build as needed.

## Single-Test Guidance

- No single-test command exists yet because the repository has no test framework configured.
- Do not invent Jest/Vitest/Playwright commands in agent instructions.
- If tests are introduced later, update this file with:
- full-suite command,
- single-file command,
- single-test-name/filter command.

## Recommended Verification

- Styling-only edits: `npm run lint`
- Layout, routing, middleware, or page changes: `npm run lint && npm run build`
- Server, auth, env, or Supabase-access changes: `npm run lint && npm run typecheck && npm run build`
- SQL migration changes: review migration carefully and document any required manual validation in Supabase

## Environment Variables

- Public env is parsed in `src/lib/env.ts`.
- Required public variables:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional server variable used for automatic role seeding:
- `SUPABASE_SERVICE_ROLE_KEY`
- Do not bypass env validation helpers.

## Architecture

- Follow the current layered pattern:
- validation in `*.validation.ts`
- orchestration in `*.controller.ts`
- business logic in `*.service.ts`
- shared helpers in `src/server/shared`
- API route files in `src/app/api/**/route.ts` should remain thin wrappers.
- App pages should stay lean and push non-trivial logic into components or server modules.
- Protected app pages live under `src/app/(app)`.
- Auth pages live under `src/app/(auth)`.

## Imports

- Prefer the `@/*` alias from `tsconfig.json` for internal imports.
- Group imports as:
- external / framework imports
- blank line
- internal `@/...` imports
- Use type imports when useful, e.g. `import type { Route } from "next";`.
- Preserve readable import ordering; do not churn files for cosmetic reordering alone.

## Formatting

- Use double quotes.
- Use semicolons.
- Match existing wrapping and indentation.
- Expand long objects, arrays, and JSX props over multiple lines when it improves readability.
- Avoid formatting-only edits unless necessary for touched code.

## TypeScript Conventions

- The repo uses `strict: true`; keep changes type-safe.
- Avoid `any`.
- Prefer `unknown` when handling caught errors, then narrow.
- Use explicit prop types for components.
- Use unions for bounded domain values, e.g. `"solo" | "team" | "brokerage"`.
- Keep generic abstractions purposeful; do not over-generalize simple components.
- Preserve existing `Readonly<{ children: React.ReactNode }>` style when editing layouts.

## Naming

- Components: PascalCase.
- Exported functions/helpers: camelCase.
- Validation schemas: `...Schema`.
- Error codes: uppercase snake case, e.g. `PROFILE_LOAD_FAILED`.
- CSS class names: kebab-case with feature prefixes.
- File names generally use lowercase with hyphens for components and feature modules.

## React / Next.js Rules

- Default to Server Components.
- Add `"use client"` only when hooks, browser APIs, or client interactivity require it.
- Use `redirect()` from `next/navigation` in server components/layouts for auth gating.
- Use `Link` for internal navigation.
- Be careful with `useSearchParams()` in App Router; isolate it properly. The login page currently wraps the client form in `Suspense` for this reason.
- Keep typed routes valid when passing `href` to `Link`.

## Supabase Conventions

- Use `createSupabaseServerClient()` for server-side access.
- Middleware session refresh is handled by `updateSession()` in `src/lib/supabase/middleware.ts`.
- Preserve organization-scoped data access patterns.
- Respect RLS assumptions; do not add shortcuts that bypass them.
- When data might be absent, prefer controlled handling such as `maybeSingle()`, fallbacks, or explicit `AppError` cases.

## Validation Rules

- Validate request payloads with Zod.
- Keep schema messages user-friendly.
- Parse request bodies in controllers before calling services.
- Prefer small, composable schemas over ad hoc runtime checks spread through handlers.

## Error Handling

- Use `AppError` for expected application/domain failures.
- Provide a clear message, status code, and stable error code.
- In route controllers, catch errors and return `fail(error)`.
- Use `ok(data, init?)` for success JSON responses.
- For unexpected errors, let shared handling produce the 500 response rather than returning inconsistent shapes.
- Limited `console.error` logging is already used in recoverable profile fallbacks; keep this intentional and not noisy.

## UI / Product Rules

- End-user pages must show business-facing content, not developer roadmap language.
- Reuse shared primitives where possible: `PageHeader`, `Metric`, `SystemPanel`, `Timeline`, `DataTable`, `StatusBadge`.
- Preserve the current product language: dark surfaces, green accent, Satoshi-based typography.
- Maintain stable shell layout across routes; avoid sidebar/nav shifts and content-driven shell movement.
- Keep mobile behavior deliberate; prefer wrapping or scrolling over cramped layouts.

## CSS Guidelines

- Global styles live in `src/app/globals.css`.
- Reuse existing design tokens from `:root` before introducing new values.
- Prefer extending current class systems rather than one-off patterns.
- Avoid route-dependent spacing hacks.
- Keep shell, sidebar, top bar, and page layout spacing stable.

## Data and Schema Notes

- Main SQL schema is in `supabase/migrations/0001_initial_schema.sql`.
- New `user_profiles` rows are expected from the `handle_new_user()` trigger on `auth.users`.
- Runtime code already includes fallbacks for missing profile rows; do not assume every environment has perfectly initialized data.
- If editing migrations, mention manual Supabase steps in your summary.

## Working With Existing Code

- Read local context before changing patterns.
- Prefer small, targeted changes.
- Reuse existing helpers before creating new ones.
- Extract shared components only when duplication is real and recurring.
- Do not add comments unless a block is non-obvious.

## Git Hygiene

- The working tree may be dirty; do not revert unrelated user changes.
- Do not amend commits unless explicitly requested.
- Do not make destructive git changes.
- Only commit when explicitly asked.

## When Reporting Work

- Mention which verification commands you ran.
- If a requested single-test command does not exist, say that clearly and use the closest real verification commands.
- Mention any manual validation still needed for Supabase, auth, or migrations.

## Keep This File Updated

- Update this file when scripts, test tooling, linting, or repo conventions change.
- If tests are added later, document exact commands for:
- full suite
- single file
- single test by name/filter
