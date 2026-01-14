# Skill: Role-Based Access Control (RBAC)

## Metadata

-   **ID**: `ecclesia.rbac.role_based_access`
-   **Version**: 1.0.0
-   **Category**: Security
-   **Priority**: Critical

## Purpose

Enforce role-based permissions for all operations. Users can only perform actions their role permits. RBAC must be enforced BOTH server-side (in Server Actions) and client-side (in UI).

## When to Use

-   Every Server Action that modifies data
-   Displaying role-specific UI elements
-   Protecting routes
-   Determining feature access

## Constraints

-   **Always check roles server-side** — never trust client-only checks
-   **Use `session.user.role`** from NextAuth session
-   **Implement principle of least privilege** — deny by default
-   **Never expose role escalation paths** to unauthorized users
-   **Log authorization failures** for security auditing

## Role Hierarchy

```typescript
// types/roles.ts
export const UserRole = {
	SUPER_ADMIN: 'SUPER_ADMIN', // System-wide access
	PARISH_ADMIN: 'PARISH_ADMIN', // Parish priest, full parish access
	PARISH_SECRETARY: 'PARISH_SECRETARY', // Parish office manager
	PARISH_STAFF: 'PARISH_STAFF', // Parish employees
	OUTSTATION_ADMIN: 'OUTSTATION_ADMIN', // Outstation leader
	ORGANIZATION_PRESIDENT: 'ORGANIZATION_PRESIDENT', // Pious org leader
	ORGANIZATION_SECRETARY: 'ORGANIZATION_SECRETARY', // Pious org secretary
	PARISHIONER: 'PARISHIONER', // Regular member
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
```

## Permission Matrix

| Action              | SUPER_ADMIN | PARISH_ADMIN | PARISH_SECRETARY | PARISH_STAFF | OUTSTATION_ADMIN | ORG_PRESIDENT | ORG_SECRETARY | PARISHIONER |
| ------------------- | :---------: | :----------: | :--------------: | :----------: | :--------------: | :-----------: | :-----------: | :---------: |
| View all orgs       |     ✅      |      ❌      |        ❌        |      ❌      |        ❌        |      ❌       |      ❌       |     ❌      |
| Manage users        |     ✅      |      ✅      |        ❌        |      ❌      |        ❌        |      ❌       |      ❌       |     ❌      |
| Toggle features     |     ✅      |      ✅      |        ❌        |      ❌      |        ❌        |      ❌       |      ❌       |     ❌      |
| Create parishioners |     ✅      |      ✅      |        ✅        |      ✅      |        ✅        |      ❌       |      ❌       |     ❌      |
| Record payments     |     ✅      |      ✅      |        ✅        |      ✅      |        ✅        |      ❌       |      ❌       |     ❌      |
| View payments       |     ✅      |      ✅      |        ✅        |      ✅      |        ✅        |      ❌       |      ❌       |    Self     |
| Manage pious org    |     ✅      |      ✅      |        ❌        |      ❌      |        ❌        |      Own      |      Own      |     ❌      |
| Book mass intention |     ✅      |      ✅      |        ✅        |      ✅      |        ✅        |      ✅       |      ✅       |     ✅      |
| Book appointment    |     ✅      |      ✅      |        ✅        |      ✅      |        ✅        |      ✅       |      ✅       |     ✅      |
| View reports        |     ✅      |      ✅      |        ✅        |      ❌      |        ✅        |      ❌       |      ❌       |     ❌      |
| Delete records      |     ✅      |      ✅      |        ❌        |      ❌      |        ❌        |      ❌       |      ❌       |     ❌      |

## Server-Side Authorization Pattern

```tsx
// app/actions/user.actions.ts
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import type { ActionResponse } from '@/types';

// Define role permissions for this action
const CREATE_USER_ROLES = ['SUPER_ADMIN', 'PARISH_ADMIN'] as const;
const DELETE_USER_ROLES = ['SUPER_ADMIN', 'PARISH_ADMIN'] as const;
const VIEW_USERS_ROLES = [
	'SUPER_ADMIN',
	'PARISH_ADMIN',
	'PARISH_SECRETARY',
] as const;

export async function createUser(data: unknown): Promise<ActionResponse> {
	const session = await auth();

	// 1. Authentication check
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// 2. Authorization check
	if (!CREATE_USER_ROLES.includes(session.user.role as any)) {
		// Log the attempt for security auditing
		console.warn(
			`Unauthorized user creation attempt by ${session.user.id} (${session.user.role})`
		);
		return {
			success: false,
			message: 'You do not have permission to create users',
		};
	}

	// 3. Additional role-specific restrictions
	const { role: newUserRole } = data as { role: string };

	// Parish admin cannot create super admins
	if (session.user.role === 'PARISH_ADMIN' && newUserRole === 'SUPER_ADMIN') {
		return {
			success: false,
			message: 'Cannot create users with higher privileges',
		};
	}

	// ... proceed with user creation
}
```

