---
title: Quick Start
description: Get started building with Ecclesia DPM in minutes
section: getting-started
order: 3
---

# Quick Start

This guide walks you through the essential concepts and patterns to start contributing to Ecclesia DPM.

## Project Structure

```
ecclesia-dpm/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Authentication pages (login, register)
│   ├── (protected)/           # Authenticated dashboard routes
│   ├── (public)/              # Public-facing pages
│   ├── actions/               # Server actions (mutations)
│   └── api/                   # API route handlers
├── components/                # React components
│   ├── ui/                    # shadcn/ui primitives
│   ├── forms/                 # Form components
│   ├── layout/                # Layout components (sidebar, navbar)
│   └── shared/                # Reusable cross-page components
├── content/                   # Documentation content (markdown)
├── docs/                      # Project documentation
│   └── epics/                 # Epic & user story files
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities, services, validators
│   ├── services/              # Database service layer
│   └── validators/            # Zod validation schemas
├── prisma/                    # Database schema & migrations
├── public/                    # Static assets
├── scripts/                   # Utility scripts
└── types/                     # TypeScript type definitions
```

## Key Concepts

### 1. Multi-Tenancy via Organizations

Every resource in Ecclesia is scoped to an **Organization** (Parish or Outstation). Organizations form a hierarchy:

```
Parish (parent)
├── Outstation A
├── Outstation B
└── Outstation C
```

Always filter queries by `organizationId` from the session:

```typescript
const parishioners = await db.parishioner.findMany({
  where: { organizationId: session.user.organizationId },
});
```

### 2. Server Components by Default

Use React Server Components for data fetching and static rendering. Only add `'use client'` when you need interactivity (state, effects, event handlers).

### 3. Server Actions for Mutations

All data mutations use Next.js Server Actions defined in `app/actions/`:

```typescript
"use server";

export async function createParishioner(data: CreateParishionerInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Validate, create, return
}
```

### 4. Feature Toggles

Features are controlled per-organization. Always check before showing or executing a feature:

```typescript
const settings = await db.organizationFeatureSettings.findUnique({
  where: { organizationId: session.user.organizationId },
});

if (!settings?.enableMassIntentions) {
  return { error: "Feature disabled" };
}
```

### 5. Role-Based Access Control

8 roles control access throughout the system:

| Role                     | Level      | Description                       |
| ------------------------ | ---------- | --------------------------------- |
| `SUPER_ADMIN`            | Platform   | Full system access                |
| `PARISH_ADMIN`           | Parish     | Parish priest, full parish access |
| `PARISH_SECRETARY`       | Parish     | Administrative support            |
| `PARISH_STAFF`           | Parish     | Limited operational access        |
| `OUTSTATION_ADMIN`       | Outstation | Outstation-level management       |
| `ORGANIZATION_PRESIDENT` | Society    | Pious organization leader         |
| `ORGANIZATION_SECRETARY` | Society    | Pious organization secretary      |
| `PARISHIONER`            | Self       | Self-service portal               |

## Creating a New Feature

1. Add/modify Prisma schema if needed → `pnpm prisma migrate dev`
2. Create server action in `app/actions/`
3. Build form component in `components/forms/`
4. Create page in `app/(protected)/[feature]/page.tsx`
5. Add navigation link to sidebar
6. Implement role-based access checks
7. Check feature toggle if applicable
