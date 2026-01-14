# Skill: Sonner Toast Notifications

## Metadata

-   **ID**: `ecclesia.feedback.sonner_toast`
-   **Version**: 1.0.0
-   **Category**: User Feedback
-   **Priority**: High

## Purpose

Use Sonner for all toast notifications. Display user feedback for action results, errors, and important information. Never leave users wondering if their action succeeded.

## Constraints

-   **Always show feedback** after Server Actions
-   **Use appropriate toast types** — success, error, warning, info
-   **Keep messages concise** — max 2 sentences
-   **Include actions when helpful** — undo, retry, view
-   **Don't overuse** — not every action needs a toast

## Setup

```tsx
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				{children}
				<Toaster
					position='top-right'
					richColors
					closeButton
					duration={4000}
				/>
			</body>
		</html>
	);
}
```

## Basic Usage

```tsx
'use client';

import { toast } from 'sonner';

// Success toast
toast.success('Parishioner created successfully');

// Error toast
toast.error('Failed to create parishioner');

// Warning toast
toast.warning('This action cannot be undone');

// Info toast
toast.info('Your session will expire in 5 minutes');

// Loading toast (auto-dismiss on completion)
toast.loading('Creating parishioner...');
```

## Server Action Feedback Pattern

```tsx
// components/forms/parishioner-form.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createParishioner } from '@/app/actions/parishioner.actions';

export function ParishionerForm() {
	const [isPending, startTransition] = useTransition();

	const onSubmit = (data: CreateParishionerInput) => {
		startTransition(async () => {
			const result = await createParishioner(data);

			if (result.success) {
				toast.success(result.message);
				// e.g., "Parishioner created successfully"
			} else {
				toast.error(result.message);
				// e.g., "Failed to create parishioner. Please try again."
			}
		});
	};

	// ...
}
```

## Promise-based Toast Pattern

```tsx
// For async operations with automatic loading/success/error states
'use client';

import { toast } from 'sonner';

async function handleExport() {
	toast.promise(exportPayments(), {
		loading: 'Exporting payments...',
		success: 'Payments exported successfully',
		error: 'Failed to export payments',
	});
}

async function handleBulkDelete(ids: string[]) {
	toast.promise(deleteParishioners(ids), {
		loading: `Deleting ${ids.length} parishioners...`,
		success: (result) => `${result.deletedCount} parishioners deleted`,
		error: (err) => err.message || 'Failed to delete parishioners',
	});
}
```

## Toast with Description

```tsx
// When more context is helpful
toast.success('Payment recorded', {
	description: 'Transaction ID: TXN-2024-001234',
});

toast.error('Payment failed', {
	description:
		'Your card was declined. Please try a different payment method.',
});

toast.warning('Low balance', {
	description: 'Your account balance is below ₦10,000.',
});
```

## Toast with Action

```tsx
// Undo action
toast.success('Parishioner archived', {
	action: {
		label: 'Undo',
		onClick: () => restoreParishioner(id),
	},
});

// View result
toast.success('Report generated', {
	action: {
		label: 'View',
		onClick: () => window.open(reportUrl),
	},
});

// Retry action
toast.error('Failed to sync data', {
	action: {
		label: 'Retry',
		onClick: () => syncData(),
	},
});
```

## Toast with Custom Duration

```tsx
// Longer duration for important messages
toast.warning('Your session will expire in 5 minutes', {
	duration: 10000, // 10 seconds
});

// Persistent toast (requires manual dismiss)
toast.error('Connection lost', {
	duration: Infinity,
	action: {
		label: 'Reconnect',
		onClick: () => reconnect(),
	},
});

// Quick feedback
toast.success('Copied!', {
	duration: 2000, // 2 seconds
});
```

## Custom Toast ID (Prevent Duplicates)

```tsx
// Prevent multiple identical toasts
toast.loading('Saving...', { id: 'save-toast' });

// Update existing toast
toast.success('Saved!', { id: 'save-toast' });

// Dismiss specific toast
toast.dismiss('save-toast');
```

## Message Guidelines

```tsx
// ✅ Good messages - clear, actionable
toast.success('Parishioner created successfully');
toast.error('Failed to save. Please try again.');
toast.warning('This will permanently delete 5 records.');
toast.info('Your changes have been saved as draft.');

// ❌ Bad messages - vague, technical, too long
toast.success('Operation completed'); // Too vague
toast.error('Error: SQLITE_CONSTRAINT_UNIQUE'); // Too technical
toast.info('The system has detected that you have made changes...'); // Too long
```

