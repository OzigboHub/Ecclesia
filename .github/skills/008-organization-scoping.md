# Skill: Organization Scoping (Multi-Tenancy)

## Metadata

-   **ID**: `ecclesia.tenancy.organization_scoping`
-   **Version**: 1.0.0
-   **Category**: Security/Architecture
-   **Priority**: Critical

## Purpose

Ensure complete data isolation between organizations (parishes and outstations). Every database query and mutation MUST be scoped to the user's organization to prevent data leaks across tenants.

## When to Use

-   ANY database query (read or write)
-   API route handlers
-   Server Actions
-   Authorization checks
-   Dashboard displays

## Constraints

-   **NEVER query without `organizationId` filter** for tenant-owned data
-   **Use `session.user.organizationId`** — never trust client-provided org IDs
-   **Parish admins can see parish + outstations** (hierarchical access)
-   **Outstation users only see their outstation data**
-   **Verify ownership before update/delete operations**

## Organization Hierarchy

```
Parish (Level: PARISH)
├── Outstation A (Level: OUTSTATION, parentId: Parish.id)
├── Outstation B (Level: OUTSTATION, parentId: Parish.id)
└── Outstation C (Level: OUTSTATION, parentId: Parish.id)
```

## Core Scoping Pattern

```tsx
// app/actions/parishioner.actions.ts
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';

export async function getParishioners() {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// ✅ ALWAYS scope by user's organization
	const parishioners = await db.parishioner.findMany({
		where: {
			organizationId: session.user.organizationId, // Critical!
		},
		orderBy: { lastName: 'asc' },
	});

	return { success: true, data: parishioners };
}
```

## Hierarchical Access (Parish Admin Pattern)

```tsx
// Parish admin can see data from parish AND all outstations
export async function getParishionersWithOutstations() {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// Get user's organization
	const organization = await db.organization.findUnique({
		where: { id: session.user.organizationId },
		include: { children: true }, // Get outstations
	});

	if (!organization) {
		return { success: false, message: 'Organization not found' };
	}

	// Build organization IDs to query
	let organizationIds: string[] = [organization.id];

	// If user is at parish level, include all outstations
	if (organization.level === 'PARISH') {
		const outstationIds = organization.children.map((child) => child.id);
		organizationIds = [...organizationIds, ...outstationIds];
	}

	// Query with hierarchical scope
	const parishioners = await db.parishioner.findMany({
		where: {
			organizationId: { in: organizationIds }, // Parish + outstations
		},
		include: { organization: true },
		orderBy: { lastName: 'asc' },
	});

	return { success: true, data: parishioners };
}
```

## Create with Organization Scope

```tsx
export async function createParishioner(data: CreateParishionerInput) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// ✅ Always set organizationId from session, never from input
	const parishioner = await db.parishioner.create({
		data: {
			...data,
			organizationId: session.user.organizationId, // From session!
			// NOT: organizationId: data.organizationId  // ❌ Never trust input
		},
	});

	return { success: true, data: parishioner };
}
```

## Update with Ownership Verification

```tsx
export async function updateParishioner(
	id: string,
	data: UpdateParishionerInput
) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// ✅ Verify the record belongs to user's organization
	const existing = await db.parishioner.findFirst({
		where: {
			id,
			organizationId: session.user.organizationId, // Ownership check!
		},
	});

	if (!existing) {
		// Could be not found OR belongs to different org — same response
		return { success: false, message: 'Parishioner not found' };
	}

	const updated = await db.parishioner.update({
		where: { id },
		data,
	});

	return { success: true, data: updated };
}
```

## Delete with Ownership Verification

```tsx
export async function deleteParishioner(id: string) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// ✅ Use findFirst with org scope, not findUnique
	const existing = await db.parishioner.findFirst({
		where: {
			id,
			organizationId: session.user.organizationId,
		},
	});

	if (!existing) {
		return { success: false, message: 'Parishioner not found' };
	}

	await db.parishioner.delete({ where: { id } });

	return { success: true, message: 'Parishioner deleted' };
}
```

