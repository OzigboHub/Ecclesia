# Skill: Performance Optimization

## Metadata

-   **ID**: `ecclesia.performance.optimization`
-   **Version**: 1.0.0
-   **Category**: Performance
-   **Priority**: High

## Purpose

Optimize for low-end mobile devices and slow networks. Avoid unnecessary client-side state, over-fetching, and duplicate requests. Build fast, responsive applications.

## Constraints

-   **Optimize for low-end mobile** — test on slow devices
-   **Avoid unnecessary client-side state** — prefer server state
-   **Minimize JavaScript bundle** — use Server Components
-   **Prevent duplicate requests** — cache and dedupe
-   **Lazy load** non-critical content
-   **Optimize images** — proper sizing and formats

## Server Components Over Client

```tsx
// ✅ PREFERRED: Server Component (zero JS shipped)
// app/dashboard/parishioners/page.tsx
import db from '@/lib/db';

export default async function ParishionersPage() {
	const parishioners = await db.parishioner.findMany();

	return (
		<div>
			{parishioners.map((p) => (
				<div key={p.id}>
					{p.firstName} {p.lastName}
				</div>
			))}
		</div>
	);
}

// ❌ AVOID: Client Component fetching (ships React + fetch code)
('use client');

import { useEffect, useState } from 'react';

export function ParishionersList() {
	const [data, setData] = useState([]);

	useEffect(() => {
		fetch('/api/parishioners')
			.then((r) => r.json())
			.then(setData);
	}, []);

	// ...
}
```

## Minimize Client Component Scope

```tsx
// ❌ WRONG: Entire page is client component
'use client';

export default function DashboardPage() {
	const [open, setOpen] = useState(false);

	return (
		<div>
			<h1>Dashboard</h1>
			<Stats /> {/* Ships as client JS */}
			<RecentActivity /> {/* Ships as client JS */}
			<Button onClick={() => setOpen(true)}>Add Item</Button>
			<Modal
				open={open}
				onClose={() => setOpen(false)}
			/>
		</div>
	);
}

// ✅ CORRECT: Only interactive parts are client components
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
	return (
		<div>
			<h1>Dashboard</h1>
			<Stats /> {/* Server Component */}
			<RecentActivity /> {/* Server Component */}
			<AddItemButton /> {/* Only this is client */}
		</div>
	);
}

// components/features/dashboard/add-item-button.tsx
('use client');
export function AddItemButton() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Add Item</Button>
			<Modal
				open={open}
				onClose={() => setOpen(false)}
			/>
		</>
	);
}
```

## Parallel Data Fetching

```tsx
// ❌ SLOW: Sequential fetches
export default async function DashboardPage() {
	const parishioners = await getParishioners(); // Wait...
	const payments = await getPayments(); // Then wait...
	const appointments = await getAppointments(); // Then wait...

	return <Dashboard data={{ parishioners, payments, appointments }} />;
}

// ✅ FAST: Parallel fetches
export default async function DashboardPage() {
	const [parishioners, payments, appointments] = await Promise.all([
		getParishioners(),
		getPayments(),
		getAppointments(),
	]);

	return <Dashboard data={{ parishioners, payments, appointments }} />;
}
```

## Streaming with Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
	return (
		<div className='space-y-6'>
			{/* Renders immediately */}
			<DashboardHeader />

			{/* Streams in when ready */}
			<Suspense fallback={<StatsSkeleton />}>
				<StatsCards />
			</Suspense>

			{/* Independent stream */}
			<Suspense fallback={<ActivitySkeleton />}>
				<RecentActivity />
			</Suspense>
		</div>
	);
}
```

## Data Caching

```tsx
// Next.js automatically caches fetch requests
// Use revalidate for cache control

// Cache for 1 hour
export const revalidate = 3600

// Or per-fetch
const data = await fetch('/api/data', {
  next: { revalidate: 3600 }
})

// Force no cache when needed
const data = await fetch('/api/data', {
  cache: 'no-store'
})

// Revalidate on demand
import { revalidatePath, revalidateTag } from 'next/cache'

// In Server Action
export async function createItem() {
  await db.item.create({ ... })
  revalidatePath('/dashboard/items')
}
```

## Avoid Duplicate State

```tsx
// ❌ WRONG: Duplicating server state in client
'use client';

export function ParishionersList({ initialData }) {
	const [parishioners, setParishioners] = useState(initialData);
	const [isRefetching, setIsRefetching] = useState(false);

	const refetch = async () => {
		setIsRefetching(true);
		const data = await fetch('/api/parishioners');
		setParishioners(await data.json());
		setIsRefetching(false);
	};

	// Now you have two sources of truth!
}

// ✅ CORRECT: Use router.refresh() for server data
('use client');

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function RefreshButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			onClick={() => startTransition(() => router.refresh())}
			disabled={isPending}
		>
			Refresh
		</Button>
	);
}
```

## Image Optimization

```tsx
// ✅ CORRECT: Use Next.js Image component
import Image from 'next/image'

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority={false}        // Don't prioritize below-fold images
  loading="lazy"          // Default for non-priority
  placeholder="blur"      // Show blur while loading
  blurDataURL="..."       // Base64 placeholder
