---
title: Database Schema
description: Database models, relationships, and design decisions
section: architecture
order: 2
---

# Database Schema

Ecclesia uses PostgreSQL via Prisma ORM. The schema is defined in `prisma/schema.prisma` and follows a multi-tenant architecture scoped by Organization.

## Core Models

### Organization

The foundation of multi-tenancy. Every resource is scoped to an Organization.

```
Organization
├── id: String (UUID)
├── name: String (unique)
├── level: HierarchyLevel (PARISH | OUTSTATION)
├── parentId: String? (self-reference for hierarchy)
├── address: String?
├── contactEmail: String?
├── contactPhone: String?
├── featureSettings: OrganizationFeatureSettings (1:1)
├── users: User[]
├── parishioners: Parishioner[]
├── payments: Payment[]
├── massIntentions: MassIntention[]
├── appointments: Appointment[]
├── societies: Society[]
└── ...
```

### User

Application users with authentication credentials and role assignments.

```
User
├── id: String (UUID)
├── name: String
├── email: String (unique)
├── password: String (bcrypt hashed)
├── role: UserRole
├── organizationId: String
├── isActive: Boolean
├── failedLoginAttempts: Int
├── lockoutUntil: DateTime?
└── sessions: Session[]
```

### Parishioner

Church members with biographical and sacramental information.

```
Parishioner
├── id: String (UUID)
├── firstName: String
├── lastName: String
├── email: String?
├── phone: String?
├── dateOfBirth: DateTime?
├── gender: Gender
├── organizationId: String
├── payments: Payment[]
├── massIntentions: MassIntention[]
├── sacraments: Sacrament[]
└── societyMemberships: SocietyMembership[]
```

### Payment

Unified payment model for all financial transactions.

```
Payment
├── id: String (UUID)
├── amount: Float
├── purpose: PaymentPurpose
├── paymentMethod: PaymentMethod
├── status: PaymentStatus
├── payerName: String
├── onBehalfOf: String?
├── month: Int? (for monthly offerings)
├── receiptNumber: String
├── organizationId: String
├── parishionerId: String?
├── massIntentionId: String?
└── paymentTypeId: String?
```

## Enums

### UserRole

```
SUPER_ADMIN | PARISH_ADMIN | PARISH_SECRETARY | PARISH_STAFF
OUTSTATION_ADMIN | ORGANIZATION_PRESIDENT | ORGANIZATION_SECRETARY | PARISHIONER
```

### PaymentPurpose

```
OFFERING | TITHE | DONATION | MASS_INTENTION | CAMPAIGN | OTHER
```

### PaymentMethod

```
CASH | BANK_TRANSFER | CARD | ONLINE | POS | CHEQUE
```

### HierarchyLevel

```
PARISH | OUTSTATION
```

## Relationships

### Organization Hierarchy

```
Parish (parent)
  └── parentId: null
  └── children: [Outstation A, Outstation B]

Outstation A
  └── parentId: Parish.id
  └── parent: Parish
```

### Payment → Parishioner (Optional)

Payments can be anonymous or linked to a parishioner. The `payerName` field always stores the name, while `parishionerId` provides the optional link.

### MassIntention → Payment

Mass intentions have associated stipend payments linked through `massIntentionId` on the Payment model.

## Indexes

Key indexes for query performance:

- `Organization.parentId` — Hierarchy lookups
- `User.email` — Login queries
- `Payment.organizationId` — Scoped payment queries
- `Parishioner.organizationId` — Scoped member queries
- `MassIntention.organizationId` — Scoped intention queries