## Helper Function for Org Scope

```tsx
// lib/auth.ts
import { auth } from '@/auth';
import db from '@/lib/db';

export async function getSessionWithOrg() {
	const session = await auth();
	if (!session) return null;

	const organization = await db.organization.findUnique({
		where: { id: session.user.organizationId },
		include: {
			children: true,
			featureSettings: true,
		},
	});

	return { session, organization };
}

export function getOrgIdsForUser(
	organization: Organization & { children: Organization[] }
): string[] {
	const ids = [organization.id];

	// Parish admin sees parish + outstations
	if (organization.level === 'PARISH') {
		ids.push(...organization.children.map((c) => c.id));
	}

	return ids;
}
```

## Usage in Server Actions

```tsx
import { getSessionWithOrg, getOrgIdsForUser } from '@/lib/auth';

export async function getPayments() {
	const ctx = await getSessionWithOrg();
	if (!ctx) {
		return { success: false, message: 'Unauthorized' };
	}

	const { session, organization } = ctx;
	const orgIds = getOrgIdsForUser(organization);

	const payments = await db.payment.findMany({
		where: {
			organizationId: { in: orgIds },
		},
		include: {
			parishioner: true,
			organization: true, // Show which org/outstation
		},
	});

	return { success: true, data: payments };
}
```

## Cross-Org Data (Super Admin Only)

```tsx
export async function getAllOrganizationsData() {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// Only SUPER_ADMIN can access cross-org data
	if (session.user.role !== 'SUPER_ADMIN') {
		return { success: false, message: 'Permission denied' };
	}

	// ✅ Explicit permission for cross-org query
	const organizations = await db.organization.findMany({
		include: {
			_count: {
				select: { parishioners: true, payments: true },
			},
		},
	});

	return { success: true, data: organizations };
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: No organization filter
const parishioners = await db.parishioner.findMany();

// ❌ WRONG: Using client-provided organizationId
export async function getParishioners(organizationId: string) {
	return db.parishioner.findMany({
		where: { organizationId }, // Client could pass any org ID!
	});
}

// ❌ WRONG: findUnique without ownership check
export async function getParishioner(id: string) {
	return db.parishioner.findUnique({
		where: { id }, // Could return data from any org!
	});
}

// ❌ WRONG: Update without ownership verification
export async function updateParishioner(id: string, data: any) {
	return db.parishioner.update({
		where: { id }, // No ownership check!
		data,
	});
}

// ❌ WRONG: Generic error reveals existence
if (!existing) {
	return { success: false, message: 'Access denied to this parishioner' };
	// Attacker now knows the record exists in another org
}

// ✅ CORRECT: Same message for not found and wrong org
if (!existing) {
	return { success: false, message: 'Parishioner not found' };
}
```

## Models That Require Organization Scoping

Based on the schema, these models MUST be scoped:

| Model               | Scoped By        |
| ------------------- | ---------------- |
| `Parishioner`       | `organizationId` |
| `Payment`           | `organizationId` |
| `MassIntention`     | `organizationId` |
| `Appointment`       | `organizationId` |
| `Event`             | `organizationId` |
| `Donation`          | `organizationId` |
| `DonationCampaign`  | `organizationId` |
| `Sacrament`         | `organizationId` |
| `PiousOrganization` | `organizationId` |
| `LiveStream`        | `organizationId` |
| `User`              | `organizationId` |

## Testing Checklist

-   [ ] All queries include `organizationId` filter
-   [ ] Organization ID comes from `session.user.organizationId`
-   [ ] Ownership verified before update/delete
-   [ ] Parish admin hierarchy access works correctly
-   [ ] Error messages don't leak organization existence
-   [ ] Super admin cross-org access is explicit

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.rbac.role_based_access`
-   `ecclesia.db.prisma_patterns`

## References

-   [prisma/schema.prisma](../../prisma/schema.prisma)
-   [docs/prd.md](../../docs/prd.md) - Section 3.2 Organization Management
-   [types/next-auth.d.ts](../../types/next-auth.d.ts)
