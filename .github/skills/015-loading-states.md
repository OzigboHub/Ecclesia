# Skill: Loading States with Skeleton

## Metadata

-   **ID**: `ecclesia.states.loading`
-   **Version**: 1.0.0
-   **Category**: UI States
-   **Priority**: High

## Purpose

Use shadcn Skeleton components for loading states. Never leave users staring at blank screens or wondering if something is happening. Provide meaningful loading feedback.

## Constraints

-   **Always show loading states** during data fetching
-   **Use Skeleton components** — not spinners for content areas
-   **Match content layout** — skeletons should mimic the real content
-   **Use Suspense boundaries** in Server Components
-   **Show progress** for long operations

## File Conventions

Next.js App Router provides special files for loading states:

```
app/
├── dashboard/
│   ├── page.tsx           # Main content
│   ├── loading.tsx        # Loading state (automatic Suspense)
│   └── parishioners/
│       ├── page.tsx
│       └── loading.tsx    # Route-specific loading
```

## Basic Loading Page

```tsx
// app/dashboard/parishioners/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
	return (
		<div className='space-y-6'>
			{/* Header skeleton */}
			<div className='flex items-center justify-between'>
				<div className='space-y-2'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-4 w-64' />
				</div>
				<Skeleton className='h-10 w-36' />
			</div>

			{/* Stats cards skeleton */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<Skeleton className='h-4 w-24' />
							<Skeleton className='h-4 w-4' />
						</CardHeader>
						<CardContent>
							<Skeleton className='h-8 w-20' />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className='h-6 w-40' />
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{/* Table header */}
						<div className='flex items-center gap-4 border-b pb-4'>
							<Skeleton className='h-4 w-4' />
							<Skeleton className='h-4 w-32' />
							<Skeleton className='h-4 w-24 ml-auto' />
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-4 w-16' />
						</div>
						{/* Table rows */}
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='flex items-center gap-4 py-2'
							>
								<Skeleton className='h-4 w-4' />
								<Skeleton className='h-4 w-40' />
								<Skeleton className='h-4 w-32 ml-auto' />
								<Skeleton className='h-6 w-16 rounded-full' />
								<Skeleton className='h-8 w-8 rounded' />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
```

## Skeleton Component

```tsx
// components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			className={cn('animate-pulse rounded-md bg-muted', className)}
			{...props}
		/>
	);
}
```

## Common Skeleton Patterns

```tsx
// Text line
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />

// Heading
<Skeleton className="h-8 w-48" />

// Avatar
<Skeleton className="h-10 w-10 rounded-full" />

// Button
<Skeleton className="h-10 w-24 rounded-md" />

// Card
<Skeleton className="h-32 w-full rounded-lg" />

// Badge
<Skeleton className="h-6 w-16 rounded-full" />

// Input
<Skeleton className="h-10 w-full rounded-md" />
```

## Table Loading State

```tsx
// components/ui/data-table-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableSkeletonProps {
	columns?: number;
	rows?: number;
}

export function DataTableSkeleton({
	columns = 5,
	rows = 10,
}: DataTableSkeletonProps) {
	return (
		<div className='rounded-md border'>
			<table className='w-full'>
				<thead>
					<tr className='border-b bg-muted/50'>
						{[...Array(columns)].map((_, i) => (
							<th
								key={i}
								className='h-12 px-4'
							>
								<Skeleton className='h-4 w-20' />
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{[...Array(rows)].map((_, rowIndex) => (
						<tr
							key={rowIndex}
							className='border-b'
						>
							{[...Array(columns)].map((_, colIndex) => (
								<td
									key={colIndex}
									className='p-4'
								>
									<Skeleton
										className='h-4'
										style={{
											width: `${
												60 + Math.random() * 40
											}%`,
										}}
									/>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
```

## Card Grid Loading State

```tsx
// components/ui/card-grid-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardGridSkeletonProps {
	count?: number;
}

export function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{[...Array(count)].map((_, i) => (
				<Card key={i}>
					<CardHeader className='space-y-2'>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-4 w-1/2' />
					</CardHeader>
					<CardContent className='space-y-3'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-5/6' />
						<div className='flex gap-2 pt-2'>
							<Skeleton className='h-6 w-16 rounded-full' />
							<Skeleton className='h-6 w-20 rounded-full' />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
```

## Form Loading State

```tsx
// components/ui/form-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
	return (
		<div className='space-y-6'>
			{/* Form fields */}
			{[...Array(4)].map((_, i) => (
				<div
					key={i}
					className='space-y-2'
				>
					<Skeleton className='h-4 w-24' /> {/* Label */}
					<Skeleton className='h-10 w-full' /> {/* Input */}
				</div>
			))}

			{/* Submit button */}
			<div className='flex justify-end gap-3 pt-4'>
				<Skeleton className='h-10 w-20' />
				<Skeleton className='h-10 w-28' />
			</div>
		</div>
	);
}
```

