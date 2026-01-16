# Super Admin Features - Implementation Status

**Last Updated**: January 2026
**Status**: INCOMPLETE - Missing Key Pages and Functionality

---

## Overview

The Super Admin role has been defined in the permission matrix but several critical pages and features are **NOT YET IMPLEMENTED**. This document tracks what exists and what's missing.

---

## Completed Super Admin Features

### ✅ RBAC Infrastructure

-   **Role Definition**: SUPER_ADMIN role defined in Prisma schema
-   **Role Guards**: Authorization checks in Server Actions via `session.user.role`
-   **Role Hierarchy**: `ROLE_HIERARCHY` in `app/actions/user.actions.ts` enforces role-based access
-   **Permission Matrix**: Documented in `/docs/user_flow.md` and `/docs/implementation-plan.md`
-   **UI Role Filtering**: Sidebar filters navigation based on user role

### ✅ User Management (Partial)

-   Users listing page (`/dashboard/users`)

    -   Shows all users with stats
    -   Role-based filtering shows admin-only items
    -   ✅ SUPER_ADMIN can view all users across entire platform
    -   ✅ Access restricted to `['SUPER_ADMIN', 'PARISH_ADMIN']` roles

-   User creation page (`/dashboard/users/new`)

    -   Form to create new users
    -   Role assignment (with hierarchy enforcement)
    -   Organization assignment
    -   ✅ SUPER_ADMIN can create users with any role (hierarchy enforced)

-   User editing page (`/dashboard/users/[id]/edit`)

    -   Edit user details and role
    -   Role hierarchy prevents privilege escalation
    -   ✅ SUPER_ADMIN can edit any user
    -   ❌ **Missing**: Super admin-specific edit permissions (e.g., can only edit non-super-admin users)

-   User password reset page (`/dashboard/users/[id]/password`)
    -   Reset password for any user
    -   ✅ SUPER_ADMIN can reset passwords

### ✅ User Actions (Server Side)

-   `createUser()` - Create user with any role ✅
-   `updateUser()` - Edit user details ✅
-   `blockUser()` - Block/unblock users ✅
-   `deleteUser()` - Soft delete users ✅
-   `resetPassword()` - Admin password reset ✅
-   `getUsers()` - List users (org-scoped) ⚠️ **See note below**
-   `getUser()` - Get single user details ✅
-   `getUserStats()` - Get user statistics ✅

### ⚠️ Organization Management (Partial)

-   Organizations listing page (`/dashboard/organizations`)

    -   Shows pious organizations (church groups/societies)
    -   ✅ SUPER_ADMIN can view all organizations
    -   ❌ **Issue**: Current implementation shows "Pious Organizations" only
    -   ❌ **Missing**: No way to view/manage parishes and outstations

-   Organization creation (`/dashboard/organizations/new`)
    -   Creates pious organizations
    -   ❌ **Missing**: No parish/outstation creation interface for super admin

---

## Missing Super Admin Features

### 🔴 Critical - Must Implement

#### 1. **Super Admin Dashboard** (`/dashboard`)

**Location**: `app/dashboard/page.tsx` (exists but not super-admin optimized)

**What's Needed**:

-   Platform-wide statistics:
    -   Total number of parishes
    -   Total number of outstations
    -   Total parishioners across all parishes
    -   Total revenue across all parishes
    -   Count of active users by role
    -   System health metrics
-   Quick navigation to super admin features
-   Recent activity across platform
-   Feature usage analytics

**Current State**: Generic dashboard shows organization-specific stats only

---

#### 2. **Organization Management Portal** (`/dashboard/organizations`)

**Location**: Needs new page or major refactor of current

**What's Needed**:

-   Separate interface showing:
    -   All parishes (with edit/delete options)
    -   All outstations (with parent parish indicator)
    -   Create new parish form
    -   Create new outstation form
    -   Transfer outstation between parishes
    -   Archive/soft-delete organizations

**Current State**: Currently only shows "Pious Organizations" (church groups, not parishes/outstations)

**Required Pages**:

```
/dashboard/organizations/parishes          - List all parishes
/dashboard/organizations/parishes/new        - Create parish
/dashboard/organizations/parishes/[id]       - Parish detail/edit
/dashboard/organizations/outstations         - List all outstations
/dashboard/organizations/outstations/new     - Create outstation
/dashboard/organizations/outstations/[id]    - Outstation detail/edit
```

---

#### 3. **Platform Reports & Analytics** (NEW)

