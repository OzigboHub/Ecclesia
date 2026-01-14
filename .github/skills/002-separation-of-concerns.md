# Skill: Separation of Concerns

## Metadata

-   **ID**: `ecclesia.architecture.separation_of_concerns`
-   **Version**: 1.0.0
-   **Category**: Architecture
-   **Priority**: Critical

## Purpose

Maintain strict separation between UI, business logic, data access, and state management layers. This ensures code is modular, testable, maintainable, and scales with the team.

## When to Use

-   Designing new features
-   Refactoring existing code
-   Code review
-   Deciding where to place new files

## Constraints

-   **UI components** must not contain business logic or direct database calls
-   **Server Actions** handle all data mutations and fetching
-   **Prisma queries** are only called from Server Actions or server-side code
-   **Client components** only manage UI state and user interactions
-   **Zustand stores** manage global client state, not server data

## Project Structure (Domain-Based)

```
app/
├── (auth)/                    # Auth-related pages
│   ├── login/
│   └── register/
├── (dashboard)/               # Protected dashboard pages
│   ├── parishioners/
│   ├── payments/
│   ├── mass-intentions/
│   └── ...
├── actions/                   # 🔴 ALL Server Actions here
│   ├── parishioner.actions.ts
│   ├── payment.actions.ts
│   ├── auth.actions.ts
│   └── ...
├── api/                       # API routes (webhooks, external integrations)
│   └── auth/
└── layout.tsx

components/
├── ui/                        # 🟢 Reusable UI primitives (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── forms/                     # 🟡 Form components (use React Hook Form)
│   ├── parishioner-form.tsx
│   └── ...
├── layout/                    # 🟢 Layout components
│   ├── sidebar.tsx
│   └── header.tsx
├── features/                  # 🔵 Feature-specific components
│   ├── parishioners/
│   │   ├── parishioner-card.tsx
│   │   └── parishioner-list.tsx
│   └── payments/
│       ├── payment-card.tsx
│       └── payment-summary.tsx
└── providers/                 # Context providers
    └── auth-provider.tsx

lib/                           # 🟣 Shared utilities
├── db.ts                      # Prisma client singleton
├── utils.ts                   # Helper functions (cn, formatters)
├── validators/                # Zod schemas
│   ├── parishioner.schema.ts
│   └── payment.schema.ts
└── constants.ts               # App-wide constants

store/                         # 🟠 Zustand stores
├── ui.store.ts                # UI state (sidebar, modals)
└── preferences.store.ts       # User preferences

types/                         # TypeScript definitions
├── next-auth.d.ts
└── index.ts
```

## Layer Responsibilities

### Layer 1: UI Components (`components/ui/`)

**Responsibility**: Render visual elements, accept props, emit events
**Must NOT**:

-   Fetch data
-   Call Server Actions directly
-   Contain business logic
-   Access Prisma or database

```tsx
// ✅ CORRECT: Pure UI component
export function PaymentCard({ amount, date, status }: PaymentCardProps) {
	return (
		<div className='rounded-lg border p-4'>
			<p className='text-lg font-bold'>₦{amount.toLocaleString()}</p>
			<p className='text-sm text-muted-foreground'>{date}</p>
			<Badge variant={status === 'completed' ? 'success' : 'warning'}>
				{status}
			</Badge>
		</div>
	);
}
```

### Layer 2: Feature Components (`components/features/`)

**Responsibility**: Compose UI components, handle user interactions, call Server Actions
**Must NOT**:

-   Access Prisma directly
-   Contain complex business logic (delegate to Server Actions)

```tsx
'use client';

import { useTransition } from 'react';
import { createPayment } from '@/app/actions/payment.actions';
import { PaymentForm } from '@/components/forms/payment-form';
import { toast } from 'sonner';

export function CreatePaymentFeature() {
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (data: PaymentFormData) => {
		startTransition(async () => {
			const result = await createPayment(data);
			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<PaymentForm
			onSubmit={handleSubmit}
			isLoading={isPending}
		/>
	);
}
```

### Layer 3: Server Actions (`app/actions/`)

**Responsibility**: Business logic, validation, authorization, database operations
**Must**:

-   Validate all inputs with Zod
-   Check authentication and authorization
-   Scope queries by organizationId
-   Return structured responses
-   Handle errors gracefully (never throw)

```tsx
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import { paymentSchema } from '@/lib/validators/payment.schema';
import { ActionResponse } from '@/types';

export async function createPayment(data: unknown): Promise<ActionResponse> {
	// 1. Authentication
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// 2. Validation
	const parsed = paymentSchema.safeParse(data);
	if (!parsed.success) {
		return {
			success: false,
			message: 'Validation failed',
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	// 3. Authorization (role check)
	const allowedRoles = ['PARISH_ADMIN', 'PARISH_SECRETARY', 'PARISH_STAFF'];
	if (!allowedRoles.includes(session.user.role)) {
		return { success: false, message: 'Permission denied' };
	}

	// 4. Business logic + Database operation
	try {
		const payment = await db.payment.create({
			data: {
				...parsed.data,
				organizationId: session.user.organizationId,
				recordedById: session.user.id,
			},
		});

		return {
			success: true,
			message: 'Payment recorded successfully',
			data: payment,
		};
	} catch (error) {
		console.error('Payment creation failed:', error);
		return { success: false, message: 'Failed to record payment' };
	}
}
```

### Layer 4: Database Access (`lib/db.ts`)

**Responsibility**: Provide type-safe Prisma client
**Must NOT**: Be imported in client components

```tsx
// lib/db.ts - ONLY import in server-side code
import { PrismaClient } from '@prisma/client';
// ... (existing singleton pattern)
```

### Layer 5: State Management (`store/`)

**Responsibility**: Global UI state, user preferences, client-side caching
**Must NOT**: Replace server data fetching

```tsx
// store/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			sidebarOpen: true,
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
		}),
		{ name: 'ui-storage' }
	)
);
```

## Decision Matrix

| Need                    | Where to Put It                |
| ----------------------- | ------------------------------ |
| Render UI               | `components/ui/`               |
| Form with validation    | `components/forms/`            |
| Feature-specific UI     | `components/features/`         |
| Data fetching           | `app/actions/` (Server Action) |
| Data mutation           | `app/actions/` (Server Action) |
| Input validation schema | `lib/validators/`              |
| Database query          | Inside Server Action only      |
| Global UI state         | `store/` (Zustand)             |
| Helper function         | `lib/utils.ts`                 |
| Constants               | `lib/constants.ts`             |
| Type definitions        | `types/`                       |

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Database call in component
export function PaymentList() {
	const payments = await db.payment.findMany(); // Never do this!
	return <div>...</div>;
}

// ❌ WRONG: Business logic in UI component
export function PaymentCard({ payment }) {
	const isOverdue =
		payment.dueDate < new Date() && payment.status === 'pending';
	const fee = payment.amount * 0.015; // Business logic leaked!
	return <div>...</div>;
}

// ✅ CORRECT: Delegate to Server Action, receive computed data
export function PaymentCard({ payment, isOverdue, fee }: ComputedPaymentProps) {
	return <div>...</div>;
}
```

## Testing Checklist

-   [ ] UI components have no data fetching logic
-   [ ] Server Actions handle all mutations
-   [ ] Validation schemas are in `lib/validators/`
-   [ ] No Prisma imports in client components
-   [ ] Zustand only manages UI/preference state

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.db.safe_query_pattern`
-   `ecclesia.state.zustand_patterns`

## References

-   [app/actions/](../../app/actions/) (to be created)
-   [lib/db.ts](../../lib/db.ts)
-   [components/](../../components/)
