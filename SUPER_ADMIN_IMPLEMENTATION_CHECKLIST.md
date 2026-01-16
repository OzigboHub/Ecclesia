# Super Admin Implementation - Quick Reference Checklist

**Use this for tracking progress during implementation**

---

## Phase 1: Server Actions & Infrastructure

### Task 1.1: Create Organization Server Actions ⏱️ 2-3 hours

-   [ ] Create `getAllOrganizations()` function

    -   [ ] Returns all parishes and outstations
    -   [ ] Checks SUPER_ADMIN role
    -   [ ] Includes parent/child relationships
    -   [ ] Testing: SUPER_ADMIN can access, others cannot

-   [ ] Create `createParish()` function

    -   [ ] Validates parish data
    -   [ ] Ensures unique name
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Creates parish correctly

-   [ ] Create `createOutstation()` function

    -   [ ] Validates outstation data
    -   [ ] Checks parent parish exists
    -   [ ] Ensures unique name within parent
    -   [ ] Sets parentId correctly
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Creates outstation correctly

-   [ ] Create `updateOrganization()` function

    -   [ ] Updates organization fields
    -   [ ] Validates unique name if changed
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Updates correctly

-   [ ] Create `deleteOrganization()` function

    -   [ ] Soft delete (sets isActive = false)
    -   [ ] Prevents deletion if has active users
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Soft deletes correctly

-   [ ] Create `transferOutstation()` function

    -   [ ] Updates parentId
    -   [ ] Validates both outstations and parents exist
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Transfers correctly

-   [ ] Create `getSystemMetrics()` function
    -   [ ] Counts parishes
    -   [ ] Counts outstations
    -   [ ] Counts parishioners
    -   [ ] Counts users by role
    -   [ ] Calculates total revenue
    -   [ ] Only SUPER_ADMIN authorized
    -   [ ] Testing: Counts correctly

**Acceptance**: All functions implemented and tested ✅

---

### Task 1.2: Create Zod Validators ⏱️ 1-2 hours

-   [ ] Create `createParishSchema`

    -   [ ] name: string, 2-100 chars
    -   [ ] address: optional
    -   [ ] phone: optional, Nigerian format
    -   [ ] email: optional
    -   [ ] diocese: optional
    -   [ ] priestName: optional

-   [ ] Create `createOutstationSchema`

    -   [ ] Extends createParishSchema
    -   [ ] Adds parishId: UUID
    -   [ ] parishId is required

-   [ ] Create `updateOrganizationSchema`

    -   [ ] Partial of createParishSchema (all optional)

-   [ ] Create `transferOutstationSchema`
    -   [ ] outstationId: UUID
    -   [ ] newParishId: UUID

**Acceptance**: All schemas created and validated ✅

---

### Task 1.3: Add Type Definitions ⏱️ 30 min

-   [ ] Add `SystemMetrics` interface
-   [ ] Add `CreateParishInput` type
-   [ ] Add `CreateOutstationInput` type
-   [ ] Add `UpdateOrganizationInput` type

**Acceptance**: All types defined in `types/index.ts` ✅

---

### Task 1.4: Update Sidebar Navigation ⏱️ 15 min

-   [ ] Add "Organizations" nav item
    -   [ ] `href: '/dashboard/organizations'`
    -   [ ] `roles: ['SUPER_ADMIN']`
    -   [ ] Uses appropriate icon

**Acceptance**: Only SUPER_ADMIN sees Organizations in sidebar ✅

---

## Phase 2: Pages & Components

### Task 2.1: Refactor Organizations Page ⏱️ 3-4 hours

-   [ ] Create tabs component

    -   [ ] "Parishes" tab (default)
    -   [ ] "Outstations" tab
    -   [ ] "Pious Organizations" tab (existing)

-   [ ] Parishes tab

    -   [ ] Lists all parishes
    -   [ ] Search/filter by name
    -   [ ] Shows count
    -   [ ] Create button links to `/organizations/parishes/new`
    -   [ ] Each parish card links to `/organizations/parishes/[id]`

-   [ ] Outstations tab

    -   [ ] Lists all outstations
    -   [ ] Shows parent parish name
    -   [ ] Search/filter by name
    -   [ ] Each outstation card links to `/organizations/outstations/[id]`

-   [ ] Authorization
    -   [ ] Only SUPER_ADMIN can see this page
    -   [ ] PARISH_ADMIN sees error/redirect

**File**: `app/dashboard/organizations/page.tsx`
**Acceptance**: Page loads, shows parishes and outstations, only super admin access ✅

---

### Task 2.2: Create Parish Detail Page ⏱️ 3-4 hours

-   [ ] Display parish information

    -   [ ] Name, address, phone, email, diocese, priest name
    -   [ ] Edit button
    -   [ ] Delete button (with confirmation)
    -   [ ] Create Outstation button