**Location**: `/dashboard/reports` (doesn't exist)

**What's Needed**:

-   Parish performance reports:
    -   Parishioner growth by parish
    -   Revenue by parish
    -   Sacrament administration statistics
    -   User activity logs
-   Exportable reports (CSV, PDF)
-   Date range filtering
-   Organization-level drill-down

**Current State**: Not implemented

---

#### 4. **Feature Management Console** (PARTIAL)

**Location**: `/dashboard/settings` (exists but needs super-admin specific section)

**What's Needed**:

-   Platform-wide feature toggles:
    -   Enable/disable features for all organizations
    -   Set feature limits per organization
    -   Override feature restrictions
    -   View feature usage analytics

**Current State**: Settings page exists but shows only organization-specific features

---

### 🟡 High Priority - Should Implement

#### 5. **Data Audit & Security**

**Location**: `/dashboard/audit` (doesn't exist)

**What's Needed**:

-   User activity logs
-   Data modification history
-   Login/access logs
-   System change logs
-   Export audit trails

**Current State**: Not implemented

---

#### 6. **System Configuration**

**Location**: `/dashboard/admin/system` (doesn't exist)

**What's Needed**:

-   API key management
-   Webhook configuration
-   Email/SMS gateway settings
-   Payment gateway settings
-   Backup/restore interface

**Current State**: Not implemented

---

#### 7. **User Accounts & Roles Dashboard**

**Location**: `/dashboard/users` (exists but needs super-admin enhancements)

**What's Needed**:

-   View all users across all organizations
-   Filter by role across entire platform
-   Block/unblock users globally
-   Reset passwords
-   View user activity logs
-   Batch operations (export users, bulk role assignment)

**Current State**: Partially implemented - works but limited features

---

## Server Actions Status

### Implemented ✅

-   `createUser()` - Full support
-   `updateUser()` - Full support
-   `deleteUser()` - Full support
-   `blockUser()` - Full support
-   `resetPassword()` - Full support
-   `getUsers()` - **Note**: Currently uses `getOrgIdsForUser()` which respects org hierarchy. For super admin viewing ALL users, needs special handling

### Missing ❌

-   `getAllOrganizations()` - Get all parishes and outstations (currently only gets pious organizations)
-   `createParish()` - Create new parish
-   `createOutstation()` - Create new outstation
-   `updateOrganization()` - Edit parish/outstation details
-   `deleteOrganization()` - Soft delete parishes/outstations
-   `getAuditLogs()` - Retrieve system audit trail
-   `transferOutstation()` - Move outstation between parishes
-   `getSystemMetrics()` - Platform-wide statistics
-   `generateReport()` - Generate reports across organizations
-   `toggleFeatureGlobal()` - Enable/disable feature for all orgs
-   `setFeatureLimit()` - Set limits per organization

---

## Client-Side Components Status

### Existing Components

-   `<ProtectedRoute>` - Works with SUPER_ADMIN role ✅
-   `useRole()` hook - Includes `isSuperAdmin` check ✅
-   Sidebar - Filters items based on role ✅

### Missing Components

-   `<SuperAdminNav>` or enhanced navigation for super admin features
-   `<OrganizationManagement>` component for parish/outstation management
-   `<AuditLogViewer>` component
-   `<ReportsGenerator>` component
-   `<FeatureToggleManager>` component (platform-wide)

---

## Implementation Checklist

### Phase 1: Foundation (CRITICAL)

-   [ ] Create `getAllOrganizations()` Server Action

    -   Returns all parishes and outstations
    -   Includes child/parent relationships
    -   Distinguishes between Parish and Outstation
    -   Only accessible to SUPER_ADMIN

-   [ ] Create parish/outstation management Server Actions

    -   `createParish()`
    -   `createOutstation()`
    -   `updateOrganization()`
    -   `deleteOrganization()`
    -   `transferOutstation()`

-   [ ] Update sidebar navigation
    -   Add "Organizations" section for super admin
    -   Link to new organization management pages

### Phase 2: Dashboard & Pages (HIGH)

-   [ ] Create `/dashboard/organizations` refactor

    -   Two tabs: "Parishes" and "Outstations"
    -   Separate components for each
    -   CRUD operations for each type

-   [ ] Create `/dashboard/organizations/new` for parishes

    -   Form to create new parish
    -   Validation using Zod

-   [ ] Create `/dashboard/organizations/[id]` for parish detail

    -   Show parish info and nested outstations
    -   Option to edit parish
    -   Option to create outstations

-   [ ] Create `/dashboard/organizations/outstations` page

    -   List all outstations with parent parish
    -   Transfer interface

-   [ ] Enhance `/dashboard/users` for super admin view
    -   Show users across all organizations
    -   Add organization column

### Phase 3: Reports & Analytics (MEDIUM)

-   [ ] Create `/dashboard/reports` page

    -   Platform statistics
    -   Organization drill-down
    -   Export functionality

-   [ ] Create `getSystemMetrics()` Server Action

-   [ ] Create `generateReport()` Server Action

### Phase 4: Security & Audit (LOWER)

-   [ ] Create `/dashboard/audit` page

    -   Activity logs
    -   Data modification history

-   [ ] Create `getAuditLogs()` Server Action

-   [ ] Create `/dashboard/admin/system` page
    -   System configuration interface
    -   API key management (if needed)

---

## Database Schema Notes

### Current Org Structure

```prisma
model Organization {
  id       String
  level    OrganizationLevel   // "PARISH" or "OUTSTATION"
  parentId String?             // For outstations, references parish
  children Organization[]      // Outstations under this parish
  parent   Organization?       // Parent parish (if outstation)
  ...
}

enum OrganizationLevel {
  PARISH
  OUTSTATION
}
```

### Queries Needed

1. Get all parishes: `WHERE level = 'PARISH'`
2. Get outstations under parish: `WHERE parentId = $parishId`
3. Get all with hierarchy: `include: { children: true, parent: true }`

---

## Testing Strategy

### Unit Tests (for Server Actions)

-   [ ] Test `createParish()` with SUPER_ADMIN role
-   [ ] Test `createOutstation()` with SUPER_ADMIN role
-   [ ] Test that PARISH_ADMIN cannot create parishes
-   [ ] Test that non-admin roles are denied

### Integration Tests

-   [ ] Create parish → Create outstation → View hierarchy
-   [ ] Transfer outstation between parishes
-   [ ] Block parish (soft delete) → Verify children handling

### E2E Tests

-   [ ] Super admin flow: Login → Create parish → Create outstation → Assign users
-   [ ] Verify non-super-admin cannot access parish creation

---

## Risk Assessment

### High Risk

-   **Data Integrity**: Transferring outstations must update all related records
-   **Role Escalation**: Prevent super admin from being deleted or demoted
-   **Org Deletion**: Soft delete logic must be correct

### Medium Risk

-   **Performance**: Loading all organizations with deep hierarchy
-   **Scoping**: Ensuring queries don't leak cross-org data

---

## Acceptance Criteria - ALL MUST PASS

### Super Admin Dashboard

-   [ ] Displays platform-wide statistics
-   [ ] Super admin user sees super admin-specific dashboard
-   [ ] Non-super-admin users cannot access dashboard

### Organization Management

-   [ ] Can create new parishes
-   [ ] Can create outstations under parishes
-   [ ] Can edit parish/outstation details
-   [ ] Can transfer outstations between parishes
-   [ ] Can soft-delete organizations
-   [ ] Hierarchy is correctly maintained
-   [ ] Cannot create/edit organizations if not SUPER_ADMIN

### User Management

-   [ ] Can view all users across all organizations
-   [ ] Can create users in any organization
-   [ ] Can edit any user
-   [ ] Can reset passwords for any user
-   [ ] Role hierarchy prevents privilege escalation

### Feature Management

-   [ ] Can toggle features for all organizations
-   [ ] Can set feature limits
-   [ ] Changes apply immediately

---

## Documentation Requirements

-   [ ] Update `/docs/super-admin-guide.md` with how-to for each feature
-   [ ] Add super admin section to `/docs/prd.md`
-   [ ] Create `/docs/epics/epic-super-admin.md` for detailed epic breakdown
-   [ ] Update `/docs/user_flow.md` with super admin specific flows
-   [ ] Create `/docs/api/super-admin-actions.md` documenting all server actions

---

## Next Steps for Developer

1. **Review this document** with the team
2. **Create GitHub issues** for each missing feature (grouped by phase)
3. **Start Phase 1** - Implement critical Server Actions first
4. **Then Pages** - Build UI in Phase 2
5. **Keep docs updated** as features are implemented

---

## Related Documents

-   `/docs/implementation-plan.md` - Overall project plan
-   `/docs/prd.md` - Product requirements (Section 3.1 for SUPER_ADMIN)
-   `/docs/user_flow.md` - Permission matrix
-   `/docs/epics/epic-02-organization-management.md` - Organization epic (may need super admin variant)
-   `/.github/skills/010-role-based-access-control.md` - RBAC patterns
