# Skill: Auth.js (NextAuth v5) Authentication Patterns

## Metadata

-   **ID**: `ecclesia.auth.authjs`
-   **Version**: 1.0.0
-   **Category**: Authentication
-   **Priority**: Critical

## Purpose

Implement authentication using Auth.js (NextAuth v5) with JWT strategy. Handle session management, protected routes, and role-based access throughout the application.

## Constraints

-   **JWT strategy** with 24-hour sessions
-   **Server-side auth checks** for API routes and Server Components
-   **Never expose sensitive data** in session/JWT
-   **Extend session with custom fields** — id, role, organizationId
-   **Use ProtectedRoute** for client-side route guards
-   **Use `auth()` helper** instead of `getServerSession()`

## Auth.js Configuration

```ts
// auth.ts (root of project)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const user = await db.user.findUnique({
					where: { email: credentials.email as string },
					include: { organization: true },
				});

				if (!user || !user.password) {
					return null;
				}

				const isValid = await bcrypt.compare(
					credentials.password as string,
					user.password
				);

				if (!isValid) {
					return null;
				}

				// Return user data for JWT
				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
					organizationId: user.organizationId,
					organizationName: user.organization?.name ?? null,
				};
			},
		}),
	],
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60, // 24 hours
	},
	callbacks: {
		async jwt({ token, user }) {
			// Initial sign in
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.organizationId = user.organizationId;
				token.organizationName = user.organizationName;
			}
			return token;
		},
		async session({ session, token }) {
			// Extend session with custom fields
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
				session.user.organizationId = token.organizationId as string;
				session.user.organizationName = token.organizationName as
					| string
					| null;
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/login',
		error: '/auth/error',
	},
});
```

## API Route Handler

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

## Extended Types

```ts
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			role: string;
			organizationId: string;
			organizationName: string | null;
		} & DefaultSession['user'];
	}

	interface User extends DefaultUser {
		role: string;
		organizationId: string;
		organizationName: string | null;
	}
}

declare module 'next-auth/jwt' {
	interface JWT extends DefaultJWT {
		id: string;
		role: string;
		organizationId: string;
		organizationName: string | null;
	}
}
```

## Server-Side Authentication

```tsx
// app/dashboard/page.tsx (Server Component)
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
	const session = await auth();

	// Redirect if not authenticated
	if (!session?.user) {
		redirect('/auth/login');
	}

	// Access user data
	const { id, role, organizationId, organizationName } = session.user;

	return (
		<div>
			<h1>Welcome, {session.user.name}</h1>
			<p>Organization: {organizationName}</p>
			<p>Role: {role}</p>
		</div>
	);
}
```

## Server Action Authentication

```ts
// app/actions/parishioner.actions.ts
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';

export async function createParishioner(data: CreateParishionerInput) {
	// Always verify session in Server Actions
	const session = await auth();

	if (!session?.user?.organizationId) {
		return {
			success: false,
			message: 'You must be logged in to perform this action.',
		};
	}

	// Use organizationId from session (never from client)
	const parishioner = await db.parishioner.create({
		data: {
			...data,
			organizationId: session.user.organizationId, // Trusted source
		},
	});

	return {
		success: true,
		message: 'Parishioner created successfully.',
		data: parishioner,
	};
}
```

## Role-Based Server Action

```ts
// app/actions/admin.actions.ts
'use server';

import { auth } from '@/auth';

const ADMIN_ROLES = ['SUPER_ADMIN', 'PARISH_ADMIN'];

export async function deleteUser(userId: string) {
	const session = await auth();

	if (!session?.user) {
		return {
			success: false,
			message: 'Authentication required.',
		};
	}

	// Check admin role
	if (!ADMIN_ROLES.includes(session.user.role)) {
		return {
			success: false,
			message: 'You do not have permission to delete users.',
		};
	}

	// Proceed with deletion...
}
```

## Client-Side Protected Route

```tsx
// components/auth/protected-route.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: string[];
}

export function ProtectedRoute({
	children,
	allowedRoles,
}: ProtectedRouteProps) {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'loading') return;

		// Not authenticated
		if (!session?.user) {
			router.push('/auth/login');
			return;
		}

		// Not authorized (role check)
		if (allowedRoles && !allowedRoles.includes(session.user.role)) {
			router.push('/dashboard?error=unauthorized');
		}
	}, [session, status, router, allowedRoles]);

	// Loading state
	if (status === 'loading') {
		return (
			<div className='space-y-4 p-6'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-32 w-full' />
			</div>
		);
	}

	// Not authenticated
	if (!session?.user) {
		return null;
	}

	// Not authorized
	if (allowedRoles && !allowedRoles.includes(session.user.role)) {
		return null;
	}

	return <>{children}</>;
}
```

## Auth Provider Setup

```tsx
// components/providers/auth-provider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	return <SessionProvider>{children}</SessionProvider>;
}

// app/layout.tsx
import { AuthProvider } from '@/components/providers/auth-provider';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
```

## Client-Side Session Hook

```tsx
// Client Component usage
'use client';

import { useSession, signOut } from 'next-auth/react';

export function UserMenu() {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return <Skeleton className='h-8 w-8 rounded-full' />;
	}

	if (!session?.user) {
		return <Button href='/auth/login'>Sign In</Button>;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar>
					<AvatarFallback>
						{session.user.name?.[0]?.toUpperCase()}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>
					{session.user.name}
					<span className='block text-xs text-muted-foreground'>
						{session.user.organizationName}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
```