## Usage by Action Type

```tsx
// Create actions
toast.success('Parishioner created successfully');
toast.error('Failed to create parishioner');

// Update actions
toast.success('Changes saved');
toast.error('Failed to save changes');

// Delete actions
toast.success('Parishioner deleted');
toast.error('Failed to delete parishioner');

// Bulk actions
toast.success(`${count} parishioners archived`);
toast.error(`Failed to archive parishioners`);

// Form validation
toast.error('Please fill in all required fields');

// Authentication
toast.success('Welcome back!');
toast.error('Invalid credentials');
toast.warning('Session expired. Please log in again.');

// Network/System
toast.error('Network error. Please check your connection.');
toast.info('Reconnected successfully');
```

## Integration with Server Actions

```tsx
// app/actions/parishioner.actions.ts
'use server';

export async function createParishioner(data: CreateParishionerInput) {
	// ... validation and database operations

	return {
		success: true,
		message: 'Parishioner created successfully', // Use this in toast
		data: parishioner,
	};
}

// Component usage
const result = await createParishioner(data);

if (result.success) {
	toast.success(result.message); // "Parishioner created successfully"
} else {
	toast.error(result.message); // "Failed to create parishioner"
}
```

## Delete Confirmation Pattern

```tsx
'use client';

import { toast } from 'sonner';
import { deleteParishioner } from '@/app/actions/parishioner.actions';

function DeleteButton({ id, name }: { id: string; name: string }) {
	const handleDelete = async () => {
		// Show confirmation toast
		toast.warning(`Delete ${name}?`, {
			description: 'This action cannot be undone.',
			action: {
				label: 'Delete',
				onClick: async () => {
					const result = await deleteParishioner(id);
					if (result.success) {
						toast.success(result.message);
					} else {
						toast.error(result.message);
					}
				},
			},
			cancel: {
				label: 'Cancel',
				onClick: () => {},
			},
		});
	};

	return (
		<Button
			variant='destructive'
			onClick={handleDelete}
		>
			Delete
		</Button>
	);
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: No feedback after action
const result = await createParishioner(data)
// User has no idea if it worked!

// ✅ CORRECT: Always show feedback
const result = await createParishioner(data)
if (result.success) {
  toast.success(result.message)
} else {
  toast.error(result.message)
}

// ❌ WRONG: Toast for every tiny action
<input onChange={() => toast.info('Field updated')} />

// ✅ CORRECT: Toast for significant actions only
<form onSubmit={() => {
  const result = await saveForm()
  toast.success('Form saved')
}}>

// ❌ WRONG: Alert/console instead of toast
alert('Saved!')
console.log('Error:', error)

// ✅ CORRECT: Use toast
toast.success('Saved!')
toast.error('Something went wrong')

// ❌ WRONG: Generic messages
toast.error('Error')
toast.success('Success')

// ✅ CORRECT: Specific messages
toast.error('Failed to save payment')
toast.success('Payment recorded successfully')
```

## Toaster Configuration Options

```tsx
// app/layout.tsx
<Toaster
	position='top-right' // Position on screen
	richColors // Enhanced colors for types
	closeButton // Show close button
	duration={4000} // Default duration (ms)
	visibleToasts={5} // Max visible at once
	expand={false} // Expand on hover
	toastOptions={{
		classNames: {
			toast: 'bg-background border-border',
			title: 'text-foreground',
			description: 'text-muted-foreground',
			actionButton: 'bg-primary text-primary-foreground',
			cancelButton: 'bg-muted text-muted-foreground',
		},
	}}
/>
```

## Testing Checklist

-   [ ] Success toast shown after create/update/delete
-   [ ] Error toast shown on failure
-   [ ] Messages are clear and actionable
-   [ ] No duplicate/excessive toasts
-   [ ] Actions (undo/retry) included when appropriate
-   [ ] Loading state for long operations

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.forms.react_hook_form`
-   `ecclesia.feedback.error_handling`

## References

-   [Sonner Docs](https://sonner.emilkowal.ski/)
-   [app/layout.tsx](../../app/layout.tsx)
