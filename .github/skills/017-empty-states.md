# Skill: Empty States Pattern

## Metadata

-   **ID**: `ecclesia.states.empty_states`
-   **Version**: 1.0.0
-   **Category**: UI States
-   **Priority**: High

## Purpose

Provide clear empty states when no data is available. Never leave screens blank. Guide users with helpful messaging and actions to populate data.

## Constraints

-   **Never show blank screens** — always explain the empty state
-   **Provide context** — why is it empty?
-   **Include actions** — what can the user do?
-   **Use relevant icons** — visual cue for the state
-   **Differentiate states** — first use vs. filtered to zero vs. no results

## Basic Empty State Component

```tsx
// components/ui/empty-state.tsx
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center py-12 text-center',
				className
			)}
		>
			<div className='rounded-full bg-muted p-4'>
				<Icon className='h-10 w-10 text-muted-foreground' />
			</div>

			<h3 className='mt-4 text-lg font-semibold'>{title}</h3>
			<p className='mt-2 max-w-sm text-muted-foreground'>{description}</p>

			{action && (
				<div className='mt-6'>
					{action.href ? (
						<Button asChild>
							<Link href={action.href}>{action.label}</Link>
						</Button>
					) : (
						<Button onClick={action.onClick}>{action.label}</Button>
					)}
				</div>
			)}
		</div>
	);
}
```

## Empty State Types

### First Use (No Data Created Yet)

```tsx
// First time user, no parishioners exist
import { Users, UserPlus } from 'lucide-react';

<EmptyState
	icon={Users}
	title='No Parishioners Yet'
	description='Get started by adding your first parishioner to the parish register.'
	action={{
		label: 'Add Parishioner',
		href: '/dashboard/parishioners/new',
	}}
/>;

// First time, no payments recorded
import { DollarSign, Plus } from 'lucide-react';

<EmptyState
	icon={DollarSign}
	title='No Payments Recorded'
	description='Start tracking parish finances by recording your first payment.'
	action={{
		label: 'Record Payment',
		onClick: () => setShowPaymentForm(true),
	}}
/>;
```

### Filtered to Zero Results

```tsx
// Filters applied but no results match
import { Search, FilterX } from 'lucide-react'

<EmptyState
  icon={Search}
  title="No Results Found"
  description="No parishioners match your current filters. Try adjusting your search criteria."
  action={{
    label: 'Clear Filters',
    onClick: clearFilters,
  }}
/>

// Search with no matches
<EmptyState
  icon={Search}
  title={`No results for "${searchQuery}"`}
  description="Try a different search term or check for typos."
  action={{
    label: 'Clear Search',
    onClick: () => setSearchQuery(''),
  }}
/>
```

### Feature Not Enabled

```tsx
// Feature disabled for organization
import { Lock, Settings } from 'lucide-react';

<EmptyState
	icon={Lock}
	title='Feature Not Available'
	description='Mass intentions management is not enabled for your parish. Contact your administrator to enable this feature.'
	action={{
		label: 'Go to Settings',
		href: '/dashboard/settings',
	}}
/>;
```

### No Permission

```tsx
// User lacks permission
import { ShieldAlert } from 'lucide-react';

<EmptyState
	icon={ShieldAlert}
	title='Access Restricted'
	description="You don't have permission to view payment records. Contact your parish administrator for access."
/>;
```

## Usage in Data Lists

```tsx
// app/dashboard/parishioners/page.tsx
import { auth } from '@/auth';
import db from '@/lib/db';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';

interface ParishionersPageProps {
	searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function ParishionersPage({
	searchParams,
}: ParishionersPageProps) {
	const { search, status } = await searchParams;
	const session = await auth();

	const parishioners = await db.parishioner.findMany({
		where: {
			organizationId: session.user.organizationId,
			...(search && {
				OR: [
					{ firstName: { contains: search, mode: 'insensitive' } },
					{ lastName: { contains: search, mode: 'insensitive' } },
				],
			}),
			...(status && { status }),
		},
	});

	const hasFilters = search || status;

	return (
		<div className='space-y-6'>
			{/* Header and filters */}
			<ParishionerFilters />

			{/* Content */}
			{parishioners.length === 0 ? (
				hasFilters ? (
					// Filtered to zero
					<EmptyState
						icon={Search}
						title='No Results Found'
						description='No parishioners match your current filters.'
						action={{
							label: 'Clear Filters',
							href: '/dashboard/parishioners',
						}}
					/>
				) : (
					// No data at all
					<EmptyState
						icon={Users}
						title='No Parishioners Yet'
						description='Start building your parish register by adding your first parishioner.'
						action={{
							label: 'Add Parishioner',
							href: '/dashboard/parishioners/new',
						}}
					/>
				)
			) : (
				<DataTable
					columns={columns}
					data={parishioners}
				/>
			)}
		</div>
	);
}
```

## Table Empty State

