# ISCE Frontend Engineering Standards

This project follows the **ISCE Frontend Engineering Standards** skill (`isce-frontend-engineering-standards`). All contributors must adhere to these conventions.

---

## Core Stack

| Concern         | Tool                          |
| --------------- | ----------------------------- |
| Framework       | Next.js App Router            |
| Language        | TypeScript (strict)           |
| Package manager | **pnpm only**                 |
| Styling         | Tailwind CSS                  |
| Components      | shadcn/ui                     |
| Theming         | Light + dark mode (mandatory) |
| Validation      | Zod                           |
| Auth & sessions | Better Auth                   |
| Forms           | React Hook Form + Zod         |

---

## Folder Structure

```text
/actions          — server actions (verb-first camelCase filenames)
/app
  /(auth)         — login, register, forgot-password, reset-password
  /(public)       — unauthenticated public routes
  /(protected)    — authenticated application routes
  /api            — route handlers, webhooks
/components
  /forms          — form-specific components
  /pages          — page-scoped components
  /shared         — reusable cross-page layout components
  /skeletons      — loading state components
  /ui             — shadcn/ui primitives (do not edit base components heavily)
/docs             — architecture, onboarding, product decisions
/hooks            — custom hooks only (useCamelCase.ts)
/lib
  /schemas        — Zod schemas (camelCase names, kebab-case filenames)
  /services       — database/service access (*.service.ts)
  /types          — shared TypeScript types and interfaces (PascalCase)
  /context        — React context providers
  /store          — global state (only when truly cross-cutting)
  consts.ts       — central constants (UPPER_SNAKE_CASE)
  utils.ts        — helper utilities
```

---

## Naming Conventions

| Target           | Convention                             | Example                        |
| ---------------- | -------------------------------------- | ------------------------------ |
| Folders          | kebab-case                             | `fee-catalogue/`               |
| Multi-word files | kebab-case                             | `user-card.tsx`                |
| Hooks            | camelCase, `use` prefix                | `usePagination.ts`             |
| Server actions   | camelCase, verb-first                  | `createFee.ts`                 |
| Services         | domain + `.service.ts`                 | `fee.service.ts`               |
| Constants        | `UPPER_SNAKE_CASE`                     | `FEEFAMILY`                    |
| Types/Interfaces | PascalCase                             | `FeeRecord`                    |
| Variables        | camelCase                              | `activePayers`                 |
| Booleans         | `is` / `has` / `should` / `can` prefix | `isActive`                     |
| Schemas          | camelCase name, kebab file             | `feeSchema` in `fee-schema.ts` |

> **Constants file:** always import from `@/lib/consts`. The old `@/lib/const` path is a deprecated shim.

---

## Role Naming

Do **not** use hierarchy-revealing names like `admin`, `superAdmin`, `manager`, or `viewer`.  
Use short abstract uppercase names (e.g. `CRIMSON`, `AZURE`, `EMERALD`, `OBSIDIAN`).

---

## State Management Layers

1. Local UI state → `useState`
2. Shared UI behaviour → custom hooks
3. Global cross-cutting state → React Context (`/lib/context`)
4. Server state → Server Components + Server Actions
5. Persistent state → database

Prefer Server Components for reads and Server Actions for mutations.

---

## Forms and Validation

- Use **React Hook Form** for all forms.
- Use **Zod** for all validation schemas.
- Validate at the **server boundary**, not only in the UI.
- Keep schemas in `/lib/schemas`.

---

## Error Handling

| Layer          | Responsibility                              |
| -------------- | ------------------------------------------- |
| UI             | Friendly, safe messages only                |
| Server Actions | Validate input, return controlled failures  |
| Services       | Throw meaningful domain errors              |
| API routes     | Structured JSON + correct HTTP status codes |

Never expose stack traces, raw DB errors, or internal payloads to the client.

---

## Security

- Auth via **Better Auth**
- All input validated with Zod
- Authorization checks happen **server-side**
- Security headers configured in `next.config.ts` (HSTS, CSP, X-Frame-Options, etc.)
- Rate-limit sensitive routes
- Secrets in `.env.local` only — never committed (see `.env.example` for required keys)

---

## Git Workflow

### Branch model

| Branch        | Purpose                       |
| ------------- | ----------------------------- |
| `release`     | Production-ready only         |
| `pre-release` | Staging and QA                |
| `main`        | Approved development baseline |
| `beta`        | Feature integration           |

### Feature branch naming

```text
type/scope-short-description
```

Examples: `feature/auth-login-flow`, `fix/navbar-mobile-overflow`

### Commit format

```text
type(scope): short description
```

Examples: `feat(fees): add import csv flow`, `fix(dashboard): resolve pagination state`

Rules: lowercase type, present tense, subject ≤ 72 chars, no trailing period.

---

## PR Standards

- Target `pre-release` by default
- Clear title following commit format
- Include: what changed, why, any breaking changes
- Require review before merge
- Prefer squash-and-merge

---

## DevSecOps

```bash
pnpm lint       # lint and type check
pnpm build      # production build
pnpm audit      # dependency vulnerability scan
pnpm outdated   # identify stale packages
```

- Strict TypeScript is enabled (`"strict": true` in `tsconfig.json`)
- Lockfile (`pnpm-lock.yaml`) must be committed
- No secrets in source — use `.env.local`
- Run lint + type check in CI before merge

---

## Review Checklist

- [ ] Folder structure and file placement correct
- [ ] Naming conventions followed
- [ ] Server-first architecture preserved (Server Components for reads, Server Actions for mutations)
- [ ] Light mode and dark mode both work
- [ ] shadcn/ui used as base component system
- [ ] Validation at boundaries (Zod)
- [ ] Errors are user-safe
- [ ] No secrets committed
- [ ] Security headers configured
- [ ] Authorization checks server-side
- [ ] `pnpm` used throughout; lockfile committed
