---
title: Database Patterns
description: Prisma ORM patterns, queries, and best practices
section: api-reference
order: 3
---

# Database Patterns

Ecclesia uses Prisma ORM with NeonDB (serverless PostgreSQL). The database client is a singleton configured in `lib/db.ts`.

## Client Setup

```typescript
import db from "@/lib/db";

// The client handles WebSocket connections for NeonDB
// Always import from @/lib/db, never instantiate directly
```

## Query Patterns

### Always Scope by Organization

Every query **must** include organization scoping:

```typescript
// ✅ Correct — scoped to organization
const parishioners = await db.parishioner.findMany({
  where: { organizationId: session.user.organizationId },
});

// ❌ Wrong — fetches across all organizations
const parishioners = await db.parishioner.findMany();
```

### Include Relations Explicitly

```typescript
const parishioner = await db.parishioner.findUnique({
  where: { id: parishionerId },
  include: {
    organization: true,
    payments: true,
    sacraments: true,
    societyMemberships: {
      include: { society: true },
    },
  },
});
```

### Pagination

```typescript
const pageSize = 20;
const page = 1;

const [parishioners, total] = await Promise.all([
  db.parishioner.findMany({
    where: { organizationId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  }),
  db.parishioner.count({
    where: { organizationId },
  }),
]);
```

### Transactions

Use transactions for multi-table updates:

```typescript
const result = await db.$transaction(async (tx) => {
  const payment = await tx.payment.create({
    data: { amount: 2000, purpose: "MASS_INTENTION", ... },
  });

  const intention = await tx.massIntention.update({
    where: { id: intentionId },
    data: { paymentId: payment.id, status: "PAID" },
  });

  return { payment, intention };
});
```

### Search with Filters

```typescript
const parishioners = await db.parishioner.findMany({
  where: {
    organizationId,
    AND: [
      search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      gender ? { gender } : {},
    ],
  },
  orderBy: { lastName: "asc" },
});
```

## Schema Changes Workflow

1. Edit `prisma/schema.prisma`
2. Create migration: `pnpm prisma migrate dev --name descriptive-name`
3. Regenerate client: `pnpm prisma generate`
4. Update TypeScript types if needed
5. Update affected server actions and components

## Seeding

The seed script is at `prisma/seed.ts` and is configured in `package.json`:

```bash
pnpm prisma db seed
```

## Studio

Inspect and edit data visually:

```bash
pnpm prisma studio
```

Opens a browser-based GUI on `http://localhost:5555`.
