# Skill: Next.js 16 App Router Architecture

## Metadata

-   **ID**: `ecclesia.nextjs.app_router_only`
-   **Version**: 1.0.0
-   **Category**: Framework
-   **Priority**: Critical

## Purpose

Use Next.js 16 App Router exclusively (`/app` directory). Never use Pages Router (`/pages`). This ensures consistency, enables React Server Components, Server Actions, and modern data fetching patterns.

## When to Use

-   Creating any new page
-   Adding API routes
-   Setting up layouts
-   Implementing authentication flows
-   Creating loading/error states

## Constraints

-   **App Router only** — all routes must be in `/app` directory
-   **No `/pages` directory** — completely prohibited
-   **Use `proxy.ts` instead of `middleware.ts`** in Next.js 16
-   **File-based routing** with special files (`page.tsx`, `layout.tsx`, etc.)
-   **Route groups** `(folder)` for organization without affecting URL

## App Router File Conventions

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI for page
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── proxy.ts            # Request proxy (replaces middleware.ts)
│
├── (auth)/             # Route group - doesn't affect URL
│   ├── login/
│   │   └── page.tsx    # /login
│   └── register/
│       └── page.tsx    # /register
│
├── dashboard/
│   ├── layout.tsx      # Nested layout for /dashboard/*
│   ├── page.tsx        # /dashboard
│   ├── loading.tsx     # Loading for dashboard
│   ├── error.tsx       # Error boundary for dashboard
│   │
│   ├── parishioners/
│   │   ├── page.tsx    # /dashboard/parishioners
│   │   └── [id]/
│   │       └── page.tsx # /dashboard/parishioners/:id
│   │
│   └── payments/
│       ├── page.tsx    # /dashboard/payments
│       └── new/
│           └── page.tsx # /dashboard/payments/new
│
├── actions/            # Server Actions directory
│   └── *.actions.ts
│
└── api/                # API routes (Route Handlers)
    └── auth/
        └── [...nextauth]/
            └── route.ts
```

## Special Files Reference

| File            | Purpose             | Renders When                           |
| --------------- | ------------------- | -------------------------------------- |
| `page.tsx`      | Page UI             | Route is matched                       |
| `layout.tsx`    | Shared UI wrapper   | Wraps page and children                |
| `loading.tsx`   | Loading UI          | Page is loading (Suspense)             |
| `error.tsx`     | Error UI            | Error in page/children                 |
| `not-found.tsx` | 404 UI              | `notFound()` called or route not found |
| `route.ts`      | API endpoint        | HTTP request to route                  |
| `proxy.ts`      | Request interceptor | Before request processed               |

## Page Component Pattern

```tsx
// app/dashboard/parishioners/page.tsx
import { Suspense } from 'react';
import { getParishioners } from '@/app/actions/parishioner.actions';
import { ParishionerList } from '@/components/features/parishioners/parishioner-list';
import { ParishionerListSkeleton } from '@/components/features/parishioners/parishioner-list-skeleton';

// Metadata for SEO
export const metadata = {
	title: 'Parishioners | Ecclesia DPM',
	description: 'Manage parish members',
};

// Server Component by default
export default async function ParishionersPage() {
	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold md:text-3xl'>Parishioners</h1>
			</div>

			<Suspense fallback={<ParishionerListSkeleton />}>
				<ParishionerListLoader />
			</Suspense>
		</div>
	);
}

// Separate async component for data fetching
async function ParishionerListLoader() {
	const result = await getParishioners();

	if (!result.success) {
		throw new Error(result.message);
	}

	if (!result.data?.length) {
		return <EmptyState message='No parishioners found' />;
	}

	return <ParishionerList parishioners={result.data} />;
}
```

## Dynamic Route with Params

```tsx
// app/dashboard/parishioners/[id]/page.tsx

// IMPORTANT: Always await params in Next.js 16
export default async function ParishionerDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params; // ✅ Must await params

	const result = await getParishioner(id);

	if (!result.success || !result.data) {
		notFound();
	}

	return <ParishionerDetail parishioner={result.data} />;
}

