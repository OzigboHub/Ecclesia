# Skill: Server Components vs Client Components

## Metadata

-   **ID**: `ecclesia.components.server_vs_client`
-   **Version**: 1.0.0
-   **Category**: Framework
-   **Priority**: Critical

## Purpose

Use Server Components by default for better performance and security. Only use Client Components when interactivity (state, effects, event handlers, browser APIs) is required.

## When to Use

-   Creating any new component
-   Deciding where to place data fetching logic
-   Optimizing bundle size
-   Implementing interactive features

## Constraints

-   **Server Components are the default** — no directive needed
-   **Client Components require `'use client'`** at the top of the file
-   **Never import server-only code into Client Components**
-   **Minimize the Client Component boundary** — push `'use client'` as far down as possible
-   **Server Components can import Client Components**, but not vice versa for server-only code

## Decision Matrix

| Feature Needed                          | Component Type                                |
| --------------------------------------- | --------------------------------------------- |
| Display static data                     | Server                                        |
| Fetch data from database                | Server                                        |
| Access backend resources                | Server                                        |
| Keep sensitive info (API keys, tokens)  | Server                                        |
| Use `useState`                          | Client                                        |
| Use `useEffect`                         | Client                                        |
| Event handlers (`onClick`, `onChange`)  | Client                                        |
| Browser APIs (`localStorage`, `window`) | Client                                        |
| Use context providers                   | Client (provider), can wrap Server (children) |
| Use React hooks                         | Client (most hooks)                           |
| Real-time updates                       | Client                                        |

## Server Component Pattern

```tsx
// app/dashboard/parishioners/page.tsx
// No 'use client' directive = Server Component by default

import { getParishioners } from '@/app/actions/parishioner.actions';
import { ParishionerCard } from '@/components/features/parishioners/parishioner-card';

export default async function ParishionersPage() {
	// ✅ Can fetch data directly
	const result = await getParishioners();

	// ✅ Can access server-side resources
	// ✅ Can use async/await at component level

	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{result.data?.map((parishioner) => (
				// Can pass data to Client Components as props
				<ParishionerCard
					key={parishioner.id}
					parishioner={parishioner}
				/>
			))}
		</div>
	);
}
```

## Client Component Pattern

```tsx
// components/features/parishioners/parishioner-card.tsx
'use client'; // ✅ Required for interactivity

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteParishioner } from '@/app/actions/parishioner.actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ParishionerCardProps {
	parishioner: Parishioner;
}

export function ParishionerCard({ parishioner }: ParishionerCardProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await deleteParishioner(parishioner.id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			toast.error(result.message);
		}
		setIsDeleting(false);
	};

	return (
		<div className='rounded-lg border p-4'>
			<h3 className='font-semibold'>{parishioner.name}</h3>
			<p className='text-sm text-muted-foreground'>{parishioner.email}</p>
			<Button
				variant='destructive'
				size='sm'
				onClick={handleDelete} // ✅ Event handler requires Client Component
				disabled={isDeleting}
			>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</div>
	);
}
```

## Minimizing Client Boundary Pattern

Push `'use client'` as deep as possible in the component tree:

