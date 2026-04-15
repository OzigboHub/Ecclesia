---
title: Architecture Overview
description: System architecture, routing, and data flow patterns
section: architecture
order: 0
---

# Architecture Overview

Ecclesia DPM follows a modern Next.js architecture with server-first rendering, organization-scoped multi-tenancy, and role-based access control.

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                    Client                        │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Server      │  │ Client   │  │ Public     │ │
│  │ Components  │  │ Comps    │  │ Pages      │ │
│  └──────┬──────┘  └────┬─────┘  └─────┬──────┘ │
└─────────┼──────────────┼──────────────┼─────────┘
          │              │              │
┌─────────┼──────────────┼──────────────┼─────────┐
│         ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────┐    │
│  │         Server Actions / API Routes     │    │
│  │         (app/actions/ & app/api/)       │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │    Auth.js  │  Feature Toggles  │  RBAC │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │           Prisma ORM (lib/db.ts)        │    │
│  └──────────────────┬──────────────────────┘    │
│                 Server                           │
└─────────────────────┼───────────────────────────┘
                      │
            ┌─────────▼─────────┐
            │  NeonDB PostgreSQL │
            └───────────────────┘
```

## Route Groups

The application uses Next.js route groups to separate concerns:

### `(auth)` — Authentication

Unauthenticated routes for login, registration, and password management.

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`

### `(public)` — Public Pages

Publicly accessible pages with the marketing navbar and footer.

- `/` — Landing page
- `/p/[slug]` — Parish public profile
- `/mass` — Public mass schedule
- `/payments` — Online payment portal
- `/pricing` — Pricing information

### `(protected)` — Dashboard

Authenticated routes with sidebar navigation. All routes require an active session.

- `/dashboard` — Main dashboard
- `/parishioners` — Member management
- `/payments` — Financial management
- `/mass-intentions` — Intention booking
- `/appointments` — Appointment scheduling
- `/societies` — Society management
- `/settings` — Organization settings

## Data Flow

### Read Operations (Server Components)

```
Page (Server Component)
  → auth() to get session
  → db.model.findMany({ where: { organizationId } })
  → Render data directly in JSX
```

### Write Operations (Server Actions)

```
Form (Client Component)
  → User submits form
  → Calls server action from app/actions/
  → Server action validates with Zod
  → Checks auth & RBAC
  → Checks feature toggle
  → Performs Prisma mutation
  → Returns result
  → Client updates UI (revalidatePath or toast)
```

## Multi-Tenancy Model

Ecclesia uses **soft multi-tenancy** where all organizations share the same database, isolated by `organizationId` on every query.

```typescript
// Every database query MUST include organization scoping
const data = await db.parishioner.findMany({
  where: {
    organizationId: session.user.organizationId,
    // ...other filters
  },
});
```

Parish Admins can view data across their outstations. Outstation Admins can only view their own outstation's data.
