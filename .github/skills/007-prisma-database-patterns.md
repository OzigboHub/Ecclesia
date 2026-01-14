# Skill: Prisma Database Patterns

## Metadata

-   **ID**: `ecclesia.db.prisma_patterns`
-   **Version**: 1.0.0
-   **Category**: Database
-   **Priority**: Critical

## Purpose

Use Prisma for ALL database access with type-safe queries. Always scope queries by organization, use proper relations, and handle transactions for complex operations.

## When to Use

-   Any database read or write operation
-   Defining data models
-   Creating migrations
-   Querying related data

## Constraints

-   **Only import `db` from `@/lib/db`** — never instantiate PrismaClient directly
-   **Always scope by `organizationId`** for tenant-owned data
-   **Use type-safe queries only** — leverage Prisma's generated types
-   **Include relations explicitly** when needed
-   **Use transactions** for multi-table operations
-   **Only call Prisma from server-side code** (Server Actions, API routes)

## Database Client Singleton

```tsx
// lib/db.ts — This is already configured for NeonDB
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = globalThis.WebSocket;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const adapter = new PrismaNeon({ connectionString });
	return new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === 'development'
				? ['query', 'error', 'warn']
				: ['error'],
	});
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
```

## Organization-Scoped Queries (Multi-Tenancy)

```tsx
// ✅ CORRECT: Always filter by organizationId
const parishioners = await db.parishioner.findMany({
	where: {
		organizationId: session.user.organizationId, // ✅ Required!
	},
	orderBy: { createdAt: 'desc' },
});

// ❌ WRONG: No organization filter (data leak!)
const parishioners = await db.parishioner.findMany({
	orderBy: { createdAt: 'desc' },
});

// ✅ CORRECT: Single record with org scope
const parishioner = await db.parishioner.findFirst({
	where: {
		id: parishionerId,
		organizationId: session.user.organizationId, // Prevents cross-org access
	},
});

// ❌ WRONG: findUnique without org check
const parishioner = await db.parishioner.findUnique({
	where: { id: parishionerId }, // Could return data from another org!
});
```

## Query Patterns

### Basic CRUD

```tsx
// CREATE
const parishioner = await db.parishioner.create({
	data: {
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@example.com',
		organizationId: session.user.organizationId, // ✅ Always set
	},
});

// READ (with relations)
const parishioner = await db.parishioner.findFirst({
	where: {
		id,
		organizationId: session.user.organizationId,
	},
	include: {
		organization: true,
		sacraments: true,
		payments: {
			orderBy: { createdAt: 'desc' },
			take: 5, // Latest 5 payments
		},
	},
});

// UPDATE
const updated = await db.parishioner.update({
	where: { id },
	data: {
		firstName: 'Jane',
		updatedAt: new Date(),
	},
});

// DELETE (soft delete pattern recommended)
const deleted = await db.parishioner.update({
	where: { id },
	data: {
		isActive: false,
		deletedAt: new Date(),
	},
});

// Hard delete (use sparingly)
await db.parishioner.delete({
	where: { id },
});
```

### Filtering and Pagination

```tsx
// Paginated list with filters
const { page = 1, limit = 20, search, status } = query;

const where: Prisma.PaymentWhereInput = {
	organizationId: session.user.organizationId,
	...(status && { status }),
	...(search && {
		OR: [
			{ payerName: { contains: search, mode: 'insensitive' } },
			{ transactionReference: { contains: search, mode: 'insensitive' } },
		],
	}),
};

const [payments, total] = await Promise.all([
	db.payment.findMany({
		where,
		include: { parishioner: true, recordedBy: true },
		orderBy: { createdAt: 'desc' },
		skip: (page - 1) * limit,
		take: limit,
	}),
	db.payment.count({ where }),
]);

return {
	data: payments,
	pagination: {
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	},
};
```

### Aggregations

```tsx
// Sum payments by purpose
const totals = await db.payment.groupBy({
	by: ['purpose'],
	where: {
		organizationId: session.user.organizationId,
		status: 'COMPLETED',
		createdAt: {
			gte: startOfMonth,
			lte: endOfMonth,
		},
	},
	_sum: { amount: true },
	_count: true,
});

// Dashboard stats
const [totalParishioners, totalPayments, recentPayments] = await Promise.all([
	db.parishioner.count({
		where: { organizationId: session.user.organizationId },
	}),
	db.payment.aggregate({
		where: {
			organizationId: session.user.organizationId,
			status: 'COMPLETED',
		},
		_sum: { amount: true },
	}),
	db.payment.findMany({
		where: { organizationId: session.user.organizationId },
		orderBy: { createdAt: 'desc' },
		take: 5,
		include: { parishioner: true },
	}),
]);
```