/>

// For avatar/icons - use smaller sizes
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// ❌ WRONG: Regular img tag
<img src="/large-photo.jpg" alt="Photo" />
```

## Code Splitting with Dynamic Imports

```tsx
// ❌ WRONG: Import heavy component directly
import { HeavyChart } from '@/components/charts/heavy-chart';

// ✅ CORRECT: Dynamic import for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
	loading: () => <ChartSkeleton />,
	ssr: false, // If it's client-only
});

// Use for modals/dialogs that aren't immediately visible
const CreateModal = dynamic(
	() => import('@/components/features/create-modal'),
	{ loading: () => null }
);
```

## Pagination and Virtual Lists

```tsx
// For large lists, implement pagination
// app/dashboard/parishioners/page.tsx

interface PageProps {
	searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function ParishionersPage({ searchParams }: PageProps) {
	const { page = '1', limit = '20' } = await searchParams;
	const pageNum = parseInt(page);
	const limitNum = parseInt(limit);

	const [parishioners, total] = await Promise.all([
		db.parishioner.findMany({
			skip: (pageNum - 1) * limitNum,
			take: limitNum,
			orderBy: { createdAt: 'desc' },
		}),
		db.parishioner.count(),
	]);

	return (
		<div>
			<DataTable data={parishioners} />
			<Pagination
				currentPage={pageNum}
				totalPages={Math.ceil(total / limitNum)}
			/>
		</div>
	);
}
```

## Debounce User Input

```tsx
// For search inputs that trigger server fetches
'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export function SearchInput() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(searchParams.get('q') ?? '');

	const updateUrl = useDebouncedCallback((term: string) => {
		const params = new URLSearchParams(searchParams);
		if (term) {
			params.set('q', term);
		} else {
			params.delete('q');
		}
		router.push(`?${params.toString()}`);
	}, 300);

	return (
		<Input
			value={value}
			onChange={(e) => {
				setValue(e.target.value);
				updateUrl(e.target.value);
			}}
			placeholder='Search...'
		/>
	);
}
```

## Selective Data Loading

```tsx
// Only load what you need from database
// ❌ WRONG: Loading everything
const parishioner = await db.parishioner.findUnique({
	where: { id },
	include: {
		organization: true,
		payments: true, // Potentially thousands
		appointments: true, // Potentially hundreds
		sacraments: true,
		massIntentions: true,
	},
});

// ✅ CORRECT: Select specific fields, paginate relations
const parishioner = await db.parishioner.findUnique({
	where: { id },
	select: {
		id: true,
		firstName: true,
		lastName: true,
		email: true,
		phone: true,
		organization: {
			select: { name: true },
		},
		// Load relations separately with pagination
	},
});

// Then load relations on separate pages/tabs
const payments = await db.payment.findMany({
	where: { parishionerId: id },
	take: 10,
	orderBy: { createdAt: 'desc' },
});
```

## Bundle Analysis

```bash
# Analyze bundle size
pnpm build
pnpm dlx @next/bundle-analyzer

# Check what's in client bundles
# Look for:
# - Large dependencies in client components
# - Server-only code accidentally in client
```

## Performance Checklist

```tsx
// Before deploying, verify:

// 1. Minimize client components
// - Only 'use client' where needed
// - Keep client boundaries small

// 2. Optimize data fetching
// - Use Server Components for data
// - Parallel fetches with Promise.all
// - Implement pagination for lists

// 3. Image optimization
// - Use next/image
// - Proper sizing
// - Lazy load below-fold

// 4. Code splitting
// - Dynamic imports for heavy components
// - Don't import unused code

// 5. Caching
// - Appropriate cache headers
// - Revalidate when data changes

// 6. Test on low-end devices
// - Throttle network in DevTools
// - Test on real mobile devices
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: useEffect for data fetching
'use client'
useEffect(() => {
  fetch('/api/data').then(...)
}, [])

// ✅ CORRECT: Server Component
export default async function Page() {
  const data = await getData()
}

// ❌ WRONG: Loading entire library
import moment from 'moment'  // 300KB!

// ✅ CORRECT: Use lighter alternatives
import { format } from 'date-fns'  // Tree-shakeable

// ❌ WRONG: No pagination
const allItems = await db.item.findMany()  // Could be millions

// ✅ CORRECT: Paginate
const items = await db.item.findMany({ take: 20 })

// ❌ WRONG: Re-fetching on every render
export function Component() {
  const data = useSWR('/api/data')  // Fetches every mount!
}

// ✅ CORRECT: Fetch on server
export default async function Page() {
  const data = await getData()  // Cached, no client fetch
}
```

## Testing Checklist

-   [ ] Client components minimized
-   [ ] Data fetched on server when possible
-   [ ] Images optimized with next/image
-   [ ] Heavy components dynamically imported
-   [ ] Lists paginated
-   [ ] Search inputs debounced
-   [ ] Tested on slow network/device

## Related Skills

-   `ecclesia.components.server_vs_client`
-   `ecclesia.states.loading`
-   `ecclesia.database.prisma_patterns`

## References

-   [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
-   [React Server Components](https://react.dev/reference/react/use-server)
-   [Web Vitals](https://web.dev/vitals/)
