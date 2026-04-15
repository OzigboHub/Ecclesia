---
title: Coding Standards
description: Project conventions, naming rules, and development guidelines
section: development
order: 1
---

# Coding Standards

Ecclesia follows strict coding conventions to maintain consistency and quality across the codebase.

## Naming Conventions

| Target             | Convention                       | Example                 |
| ------------------ | -------------------------------- | ----------------------- |
| Folders            | kebab-case                       | `mass-intentions/`      |
| Files (multi-word) | kebab-case                       | `user-card.tsx`         |
| Hooks              | camelCase with `use` prefix      | `useFeatureSettings.ts` |
| Server actions     | camelCase, verb-first            | `createPayment.ts`      |
| Constants          | UPPER_SNAKE_CASE                 | `PAYMENT_PURPOSES`      |
| Types/Interfaces   | PascalCase                       | `PaymentRecord`         |
| Variables          | camelCase                        | `activeParishioners`    |
| Booleans           | `is`/`has`/`should`/`can` prefix | `isActive`              |

## Import Aliases

Always use the `@/` path alias:

```typescript
// ✅ Correct
import db from "@/lib/db";
import { Button } from "@/components/ui/button";

// ❌ Wrong
import db from "../../../lib/db";
```

## Component Patterns

### Server Components (Default)

No directive needed. Use for data fetching and static content:

```tsx
// app/dashboard/parishioners/page.tsx
import { auth } from "@/auth";
import db from "@/lib/db";

export default async function ParishionersPage() {
  const session = await auth();
  const parishioners = await db.parishioner.findMany({
    where: { organizationId: session!.user.organizationId },
  });

  return <ParishionerList data={parishioners} />;
}
```

### Client Components

Add `'use client'` only when interactivity is required:

```tsx
"use client";

import { useState } from "react";

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  // ...
}
```

### Style Composition with `cn()`

```tsx
import { cn } from "@/lib/utils";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border bg-card p-4", className)}
      {...props}
    />
  );
}
```

## Form Patterns

Forms use React Hook Form + Zod validation:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## File Organization

```
app/actions/          → Server actions (verb-first filenames)
app/(auth)/           → Login, register, password reset
app/(public)/         → Public-facing routes
app/(protected)/      → Authenticated dashboard routes
components/ui/        → shadcn/ui primitives
components/forms/     → Form components
components/layout/    → Layout (sidebar, navbar, footer)
components/shared/    → Reusable cross-page components
hooks/                → Custom hooks
lib/                  → Utilities, DB client, validators
lib/services/         → Database service layer
lib/validators/       → Zod schemas
types/                → TypeScript type definitions
```

## Git Conventions

- Feature branches: `feature/descriptive-name`
- Bug fixes: `fix/descriptive-name`
- Commits: conventional commits (e.g., `feat:`, `fix:`, `chore:`)