## Transactions

```tsx
// Use transactions for operations that must succeed or fail together
const result = await db.$transaction(async (tx) => {
	// Create payment
	const payment = await tx.payment.create({
		data: {
			amount: 5000,
			purpose: 'MASS_INTENTION',
			status: 'COMPLETED',
			organizationId: session.user.organizationId,
			recordedById: session.user.id,
		},
	});

	// Create mass intention linked to payment
	const massIntention = await tx.massIntention.create({
		data: {
			type: 'THANKSGIVING',
			intentionFor: 'Family blessing',
			requestedDate: new Date(),
			paymentId: payment.id,
			organizationId: session.user.organizationId,
		},
	});

	return { payment, massIntention };
});

// Transaction with error handling
try {
	const result = await db.$transaction(async (tx) => {
		// ... operations

		// Throw to rollback entire transaction
		if (someConditionFails) {
			throw new Error('Validation failed');
		}

		return data;
	});
} catch (error) {
	// Transaction automatically rolled back
	console.error('Transaction failed:', error);
}
```

## Relation Patterns

```tsx
// Include nested relations
const organization = await db.organization.findFirst({
	where: { id: orgId },
	include: {
		users: {
			where: { isActive: true },
			select: { id: true, firstName: true, lastName: true, role: true },
		},
		featureSettings: true,
		children: {
			include: { featureSettings: true }, // Include outstation settings
		},
	},
});

// Connect existing records
const payment = await db.payment.create({
	data: {
		amount: 1000,
		purpose: 'TITHE',
		status: 'COMPLETED',
		organization: { connect: { id: session.user.organizationId } },
		parishioner: { connect: { id: parishionerId } },
		recordedBy: { connect: { id: session.user.id } },
	},
});

// Create with nested relation
const parishioner = await db.parishioner.create({
	data: {
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@example.com',
		organizationId: session.user.organizationId,
		sacraments: {
			create: [
				{
					type: 'BAPTISM',
					date: new Date('2000-01-01'),
					organizationId,
				},
				{
					type: 'FIRST_COMMUNION',
					date: new Date('2008-05-15'),
					organizationId,
				},
			],
		},
	},
	include: { sacraments: true },
});
```

## Migration Workflow

```bash
# After modifying prisma/schema.prisma:

# 1. Create and apply migration (development)
pnpm prisma migrate dev --name descriptive_name

# 2. Regenerate Prisma Client
pnpm prisma generate

# 3. View database in browser
pnpm prisma studio

# Production deployment
pnpm prisma migrate deploy
```

## Type-Safe Query Building

```tsx
import { Prisma } from '@prisma/client';

// Type-safe where clause
const buildPaymentFilter = (
	orgId: string,
	filters: { status?: string; purpose?: string; dateFrom?: Date }
): Prisma.PaymentWhereInput => ({
	organizationId: orgId,
	...(filters.status && { status: filters.status as PaymentStatus }),
	...(filters.purpose && { purpose: filters.purpose as PaymentPurpose }),
	...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
});

// Use the typed filter
const payments = await db.payment.findMany({
	where: buildPaymentFilter(session.user.organizationId, filters),
});
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Direct PrismaClient instantiation
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Creates new connection each time!

// ✅ CORRECT: Use singleton
import db from '@/lib/db';

// ❌ WRONG: N+1 query problem
const parishioners = await db.parishioner.findMany();
for (const p of parishioners) {
	const payments = await db.payment.findMany({
		where: { parishionerId: p.id },
	});
}

// ✅ CORRECT: Use include
const parishioners = await db.parishioner.findMany({
	include: { payments: true },
});

// ❌ WRONG: Importing Prisma in client component
('use client');
import db from '@/lib/db'; // ERROR: Prisma can't run in browser

// ❌ WRONG: Raw SQL without parameterization
await db.$queryRaw`SELECT * FROM users WHERE email = '${userInput}'`; // SQL injection!

// ✅ CORRECT: Parameterized query
await db.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

## Testing Checklist

-   [ ] Using `db` from `@/lib/db` singleton
-   [ ] All queries scoped by `organizationId`
-   [ ] Relations included explicitly when needed
-   [ ] Transactions used for multi-table operations
-   [ ] No Prisma imports in client components
-   [ ] Pagination implemented for list queries
-   [ ] Proper error handling around database calls

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.tenancy.organization_scoping`
-   `ecclesia.architecture.separation_of_concerns`

## References

-   [prisma/schema.prisma](../../prisma/schema.prisma)
-   [lib/db.ts](../../lib/db.ts)
-   [Prisma Documentation](https://www.prisma.io/docs)
