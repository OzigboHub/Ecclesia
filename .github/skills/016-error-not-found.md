# Skill: Error and Not-Found Handling

## Metadata

-   **ID**: `ecclesia.states.error_handling`
-   **Version**: 1.0.0
-   **Category**: UI States
-   **Priority**: High

## Purpose

Handle errors gracefully with proper error boundaries and not-found pages. Never show raw errors to users. Provide helpful error messages and recovery options.

## Constraints

-   **Never expose technical errors** to users
-   **Use error.tsx** for runtime errors
-   **Use not-found.tsx** for 404 states
-   **Provide recovery actions** — retry, go back, contact support
-   **Log errors** for debugging (server-side)

## File Conventions

```
app/
├── error.tsx              # Global error boundary
├── not-found.tsx          # Global 404 page
├── dashboard/
│   ├── error.tsx          # Dashboard-specific errors
│   ├── not-found.tsx      # Dashboard 404
│   └── parishioners/
│       ├── error.tsx      # Feature-specific errors
│       └── [id]/
│           └── not-found.tsx  # Individual resource 404
```

## Global Error Boundary

```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
	useEffect(() => {
		// Log error to error reporting service
		console.error('Application error:', error);
	}, [error]);

	return (
		<div className='flex min-h-[400px] flex-col items-center justify-center text-center'>
			<div className='rounded-full bg-destructive/10 p-4'>
				<AlertCircle className='h-12 w-12 text-destructive' />
			</div>

			<h1 className='mt-6 text-2xl font-bold'>Something went wrong</h1>
			<p className='mt-2 max-w-md text-muted-foreground'>
				We encountered an unexpected error. Please try again or contact
				support if the problem persists.
			</p>

			{/* Error digest for support reference */}
			{error.digest && (
				<p className='mt-2 text-xs text-muted-foreground'>
					Error ID: {error.digest}
				</p>
			)}

			<div className='mt-6 flex gap-4'>
				<Button
					onClick={reset}
					variant='default'
				>
					<RefreshCcw className='mr-2 h-4 w-4' />
					Try Again
				</Button>
				<Button
					asChild
					variant='outline'
				>
					<Link href='/dashboard'>
						<Home className='mr-2 h-4 w-4' />
						Go to Dashboard
					</Link>
				</Button>
			</div>
		</div>
	);
}
```

## Global Not Found Page

```tsx
// app/not-found.tsx
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center text-center px-4'>
			<div className='rounded-full bg-muted p-4'>
				<FileQuestion className='h-12 w-12 text-muted-foreground' />
			</div>

			<h1 className='mt-6 text-4xl font-bold'>404</h1>
			<h2 className='mt-2 text-xl font-semibold'>Page Not Found</h2>
			<p className='mt-2 max-w-md text-muted-foreground'>
				The page you're looking for doesn't exist or has been moved.
			</p>

			<div className='mt-6 flex gap-4'>
				<Button
					asChild
					variant='default'
				>
					<Link href='/dashboard'>
						<Home className='mr-2 h-4 w-4' />
						Go to Dashboard
					</Link>
				</Button>
				<Button
					asChild
					variant='outline'
				>
					<Link href='javascript:history.back()'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Go Back
					</Link>
				</Button>
			</div>
		</div>
	);
}
```

## Dashboard Error Boundary

```tsx
// app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCcw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error('Dashboard error:', error);
	}, [error]);

	return (
		<div className='flex items-center justify-center p-6'>
			<Card className='max-w-md'>
				<CardHeader className='text-center'>
					<div className='mx-auto rounded-full bg-destructive/10 p-3 w-fit'>
						<AlertCircle className='h-8 w-8 text-destructive' />
					</div>
					<CardTitle className='mt-4'>Dashboard Error</CardTitle>
				</CardHeader>
				<CardContent className='text-center space-y-4'>
					<p className='text-muted-foreground'>
						We couldn't load your dashboard data. This might be a
						temporary issue.
					</p>

					{error.digest && (
						<p className='text-xs text-muted-foreground bg-muted rounded p-2'>
							Reference: {error.digest}
						</p>
					)}

					<div className='flex flex-col gap-2'>
						<Button
							onClick={reset}
							className='w-full'
						>
							<RefreshCcw className='mr-2 h-4 w-4' />
							Retry
						</Button>
						<Button
							asChild
							variant='outline'
							className='w-full'
						>
							<Link href='/dashboard'>
								<Home className='mr-2 h-4 w-4' />
								Dashboard Home
							</Link>
						</Button>
						<Button
							asChild
							variant='ghost'
							className='w-full'
						>
							<Link href='/support'>
								<HelpCircle className='mr-2 h-4 w-4' />
								Contact Support
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
```

