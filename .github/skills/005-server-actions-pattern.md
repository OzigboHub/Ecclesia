# Skill: Server Actions Pattern

## Metadata

-   **ID**: `ecclesia.actions.server_actions_pattern`
-   **Version**: 1.0.0
-   **Category**: Data Layer
-   **Priority**: Critical

## Purpose

Use Server Actions for ALL data fetching and mutations. Server Actions run on the server, providing security, direct database access, and automatic request deduplication.

## When to Use

-   Fetching data for pages
-   Creating, updating, or deleting records
-   Form submissions
-   Any operation that touches the database
-   Any operation requiring authentication/authorization

## Constraints

-   **All Server Actions must be in `app/actions/` directory**
-   **Never throw errors** — always return structured responses
-   **Always validate inputs with Zod**
-   **Always check authentication and authorization**
-   **Always scope queries by `organizationId`**
-   **Always check feature toggles when applicable**

## Structured Response Type

```tsx
// types/index.ts
export interface ActionResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	errors?: Record<string, string[]>;
}
```

## Server Action Template

```tsx
// app/actions/[domain].actions.ts
'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { createSchema, updateSchema } from '@/lib/validators/[domain].schema';
import type { ActionResponse } from '@/types';

// ============================================
// READ OPERATIONS
// ============================================

export async function getItems(): Promise<ActionResponse<Item[]>> {
	try {
		// 1. Authentication
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// 2. Feature toggle check (if applicable)
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});
		if (!settings?.enableFeatureName) {
			return { success: false, message: 'Feature not enabled' };
		}

		// 3. Data fetching (scoped by organization)
		const items = await db.item.findMany({
			where: { organizationId: session.user.organizationId },
			include: { relatedModel: true },
			orderBy: { createdAt: 'desc' },
		});

		return {
			success: true,
			message: 'Items retrieved successfully',
			data: items,
		};
	} catch (error) {
		console.error('Failed to get items:', error);
		return { success: false, message: 'Failed to retrieve items' };
	}
}

export async function getItem(id: string): Promise<ActionResponse<Item>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		const item = await db.item.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId, // ✅ Always scope!
			},
			include: { relatedModel: true },
		});

		if (!item) {
			return { success: false, message: 'Item not found' };
		}

		return { success: true, message: 'Item retrieved', data: item };
	} catch (error) {
		console.error('Failed to get item:', error);
		return { success: false, message: 'Failed to retrieve item' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createItem(
	formData: unknown
): Promise<ActionResponse<Item>> {
	try {
		// 1. Authentication
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// 2. Authorization (role check)
		const allowedRoles = ['PARISH_ADMIN', 'PARISH_SECRETARY'];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// 3. Validation with Zod
		const parsed = createSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// 4. Feature toggle check
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});
		if (!settings?.enableFeatureName) {
			return { success: false, message: 'Feature not enabled' };
		}

		// 5. Create record
		const item = await db.item.create({
			data: {
				...parsed.data,
				organizationId: session.user.organizationId,
				createdById: session.user.id,
			},
		});

		// 6. Revalidate cache
		revalidatePath('/dashboard/items');

		return {
			success: true,
			message: 'Item created successfully',
			data: item,
		};
	} catch (error) {
		console.error('Failed to create item:', error);
		return { success: false, message: 'Failed to create item' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateItem(
	id: string,
	formData: unknown
): Promise<ActionResponse<Item>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization
		const allowedRoles = ['PARISH_ADMIN', 'PARISH_SECRETARY'];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Validation
		const parsed = updateSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify ownership (organization scope)
		const existing = await db.item.findFirst({
			where: { id, organizationId: session.user.organizationId },
		});
		if (!existing) {
			return { success: false, message: 'Item not found' };
		}

		// Update
		const item = await db.item.update({
			where: { id },
			data: parsed.data,
		});

		revalidatePath('/dashboard/items');
		revalidatePath(`/dashboard/items/${id}`);

		return {
			success: true,
			message: 'Item updated successfully',
			data: item,
		};
	} catch (error) {
		console.error('Failed to update item:', error);
		return { success: false, message: 'Failed to update item' };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteItem(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can delete
		if (session.user.role !== 'PARISH_ADMIN') {
			return { success: false, message: 'Permission denied' };
		}

		// Verify ownership
		const existing = await db.item.findFirst({
			where: { id, organizationId: session.user.organizationId },
		});
		if (!existing) {
			return { success: false, message: 'Item not found' };
		}

		await db.item.delete({ where: { id } });

		revalidatePath('/dashboard/items');

		return { success: true, message: 'Item deleted successfully' };
	} catch (error) {
		console.error('Failed to delete item:', error);
		return { success: false, message: 'Failed to delete item' };
	}
}
```

