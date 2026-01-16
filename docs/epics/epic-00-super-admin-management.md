# Epic 00: Super Admin Platform Management

**Epic ID**: SUPER-ADMIN-MGMT
**Status**: ⚠️ PLANNED (Not Started)
**Priority**: 🔴 CRITICAL
**Owner**: TBD
**Dependencies**: None (foundational)

---

## Overview

The Super Admin role is defined in the system but lacks dedicated pages and Server Actions to exercise those permissions. This epic implements all critical super admin features required for platform governance.

### What This Epic Enables

-   **Platform Oversight**: View all parishes, outstations, users, and metrics across the entire system
-   **Organization Management**: Create, edit, and manage parishes and outstations
-   **User Management**: Create and manage users with any role across the platform
-   **System Administration**: Configure features, manage settings, view audit logs

---

## User Stories

### SUPER-ADMIN-001: View All Organizations

**As a** Super Admin
**I want to** view all parishes and outstations across the platform
**So that** I can understand the system structure and manage organizations

**Acceptance Criteria**:

-   [ ] Dashboard organizations page shows both parishes and outstations
-   [ ] Parishes are visually distinguished from outstations
-   [ ] Parent parish is displayed for each outstation
-   [ ] Can search/filter organizations by name or type
-   [ ] Only SUPER_ADMIN role can access this page
-   [ ] PARISH_ADMIN cannot view other parishes' data

**Definition of Done**:

-   Page created: `/dashboard/organizations`
-   Server action: `getAllOrganizations()` implemented
-   Zod schema validation in place
-   Tests pass

**Estimated Points**: 5

---

### SUPER-ADMIN-002: Create New Parish

**As a** Super Admin
**I want to** create new parishes in the system
**So that** I can onboard new church communities

**Acceptance Criteria**:

-   [ ] Can access parish creation form
-   [ ] Form has fields: name, address, phone, email, diocese, priest name
-   [ ] All fields are validated with appropriate error messages
-   [ ] Organization name must be unique across system
-   [ ] Successfully created parish appears in organization list
-   [ ] Only SUPER_ADMIN can create parishes
-   [ ] Form redirects to parish detail page after creation

**Definition of Done**:

-   Page created: `/dashboard/organizations/parishes/new`
-   Server action: `createParish()` implemented
-   Zod schema: `createParishSchema` defined
-   Form component: `ParishForm` created
-   Tests pass

**Estimated Points**: 5

---

### SUPER-ADMIN-003: Create Outstation Under Parish

**As a** Super Admin
**I want to** create outstations under specific parishes
**So that** I can organize sub-units of larger parishes

**Acceptance Criteria**:

-   [ ] Can access outstation creation form from parish detail page
-   [ ] Form requires selection of parent parish
-   [ ] Form has same fields as parish (name, address, phone, etc.)
-   [ ] Outstation name must be unique within parent parish
-   [ ] Successfully created outstation appears under parent in hierarchy
-   [ ] Only SUPER_ADMIN can create outstations
-   [ ] Refreshes parish detail page after creation

**Definition of Done**:

-   Page/Modal: Outstation creation form
-   Server action: `createOutstation()` implemented
-   Zod schema: `createOutstationSchema` defined
-   Form component: `OutstationForm` created
-   Tests pass

**Estimated Points**: 5

---

### SUPER-ADMIN-004: Edit Organization Details

**As a** Super Admin
**I want to** edit parish and outstation details
**So that** I can keep organization information up-to-date

**Acceptance Criteria**:

-   [ ] Can access edit page from organization detail page
-   [ ] Form is pre-populated with current organization data
-   [ ] Can edit name, address, phone, email fields
-   [ ] Validates that name remains unique
-   [ ] Changes persist to database
-   [ ] Redirects to organization detail page after save
-   [ ] Only SUPER_ADMIN can edit organizations

**Definition of Done**:

-   Page created: `/dashboard/organizations/[id]/edit`
-   Server action: `updateOrganization()` implemented
-   Tests pass

**Estimated Points**: 3

---

### SUPER-ADMIN-005: Transfer Outstation Between Parishes

**As a** Super Admin
**I want to** move an outstation from one parish to another
**So that** I can reorganize the parish structure as needed

**Acceptance Criteria**:

-   [ ] Can access transfer option from outstation detail page
-   [ ] Dialog shows current parent parish
-   [ ] Can select new parent parish
-   [ ] Transfer updates the parentId relationship
-   [ ] All parishioners under outstation remain associated
-   [ ] All appointments/payments remain associated
-   [ ] Only SUPER_ADMIN can transfer outstations
-   [ ] Shows confirmation dialog with impact summary