```tsx
// components/ui/data-table.tsx
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';

interface DataTableProps<T> {
	columns: ColumnDef<T>[];
	data: T[];
	emptyState?: {
		icon: LucideIcon;
		title: string;
		description: string;
		action?: { label: string; href?: string; onClick?: () => void };
	};
}

export function DataTable<T>({ columns, data, emptyState }: DataTableProps<T>) {
	if (data.length === 0 && emptyState) {
		return (
			<div className='rounded-md border'>
				<EmptyState
					{...emptyState}
					className='py-16'
				/>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className='rounded-md border'>
				<EmptyState
					icon={Inbox}
					title='No Data'
					description="There's nothing to display here yet."
					className='py-16'
				/>
			</div>
		);
	}

	return (
		<div className='rounded-md border'>
			<table className='w-full'>{/* ... table content */}</table>
		</div>
	);
}
```

## Card Grid Empty State

```tsx
// When using card-based layouts
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Plus } from 'lucide-react';

export function AppointmentsGrid({ appointments }) {
	if (appointments.length === 0) {
		return (
			<EmptyState
				icon={Calendar}
				title='No Appointments Scheduled'
				description="You don't have any upcoming appointments. Schedule one to get started."
				action={{
					label: 'Schedule Appointment',
					onClick: () => setShowScheduleModal(true),
				}}
			/>
		);
	}

	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{appointments.map((appointment) => (
				<AppointmentCard
					key={appointment.id}
					appointment={appointment}
				/>
			))}
		</div>
	);
}
```

## Recent Activity Empty State

```tsx
// Dashboard recent activity section
import { Clock, ArrowRight } from 'lucide-react';

export function RecentActivity({ activities }) {
	if (activities.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col items-center justify-center py-8 text-center'>
						<Clock className='h-8 w-8 text-muted-foreground' />
						<p className='mt-2 text-sm text-muted-foreground'>
							No recent activity to show. Actions you take will
							appear here.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>{/* Activity list */}</CardContent>
		</Card>
	);
}
```

## Comments/Notes Empty State

```tsx
// When a detail view has no comments
import { MessageSquare, Plus } from 'lucide-react';

export function CommentsList({ comments, onAddComment }) {
	if (comments.length === 0) {
		return (
			<div className='rounded-lg border border-dashed p-6 text-center'>
				<MessageSquare className='mx-auto h-8 w-8 text-muted-foreground' />
				<p className='mt-2 text-sm font-medium'>No comments yet</p>
				<p className='text-sm text-muted-foreground'>
					Be the first to add a note.
				</p>
				<Button
					variant='outline'
					size='sm'
					className='mt-4'
					onClick={onAddComment}
				>
					<Plus className='mr-2 h-4 w-4' />
					Add Comment
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{comments.map((comment) => (
				<CommentCard
					key={comment.id}
					comment={comment}
				/>
			))}
		</div>
	);
}
```

## Feature-Specific Empty States

```tsx
// Parishioners
<EmptyState
  icon={Users}
  title="No Parishioners Yet"
  description="Build your parish community by registering parishioners."
  action={{ label: 'Add Parishioner', href: '/dashboard/parishioners/new' }}
/>

// Payments
<EmptyState
  icon={DollarSign}
  title="No Payments Recorded"
  description="Track parish finances by recording offerings, tithes, and donations."
  action={{ label: 'Record Payment', onClick: openPaymentModal }}
/>

// Mass Intentions
<EmptyState
  icon={Church}
  title="No Mass Intentions"
  description="Mass intentions submitted by parishioners will appear here."
/>

// Appointments
<EmptyState
  icon={CalendarDays}
  title="No Appointments"
  description="Schedule appointments for sacraments and pastoral meetings."
  action={{ label: 'Schedule Appointment', href: '/dashboard/appointments/new' }}
/>

// Organizations (Pious Societies)
<EmptyState
  icon={Building}
  title="No Organizations"
  description="Create pious organizations and societies for your parish."
  action={{ label: 'Create Organization', onClick: openOrgModal }}
/>

// Reports
<EmptyState
  icon={BarChart}
  title="No Data Available"
  description="Reports will appear once you have recorded parish activities."
/>
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Blank screen
{
	data.length === 0 && null;
}

// ✅ CORRECT: Show empty state
{
	data.length === 0 && (
		<EmptyState
			icon={Inbox}
			title='No Data'
			description="There's nothing here yet."
		/>
	);
}

// ❌ WRONG: Just text
{
	data.length === 0 && <p>No items found</p>;
}

// ✅ CORRECT: Full empty state with context and action
{
	data.length === 0 && (
		<EmptyState
			icon={Users}
			title='No Parishioners'
			description='Add parishioners to get started.'
			action={{ label: 'Add First', href: '/new' }}
		/>
	);
}

// ❌ WRONG: Same empty state for all scenarios
// Using generic "No data" everywhere

// ✅ CORRECT: Context-specific empty states
// Different for first-use vs filtered vs error
```

## Testing Checklist

-   [ ] Every list/table has empty state
-   [ ] Empty state explains why it's empty
-   [ ] Relevant action provided when applicable
-   [ ] Different states for first-use vs filtered
-   [ ] Icons match the context
-   [ ] No blank screens anywhere

## Related Skills

-   `ecclesia.states.loading`
-   `ecclesia.states.error_handling`
-   `ecclesia.styling.tailwind_shadcn`

## References

-   [components/ui/empty-state.tsx](../../components/ui/empty-state.tsx)
-   Design patterns for empty states
