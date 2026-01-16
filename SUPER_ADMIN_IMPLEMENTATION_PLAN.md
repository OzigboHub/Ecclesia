# Super Admin Implementation Plan - Phase 1

**Objective**: Implement critical super admin features to enable complete platform management.

**Timeline**: 2-3 weeks (for phases 1-2)
**Priority**: CRITICAL - Blocks super admin usage

---

## Phase 1: Server Actions & Infrastructure (Week 1)

### Task 1.1: Create Organization Server Actions

**File**: `app/actions/organization.actions.ts` (refactor/extend)

```typescript
// Add these functions
export async function getAllOrganizations(): Promise<
	ActionResponse<Organization[]>
>;
// Returns all parishes and outstations across platform
// Only SUPER_ADMIN can access
// Includes: parent relationships, children, feature settings

export async function createParish(
	data: CreateParishInput
): Promise<ActionResponse<Organization>>;
// Create new parish
// Only SUPER_ADMIN can create parishes
// Validates: name is unique

export async function createOutstation(
	data: CreateOutstationInput & { parishId: string }
): Promise<ActionResponse<Organization>>;
// Create outstation under specific parish
// Only SUPER_ADMIN can create
// Validates: parish exists, outstation name unique under parent

export async function updateOrganization(
	id: string,
	data: UpdateOrganizationInput
): Promise<ActionResponse<Organization>>;
// Edit organization details (name, address, phone, etc.)
// Only SUPER_ADMIN can update non-pious organizations
// Verify ownership scope

export async function deleteOrganization(id: string): Promise<ActionResponse>;
// Soft delete organization (set isActive: false)
// Only SUPER_ADMIN can delete
// Prevents deletion if has active users

export async function transferOutstation(
	outstationId: string,
	newParishId: string
): Promise<ActionResponse<Organization>>;
// Move outstation from one parish to another
// Updates parentId
// Cascades to all parishioners

export async function getSystemMetrics(): Promise<
	ActionResponse<SystemMetrics>
>;
// Returns platform-wide statistics
// Total parishes, outstations, parishioners, revenue, users
// Only SUPER_ADMIN can access
```

### Task 1.2: Create Zod Validators

**File**: `lib/validators/organization.schema.ts` (extend)

```typescript
// Add these schemas
export const createParishSchema = z.object({
	name: z.string().min(2).max(100),
	address: z.string().optional(),
	phone: z
		.string()
		.regex(/^(\+234|0)[789][01]\d{8}$/)
		.optional(),
	email: z.string().email().optional(),
	diocese: z.string().optional(),
	priestName: z.string().optional(),
});

export const createOutstationSchema = createParishSchema.extend({
	parishId: z.string().uuid('Invalid parish ID'),
});

export const updateOrganizationSchema = createParishSchema.partial();

export const transferOutstationSchema = z.object({
	outstationId: z.string().uuid(),
	newParishId: z.string().uuid(),
});
```

### Task 1.3: Update Organization Sidebar Navigation

**File**: `components/layout/sidebar.tsx`

Add this navigation item for SUPER_ADMIN:

```typescript
{
  name: 'Organizations',
  href: '/dashboard/organizations',
  icon: Building2,
  roles: ['SUPER_ADMIN'],  // Only super admin
}
```

### Task 1.4: Type Definitions

**File**: `types/index.ts` (add)

```typescript
export interface SystemMetrics {
	totalParishes: number;
	totalOutstations: number;
	totalParishioners: number;
	totalUsers: number;
	totalRevenue: number;
	usersByRole: Record<string, number>;
	organizationStatus: {
		active: number;
		inactive: number;
	};
}

export interface CreateParishInput {
	name: string;
	address?: string;
	phone?: string;
	email?: string;
	diocese?: string;
	priestName?: string;
}

export interface CreateOutstationInput extends CreateParishInput {
	parishId: string;
}
```

**Estimated Time**: 4-6 hours

---

## Phase 2: Pages & Components (Week 1-2)

### Task 2.1: Refactor Organizations Landing Page

**File**: `app/dashboard/organizations/page.tsx` (major refactor)

**Current State**: Shows only Pious Organizations (church groups)
**New State**: Shows parishes and outstations with tabs