**Definition of Done**:

-   Transfer modal/dialog created
-   Server action: `transferOutstation()` implemented
-   Zod schema: `transferOutstationSchema` defined
-   Tests pass

**Estimated Points**: 5

---

### SUPER-ADMIN-006: Delete/Archive Organization

**As a** Super Admin
**I want to** soft-delete parishes and outstations
**So that** I can remove inactive organizations without data loss

**Acceptance Criteria**:

-   [ ] Can access delete option from organization detail page
-   [ ] Shows confirmation dialog with warning about cascading effects
-   [ ] Prevents deletion if organization has active users
-   [ ] Sets `isActive: false` (soft delete, not hard delete)
-   [ ] Deleted organizations don't appear in list by default
-   [ ] Shows option to restore deleted organizations
-   [ ] Only SUPER_ADMIN can delete

**Definition of Done**:

-   Delete confirmation dialog created
-   Server action: `deleteOrganization()` implemented
-   Tests pass

**Estimated Points**: 5

---

### SUPER-ADMIN-007: View All Users Across Platform

**As a** Super Admin
**I want to** view all users across all organizations
**So that** I can manage user accounts system-wide

**Acceptance Criteria**:

-   [ ] Users page shows users from all organizations (not just current org)
-   [ ] Can see organization name for each user
-   [ ] Can filter by role across entire platform
-   [ ] Can search users by name or email
-   [ ] Pagination works correctly for large user lists
-   [ ] Only SUPER_ADMIN can view all users
-   [ ] PARISH_ADMIN only sees their organization's users

**Definition of Done**:

-   Users page enhanced to show all users for SUPER_ADMIN
-   Server action updated: `getUsers()` with getAllOrgs parameter
-   Tests pass

**Estimated Points**: 3

---

### SUPER-ADMIN-008: Create Users in Any Organization

**As a** Super Admin
**I want to** create users with any role in any organization
**So that** I can set up accounts for anyone in the system

**Acceptance Criteria**:

-   [ ] User creation form shows organization selector
-   [ ] Can select any organization in the system
-   [ ] Can assign any role (except preventing super admin creation)
-   [ ] Role hierarchy prevents privilege escalation
-   [ ] User is created with correct organization association
-   [ ] Confirmation email sent (if configured)
-   [ ] Only SUPER_ADMIN can create users in other organizations

**Definition of Done**:

-   User creation form enhanced with org selector
-   Tests pass

**Estimated Points**: 3

---

### SUPER-ADMIN-009: View Super Admin Dashboard

**As a** Super Admin
**I want to** see a dashboard with platform-wide metrics
**So that** I can understand system health and usage

**Acceptance Criteria**:

-   [ ] Dashboard shows when logged in as SUPER_ADMIN
-   [ ] Displays total number of parishes
-   [ ] Displays total number of outstations
-   [ ] Displays total parishioners across all organizations
-   [ ] Displays total users by role
-   [ ] Displays total revenue collected
-   [ ] Shows recent organizations created (last 7 days)
-   [ ] Shows recent users created (last 7 days)
-   [ ] All metrics are read-only and accurate
-   [ ] Only SUPER_ADMIN can view this dashboard

**Definition of Done**:

-   Dashboard page enhanced with super admin section
-   Server action: `getSystemMetrics()` implemented
-   Tests pass

**Estimated Points**: 5

---

## Technical Implementation Details

### Server Actions Required

```typescript
// app/actions/organization.actions.ts

export async function getAllOrganizations(): Promise<ActionResponse<Organization[]>>
  - Returns all parishes and outstations
  - Includes parent/child relationships
  - Only SUPER_ADMIN authorized

export async function createParish(data: CreateParishInput): Promise<ActionResponse<Organization>>
  - Validates unique name
  - Creates with level = "PARISH"
  - Only SUPER_ADMIN authorized

export async function createOutstation(
  data: CreateOutstationInput & { parishId: string }
): Promise<ActionResponse<Organization>>
  - Validates parent parish exists
  - Validates unique name within parent
  - Creates with level = "OUTSTATION"
  - Sets parentId
  - Only SUPER_ADMIN authorized

export async function updateOrganization(
  id: string,
  data: UpdateOrganizationInput
): Promise<ActionResponse<Organization>>
  - Validates unique name if changed
  - Updates specified fields
  - Only SUPER_ADMIN authorized

export async function deleteOrganization(id: string): Promise<ActionResponse>
  - Soft delete: sets isActive = false
  - Prevents deletion if has active users
  - Only SUPER_ADMIN authorized

export async function transferOutstation(
  outstationId: string,
  newParishId: string
): Promise<ActionResponse<Organization>>
  - Validates outstation exists
  - Validates new parent parish exists
  - Updates parentId
  - Only SUPER_ADMIN authorized

export async function getSystemMetrics(): Promise<ActionResponse<SystemMetrics>>
  - Counts parishes, outstations, parishioners
  - Groups users by role
  - Calculates total revenue
  - Only SUPER_ADMIN authorized
```