## Login Form (Server Action)

```tsx
// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators/auth.schema';
import { login } from '@/app/actions/auth.actions';
import { toast } from 'sonner';

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (data: LoginInput) => {
		setIsLoading(true);

		try {
			const result = await login(data);

			if (!result.success) {
				toast.error(result.message ?? 'Invalid email or password');
				return;
			}

			toast.success('Welcome back!');
			router.push(callbackUrl);
			router.refresh();
		} catch (error) {
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'
		>
			<Input
				type='email'
				placeholder='Email'
				{...form.register('email')}
				disabled={isLoading}
			/>
			<Input
				type='password'
				placeholder='Password'
				{...form.register('password')}
				disabled={isLoading}
			/>
			<Button
				type='submit'
				className='w-full'
				disabled={isLoading}
			>
				{isLoading ? 'Signing in...' : 'Sign In'}
			</Button>
		</form>
	);
}
```

## Auth Server Actions

```ts
// app/actions/auth.actions.ts
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function login(data: { email: string; password: string }) {
	try {
		await signIn('credentials', {
			email: data.email,
			password: data.password,
			redirect: false,
		});

		return { success: true };
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return {
						success: false,
						message: 'Invalid email or password',
					};
				default:
					return { success: false, message: 'Something went wrong' };
			}
		}
		throw error;
	}
}

export async function logout() {
	await signOut({ redirect: false });
	return { success: true };
}
```

## Dashboard Layout with Auth

```tsx
// app/dashboard/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	return (
		<div className='flex min-h-screen'>
			<Sidebar user={session.user} />
			<main className='flex-1 p-6'>{children}</main>
		</div>
	);
}
```

## Helper Functions

```ts
// lib/auth.ts
import { auth } from '@/auth';

export async function getCurrentUser() {
	const session = await auth();
	return session?.user ?? null;
}

export async function requireAuth() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error('Authentication required');
	}
	return user;
}

export async function requireRole(allowedRoles: string[]) {
	const user = await requireAuth();
	if (!allowedRoles.includes(user.role)) {
		throw new Error('Insufficient permissions');
	}
	return user;
}
```

## Middleware (Optional)

```ts
// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
	const isOnAuth = req.nextUrl.pathname.startsWith('/auth');

	// Redirect authenticated users away from auth pages
	if (isLoggedIn && isOnAuth) {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	// Redirect unauthenticated users to login
	if (!isLoggedIn && isOnDashboard) {
		return NextResponse.redirect(new URL('/auth/login', req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Trusting client-provided organizationId
export async function createItem(data: {
	organizationId: string;
	name: string;
}) {
	await db.item.create({
		data: {
			name: data.name,
			organizationId: data.organizationId, // Never trust client!
		},
	});
}

// ✅ CORRECT: Use session's organizationId
export async function createItem(data: { name: string }) {
	const session = await auth();
	await db.item.create({
		data: {
			name: data.name,
			organizationId: session.user.organizationId, // Trusted source
		},
	});
}

// ❌ WRONG: Checking auth only on client
('use client');
const { session } = useSession();
if (!session) return null; // Can be bypassed!

// ✅ CORRECT: Always check on server
// Server Component or Server Action
const session = await auth();
if (!session) redirect('/auth/login');

// ❌ WRONG: Using old getServerSession pattern
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
const session = await getServerSession(authOptions);

// ✅ CORRECT: Use auth() from Auth.js v5
import { auth } from '@/auth';
const session = await auth();

// ❌ WRONG: Storing sensitive data in session
token.password = user.password; // Never!
token.creditCard = user.creditCard; // Never!

// ✅ CORRECT: Only store necessary identifiers
token.id = user.id;
token.role = user.role;
token.organizationId = user.organizationId;
```

## Key Differences from NextAuth v4

| Feature              | NextAuth v4                                      | Auth.js v5                                       |
| -------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Config file          | `app/api/auth/[...nextauth]/route.ts`            | `auth.ts` (root)                                 |
| Get session (server) | `getServerSession(authOptions)`                  | `auth()`                                         |
| Imports              | `import NextAuth from 'next-auth'`               | `import NextAuth from 'next-auth'` + destructure |
| Providers            | `import Provider from 'next-auth/providers/...'` | Same                                             |
| Route handler        | Export `authOptions` + handler                   | Export `handlers`                                |
| Sign in/out          | `signIn()` from client                           | Can use server actions                           |
| Middleware           | Custom implementation                            | Built-in `auth()` wrapper                        |

## Testing Checklist

-   [ ] `auth.ts` configured at project root
-   [ ] Route handler exports `handlers`
-   [ ] Session extended with custom fields
-   [ ] Type definitions updated (next-auth.d.ts)
-   [ ] Server Components use `auth()`
-   [ ] Server Actions use `auth()`
-   [ ] Role checks implemented where needed
-   [ ] Login/logout flows working
-   [ ] Redirect to login on unauthenticated access
-   [ ] Middleware configured (optional)

## Related Skills

-   `ecclesia.rbac.role_based_access`
-   `ecclesia.multitenancy.organization_scoping`
-   `ecclesia.actions.server_actions_pattern`

## References

-   [Auth.js Documentation](https://authjs.dev/)
-   [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
-   [auth.ts](../../auth.ts)
-   [types/next-auth.d.ts](../../types/next-auth.d.ts)