```typescript
// Layout:
// ├── Header "Organizations Management"
// ├── Tabs:
// │   ├── "Parishes" (default)
// │   │   ├── List of all parishes
// │   │   ├── Create Parish button
// │   │   └── Each parish card links to detail page
// │   ├── "Outstations"
// │   │   ├── List of all outstations
// │   │   ├── Show parent parish
// │   │   └── Each outstation card links to detail page
// │   └── "Pious Organizations" (keep existing)
```

**Estimated Time**: 3-4 hours

### Task 2.2: Create Parish Detail/Edit Page

**Files**:

-   `app/dashboard/organizations/parishes/[id]/page.tsx` (detail)
-   `app/dashboard/organizations/parishes/[id]/edit/page.tsx` (edit)

**Features**:

-   Display parish information
-   Show list of outstations
-   Edit button → Edit page
-   Create Outstation button → Opens form/modal
-   Transfer outstation buttons
-   Back button to organizations list

**Estimated Time**: 3-4 hours

### Task 2.3: Create Parish Creation Page

**File**: `app/dashboard/organizations/parishes/new/page.tsx`

**Features**:

-   Form with fields from `createParishSchema`
-   Submit calls `createParish()` Server Action
-   Success → redirect to parish detail page
-   Error → display validation errors

**Estimated Time**: 2-3 hours

### Task 2.4: Create Outstation Creation Modal/Page

**Options**:
A) Modal dialog (easier) - appears on parish detail page
B) Separate page - `/app/dashboard/organizations/outstations/new`

**Recommend**: Option A (modal on parish detail)

**Features**:

-   Form with fields from `createOutstationSchema`
-   Pre-fills `parishId` from parent parish
-   Submit calls `createOutstation()` Server Action
-   Success → refresh parish detail page

**Estimated Time**: 2-3 hours

### Task 2.5: Create Organization Form Component

**File**: `components/forms/organization-form.tsx` (refactor/extend)

**Current**: Generic org form for pious organizations
**New**: Separate forms for:

-   `ParishForm` - for creating/editing parishes
-   `OutstationForm` - for creating/editing outstations
-   Keep generic form for pious organizations

**Estimated Time**: 2-3 hours

**Total Phase 2**: 15-20 hours

---

## Phase 2.5: Enhanced User Management (Week 2)

### Task 2.5.1: Update Users List Page

**File**: `app/dashboard/users/page.tsx`

**Changes**:

-   Add column showing user's organization
-   Filter by role across ALL organizations (not just current org)
-   Super admin sees all users everywhere

**Current Issue**: `getUsers()` uses `getOrgIdsForUser()` which respects hierarchy
**Fix**: Add parameter to `getUsers()` to bypass hierarchy for SUPER_ADMIN

```typescript
export async function getUsers(
	getAllOrgs: boolean = false
): Promise<ActionResponse<User[]>> {
	const session = await auth();
	if (!session) return { success: false, message: 'Unauthorized' };

	let organizationIds: string[];

	if (getAllOrgs && session.user.role === 'SUPER_ADMIN') {
		// Get ALL organizations for super admin
		organizationIds = (
			await db.organization.findMany({
				select: { id: true },
			})
		).map((o) => o.id);
	} else {
		// Get hierarchy for regular admins
		organizationIds = getOrgIdsForUser(organization);
	}

	// ... rest of query
}
```

**Estimated Time**: 1-2 hours

---

## Phase 3: Dashboard Enhancement (Week 2)

### Task 3.1: Create Super Admin Dashboard

**File**: `app/dashboard/page.tsx` (enhancement)

**Add Super Admin Section**:
If user is SUPER_ADMIN, show platform-wide metrics:

-   Total parishes
-   Total outstations
-   Total parishioners (across all)
-   Total users by role
-   Recent organizations created
-   Recent users created

Uses `getSystemMetrics()` Server Action

**Estimated Time**: 3-4 hours

---

## Testing Checklist

### Server Action Tests

-   [ ] `createParish()` - SUPER_ADMIN can create, others cannot
-   [ ] `createOutstation()` - SUPER_ADMIN can create, parent parish must exist
-   [ ] `updateOrganization()` - SUPER_ADMIN can update any org
-   [ ] `deleteOrganization()` - soft deletes correctly
-   [ ] `transferOutstation()` - updates parentId correctly
-   [ ] `getAllOrganizations()` - returns all orgs, no leaks
-   [ ] `getSystemMetrics()` - counts correct