-   [ ] Show nested outstations

    -   [ ] List all outstations under this parish
    -   [ ] For each outstation:
        -   [ ] Edit option
        -   [ ] Delete option
        -   [ ] Transfer option

-   [ ] Back button to organizations list

**File**: `app/dashboard/organizations/parishes/[id]/page.tsx`
**Acceptance**: Page displays parish details and outstations ✅

---

### Task 2.3: Create Parish Editing Page ⏱️ 2-3 hours

-   [ ] Create edit form page
    -   [ ] Pre-populated with current data
    -   [ ] Form uses ParishForm component
    -   [ ] Calls `updateOrganization()` on submit
    -   [ ] Redirects to parish detail on success
    -   [ ] Shows error messages on failure

**File**: `app/dashboard/organizations/parishes/[id]/edit/page.tsx`
**Acceptance**: Can edit and save parish details ✅

---

### Task 2.4: Create Parish Creation Page ⏱️ 2-3 hours

-   [ ] Create new parish page
    -   [ ] Form uses ParishForm component
    -   [ ] Calls `createParish()` on submit
    -   [ ] Redirects to parish detail on success
    -   [ ] Shows validation errors

**File**: `app/dashboard/organizations/parishes/new/page.tsx`
**Acceptance**: Can create new parishes ✅

---

### Task 2.5: Create Outstation Creation Modal ⏱️ 2-3 hours

-   [ ] Create OutstationForm component

    -   [ ] Shows form fields
    -   [ ] Pre-fills parishId from parent parish
    -   [ ] Calls `createOutstation()` on submit

-   [ ] Modal/Dialog implementation
    -   [ ] Appears on parish detail page
    -   [ ] Can close without creating
    -   [ ] Refreshes list on success

**File**: `components/forms/outstation-form.tsx` + modal on parish page
**Acceptance**: Can create outstation from parish detail page ✅

---

### Task 2.6: Create Organization Form Components ⏱️ 2-3 hours

-   [ ] Create ParishForm component

    -   [ ] Accepts initialData prop
    -   [ ] Shows name, address, phone, email, diocese, priestName fields
    -   [ ] Validates with createParishSchema/updateOrganizationSchema
    -   [ ] Shows loading state during submit
    -   [ ] Displays error messages

-   [ ] Create OutstationForm component
    -   [ ] Similar to ParishForm
    -   [ ] Has parishId field (or hidden if pre-filled)

**File**: `components/forms/parish-form.tsx`, `components/forms/outstation-form.tsx`
**Acceptance**: Forms work with validation ✅

---

### Task 2.7: Update Users List Page ⏱️ 1-2 hours

-   [ ] Modify `getUsers()` Server Action

    -   [ ] Add `getAllOrgs` parameter
    -   [ ] If SUPER_ADMIN and getAllOrgs=true, get all users
    -   [ ] Otherwise use hierarchy (existing logic)

-   [ ] Update Users page
    -   [ ] Add "Organization" column to table
    -   [ ] Shows organization name for each user
    -   [ ] SUPER_ADMIN sees all users
    -   [ ] PARISH_ADMIN sees only their org users

**File**: `app/dashboard/users/page.tsx`, `app/actions/user.actions.ts`
**Acceptance**: Super admin sees all users with organization column ✅

---

## Phase 3: Dashboard Enhancement

### Task 3.1: Enhance Super Admin Dashboard ⏱️ 3-4 hours

-   [ ] Check user role (is SUPER_ADMIN?)

    -   [ ] If SUPER_ADMIN, show platform metrics section
    -   [ ] If not, show existing dashboard

-   [ ] Add platform metrics section

    -   [ ] Total parishes card
    -   [ ] Total outstations card
    -   [ ] Total parishioners card (across all)
    -   [ ] Total users card
    -   [ ] Total revenue card
    -   [ ] Users by role breakdown

-   [ ] Call `getSystemMetrics()` Server Action

    -   [ ] Load on page render
    -   [ ] Display in cards
    -   [ ] Format numbers appropriately

-   [ ] Add quick links to admin pages
    -   [ ] Link to Organizations Management
    -   [ ] Link to User Management
    -   [ ] Link to Settings

**File**: `app/dashboard/page.tsx`
**Acceptance**: Super admin sees platform metrics on dashboard ✅

---

## Testing Checklist

### Unit Tests

-   [ ] Test each Server Action with SUPER_ADMIN role
-   [ ] Test each Server Action denied for non-SUPER_ADMIN roles
-   [ ] Test validation schemas reject invalid data
-   [ ] Test organization hierarchy logic
-   [ ] Test soft delete logic

### Integration Tests

-   [ ] Create parish → view in list
-   [ ] Create parish → create outstation under it
-   [ ] Edit parish → changes persist
-   [ ] Transfer outstation → parentId updates
-   [ ] Soft delete organization → appears inactive
-   [ ] Get all organizations → returns both parishes and outstations

