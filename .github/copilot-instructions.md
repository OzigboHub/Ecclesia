# Copilot Instructions for Ecclesia DPM

## Project Overview

Ecclesia is a Catholic parish management system built with Next.js 16 (App Router), TypeScript, Prisma ORM, and Auth.js (NextAuth v5). The system manages parishioners, payments, mass intentions, appointments, organizations, and sacramental records across parish-outstation hierarchies.

> **📚 Detailed Skills Reference**: See [.github/skills/README.md](skills/README.md) for comprehensive coding patterns and conventions.

## Core Principles

1. **Mobile-First Design** → [001-mobile-first-design.md](skills/001-mobile-first-design.md)
2. **Server Components by Default** → [004-server-vs-client-components.md](skills/004-server-vs-client-components.md)
3. **Server Actions for Mutations** → [005-server-actions-pattern.md](skills/005-server-actions-pattern.md)
4. **Organization-Scoped Queries** → [008-organization-scoping.md](skills/008-organization-scoping.md)
5. **Zod Validation Everywhere** → [006-zod-validation.md](skills/006-zod-validation.md)

## Architecture & Key Concepts

### Multi-Tenancy via Organization Hierarchy

-   **Every resource is scoped to an Organization** (Parish or Outstation)
-   Organizations have hierarchical relationships: Parish → Outstations
-   Always filter queries by `organizationId` from `session.user.organizationId`
-   Schema: [prisma/schema.prisma](prisma/schema.prisma)
-   📘 See: [008-organization-scoping.md](skills/008-organization-scoping.md)

### Feature Toggle System

-   Features are controlled per-organization via `OrganizationFeatureSettings` model
-   Before implementing feature logic, check if feature is enabled: `organization.featureSettings.enable[FeatureName]`
-   See [docs/feature_toggled_guide.md](docs/feature_toggled_guide.md) for comprehensive patterns
-   Default-enabled features: Parishioner management, sacramental records, financial management, mass intentions
-   Default-disabled: Live streaming, SMS notifications, online payments, mobile app
-   📘 See: [009-feature-toggle-system.md](skills/009-feature-toggle-system.md)

### Role-Based Access Control (RBAC)

8 roles: `SUPER_ADMIN`, `PARISH_ADMIN`, `PARISH_SECRETARY`, `PARISH_STAFF`, `OUTSTATION_ADMIN`, `ORGANIZATION_PRESIDENT`, `ORGANIZATION_SECRETARY`, `PARISHIONER`

-   Role stored in: `session.user.role` (Auth.js JWT)
-   Implement role checks server-side in API routes and client-side for UI
-   Reference [docs/prd.md](docs/prd.md) sections 3.1.1-3.1.2 for role permissions
-   📘 See: [010-role-based-access-control.md](skills/010-role-based-access-control.md)

## Development Patterns

### Database & ORM

**Database**: NeonDB (serverless PostgreSQL) with Prisma adapter

-   Import: `import db from '@/lib/db'` (singleton pattern with WebSocket support)
-   Always include relations explicitly: `include: { organization: true, user: true }`
-   Use transactions for multi-table updates: `db.$transaction([...])`
-   Prisma Client regeneration: `pnpm prisma generate` after schema changes
-   📘 See: [007-prisma-database-patterns.md](skills/007-prisma-database-patterns.md)

### Authentication Flow

-   Auth.js (NextAuth v5) with JWT strategy (24hr session)
-   Config: [auth.ts](auth.ts) (root) + [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)
-   Session extended with: `id`, `role`, `organizationId`, `organizationName`
-   Protected routes: Wrap with `<ProtectedRoute>` component (client-side redirect)
-   Server-side auth: `import { auth } from '@/auth'; const session = await auth()`
-   📘 See: [018-authjs-authentication.md](skills/018-authjs-authentication.md)

### Component Structure

**UI Components**: Located in [components/ui/](components/ui/)

-   Custom components built with Tailwind v4 + `cn()` utility (clsx + tailwind-merge)
-   Pattern: Accept `className` prop, merge with `cn()` for style composition
-   Variants via object mapping (see [components/ui/button.tsx](components/ui/button.tsx))
-   📘 See: [013-tailwind-shadcn-styling.md](skills/013-tailwind-shadcn-styling.md)

**Lucide React Icons**: Used consistently across the app (e.g., `Home`, `Users`, `DollarSign`)

**Forms**: Located in [components/forms/](components/forms/)

-   Client components (`'use client'`) with controlled inputs
-   Form validation should follow patterns in existing forms
-   📘 See: [011-react-hook-form.md](skills/011-react-hook-form.md), [006-zod-validation.md](skills/006-zod-validation.md)

### Styling Conventions

-   Tailwind v4 with CSS variables for theming
-   Dark mode support via CSS vars (primary, secondary, accent, muted colors)
-   Utility-first: Avoid custom CSS files except [app/globals.css](app/globals.css)
-   Responsive: Mobile-first breakpoints (`md:`, `lg:`)
-   📘 See: [001-mobile-first-design.md](skills/001-mobile-first-design.md)

### Page Layouts

**Dashboard Pattern**: All dashboard pages use nested layout with sidebar

-   Layout: [app/dashboard/layout.tsx](app/dashboard/layout.tsx)
-   Sidebar: [components/layout/sidebar.tsx](components/layout/sidebar.tsx) (active link detection via `usePathname`)

## Key Workflows

### Development Commands

```bash
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build
pnpm prisma generate  # Regenerate Prisma Client
pnpm prisma migrate dev --name <name>  # Create & apply migration
pnpm prisma studio    # Open Prisma Studio GUI
```

### Creating New Features

1. Check [docs/backlog.md](docs/backlog.md) for planned features
2. Add/modify Prisma schema if needed → `pnpm prisma migrate dev`
3. Create API route in `app/api/` (use `auth()` for auth)
4. Build form component in `components/forms/`
5. Create page in `app/dashboard/[feature]/page.tsx`
6. Add navigation link to sidebar if applicable
7. Implement role-based access checks

### Database Queries Best Practices

```typescript
// Always scope by organization
const parishioners = await db.parishioner.findMany({
	where: { organizationId: session.user.organizationId },
	include: { organization: true },
});

// Feature toggle check
const settings = await db.organizationFeatureSettings.findUnique({
	where: { organizationId: session.user.organizationId },
});
if (!settings?.enableMassIntentions) {
	return new Response('Feature disabled', { status: 403 });
}
```

## Critical Files

-   [docs/prd.md](docs/prd.md): Complete requirements, user personas, success metrics
-   [docs/schema.md](docs/schema.md): Annotated schema with business logic explanations
-   [prisma/schema.prisma](prisma/schema.prisma): Source of truth for data models
-   [auth.ts](auth.ts): Auth.js configuration
-   [types/next-auth.d.ts](types/next-auth.d.ts): Auth.js session/user type extensions
-   [lib/db.ts](lib/db.ts): Database client with NeonDB adapter

## Don't Forget

-   **Multi-tenancy**: Never query across organizations without explicit permission checks
-   **Feature toggles**: Check `OrganizationFeatureSettings` before showing/executing features
-   **Session data**: Use `session.user.organizationId` and `session.user.role` for scoping
-   **Type safety**: Leverage Prisma types; avoid `any`
-   **Path aliases**: Use `@/` for imports (maps to project root)