### Page Tests

-   [ ] `/dashboard/organizations` - tabs work, shows parishes/outstations
-   [ ] `/dashboard/organizations/parishes/[id]` - detail page loads correctly
-   [ ] `/dashboard/organizations/parishes/new` - create form works
-   [ ] `/dashboard/users` - shows all users for SUPER_ADMIN
-   [ ] `/dashboard` - shows super admin metrics for SUPER_ADMIN

### Authorization Tests

-   [ ] PARISH_ADMIN cannot access organization management
-   [ ] PARISH_ADMIN cannot create parishes
-   [ ] Non-SUPER_ADMIN cannot access `/dashboard/organizations/new`

---

## File Changes Summary

### New Files to Create

```
app/dashboard/organizations/parishes/
├── [id]/
│   ├── page.tsx                    (detail page)
│   └── edit/page.tsx               (edit page)
└── new/page.tsx                    (create page)

app/actions/
└── (may refactor existing organization.actions.ts)
```

### Files to Modify

```
app/dashboard/organizations/page.tsx       (refactor - add tabs)
app/dashboard/page.tsx                     (enhance for super admin)
app/dashboard/users/page.tsx               (add org column)
app/actions/organization.actions.ts        (add new server actions)
lib/validators/organization.schema.ts      (add schemas)
components/layout/sidebar.tsx              (add nav item)
types/index.ts                             (add types)
components/forms/organization-form.tsx     (refactor/extend)
```

### Files to Review

```
prisma/schema.prisma                       (Organization model - ensure structure correct)
lib/auth.ts                                (check helpers)
```

---

## Implementation Order (Sequential)

1. **Server Actions First** (Task 1.1-1.4) - 4-6 hours
2. **Organizations Page** (Task 2.1) - 3-4 hours
3. **Parish Detail Page** (Task 2.2) - 3-4 hours
4. **Parish Creation** (Task 2.3) - 2-3 hours
5. **Outstation Creation** (Task 2.4) - 2-3 hours
6. **Enhanced Users List** (Task 2.5.1) - 1-2 hours
7. **Super Admin Dashboard** (Task 3.1) - 3-4 hours
8. **Testing & QA** - 4-6 hours

**Total**: 25-35 hours (approximately 3-4 days for 1 developer)

---

## Dependencies

1. **Database Schema** ✅ Already supports parishes/outstations hierarchy
2. **Auth** ✅ Session already has SUPER_ADMIN role
3. **Existing Infrastructure** ✅ Server Actions, Zod, Components all in place

---

## Success Criteria

-   [ ] SUPER_ADMIN can view all parishes and outstations
-   [ ] SUPER_ADMIN can create new parishes
-   [ ] SUPER_ADMIN can create outstations under parishes
-   [ ] SUPER_ADMIN can edit any organization
-   [ ] SUPER_ADMIN can transfer outstations between parishes
-   [ ] SUPER_ADMIN can soft-delete organizations
-   [ ] SUPER_ADMIN can view all users across all organizations
-   [ ] SUPER_ADMIN dashboard shows platform-wide metrics
-   [ ] Non-super-admin users cannot access these features
-   [ ] All role checks pass
-   [ ] All validation passes
-   [ ] No data leaks across organizations

---

## Notes for Developer

1. **Start with Database Queries**: Ensure your queries correctly distinguish between parishes and outstations
2. **Test Role Checks**: Use a test account with SUPER_ADMIN role
3. **Be Careful with Cascades**: When transferring or deleting, ensure all related records are handled
4. **Update Sidebar Early**: This signals to users that new features are coming
5. **Keep Documentation Updated**: Update docstrings and comments as you implement

---

## Questions to Clarify

1. Should super admin be able to bulk import parishes from CSV?
2. Should there be a soft-delete confirmation with preview of affected records?
3. Do we need to log all super admin actions for audit trail?
4. Should transferring outstation send notification to affected admins?

---

## Rollback Plan

If issues arise during implementation:

1. Delete new files
2. Revert modified files to previous commit
3. No database migration issues (only using existing schema)
4. Remove sidebar navigation item

---