## Authorization Helper Functions

```tsx
// lib/auth.ts
import { auth } from '@/auth';
import type { UserRole } from '@/types';

export async function getAuthorizedSession(allowedRoles: UserRole[]) {
	const session = await auth();

	if (!session) {
		return { authorized: false, reason: 'Unauthorized' } as const;
	}

	if (!allowedRoles.includes(session.user.role as UserRole)) {
		return { authorized: false, reason: 'Permission denied' } as const;
	}

	return { authorized: true, session } as const;
}

// Role hierarchy helpers
export function isAdminRole(role: string): boolean {
	return ['SUPER_ADMIN', 'PARISH_ADMIN'].includes(role);
}

export function isStaffRole(role: string): boolean {
	return [
		'SUPER_ADMIN',
		'PARISH_ADMIN',
		'PARISH_SECRETARY',
		'PARISH_STAFF',
		'OUTSTATION_ADMIN',
	].includes(role);
}

export function canManageOrganization(role: string): boolean {
	return ['SUPER_ADMIN', 'PARISH_ADMIN'].includes(role);
}

export function canRecordPayments(role: string): boolean {
	return [
		'SUPER_ADMIN',
		'PARISH_ADMIN',
		'PARISH_SECRETARY',
		'PARISH_STAFF',
		'OUTSTATION_ADMIN',
	].includes(role);
}
```

## Using Authorization Helper

```tsx
// app/actions/parishioner.actions.ts
'use server';

import { getAuthorizedSession, canRecordPayments } from '@/lib/auth';
import db from '@/lib/db';

export async function deleteParishioner(id: string) {
	// Use helper for clean authorization
	const auth = await getAuthorizedSession(['SUPER_ADMIN', 'PARISH_ADMIN']);

	if (!auth.authorized) {
		return { success: false, message: auth.reason };
	}

	const { session } = auth;

	// Verify ownership (organization scope)
	const parishioner = await db.parishioner.findFirst({
		where: { id, organizationId: session.user.organizationId },
	});

	if (!parishioner) {
		return { success: false, message: 'Parishioner not found' };
	}

	await db.parishioner.delete({ where: { id } });

	return { success: true, message: 'Parishioner deleted' };
}

export async function createPayment(data: unknown) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// Use role helper function
	if (!canRecordPayments(session.user.role)) {
		return { success: false, message: 'You cannot record payments' };
	}

	// ... proceed
}
```

## Client-Side Role Checks (UI)

```tsx
// hooks/use-role.ts
'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types';

export function useRole() {
	const { data: session } = useSession();
	const role = session?.user?.role as UserRole | undefined;

	const isAdmin = role && ['SUPER_ADMIN', 'PARISH_ADMIN'].includes(role);
	const isStaff =
		role &&
		[
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
			'OUTSTATION_ADMIN',
		].includes(role);
	const isSuperAdmin = role === 'SUPER_ADMIN';

	const hasRole = (roles: UserRole[]) => role && roles.includes(role);

	return {
		role,
		isAdmin,
		isStaff,
		isSuperAdmin,
		hasRole,
	};
}
```

## Role-Based UI Rendering

