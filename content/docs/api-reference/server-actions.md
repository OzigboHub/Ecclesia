---
title: Server Actions
description: Server action patterns and available mutations
section: api-reference
order: 1
---

# Server Actions

Ecclesia uses Next.js Server Actions for all data mutations. Server actions are defined in `app/actions/` and follow a consistent pattern.

## Action Files

| File                          | Domain                    |
| ----------------------------- | ------------------------- |
| `auth.actions.ts`             | Authentication & sessions |
| `parishioner.actions.ts`      | Parishioner CRUD          |
| `payment.actions.ts`          | Payment recording         |
| `mass-intention.actions.ts`   | Mass intention booking    |
| `appointment.actions.ts`      | Appointment management    |
| `organization.actions.ts`     | Organization settings     |
| `mass-schedule.actions.ts`    | Mass schedule management  |
| `announcement.actions.ts`     | Announcements             |
| `campaign.actions.ts`         | Donation campaigns        |
| `live-stream.actions.ts`      | Live streaming            |
| `event.actions.ts`            | Event management          |
| `dashboard.actions.ts`        | Dashboard data            |
| `parish-financial.actions.ts` | Financial reports         |
| `payment-type.actions.ts`     | Custom payment types      |
| `society.actions.ts`          | Society management        |
| `access.actions.ts`           | Access control            |
| `mass.actions.ts`             | Mass management           |

## Standard Action Pattern

Every server action follows this structure:

```typescript
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// 1. Define validation schema
const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

// 2. Define the action
export async function createResource(data: z.infer<typeof createSchema>) {
  // 3. Authenticate
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  // 4. Validate input
  const validated = createSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  // 5. Check feature toggle (if applicable)
  const settings = await db.organizationFeatureSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  });
  if (!settings?.enableFeatureName) {
    return { error: "Feature not enabled" };
  }

  // 6. Check role permissions (if applicable)
  const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
  if (!allowedRoles.includes(session.user.role)) {
    return { error: "Insufficient permissions" };
  }

  try {
    // 7. Perform mutation (always scope by organization)
    const result = await db.resource.create({
      data: {
        ...validated.data,
        organizationId: session.user.organizationId,
      },
    });

    // 8. Revalidate cached pages
    revalidatePath("/dashboard/resources");

    return { success: true, data: result };
  } catch (error) {
    return { error: "Failed to create resource" };
  }
}
```

## Calling Server Actions from Client Components

```tsx
"use client";

import { createResource } from "@/app/actions/resource.actions";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function CreateResourceForm() {
  const form = useForm();

  async function onSubmit(data: FormData) {
    const result = await createResource(data);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Resource created successfully");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>{/* form fields */}</form>
  );
}
```

## Error Handling

Server actions return a consistent shape:

```typescript
// Success
{ success: true, data: T }

// Error
{ error: string }
// or
{ error: Record<string, string[]> } // field-level errors
```