## Resource Not Found Pattern

```tsx
// app/dashboard/parishioners/[id]/page.tsx
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import db from '@/lib/db';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function ParishionerDetailPage({ params }: PageProps) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user?.organizationId) {
		notFound();
	}

	const parishioner = await db.parishioner.findFirst({
		where: {
			id,
			organizationId: session.user.organizationId, // Scoped to org
		},
	});

	// Trigger not-found.tsx
	if (!parishioner) {
		notFound();
	}

	return (
		<div>
			<h1>
				{parishioner.firstName} {parishioner.lastName}
			</h1>
			{/* ... */}
		</div>
	);
}
```

```tsx
// app/dashboard/parishioners/[id]/not-found.tsx
import { Button } from '@/components/ui/button';
import { UserX, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function ParishionerNotFound() {
	return (
		<div className='flex flex-col items-center justify-center py-12 text-center'>
			<div className='rounded-full bg-muted p-4'>
				<UserX className='h-10 w-10 text-muted-foreground' />
			</div>

			<h1 className='mt-6 text-xl font-bold'>Parishioner Not Found</h1>
			<p className='mt-2 max-w-sm text-muted-foreground'>
				This parishioner doesn't exist or you don't have permission to
				view them.
			</p>

			<div className='mt-6 flex gap-4'>
				<Button
					asChild
					variant='default'
				>
					<Link href='/dashboard/parishioners'>
						<Users className='mr-2 h-4 w-4' />
						All Parishioners
					</Link>
				</Button>
				<Button
					asChild
					variant='outline'
				>
					<Link href='javascript:history.back()'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Go Back
					</Link>
				</Button>
			</div>
		</div>
	);
}
```

## Server Action Error Handling

```tsx
// app/actions/parishioner.actions.ts
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import { createParishionerSchema } from '@/lib/validators/parishioner.schema';

export async function createParishioner(data: CreateParishionerInput) {
	try {
		const session = await auth();

		if (!session?.user?.organizationId) {
			return {
				success: false,
				message: 'You must be logged in to perform this action.',
			};
		}

		const validation = createParishionerSchema.safeParse(data);
		if (!validation.success) {
			return {
				success: false,
				message: 'Please check your input and try again.',
				errors: validation.error.flatten().fieldErrors,
			};
		}

		const parishioner = await db.parishioner.create({
			data: {
				...validation.data,
				organizationId: session.user.organizationId,
			},
		});

		return {
			success: true,
			message: 'Parishioner created successfully.',
			data: parishioner,
		};
	} catch (error) {
		// Log error for debugging
		console.error('Failed to create parishioner:', error);

		// Return user-friendly message
		return {
			success: false,
			message: 'Failed to create parishioner. Please try again.',
		};
	}
}
```

## Handling Errors in Client Components

```tsx
// components/features/parishioners/parishioner-form.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createParishioner } from '@/app/actions/parishioner.actions';

export function ParishionerForm() {
	const [isPending, startTransition] = useTransition();

	const onSubmit = (data: CreateParishionerInput) => {
		startTransition(async () => {
			try {
				const result = await createParishioner(data);

				if (result.success) {
					toast.success(result.message);
					// Handle success...
				} else {
					toast.error(result.message);
					// Handle field errors...
					if (result.errors) {
						Object.entries(result.errors).forEach(
							([field, messages]) => {
								setError(
									field as keyof CreateParishionerInput,
									{
										message: messages[0],
									}
								);
							}
						);
					}
				}
			} catch (error) {
				// Unexpected error (network issues, etc.)
				toast.error('An unexpected error occurred. Please try again.');
				console.error('Form submission error:', error);
			}
		});
	};

	// ...
}
```