// Generate metadata dynamically
export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const result = await getParishioner(id);

	return {
		title: result.data?.name ?? 'Parishioner',
	};
}
```

## Search Params Pattern

```tsx
// app/dashboard/payments/page.tsx
export default async function PaymentsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; status?: string }>;
}) {
	// ✅ Must await searchParams in Next.js 16
	const { page = '1', status } = await searchParams;

	const result = await getPayments({
		page: parseInt(page),
		status: status as PaymentStatus | undefined,
	});

	return <PaymentList payments={result.data} />;
}
```

## Layout Pattern

```tsx
// app/dashboard/layout.tsx
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProtectedRoute>
			<div className='flex h-screen'>
				<Sidebar />
				<main className='flex-1 overflow-y-auto bg-muted/30'>
					<div className='container py-6 px-4 md:px-6 lg:px-8'>
						{children}
					</div>
				</main>
			</div>
		</ProtectedRoute>
	);
}
```

## Loading State Pattern

```tsx
// app/dashboard/parishioners/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ParishionersLoading() {
	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-10 w-32' />
			</div>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton
						key={i}
						className='h-32'
					/>
				))}
			</div>
		</div>
	);
}
```

## Error Boundary Pattern

```tsx
// app/dashboard/parishioners/error.tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ParishionersError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Parishioners error:', error);
	}, [error]);

	return (
		<div className='flex flex-col items-center justify-center py-12'>
			<AlertCircle className='h-12 w-12 text-destructive mb-4' />
			<h2 className='text-xl font-semibold mb-2'>Something went wrong</h2>
			<p className='text-muted-foreground mb-4'>{error.message}</p>
			<Button onClick={reset}>Try again</Button>
		</div>
	);
}
```

## Not Found Pattern

```tsx
// app/dashboard/parishioners/[id]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';

export default function ParishionerNotFound() {
	return (
		<div className='flex flex-col items-center justify-center py-12'>
			<UserX className='h-12 w-12 text-muted-foreground mb-4' />
			<h2 className='text-xl font-semibold mb-2'>
				Parishioner not found
			</h2>
			<p className='text-muted-foreground mb-4'>
				The parishioner you're looking for doesn't exist or has been
				removed.
			</p>
			<Button asChild>
				<Link href='/dashboard/parishioners'>Back to Parishioners</Link>
			</Button>
		</div>
	);
}
```

## Proxy Pattern (Next.js 16)

```tsx
// app/proxy.ts (replaces middleware.ts in Next.js 16)
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
	const token = await getToken({ req: request });
	const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
	const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

	// Redirect authenticated users away from auth pages
	if (isAuthPage && token) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	// Redirect unauthenticated users to login
	if (isDashboard && !token) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/:path*', '/auth/:path*'],
};
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Using pages directory
// pages/index.tsx  <- NEVER create this

// ❌ WRONG: Not awaiting params
export default async function Page({ params }) {
	const id = params.id; // Wrong in Next.js 16!
}

// ✅ CORRECT: Await params
export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
}

// ❌ WRONG: Using middleware.ts in Next.js 16
// middleware.ts  <- Use proxy.ts instead

// ❌ WRONG: Data fetching in layout
export default async function Layout({ children }) {
	const data = await fetchData(); // Avoid in layouts
	return <div>{children}</div>;
}
```

## Testing Checklist

-   [ ] No `/pages` directory exists
-   [ ] All routes use App Router conventions
-   [ ] `params` and `searchParams` are awaited
-   [ ] Every route segment has `loading.tsx`
-   [ ] Every route segment has `error.tsx`
-   [ ] Dynamic routes have `not-found.tsx`
-   [ ] Using `proxy.ts` instead of `middleware.ts`

## Related Skills

-   `ecclesia.components.server_vs_client`
-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.ui.loading_states`

## References

-   [app/layout.tsx](../../app/layout.tsx)
-   [app/dashboard/layout.tsx](../../app/dashboard/layout.tsx)
-   [Next.js App Router Docs](https://nextjs.org/docs/app)