### Pages Required

```
/dashboard/organizations          (refactor)
  ├── /parishes                   (new tab)
  ├── /parishes/new               (new page)
  ├── /parishes/[id]              (new page)
  ├── /parishes/[id]/edit         (new page)
  ├── /outstations                (new tab)
  └── /outstations/[id]           (new page)
```

### Components Required

-   `ParishForm` - Form component for creating/editing parishes
-   `OutstationForm` - Form component for creating/editing outstations
-   `TransferOutstationDialog` - Modal for transferring outstations
-   `DeleteOrganizationDialog` - Confirmation dialog for deletion

### Zod Validators Required

-   `createParishSchema`
-   `createOutstationSchema`
-   `updateOrganizationSchema`
-   `transferOutstationSchema`

---

## Testing Strategy

### Unit Tests

-   [ ] `createParish()` only works for SUPER_ADMIN
-   [ ] `createOutstation()` validates parent parish exists
-   [ ] `transferOutstation()` updates parentId correctly
-   [ ] `getSystemMetrics()` counts correctly
-   [ ] All authorization checks pass

### Integration Tests

-   [ ] Create parish → create outstations → verify hierarchy
-   [ ] Transfer outstation → verify relationships updated
-   [ ] Soft delete organization → verify isActive = false
-   [ ] Users list shows all users for SUPER_ADMIN

### E2E Tests

-   [ ] Super admin login → create parish → create outstation → verify in list
-   [ ] Super admin transfer outstation → verify in new parent
-   [ ] Non-super admin cannot access organization management

---

## Dependencies

-   ✅ Auth.js with SUPER_ADMIN role
-   ✅ Prisma schema with Organization hierarchy
-   ✅ Server Actions infrastructure
-   ✅ Zod validation patterns

---

## Acceptance Criteria - ALL MUST PASS

-   [ ] All SUPER_ADMIN users can access new pages
-   [ ] All non-SUPER_ADMIN users are denied access to admin pages
-   [ ] All Server Actions properly validate role
-   [ ] All organization relationships are maintained correctly
-   [ ] Dashboard metrics are accurate
-   [ ] No data leaks across organizations
-   [ ] All forms validate inputs correctly
-   [ ] All tests pass
-   [ ] Code follows project conventions

---

## Estimated Effort

| Component       | Story Points  |
| --------------- | ------------- |
| SUPER-ADMIN-001 | 5             |
| SUPER-ADMIN-002 | 5             |
| SUPER-ADMIN-003 | 5             |
| SUPER-ADMIN-004 | 3             |
| SUPER-ADMIN-005 | 5             |
| SUPER-ADMIN-006 | 5             |
| SUPER-ADMIN-007 | 3             |
| SUPER-ADMIN-008 | 3             |
| SUPER-ADMIN-009 | 5             |
| Testing & QA    | 8             |
| **TOTAL**       | **47 points** |

**Estimated Duration**: 1.5-2 weeks (for 1 experienced developer)

---

## Documentation

-   [ ] Update `/docs/super-admin-guide.md` with how-to for each feature
-   [ ] Create API documentation for new Server Actions
-   [ ] Update user permission matrix
-   [ ] Create troubleshooting guide

---

## Definition of Done (Epic Level)

-   ✅ All 9 user stories completed and tested
-   ✅ All Server Actions implemented and tested
-   ✅ All pages created with proper authorization
-   ✅ All Zod validators defined
-   ✅ All role checks passing
-   ✅ Documentation updated
-   ✅ Code reviewed and approved
-   ✅ No regression in existing features

---

## Related Documentation

-   `SUPER_ADMIN_FEATURE_STATUS.md` - Current status of features
-   `SUPER_ADMIN_IMPLEMENTATION_PLAN.md` - Step-by-step implementation guide
-   `/docs/user_flow.md` - Permission matrix (Section 2.1)
-   `/docs/prd.md` - Product requirements (Section 3.1.1)
-   `/.github/skills/010-role-based-access-control.md` - RBAC patterns

---