## Calling Server Actions from Client Components

```tsx
// components/features/items/create-item-form.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createItem } from '@/app/actions/item.actions';
import {
	createItemSchema,
	type CreateItemInput,
} from '@/lib/validators/item.schema';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateItemForm() {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<CreateItemInput>({
		resolver: zodResolver(createItemSchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	const onSubmit = (data: CreateItemInput) => {
		startTransition(async () => {
			const result = await createItem(data);

			if (result.success) {
				toast.success(result.message);
				router.push('/dashboard/items');
				router.refresh();
			} else {
				toast.error(result.message);

				// Set field-level errors from server
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							form.setError(field as keyof CreateItemInput, {
								message: messages[0],
							});
						}
					);
				}
			}
		});
	};

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'
		>
			<Input
				{...form.register('name')}
				placeholder='Name'
				disabled={isPending}
			/>
			{form.formState.errors.name && (
				<p className='text-sm text-destructive'>
					{form.formState.errors.name.message}
				</p>
			)}

			<Button
				type='submit'
				disabled={isPending}
			>
				{isPending ? 'Creating...' : 'Create Item'}
			</Button>
		</form>
	);
}
```

## Calling Server Actions from Server Components

```tsx
// app/dashboard/items/page.tsx
import { getItems } from '@/app/actions/item.actions';
import { ItemList } from '@/components/features/items/item-list';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ItemsPage() {
	const result = await getItems();

	if (!result.success) {
		throw new Error(result.message);
	}

	if (!result.data?.length) {
		return (
			<EmptyState
				title='No items yet'
				description='Create your first item to get started'
				action={{ label: 'Create Item', href: '/dashboard/items/new' }}
			/>
		);
	}

	return <ItemList items={result.data} />;
}
```

## File Organization

```
app/actions/
├── auth.actions.ts          # Login, register, password reset
├── parishioner.actions.ts   # Parishioner CRUD
├── payment.actions.ts       # Payment recording and retrieval
├── mass-intention.actions.ts
├── appointment.actions.ts
├── organization.actions.ts  # Org settings, feature toggles
└── dashboard.actions.ts     # Dashboard stats and summaries
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Throwing errors
export async function createItem(data: unknown) {
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')  // Never throw!
  }
}

// ✅ CORRECT: Return structured response
export async function createItem(data: unknown): Promise<ActionResponse> {
  const session = await auth()
  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }
}

// ❌ WRONG: No validation
export async function createItem(data: ItemInput) {
  await db.item.create({ data })  // Trusting input directly!
}

// ❌ WRONG: No organization scoping
export async function getItems() {
  return db.item.findMany()  // Returns ALL items across orgs!
}

// ❌ WRONG: Server Action in component file
// components/features/items/item-list.tsx
'use server'  // Should be in app/actions/
export async function getItems() { ... }
```

## Testing Checklist

-   [ ] Server Action is in `app/actions/` directory
-   [ ] Uses `'use server'` directive
-   [ ] Returns `ActionResponse` type
-   [ ] Never throws errors
-   [ ] Validates input with Zod
-   [ ] Checks authentication
-   [ ] Checks authorization (roles)
-   [ ] Scopes queries by organizationId
-   [ ] Checks feature toggles when applicable
-   [ ] Calls `revalidatePath` after mutations

## Related Skills

-   `ecclesia.validation.zod_schemas`
-   `ecclesia.db.safe_query_pattern`
-   `ecclesia.rbac.authorize_route_handler`

## References

-   [auth.ts](../../auth.ts)
-   [lib/db.ts](../../lib/db.ts)
-   [prisma/schema.prisma](../../prisma/schema.prisma)