```tsx
// ❌ WRONG: Entire page is Client Component
'use client';

export default function PaymentsPage() {
	const [filter, setFilter] = useState('all');

	return (
		<div>
			<h1>Payments</h1> {/* This doesn't need to be client */}
			<FilterButtons
				filter={filter}
				setFilter={setFilter}
			/>
			<PaymentList filter={filter} /> {/* This could be server */}
		</div>
	);
}

// ✅ CORRECT: Only interactive part is Client Component
// app/dashboard/payments/page.tsx (Server Component)
import { PaymentFilters } from '@/components/features/payments/payment-filters';
import { getPayments } from '@/app/actions/payment.actions';

export default async function PaymentsPage() {
	const result = await getPayments();

	return (
		<div>
			<h1>Payments</h1> {/* Server-rendered */}
			<PaymentFilters /> {/* Client Component - only this needs interactivity */}
			<PaymentList payments={result.data} /> {/* Server-rendered */}
		</div>
	);
}

// components/features/payments/payment-filters.tsx
('use client');

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function PaymentFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [filter, setFilter] = useState(searchParams.get('status') ?? 'all');

	const handleFilterChange = (newFilter: string) => {
		setFilter(newFilter);
		router.push(`?status=${newFilter}`);
	};

	return (
		<div className='flex gap-2'>
			{['all', 'pending', 'completed'].map((f) => (
				<Button
					key={f}
					variant={filter === f ? 'default' : 'outline'}
					onClick={() => handleFilterChange(f)}
				>
					{f}
				</Button>
			))}
		</div>
	);
}
```

## Composition Pattern: Server Parent + Client Child

```tsx
// app/dashboard/page.tsx (Server Component)
import { getDashboardStats } from '@/app/actions/dashboard.actions';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentActivity } from '@/components/features/dashboard/recent-activity';
import { QuickActions } from '@/components/features/dashboard/quick-actions';

export default async function DashboardPage() {
	// Fetch data on server
	const stats = await getDashboardStats();

	return (
		<div className='space-y-6'>
			{/* Server-rendered static display */}
			<StatsCards stats={stats.data} />

			{/* Client Component for interactive filtering */}
			<RecentActivity />

			{/* Client Component for buttons/actions */}
			<QuickActions />
		</div>
	);
}
```

## Passing Server Data to Client Components

```tsx
// ✅ CORRECT: Serialize data and pass as props
// Server Component
async function ServerParent() {
	const data = await fetchData();
	return <ClientChild data={data} />; // Must be serializable
}

// Client Component
('use client');
function ClientChild({ data }: { data: SerializableData }) {
	// Use data from server
	return <div>{data.name}</div>;
}

// ❌ WRONG: Passing non-serializable data
async function ServerParent() {
	const data = await fetchData();
	return (
		<ClientChild
			data={data}
			onClick={() => {}} // Functions can't be serialized!
		/>
	);
}
```

## Context Providers Pattern

```tsx
// components/providers/theme-provider.tsx
'use client';

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState('light');

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children} {/* Can be Server Components */}
		</ThemeContext.Provider>
	);
}

// app/layout.tsx (can still be Server Component)
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html>
			<body>
				<ThemeProvider>
					{children} {/* Server Components work here */}
				</ThemeProvider>
			</body>
		</html>
	);
}
```

## What You Cannot Do

```tsx
// ❌ WRONG: Using hooks in Server Component
export default async function Page() {
	const [state, setState] = useState(); // Error!
	useEffect(() => {}); // Error!
}

// ❌ WRONG: Event handlers in Server Component
export default function Page() {
	return <button onClick={() => {}}>Click</button>; // Error!
}

// ❌ WRONG: Importing server-only code in Client Component
('use client');
import db from '@/lib/db'; // Error! Prisma can't run on client

// ❌ WRONG: Using browser APIs in Server Component
export default function Page() {
	const width = window.innerWidth; // Error! No window on server
}
```

## Testing Checklist

-   [ ] Server Components have no `'use client'` directive
-   [ ] Client Components only where interactivity needed
-   [ ] No useState/useEffect in Server Components
-   [ ] No event handlers in Server Components
-   [ ] No browser APIs in Server Components
-   [ ] No Prisma/DB imports in Client Components
-   [ ] Client boundary pushed as deep as possible

## Related Skills

-   `ecclesia.nextjs.app_router_only`
-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.architecture.separation_of_concerns`

## References

-   [components/auth/protected-route.tsx](../../components/auth/protected-route.tsx) (Client Component example)
-   [app/dashboard/layout.tsx](../../app/dashboard/layout.tsx) (Layout example)
-   [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