## Error Message Guidelines

```tsx
// ✅ Good error messages - user-friendly
'Failed to save changes. Please try again.';
'This parishioner could not be found.';
"You don't have permission to perform this action.";
'Please check your internet connection and try again.';
'Session expired. Please log in again.';

// ❌ Bad error messages - technical jargon
'Error: SQLITE_CONSTRAINT_UNIQUE';
"TypeError: Cannot read property 'id' of undefined";
'500 Internal Server Error';
'Prisma error P2002: Unique constraint failed';
```

## Contextual Error Messages

```tsx
// Create operations
'Failed to create parishioner. Please try again.';
'Failed to record payment. Please verify the details.';

// Update operations
'Failed to save changes. Please try again.';
'Could not update the record. Please refresh and try again.';

// Delete operations
'Failed to delete. The record may be in use by other items.';
'Could not remove the parishioner. Please try again.';

// Authentication
'Invalid credentials. Please check your email and password.';
'Session expired. Please log in to continue.';

// Authorization
"You don't have permission to access this feature.";
'This action is restricted to administrators.';

// Network
'Connection failed. Please check your internet.';
'Request timed out. Please try again.';
```

## Feature-Specific Error Pages

```tsx
// app/dashboard/payments/error.tsx
'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, RefreshCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsError({ error, reset }: ErrorProps) {
	return (
		<div className='flex flex-col items-center justify-center py-12 text-center'>
			<div className='rounded-full bg-destructive/10 p-4'>
				<CreditCard className='h-10 w-10 text-destructive' />
			</div>

			<h1 className='mt-6 text-xl font-bold'>Payment Error</h1>
			<p className='mt-2 max-w-sm text-muted-foreground'>
				We couldn't load payment information. Your data is safe.
			</p>

			<div className='mt-6 flex gap-4'>
				<Button onClick={reset}>
					<RefreshCcw className='mr-2 h-4 w-4' />
					Try Again
				</Button>
				<Button
					asChild
					variant='outline'
				>
					<Link href='/dashboard'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Dashboard
					</Link>
				</Button>
			</div>
		</div>
	);
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Exposing raw errors
catch (error) {
  return { success: false, message: error.message }
  // Could expose: "Unique constraint failed on field: email"
}

// ✅ CORRECT: User-friendly message
catch (error) {
  console.error('Error:', error) // Log for debugging
  return { success: false, message: 'Failed to complete action. Please try again.' }
}

// ❌ WRONG: No error boundary
// Page crashes show Next.js default error

// ✅ CORRECT: error.tsx handles gracefully
// app/dashboard/error.tsx exists

// ❌ WRONG: Silent failures
try {
  await deleteItem(id)
} catch (error) {
  // Nothing - user has no idea what happened
}

// ✅ CORRECT: Always inform user
try {
  await deleteItem(id)
  toast.success('Deleted successfully')
} catch (error) {
  toast.error('Failed to delete. Please try again.')
}

// ❌ WRONG: Generic error pages everywhere
"Something went wrong"

// ✅ CORRECT: Context-specific messages
"Failed to load parishioner details"
"Payment could not be processed"
```

## Testing Checklist

-   [ ] Every route segment has error.tsx
-   [ ] Resource pages have not-found.tsx
-   [ ] Server Actions never throw (return structured response)
-   [ ] Error messages are user-friendly
-   [ ] Recovery actions provided (retry, go back)
-   [ ] Errors logged for debugging
-   [ ] No technical details exposed to users

## Related Skills

-   `ecclesia.states.loading`
-   `ecclesia.states.empty_states`
-   `ecclesia.actions.server_actions_pattern`

## References

-   [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
-   [Next.js Not Found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
-   [app/error.tsx](../../app/error.tsx)