## Detail Page Loading State

```tsx
// app/dashboard/parishioners/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
	return (
		<div className='space-y-6'>
			{/* Back button and title */}
			<div className='flex items-center gap-4'>
				<Skeleton className='h-10 w-10 rounded' />
				<div className='space-y-2'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-4 w-32' />
				</div>
			</div>

			{/* Profile card */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-4'>
						<Skeleton className='h-20 w-20 rounded-full' />
						<div className='space-y-2'>
							<Skeleton className='h-6 w-40' />
							<Skeleton className='h-4 w-24' />
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-2'>
						{[...Array(6)].map((_, i) => (
							<div
								key={i}
								className='space-y-1'
							>
								<Skeleton className='h-4 w-20' />
								<Skeleton className='h-5 w-32' />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
```

## Suspense for Partial Loading

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import {
	StatsCards,
	StatsCardsSkeleton,
} from '@/components/dashboard/stats-cards';
import {
	RecentActivity,
	RecentActivitySkeleton,
} from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
	return (
		<div className='space-y-6'>
			{/* Quick actions load immediately (client component, no data) */}
			<QuickActions />

			{/* Stats cards - show skeleton while loading */}
			<Suspense fallback={<StatsCardsSkeleton />}>
				<StatsCards />
			</Suspense>

			{/* Recent activity - independent loading */}
			<Suspense fallback={<RecentActivitySkeleton />}>
				<RecentActivity />
			</Suspense>
		</div>
	);
}
```

## Client-Side Loading States

```tsx
// For client-side data fetching or mutations
'use client';

import { useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ParishionerDetails({ id }: { id: string }) {
	const [isPending, startTransition] = useTransition();

	const handleRefresh = () => {
		startTransition(async () => {
			await refreshData();
		});
	};

	return (
		<div className='relative'>
			{/* Overlay loading state */}
			{isPending && (
				<div className='absolute inset-0 bg-background/50 flex items-center justify-center z-10'>
					<Skeleton className='h-8 w-32' />
				</div>
			)}

			{/* Content */}
			<div className={isPending ? 'opacity-50' : ''}>{/* ... */}</div>
		</div>
	);
}
```

## Button Loading State

```tsx
// components/ui/button.tsx
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	loading?: boolean;
}

export function Button({ loading, disabled, children, ...props }: ButtonProps) {
	return (
		<button
			disabled={loading || disabled}
			{...props}
		>
			{loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
			{children}
		</button>
	);
}

// Usage
<Button loading={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>;
```

## Loading States by Context

```tsx
// Full page loading - use loading.tsx
// app/dashboard/parishioners/loading.tsx

// Partial section loading - use Suspense
<Suspense fallback={<CardSkeleton />}>
  <AsyncComponent />
</Suspense>

// Button/action loading - use isPending
<Button disabled={isPending}>
  {isPending ? 'Loading...' : 'Submit'}
</Button>

// Data refresh - overlay loading
{isRefreshing && <LoadingOverlay />}

// List/table loading - skeleton rows
<DataTableSkeleton rows={10} columns={5} />
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Generic spinner for content areas
<div className="flex items-center justify-center h-64">
  <Spinner />
</div>

// ✅ CORRECT: Skeleton matching content layout
<div className="space-y-4">
  <Skeleton className="h-8 w-48" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>

// ❌ WRONG: No loading state
async function getData() {
  const data = await fetch('/api/data')
  return <DataList data={data} />
  // Users see nothing while loading!
}

// ✅ CORRECT: loading.tsx or Suspense
// loading.tsx handles this automatically

// ❌ WRONG: Skeleton doesn't match content
<Skeleton className="h-4 w-full" />
// But actual content is a large card

// ✅ CORRECT: Skeleton matches content shape
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-40" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-32 w-full" />
  </CardContent>
</Card>
```

## Testing Checklist

-   [ ] Every page has a loading.tsx file
-   [ ] Skeletons match content layout
-   [ ] Suspense boundaries for partial loading
-   [ ] Buttons show loading state during actions
-   [ ] No blank screens during data fetching
-   [ ] Loading states are visually consistent

## Related Skills

-   `ecclesia.states.error_handling`
-   `ecclesia.states.empty_states`
-   `ecclesia.components.server_components`

## References

-   [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
-   [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton)
-   [app/dashboard/loading.tsx](../../app/dashboard/loading.tsx)