### E2E Tests

-   [ ] Super admin login → create parish → create outstation → view in hierarchy
-   [ ] Super admin edit organization → changes visible
-   [ ] Non-super admin cannot access organization pages
-   [ ] Super admin can transfer outstation
-   [ ] Super admin dashboard shows correct metrics

### Authorization Tests

-   [ ] PARISH_ADMIN cannot access `/dashboard/organizations/parishes/new`
-   [ ] PARISH_ADMIN cannot call `createParish()`
-   [ ] PARISH_ADMIN cannot view all users
-   [ ] PARISH_STAFF gets 403 on admin pages

---

## Code Quality Checklist

### All New Code Must Have

-   [ ] Proper TypeScript types (no `any`)
-   [ ] Following project conventions (seen in `.github/skills/`)
-   [ ] Proper error handling with `ActionResponse` type
-   [ ] Zod validation for all inputs
-   [ ] JSDoc comments on public functions
-   [ ] Accessibility attributes on forms
-   [ ] Loading states during async operations
-   [ ] Proper error messages for users

### All New Pages Must Have

-   [ ] Authentication check (redirect to login if not authenticated)
-   [ ] Authorization check (redirect if not SUPER_ADMIN)
-   [ ] Proper page title and description
-   [ ] Mobile-responsive layout
-   [ ] Back button where appropriate
-   [ ] Loading states for async content
-   [ ] Error boundaries

### All New Components Must Have

-   [ ] Accept `className` prop for flexibility
-   [ ] Use `cn()` utility for class merging
-   [ ] Proper TypeScript interfaces for props
-   [ ] JSDoc comments
-   [ ] Accessibility attributes
-   [ ] Mobile-first responsive design

---

## Documentation Checklist

-   [ ] JSDoc comments on all new functions
-   [ ] README for new features (where applicable)
-   [ ] Update `/docs/super-admin-guide.md` (create if doesn't exist)
-   [ ] Update `/docs/prd.md` SUPER_ADMIN section
-   [ ] Update `/docs/user_flow.md` if permissions changed
-   [ ] Code comments for complex logic
-   [ ] Inline comments for business logic

---

## Deployment Checklist

Before merging to main:

-   [ ] All tests pass locally
-   [ ] No console errors in browser
-   [ ] No TypeScript errors in build
-   [ ] Code reviewed by team member
-   [ ] Database schema verified (no migrations needed)
-   [ ] No breaking changes to existing features
-   [ ] Super admin can perform all operations
-   [ ] Non-super-admins cannot access new pages

---

## Progress Tracking

### Phase 1: Server Actions (Estimated 4-6 hours)

-   [ ] Task 1.1: Organization Server Actions - **ETA: [date]**
-   [ ] Task 1.2: Zod Validators - **ETA: [date]**
-   [ ] Task 1.3: Type Definitions - **ETA: [date]**
-   [ ] Task 1.4: Sidebar Navigation - **ETA: [date]**
-   **Status**: ⏳ Not Started / 🔄 In Progress / ✅ Complete

### Phase 2: Pages & Components (Estimated 15-20 hours)

-   [ ] Task 2.1: Organizations Page - **ETA: [date]**
-   [ ] Task 2.2: Parish Detail Page - **ETA: [date]**
-   [ ] Task 2.3: Parish Edit Page - **ETA: [date]**
-   [ ] Task 2.4: Parish Creation - **ETA: [date]**
-   [ ] Task 2.5: Outstation Creation - **ETA: [date]**
-   [ ] Task 2.6: Form Components - **ETA: [date]**
-   [ ] Task 2.7: Users List Enhancement - **ETA: [date]**
-   **Status**: ⏳ Not Started / 🔄 In Progress / ✅ Complete

### Phase 3: Dashboard (Estimated 3-4 hours)

-   [ ] Task 3.1: Super Admin Dashboard - **ETA: [date]**
-   **Status**: ⏳ Not Started / 🔄 In Progress / ✅ Complete

### Testing & Documentation

-   [ ] All tests pass - **ETA: [date]**
-   [ ] Documentation updated - **ETA: [date]**
-   [ ] Code review complete - **ETA: [date]**
-   **Status**: ⏳ Not Started / 🔄 In Progress / ✅ Complete

---

## Notes & Blockers

### Blockers (Anything preventing progress)

```
[None at start of project]
```

### Notes (Important reminders)

```
- Remember: Organization model already has parish/outstation support
- Database queries: Use level='PARISH' to find parishes
- Authorization: Always check session.user.role === 'SUPER_ADMIN'
- Validation: Use Zod schemas for all inputs
- Organization Scoping: Ensure no cross-org data leaks
```

### Lessons Learned (As you implement)

```
[Add as you discover patterns and gotchas]
```

---

**Tracker Created**: [Date]
**Expected Completion**: [Estimate - 1.5-2 weeks]
**Owner**: [Name]

---