```tsx
// components/features/users/user-actions.tsx
'use client';

import { useRole } from '@/hooks/use-role';
import { Button } from '@/components/ui/button';
import { Trash, Edit, UserPlus } from 'lucide-react';

interface UserActionsProps {
	userId: string;
	userRole: string;
}

export function UserActions({ userId, userRole }: UserActionsProps) {
	const { role, isAdmin, hasRole } = useRole();

	// Only admins can see any actions
	if (!isAdmin) return null;

	// Can't perform actions on higher/equal privilege users
	const canModify = canModifyUser(role!, userRole);

	return (
		<div className='flex gap-2'>
			{canModify && (
				<>
					<Button
						variant='ghost'
						size='sm'
					>
						<Edit className='h-4 w-4' />
					</Button>
					{hasRole(['SUPER_ADMIN', 'PARISH_ADMIN']) && (
						<Button
							variant='ghost'
							size='sm'
							className='text-destructive'
						>
							<Trash className='h-4 w-4' />
						</Button>
					)}
				</>
			)}
		</div>
	);
}

function canModifyUser(actorRole: string, targetRole: string): boolean {
	const roleHierarchy: Record<string, number> = {
		SUPER_ADMIN: 100,
		PARISH_ADMIN: 80,
		PARISH_SECRETARY: 60,
		PARISH_STAFF: 40,
		OUTSTATION_ADMIN: 40,
		ORGANIZATION_PRESIDENT: 30,
		ORGANIZATION_SECRETARY: 30,
		PARISHIONER: 10,
	};
	return roleHierarchy[actorRole] > roleHierarchy[targetRole];
}
```

## Protected Route Component

```tsx
// components/auth/role-guard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/types';

interface RoleGuardProps {
	allowedRoles: UserRole[];
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function RoleGuard({
	allowedRoles,
	children,
	fallback,
}: RoleGuardProps) {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	if (status === 'loading') {
		return <div>Loading...</div>;
	}

	if (!session) {
		return null;
	}

	const hasPermission = allowedRoles.includes(session.user.role as UserRole);

	if (!hasPermission) {
		return (
			fallback ?? (
				<div className='flex flex-col items-center justify-center py-12'>
					<h2 className='text-xl font-semibold'>Access Denied</h2>
					<p className='text-muted-foreground'>
						You don't have permission to view this page.
					</p>
				</div>
			)
		);
	}

	return <>{children}</>;
}
```

## Usage in Pages

```tsx
// app/dashboard/users/page.tsx
import { RoleGuard } from '@/components/auth/role-guard';
import { UserList } from '@/components/features/users/user-list';

export default function UsersPage() {
	return (
		<RoleGuard allowedRoles={['SUPER_ADMIN', 'PARISH_ADMIN']}>
			<UserList />
		</RoleGuard>
	);
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Only client-side check
'use client'
export function DeleteButton({ id }) {
  const { isAdmin } = useRole()
  if (!isAdmin) return null

  // Server Action still needs to verify role!
  return <Button onClick={() => deleteUser(id)}>Delete</Button>
}

// ❌ WRONG: Checking role by string comparison everywhere
if (session.user.role === 'PARISH_ADMIN' || session.user.role === 'SUPER_ADMIN' || ...) {
  // Hard to maintain, easy to miss a role
}

// ✅ CORRECT: Use role arrays or helper functions
const ADMIN_ROLES = ['SUPER_ADMIN', 'PARISH_ADMIN']
if (ADMIN_ROLES.includes(session.user.role)) {
  // Easier to maintain
}

// ❌ WRONG: Allowing role escalation
export async function updateUser(id: string, data: { role: string }) {
  // Anyone can set any role!
  await db.user.update({ where: { id }, data })
}

// ✅ CORRECT: Validate role changes
export async function updateUser(id: string, data: { role: string }) {
  const session = await auth()

  // Only admins can change roles
  if (!isAdmin(session.user.role)) {
    return { success: false, message: 'Cannot change user roles' }
  }

  // Can't promote to equal or higher level
  if (getRoleLevel(data.role) >= getRoleLevel(session.user.role)) {
    return { success: false, message: 'Cannot assign this role' }
  }

  // ... proceed
}
```

## Testing Checklist

-   [ ] Server Action checks authorization before executing
-   [ ] UI hides elements user cannot access
-   [ ] Role escalation is prevented
-   [ ] Authorization failures are logged
-   [ ] Role checks use helper functions/constants
-   [ ] Error messages don't leak sensitive info

## Related Skills

-   `ecclesia.auth.nextauth_session`
-   `ecclesia.tenancy.organization_scoping`
-   `ecclesia.actions.server_actions_pattern`

## References

-   [types/next-auth.d.ts](../../types/next-auth.d.ts)
-   [docs/prd.md](../../docs/prd.md) - Section 3.1 User Management
-   [prisma/schema.prisma](../../prisma/schema.prisma) - UserRole enum
