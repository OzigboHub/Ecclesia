# Ecclesia DPM - Implementation Plan

## Overview

This document provides a prioritized implementation plan with dependency management for the Ecclesia Digital Parish Manager. Tasks are organized into phases with clear dependencies, acceptance criteria, and checkable milestimes.

**Total Estimated Effort**: 1,127 Story Points across 12 Epics
**Recommended Team Size**: 2-4 developers
**Estimated Timeline**: 6-9 months (with parallel workstreams)

---

## Recent Progress Update

**Last Updated**: January 2025
**Build Status**: ✅ PASSING (All 20 routes generated successfully)

### Completed Items

#### Form System Migration (React Hook Form + Zod)

-   ✅ All forms migrated to React Hook Form with zodResolver pattern
-   ✅ Created comprehensive Zod validators for all domain models
-   ✅ Implemented proper error handling and field-level validation
-   ✅ Added loading states with `useTransition` for Server Actions

#### Prisma Schema Updates (using `db push`)

-   ✅ Added `notes` field to `MassIntention` model (optional String)
-   ✅ Added `CASH` payment method to `PaymentMethod` enum
-   ✅ All schema changes applied via `pnpm dlx prisma db push`
-   ✅ Prisma Client regenerated and types updated

#### Completed Features

-   ✅ **Mass Intentions**: Form component with React Hook Form (MAS-001 partial)
-   ✅ **Appointments**: Form component with React Hook Form (APT-003 partial)
-   ✅ **Payments**: Full form recreation with Nigerian Naira support (FIN-001 partial)
-   ✅ **Pious Organizations**: Form and validator created

#### Build Fixes & Infrastructure

-   ✅ Fixed all TypeScript compilation errors
-   ✅ Removed unused `resizable.tsx` component
-   ✅ Added Suspense boundaries for `useSearchParams` usage
-   ✅ Fixed sidebar role filtering with proper type assertions
-   ✅ All 20 routes generating successfully in production build

### Next Steps

-   Continue with Epic 06 (Mass Intentions) - Calendar and listing page
-   Continue with Epic 07 (Appointments) - Calendar and listing page
-   Complete payment listing and detail views (Epic 04)
-   Implement pious organization management pages

### Development Notes

-   **Database Migrations**: Currently using `pnpm dlx prisma db push` for rapid schema iteration during development. Will switch to proper migrations (`prisma migrate dev`) before production deployment.
-   **Form Pattern**: All forms follow React Hook Form + Zod validation pattern as documented in `.github/skills/011-react-hook-form.md`
-   **Validation Schemas**: All Zod schemas located in `lib/validators/` directory
-   **Server Actions**: All data operations use Server Actions pattern in `app/actions/` directory

---

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOUNDATION LAYER (Phase 1)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [EP-01] Authentication & User Management                                   │
│     ↓                                                                       │
│  [EP-02] Organization & Multi-Tenancy Setup                                 │
│     ↓                                                                       │
│  [EP-11] Settings & Configuration                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE FEATURES (Phase 2)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  [EP-03] Parishioner Management ←──────┐                                    │
│     ↓                                  │                                    │
│  [EP-04] Financial Management ─────────┤                                    │
│     ↓                                  │                                    │
│  [EP-05] Sacramental Records ──────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENGAGEMENT FEATURES (Phase 3)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [EP-06] Mass Intentions & Bookings ←── Depends on EP-03, EP-04            │
│  [EP-07] Appointments & Scheduling  ←── Depends on EP-03                   │
│  [EP-08] Pious Organizations        ←── Depends on EP-03                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADVANCED FEATURES (Phase 4)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [EP-09] Communication & Notifications ←── Depends on EP-03                │
│  [EP-10] Reports & Analytics           ←── Depends on EP-03, EP-04, EP-05  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPERATIONS (Phase 5)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  [EP-12] Data Migration & Import/Export ←── Depends on all core features   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Weeks 1-4)

### Priority: CRITICAL

### Total Story Points: 201

These tasks establish the core infrastructure. No other features can be implemented without them.

---

### Epic 01: Authentication & User Management (89 SP)

#### 1.1 Core Authentication Setup

**Dependencies**: None (Starting point)
**Sprint**: Week 1

-   [ ] **AUTH-001**: Implement Auth.js configuration with JWT strategy (8 SP)

    -   [ ] Create `auth.ts` at project root
    -   [ ] Configure Credentials provider
    -   [ ] Set up JWT callbacks with custom fields (id, role, organizationId)
    -   [ ] Configure 24-hour session expiry
    -   [ ] **Acceptance**: Users can sign in, JWT contains extended fields

-   [ ] **AUTH-002**: Create login page and form (5 SP)

    -   [ ] Build `/auth/login/page.tsx` with mobile-first design
    -   [ ] Implement React Hook Form with Zod validation
    -   [ ] Add error handling and loading states
    -   [ ] **Acceptance**: Login form validates input, shows errors, redirects on success

-   [ ] **AUTH-003**: Create registration flow (8 SP)

    -   [ ] Build `/auth/register/page.tsx`
    -   [ ] Implement password strength requirements
    -   [ ] Add email validation
    -   [ ] Create user in database with hashed password
    -   [ ] **Acceptance**: New users can register with valid email/password

-   [ ] **AUTH-004**: Implement password reset flow (8 SP)
    -   [ ] Create forgot password page
    -   [ ] Generate secure reset tokens
    -   [ ] Create reset password page
    -   [ ] Implement token expiration (1 hour)
    -   [ ] **Acceptance**: Users can reset password via email link

#### 1.2 Session Management

**Dependencies**: AUTH-001
**Sprint**: Week 1-2

-   [ ] **AUTH-005**: Create SessionProvider wrapper (3 SP)

    -   [ ] Create `AuthProvider` component
    -   [ ] Add to root layout
    -   [ ] **Acceptance**: `useSession` works throughout app

-   [ ] **AUTH-006**: Implement ProtectedRoute component (5 SP)

    -   [ ] Create client-side route guard
    -   [ ] Handle loading states
    -   [ ] Redirect unauthenticated users
    -   [ ] **Acceptance**: Protected pages redirect to login

-   [ ] **AUTH-007**: Create server-side auth helpers (5 SP)
    -   [ ] Create `getCurrentUser()` helper
    -   [ ] Create `requireAuth()` helper
    -   [ ] Create `requireRole()` helper
    -   [ ] **Acceptance**: Server actions can easily check auth

#### 1.3 User Management (Admin)

**Dependencies**: AUTH-001 through AUTH-007
**Sprint**: Week 2

-   [ ] **AUTH-008**: Build user listing page (8 SP)

    -   [ ] Create `/dashboard/users/page.tsx`
    -   [ ] Implement DataTable with pagination
    -   [ ] Add search and filter functionality
    -   [ ] Show user role, status, organization
    -   [ ] **Acceptance**: Admins can view all users in their org

-   [ ] **AUTH-009**: Create user form (create/edit) (8 SP)

    -   [ ] Build user creation form
    -   [ ] Add role assignment dropdown
    -   [ ] Implement edit mode
    -   [ ] Validate email uniqueness
    -   [ ] **Acceptance**: Admins can create/edit users

-   [ ] **AUTH-010**: Implement role management (8 SP)

    -   [ ] Create role change functionality
    -   [ ] Add role hierarchy validation (can't promote above own level)
    -   [ ] Log role changes for audit
    -   [ ] **Acceptance**: Admins can change user roles appropriately

-   [ ] **AUTH-011**: Build user profile page (5 SP)
    -   [ ] Create `/dashboard/profile/page.tsx`
    -   [ ] Allow users to update their own info
    -   [ ] Implement password change
    -   [ ] **Acceptance**: Users can manage their profile

#### 1.4 Security Features

**Dependencies**: AUTH-001 through AUTH-010
**Sprint**: Week 2-3

-   [ ] **AUTH-012**: Implement account lockout (5 SP)

    -   [ ] Track failed login attempts
    -   [ ] Lock account after 5 failures
    -   [ ] Auto-unlock after 30 minutes
    -   [ ] **Acceptance**: Brute force protection works

-   [ ] **AUTH-013**: Add audit logging for auth events (5 SP)

    -   [ ] Log login/logout events
    -   [ ] Log password changes
    -   [ ] Log role changes
    -   [ ] **Acceptance**: Auth events are tracked

-   [ ] **AUTH-014**: Implement session management (5 SP)
    -   [ ] Show active sessions
    -   [ ] Allow session revocation
    -   [ ] **Acceptance**: Users can manage their sessions

---

### Epic 02: Organization & Multi-Tenancy (67 SP)

#### 2.1 Organization Setup

**Dependencies**: EP-01 (AUTH-001 through AUTH-007)
**Sprint**: Week 2-3

-   [ ] **ORG-001**: Create Organization model and seed data (5 SP)

    -   [ ] Verify Prisma schema for Organization
    -   [ ] Create seed script for initial parish
    -   [ ] Add parish-outstation hierarchy
    -   [ ] **Acceptance**: Organizations can be created with hierarchy

-   [ ] **ORG-002**: Implement organization-scoped queries (8 SP)

    -   [ ] Create `getSessionWithOrg()` helper
    -   [ ] Create `getOrgIdsForUser()` helper
    -   [ ] Update all existing queries to use helpers
    -   [ ] **Acceptance**: All queries are scoped by org

-   [ ] **ORG-003**: Build organization management page (8 SP)

    -   [ ] Create `/dashboard/settings/organization/page.tsx`
    -   [ ] Display organization details
    -   [ ] Show outstation list (for parishes)
    -   [ ] **Acceptance**: Admins can view org structure

-   [ ] **ORG-004**: Create organization edit form (5 SP)
    -   [ ] Build organization settings form
    -   [ ] Allow name, contact info updates
    -   [ ] Upload organization logo
    -   [ ] **Acceptance**: Org details can be updated

#### 2.2 Outstation Management

**Dependencies**: ORG-001 through ORG-004
**Sprint**: Week 3

-   [ ] **ORG-005**: Implement outstation creation (8 SP)

    -   [ ] Build outstation creation form
    -   [ ] Auto-link to parent parish
    -   [ ] Copy default feature settings
    -   [ ] **Acceptance**: Parish can create outstations

-   [ ] **ORG-006**: Create outstation admin assignment (5 SP)
    -   [ ] Allow assigning users to outstations
    -   [ ] Implement OUTSTATION_ADMIN role
    -   [ ] **Acceptance**: Users can be assigned to outstations

#### 2.3 Feature Toggle System

**Dependencies**: ORG-001 through ORG-004
**Sprint**: Week 3

-   [ ] **ORG-007**: Implement OrganizationFeatureSettings model (5 SP)

    -   [ ] Verify schema for feature settings
    -   [ ] Create default settings on org creation
    -   [ ] **Acceptance**: Each org has feature settings

-   [ ] **ORG-008**: Build feature toggle management UI (8 SP)

    -   [ ] Create `/dashboard/settings/features/page.tsx`
    -   [ ] Display all toggleable features
    -   [ ] Implement switch components
    -   [ ] **Acceptance**: Admins can toggle features

-   [ ] **ORG-009**: Create server-side feature check helpers (5 SP)

    -   [ ] Create `isFeatureEnabled()` helper
    -   [ ] Create `getFeatureSettings()` helper
    -   [ ] **Acceptance**: Features can be checked in server actions

-   [ ] **ORG-010**: Implement client-side feature hook (5 SP)

    -   [ ] Create `useFeatureSettings()` hook
    -   [ ] Cache settings in session
    -   [ ] **Acceptance**: UI can conditionally render features

-   [ ] **ORG-011**: Update sidebar with feature-based nav (5 SP)
    -   [ ] Filter navigation items by enabled features
    -   [ ] Add loading state
    -   [ ] **Acceptance**: Disabled features don't show in nav

---

### Epic 11: Settings & Configuration (45 SP)

#### 11.1 System Settings

**Dependencies**: EP-02 (ORG-001 through ORG-011)
**Sprint**: Week 3-4

-   [ ] **SET-001**: Create settings page layout (3 SP)

    -   [ ] Build `/dashboard/settings/page.tsx`
    -   [ ] Create settings navigation tabs
    -   [ ] **Acceptance**: Settings section is accessible

-   [ ] **SET-002**: Implement general settings (5 SP)

    -   [ ] Parish name, address, contact info
    -   [ ] Working hours
    -   [ ] Currency settings (default NGN)
    -   [ ] **Acceptance**: Basic settings can be configured

-   [ ] **SET-003**: Build payment configuration (8 SP)

    -   [ ] Configure payment purposes
    -   [ ] Set default amounts
    -   [ ] Configure payment methods
    -   [ ] **Acceptance**: Payment options are configurable

-   [ ] **SET-004**: Create notification settings (5 SP)
    -   [ ] Email notification preferences
    -   [ ] SMS notification settings (if enabled)
    -   [ ] Notification templates
    -   [ ] **Acceptance**: Notification preferences saved

#### 11.2 Customization

**Dependencies**: SET-001 through SET-004
**Sprint**: Week 4

-   [ ] **SET-005**: Implement custom fields configuration (13 SP)

    -   [ ] Define custom field schema
    -   [ ] Build custom field management UI
    -   [ ] Support text, number, date, select types
    -   [ ] **Acceptance**: Admins can add custom fields

-   [ ] **SET-006**: Create data backup settings (5 SP)

    -   [ ] Configure backup frequency
    -   [ ] Set retention period
    -   [ ] **Acceptance**: Backup preferences saved

-   [ ] **SET-007**: Build audit log viewer (5 SP)
    -   [ ] Create audit log page
    -   [ ] Filter by action type, user, date
    -   [ ] **Acceptance**: Admins can view audit trail

---

## Phase 1 Milestone Checklist

Before proceeding to Phase 2, verify:

-   [ ] Users can register, login, and logout
-   [ ] Password reset flow works end-to-end
-   [ ] Role-based access control is enforced
-   [ ] Organizations are created with hierarchy
-   [ ] All queries are scoped by organizationId
-   [ ] Feature toggles can be managed
-   [ ] Settings page is functional
-   [ ] Audit logging is capturing events

---

## Phase 2: Core Features (Weeks 5-10)

### Priority: HIGH

### Total Story Points: 303

These are the primary value-delivering features of the system.

---

### Epic 03: Parishioner Management (98 SP)

#### 3.1 Parishioner CRUD

**Dependencies**: Phase 1 complete
**Sprint**: Week 5-6

-   [ ] **PAR-001**: Create parishioner listing page (8 SP)

    -   [ ] Build `/dashboard/parishioners/page.tsx`
    -   [ ] Implement DataTable with pagination
    -   [ ] Add search (name, email, phone)
    -   [ ] Add filters (status, gender, organization)
    -   [ ] **Acceptance**: Parishioners list with search/filter

-   [ ] **PAR-002**: Build parishioner form (create) (8 SP)

    -   [ ] Create comprehensive form with all fields
    -   [ ] Implement Zod validation
    -   [ ] Handle photo upload
    -   [ ] Auto-generate unique ID
    -   [ ] **Acceptance**: New parishioners can be created

-   [ ] **PAR-003**: Create parishioner detail page (8 SP)

    -   [ ] Build `/dashboard/parishioners/[id]/page.tsx`
    -   [ ] Display all parishioner information
    -   [ ] Show related records (payments, sacraments)
    -   [ ] **Acceptance**: Full parishioner profile viewable

-   [ ] **PAR-004**: Implement parishioner edit (5 SP)

    -   [ ] Pre-populate form with existing data
    -   [ ] Track changes for audit
    -   [ ] **Acceptance**: Parishioner data can be updated

-   [ ] **PAR-005**: Create parishioner deletion (soft delete) (5 SP)
    -   [ ] Implement soft delete with confirmation
    -   [ ] Archive related records
    -   [ ] **Acceptance**: Parishioners can be deactivated

#### 3.2 Family Management

**Dependencies**: PAR-001 through PAR-005
**Sprint**: Week 6-7

-   [ ] **PAR-006**: Implement family grouping (8 SP)

    -   [ ] Create Family model relationships
    -   [ ] Build family assignment UI
    -   [ ] **Acceptance**: Parishioners can be grouped into families

-   [ ] **PAR-007**: Create family head designation (5 SP)

    -   [ ] Allow setting family head
    -   [ ] Show family members on profile
    -   [ ] **Acceptance**: Family structure is visible

-   [ ] **PAR-008**: Build family dashboard view (8 SP)
    -   [ ] Create family listing page
    -   [ ] Show family statistics
    -   [ ] **Acceptance**: Families can be managed

#### 3.3 Advanced Features

**Dependencies**: PAR-006 through PAR-008
**Sprint**: Week 7

-   [ ] **PAR-009**: Implement bulk import (13 SP)

    -   [ ] Create CSV import wizard
    -   [ ] Validate and preview data
    -   [ ] Handle duplicates
    -   [ ] **Acceptance**: Parishioners can be imported from CSV

-   [ ] **PAR-010**: Create parishioner search (5 SP)

    -   [ ] Implement advanced search
    -   [ ] Search across all fields
    -   [ ] **Acceptance**: Complex searches work

-   [ ] **PAR-011**: Build parishioner reports (8 SP)

    -   [ ] Demographics report
    -   [ ] New registrations report
    -   [ ] Status report
    -   [ ] **Acceptance**: Basic reports available

-   [ ] **PAR-012**: Implement parishioner card generation (8 SP)

    -   [ ] Create ID card template
    -   [ ] Generate printable cards
    -   [ ] **Acceptance**: ID cards can be printed

-   [ ] **PAR-013**: Add parishioner portal access (8 SP)
    -   [ ] Allow parishioners to view own profile
    -   [ ] Enable self-update requests
    -   [ ] **Acceptance**: Parishioners have limited self-service

---

### Epic 04: Financial Management (108 SP)

#### 4.1 Payment Recording

**Dependencies**: Phase 1 complete, PAR-001 through PAR-005 (for parishioner linking)
**Sprint**: Week 6-7

-   [x] **FIN-001**: Create payment recording form (8 SP)

    -   [x] Build comprehensive payment form
    -   [x] Support all payment purposes (Offering, Tithe, etc.)
    -   [x] Support all payment methods (including CASH)
    -   [x] Link to parishioner (optional)
    -   [x] Nigerian Naira (₦) formatting with Intl.NumberFormat
    -   [x] React Hook Form + Zod validation
    -   [x] **Acceptance**: Payments can be recorded
    -   **Status**: ✅ COMPLETED - Form created with full validation

-   [ ] **FIN-002**: Build payment listing page (8 SP)

    -   [ ] Create `/dashboard/payments/page.tsx`
    -   [ ] Implement DataTable with pagination
    -   [ ] Add filters (date, purpose, method, status)
    -   [ ] **Acceptance**: Payments list with filtering

-   [ ] **FIN-003**: Create payment detail view (5 SP)

    -   [ ] Show full payment details
    -   [ ] Display receipt preview
    -   [ ] **Acceptance**: Payment details viewable

-   [ ] **FIN-004**: Implement payment receipt generation (8 SP)
    -   [ ] Create receipt template
    -   [ ] Generate PDF receipts
    -   [ ] Enable printing
    -   [ ] **Acceptance**: Receipts can be generated

#### 4.2 Offerings & Tithes

**Dependencies**: FIN-001 through FIN-004
**Sprint**: Week 7-8

-   [ ] **FIN-005**: Create offering tracking (8 SP)

    -   [ ] Weekly offering recording
    -   [ ] Sunday collection management
    -   [ ] **Acceptance**: Offerings can be tracked by date

-   [ ] **FIN-006**: Implement tithe management (8 SP)

    -   [ ] Monthly tithe tracking per parishioner
    -   [ ] Tithe history view
    -   [ ] **Acceptance**: Tithes tracked per person

-   [ ] **FIN-007**: Build monthly tracking dashboard (8 SP)
    -   [ ] Show monthly contributions per parishioner
    -   [ ] Track contribution patterns
    -   [ ] **Acceptance**: Monthly view available

#### 4.3 Donation Campaigns

**Dependencies**: FIN-001 through FIN-004
**Sprint**: Week 8

-   [ ] **FIN-008**: Create donation campaign management (13 SP)

    -   [ ] Build campaign creation form
    -   [ ] Set target amount, dates
    -   [ ] Track progress
    -   [ ] **Acceptance**: Campaigns can be created

-   [ ] **FIN-009**: Implement campaign donation recording (8 SP)

    -   [ ] Link donations to campaigns
    -   [ ] Show progress bar
    -   [ ] **Acceptance**: Campaign donations tracked

-   [ ] **FIN-010**: Build campaign dashboard (5 SP)
    -   [ ] List all campaigns
    -   [ ] Show status and progress
    -   [ ] **Acceptance**: Campaign overview available

#### 4.4 Financial Reports

**Dependencies**: FIN-001 through FIN-010
**Sprint**: Week 9

-   [ ] **FIN-011**: Create income summary report (8 SP)

    -   [ ] Daily, weekly, monthly summaries
    -   [ ] Breakdown by purpose
    -   [ ] **Acceptance**: Income reports generated

-   [ ] **FIN-012**: Build parishioner contribution report (8 SP)

    -   [ ] Individual contribution history
    -   [ ] Year-to-date totals
    -   [ ] **Acceptance**: Contribution statements available

-   [ ] **FIN-013**: Implement financial export (5 SP)

    -   [ ] Export to Excel/CSV
    -   [ ] Configurable date ranges
    -   [ ] **Acceptance**: Data can be exported

-   [ ] **FIN-014**: Create financial dashboard widgets (8 SP)
    -   [ ] Today's collections
    -   [ ] Weekly trend
    -   [ ] Monthly comparison
    -   [ ] **Acceptance**: Dashboard shows financial summary

---

### Epic 05: Sacramental Records (97 SP)

#### 5.1 Baptism Records

**Dependencies**: Phase 1 complete, PAR-001 through PAR-005
**Sprint**: Week 8-9

-   [ ] **SAC-001**: Create baptism record form (8 SP)

    -   [ ] Build comprehensive baptism form
    -   [ ] Link to parishioner
    -   [ ] Capture godparents info
    -   [ ] **Acceptance**: Baptism records can be created

-   [ ] **SAC-002**: Build baptism certificate generation (8 SP)

    -   [ ] Create certificate template
    -   [ ] Generate PDF certificates
    -   [ ] **Acceptance**: Certificates can be printed

-   [ ] **SAC-003**: Implement baptism register (5 SP)
    -   [ ] List all baptisms with filters
    -   [ ] Search by name, date
    -   [ ] **Acceptance**: Baptism register viewable

#### 5.2 Other Sacraments

**Dependencies**: SAC-001 through SAC-003
**Sprint**: Week 9-10

-   [ ] **SAC-004**: Create First Communion records (8 SP)

    -   [ ] Build form for First Communion
    -   [ ] Link to parishioner and baptism
    -   [ ] Generate certificate
    -   [ ] **Acceptance**: First Communion tracked

-   [ ] **SAC-005**: Implement Confirmation records (8 SP)

    -   [ ] Build Confirmation form
    -   [ ] Capture sponsor info
    -   [ ] Generate certificate
    -   [ ] **Acceptance**: Confirmations tracked

-   [ ] **SAC-006**: Create Marriage records (13 SP)

    -   [ ] Build marriage form (both parties)
    -   [ ] Capture witness information
    -   [ ] Track marriage preparation
    -   [ ] Generate certificate
    -   [ ] **Acceptance**: Marriages fully tracked

-   [ ] **SAC-007**: Implement Holy Orders records (5 SP)

    -   [ ] Track ordinations
    -   [ ] Record ordination details
    -   [ ] **Acceptance**: Ordinations recorded

-   [ ] **SAC-008**: Create Death/Funeral records (8 SP)
    -   [ ] Build death record form
    -   [ ] Link to parishioner
    -   [ ] Track funeral details
    -   [ ] **Acceptance**: Deaths/funerals recorded

#### 5.3 Sacramental Reports

**Dependencies**: SAC-001 through SAC-008
**Sprint**: Week 10

-   [ ] **SAC-009**: Build sacramental register report (8 SP)

    -   [ ] Combined register view
    -   [ ] Filter by type, date
    -   [ ] **Acceptance**: Full register available

-   [ ] **SAC-010**: Create annual sacramental statistics (5 SP)

    -   [ ] Count by type per year
    -   [ ] Trend analysis
    -   [ ] **Acceptance**: Statistics generated

-   [ ] **SAC-011**: Implement certificate reprint (3 SP)

    -   [ ] Search existing records
    -   [ ] Reprint certificates
    -   [ ] **Acceptance**: Certificates can be reprinted

-   [ ] **SAC-012**: Create sacramental timeline (5 SP)

    -   [ ] Show parishioner's sacramental journey
    -   [ ] Visual timeline display
    -   [ ] **Acceptance**: Timeline viewable on profile

-   [ ] **SAC-013**: Build sacramental preparation tracking (13 SP)
    -   [ ] Track preparation classes
    -   [ ] Record attendance
    -   [ ] Mark completion
    -   [ ] **Acceptance**: Preparation programs tracked

---

## Phase 2 Milestone Checklist

Before proceeding to Phase 3, verify:

-   [ ] Parishioners can be created, viewed, edited, deleted
-   [ ] Family grouping works
-   [ ] Bulk import functions correctly
-   [ ] All payment types can be recorded
-   [ ] Receipts generate correctly
-   [ ] Donation campaigns work end-to-end
-   [ ] Financial reports generate accurately
-   [ ] All sacrament types can be recorded
-   [ ] Certificates generate correctly
-   [ ] Sacramental timeline displays properly

---

## Phase 3: Engagement Features (Weeks 11-16)

### Priority: HIGH

### Total Story Points: 270

These features enable deeper parish engagement and service delivery.

---

### Epic 06: Mass Intentions & Bookings (87 SP)

**Dependencies**: EP-03 (Parishioner Management), EP-04 (Financial Management)
**Sprint**: Week 11-13

#### 6.1 Mass Intention Management

-   [x] **MAS-001**: Create mass intention form (8 SP)

    -   [x] Build intention booking form
    -   [x] Support types: Thanksgiving, Requiem, Special
    -   [x] Link to parishioner (optional)
    -   [x] Added notes field for special instructions
    -   [x] React Hook Form + Zod validation
    -   [x] **Acceptance**: Intentions can be booked
    -   **Status**: ✅ COMPLETED - Form created with full validation

-   [ ] **MAS-002**: Implement intention calendar (13 SP)

    -   [ ] Create calendar view
    -   [ ] Show available slots
    -   [ ] Block full dates
    -   [ ] **Acceptance**: Calendar shows availability

-   [x] **MAS-003**: Build intention listing page (8 SP)

    -   [x] Create `/dashboard/mass-intentions/page.tsx`
    -   [x] Filter by date, type, status
    -   [x] Modal-based booking with form
    -   [ ] Advanced filtering UI
    -   [x] **Acceptance**: Intentions list viewable
    -   **Status**: ✅ PARTIALLY COMPLETED - Basic listing and booking works

-   [ ] **MAS-004**: Create intention payment integration (8 SP)

    -   [ ] Link intention to payment
    -   [ ] Auto-create payment record
    -   [ ] **Acceptance**: Intentions linked to payments

-   [ ] **MAS-005**: Implement intention approval workflow (8 SP)
    -   [ ] Pending → Approved → Completed flow
    -   [ ] Admin approval
    -   [ ] **Acceptance**: Workflow functions

#### 6.2 Mass Schedule

-   [ ] **MAS-006**: Create mass schedule management (13 SP)

    -   [ ] Define regular mass times
    -   [ ] Support special masses
    -   [ ] Configure intention slots per mass
    -   [ ] **Acceptance**: Schedule configurable

-   [ ] **MAS-007**: Build priest assignment (5 SP)

    -   [ ] Assign priests to masses
    -   [ ] Track celebrant
    -   [ ] **Acceptance**: Priests assigned

-   [ ] **MAS-008**: Create mass schedule display (5 SP)
    -   [ ] Public mass schedule view
    -   [ ] Weekly schedule display
    -   [ ] **Acceptance**: Schedule viewable

#### 6.3 Intention Reports

-   [ ] **MAS-009**: Build daily intention list (5 SP)

    -   [ ] Print daily intentions for celebrant
    -   [ ] Format for announcement
    -   [ ] **Acceptance**: Daily list generated

-   [ ] **MAS-010**: Create intention revenue report (5 SP)

    -   [ ] Income from intentions
    -   [ ] Monthly breakdown
    -   [ ] **Acceptance**: Revenue tracked

-   [ ] **MAS-011**: Implement intention statistics (5 SP)

    -   [ ] Intentions by type
    -   [ ] Popular dates
    -   [ ] **Acceptance**: Statistics available

-   [ ] **MAS-012**: Create intention notification (5 SP)
    -   [ ] Notify requestor of scheduled date
    -   [ ] Send reminder before mass
    -   [ ] **Acceptance**: Notifications sent

---

### Epic 07: Appointments & Scheduling (88 SP)

**Dependencies**: EP-03 (Parishioner Management)
**Sprint**: Week 13-15

#### 7.1 Appointment Types

-   [ ] **APT-001**: Create appointment type configuration (8 SP)

    -   [ ] Define appointment types
    -   [ ] Set duration, requirements
    -   [ ] **Acceptance**: Types configurable

-   [ ] **APT-002**: Build priest availability management (13 SP)

    -   [ ] Set priest schedules
    -   [ ] Block unavailable times
    -   [ ] **Acceptance**: Availability managed

-   [x] **APT-003**: Implement appointment booking form (8 SP)
    -   [x] Type selection
    -   [x] Date/time picker
    -   [x] Purpose description
    -   [x] React Hook Form + Zod validation
    -   [x] **Acceptance**: Appointments bookable
    -   **Status**: ✅ COMPLETED - Form created with full validation

#### 7.2 Appointment Management

-   [ ] **APT-004**: Create appointment calendar (13 SP)

    -   [ ] Calendar view of appointments
    -   [ ] Show by priest/type
    -   [ ] **Acceptance**: Calendar functional

-   [ ] **APT-005**: Build appointment listing (8 SP)

    -   [ ] List all appointments
    -   [ ] Filter by status, type, date
    -   [ ] **Acceptance**: Appointments list viewable

-   [ ] **APT-006**: Implement appointment workflow (8 SP)

    -   [ ] Request → Confirmed → Completed/Cancelled
    -   [ ] Admin confirmation
    -   [ ] **Acceptance**: Workflow works

-   [ ] **APT-007**: Create appointment rescheduling (5 SP)

    -   [ ] Request reschedule
    -   [ ] Find new slot
    -   [ ] **Acceptance**: Reschedule works

-   [ ] **APT-008**: Build appointment cancellation (5 SP)
    -   [ ] Cancel with reason
    -   [ ] Notify parties
    -   [ ] **Acceptance**: Cancellation works

#### 7.3 Confession Scheduling (Feature Toggle)

-   [ ] **APT-009**: Create confession time slots (8 SP)

    -   [ ] Configure confession times
    -   [ ] Set capacity
    -   [ ] **Acceptance**: Times configurable

-   [ ] **APT-010**: Implement confession booking (5 SP)
    -   [ ] Anonymous booking option
    -   [ ] Queue management
    -   [ ] **Acceptance**: Confessions bookable

#### 7.4 Notifications

-   [ ] **APT-011**: Build appointment reminders (5 SP)

    -   [ ] Email/SMS reminders
    -   [ ] Configurable timing
    -   [ ] **Acceptance**: Reminders sent

-   [ ] **APT-012**: Create appointment report (3 SP)
    -   [ ] Appointment statistics
    -   [ ] No-show tracking
    -   [ ] **Acceptance**: Reports available

---

### Epic 08: Pious Organizations (95 SP)

**Dependencies**: EP-03 (Parishioner Management)
**Sprint**: Week 14-16

#### 8.1 Organization Management

-   [ ] **PIO-001**: Create organization listing (5 SP)

    -   [ ] Build `/dashboard/organizations/page.tsx`
    -   [ ] List all pious organizations
    -   [ ] **Acceptance**: Organizations viewable

-   [ ] **PIO-002**: Build organization form (8 SP)

    -   [ ] Create/edit organization form
    -   [ ] Name, patron, description
    -   [ ] Meeting schedule
    -   [ ] **Acceptance**: Organizations manageable

-   [ ] **PIO-003**: Create organization detail page (8 SP)
    -   [ ] Show organization info
    -   [ ] Display members
    -   [ ] Show activities
    -   [ ] **Acceptance**: Detail page works

#### 8.2 Membership Management

-   [ ] **PIO-004**: Implement member enrollment (8 SP)

    -   [ ] Add parishioners to organizations
    -   [ ] Track enrollment date
    -   [ ] **Acceptance**: Enrollment works

-   [ ] **PIO-005**: Create membership roles (8 SP)

    -   [ ] Define positions (President, Secretary, etc.)
    -   [ ] Assign roles to members
    -   [ ] **Acceptance**: Roles assignable

-   [ ] **PIO-006**: Build member listing (5 SP)

    -   [ ] List members with roles
    -   [ ] Search and filter
    -   [ ] **Acceptance**: Members viewable

-   [ ] **PIO-007**: Implement membership removal (5 SP)
    -   [ ] Remove members
    -   [ ] Track removal reason
    -   [ ] **Acceptance**: Removal works

#### 8.3 Organization Activities

-   [ ] **PIO-008**: Create meeting management (13 SP)

    -   [ ] Schedule meetings
    -   [ ] Track attendance
    -   [ ] Record minutes
    -   [ ] **Acceptance**: Meetings tracked

-   [ ] **PIO-009**: Build attendance tracking (8 SP)

    -   [ ] Mark attendance
    -   [ ] View attendance history
    -   [ ] **Acceptance**: Attendance works

-   [ ] **PIO-010**: Implement dues collection (8 SP)
    -   [ ] Record member dues
    -   [ ] Track payment status
    -   [ ] Link to payment system
    -   [ ] **Acceptance**: Dues tracked

#### 8.4 Organization Reports

-   [ ] **PIO-011**: Create membership report (5 SP)

    -   [ ] Member count per org
    -   [ ] Active vs inactive
    -   [ ] **Acceptance**: Report available

-   [ ] **PIO-012**: Build attendance report (5 SP)

    -   [ ] Attendance percentage
    -   [ ] Trend analysis
    -   [ ] **Acceptance**: Attendance report works

-   [ ] **PIO-013**: Implement organization dashboard (8 SP)
    -   [ ] Organization-specific dashboard
    -   [ ] For org leaders
    -   [ ] **Acceptance**: Dashboard functional

---

## Phase 3 Milestone Checklist

Before proceeding to Phase 4, verify:

-   [ ] Mass intentions can be booked and managed
-   [ ] Mass schedule is configurable
-   [ ] Intention payments are linked
-   [ ] Appointments can be scheduled
-   [ ] Appointment workflow works
-   [ ] Confession booking works (if enabled)
-   [ ] Pious organizations can be managed
-   [ ] Member enrollment works
-   [ ] Meeting attendance is tracked
-   [ ] Dues collection integrates with payments

---

## Phase 4: Advanced Features (Weeks 17-22)

### Priority: MEDIUM

### Total Story Points: 235

These features enhance the system with communication and analytics capabilities.

---

### Epic 09: Communication & Notifications (102 SP)

**Dependencies**: EP-03 (Parishioner Management)
**Sprint**: Week 17-19

#### 9.1 Announcement System

-   [ ] **COM-001**: Create announcement management (8 SP)

    -   [ ] Build announcement form
    -   [ ] Set publish date, expiry
    -   [ ] Target audience selection
    -   [ ] **Acceptance**: Announcements creatable

-   [ ] **COM-002**: Build announcement display (5 SP)

    -   [ ] Dashboard announcement widget
    -   [ ] Public announcement page
    -   [ ] **Acceptance**: Announcements visible

-   [ ] **COM-003**: Implement announcement scheduling (5 SP)
    -   [ ] Schedule future announcements
    -   [ ] Auto-expire
    -   [ ] **Acceptance**: Scheduling works

#### 9.2 Email Notifications

-   [ ] **COM-004**: Create email template system (13 SP)

    -   [ ] Build email templates
    -   [ ] Variable substitution
    -   [ ] HTML/Text versions
    -   [ ] **Acceptance**: Templates work

-   [ ] **COM-005**: Implement transactional emails (8 SP)

    -   [ ] Payment receipts
    -   [ ] Appointment confirmations
    -   [ ] **Acceptance**: Emails sent automatically

-   [ ] **COM-006**: Build bulk email feature (13 SP)
    -   [ ] Select recipients
    -   [ ] Compose message
    -   [ ] Track delivery
    -   [ ] **Acceptance**: Bulk emails work

#### 9.3 SMS Notifications (Feature Toggle)

-   [ ] **COM-007**: Integrate SMS provider (13 SP)

    -   [ ] Configure SMS gateway
    -   [ ] Test connectivity
    -   [ ] **Acceptance**: SMS sends

-   [ ] **COM-008**: Create SMS templates (5 SP)

    -   [ ] Build SMS templates
    -   [ ] Character limit handling
    -   [ ] **Acceptance**: Templates work

-   [ ] **COM-009**: Implement bulk SMS (8 SP)
    -   [ ] Select recipients
    -   [ ] Send bulk SMS
    -   [ ] Track delivery
    -   [ ] **Acceptance**: Bulk SMS works

#### 9.4 Communication Reports

-   [ ] **COM-010**: Build communication log (5 SP)

    -   [ ] Log all communications
    -   [ ] View history
    -   [ ] **Acceptance**: Log viewable

-   [ ] **COM-011**: Create delivery report (5 SP)

    -   [ ] Track delivery status
    -   [ ] Failed delivery handling
    -   [ ] **Acceptance**: Delivery tracked

-   [ ] **COM-012**: Implement preference management (8 SP)

    -   [ ] User communication preferences
    -   [ ] Opt-out handling
    -   [ ] **Acceptance**: Preferences respected

-   [ ] **COM-013**: Build notification center (5 SP)
    -   [ ] In-app notifications
    -   [ ] Mark as read
    -   [ ] **Acceptance**: Notification center works

---

### Epic 10: Reports & Analytics (133 SP)

**Dependencies**: EP-03, EP-04, EP-05 (All core features)
**Sprint**: Week 19-22

#### 10.1 Dashboard Analytics

-   [ ] **REP-001**: Create main dashboard (13 SP)

    -   [ ] Key metrics overview
    -   [ ] Recent activity
    -   [ ] Quick actions
    -   [ ] **Acceptance**: Dashboard functional

-   [ ] **REP-002**: Build financial dashboard (13 SP)

    -   [ ] Income summary
    -   [ ] Trend charts
    -   [ ] Comparison views
    -   [ ] **Acceptance**: Financial dash works

-   [ ] **REP-003**: Create parishioner dashboard (8 SP)
    -   [ ] Registration trends
    -   [ ] Demographics
    -   [ ] **Acceptance**: Parishioner dash works

#### 10.2 Standard Reports

-   [ ] **REP-004**: Implement report builder (21 SP)

    -   [ ] Report configuration
    -   [ ] Field selection
    -   [ ] Filter criteria
    -   [ ] **Acceptance**: Reports configurable

-   [ ] **REP-005**: Create financial reports (13 SP)

    -   [ ] Income statement
    -   [ ] Collection report
    -   [ ] Campaign progress
    -   [ ] **Acceptance**: Financial reports work

-   [ ] **REP-006**: Build parishioner reports (8 SP)

    -   [ ] Demographics
    -   [ ] New registrations
    -   [ ] Status breakdown
    -   [ ] **Acceptance**: Parishioner reports work

-   [ ] **REP-007**: Create sacramental reports (8 SP)
    -   [ ] Annual statistics
    -   [ ] By type breakdown
    -   [ ] **Acceptance**: Sacramental reports work

#### 10.3 Export & Printing

-   [ ] **REP-008**: Implement PDF generation (8 SP)

    -   [ ] Generate PDF reports
    -   [ ] Proper formatting
    -   [ ] **Acceptance**: PDFs generate

-   [ ] **REP-009**: Build Excel export (8 SP)

    -   [ ] Export to Excel
    -   [ ] Proper formatting
    -   [ ] **Acceptance**: Excel exports work

-   [ ] **REP-010**: Create print layouts (5 SP)
    -   [ ] Print-friendly views
    -   [ ] Proper pagination
    -   [ ] **Acceptance**: Printing works

#### 10.4 Advanced Analytics

-   [ ] **REP-011**: Build trend analysis (13 SP)

    -   [ ] Year-over-year comparison
    -   [ ] Growth metrics
    -   [ ] **Acceptance**: Trends viewable

-   [ ] **REP-012**: Create custom report saving (8 SP)

    -   [ ] Save report configurations
    -   [ ] Quick access
    -   [ ] **Acceptance**: Reports savable

-   [ ] **REP-013**: Implement scheduled reports (8 SP)
    -   [ ] Schedule recurring reports
    -   [ ] Email delivery
    -   [ ] **Acceptance**: Scheduled reports work

---

## Phase 4 Milestone Checklist

Before proceeding to Phase 5, verify:

-   [ ] Announcements can be created and displayed
-   [ ] Email notifications send correctly
-   [ ] SMS works (if enabled)
-   [ ] Communication preferences are respected
-   [ ] Main dashboard shows key metrics
-   [ ] Financial reports are accurate
-   [ ] Parishioner reports generate
-   [ ] PDF/Excel exports work
-   [ ] Reports can be saved and scheduled

---

## Phase 5: Operations (Weeks 23-26)

### Priority: MEDIUM

### Total Story Points: 118

Final operational capabilities for data management.

---

### Epic 12: Data Migration & Import/Export (118 SP)

**Dependencies**: All core features complete
**Sprint**: Week 23-26

#### 12.1 Data Import

-   [ ] **MIG-001**: Create import wizard (13 SP)

    -   [ ] Step-by-step import process
    -   [ ] File upload
    -   [ ] Mapping configuration
    -   [ ] **Acceptance**: Wizard functional

-   [ ] **MIG-002**: Implement parishioner import (13 SP)

    -   [ ] CSV/Excel import
    -   [ ] Field mapping
    -   [ ] Validation
    -   [ ] **Acceptance**: Parishioners importable

-   [ ] **MIG-003**: Build payment history import (13 SP)

    -   [ ] Import historical payments
    -   [ ] Link to parishioners
    -   [ ] **Acceptance**: Payments importable

-   [ ] **MIG-004**: Create sacramental import (13 SP)
    -   [ ] Import sacramental records
    -   [ ] Link to parishioners
    -   [ ] **Acceptance**: Sacraments importable

#### 12.2 Data Export

-   [ ] **MIG-005**: Implement full data export (13 SP)

    -   [ ] Export all organization data
    -   [ ] Structured format
    -   [ ] **Acceptance**: Full export works

-   [ ] **MIG-006**: Create selective export (8 SP)

    -   [ ] Choose data to export
    -   [ ] Date range selection
    -   [ ] **Acceptance**: Selective export works

-   [ ] **MIG-007**: Build export scheduling (5 SP)
    -   [ ] Schedule regular exports
    -   [ ] Automated backup
    -   [ ] **Acceptance**: Scheduled exports work

#### 12.3 Data Validation

-   [ ] **MIG-008**: Create data validation rules (8 SP)

    -   [ ] Define validation rules
    -   [ ] Check imported data
    -   [ ] **Acceptance**: Validation works

-   [ ] **MIG-009**: Implement duplicate detection (8 SP)

    -   [ ] Find potential duplicates
    -   [ ] Merge interface
    -   [ ] **Acceptance**: Duplicates detected

-   [ ] **MIG-010**: Build data cleanup tools (8 SP)
    -   [ ] Identify incomplete records
    -   [ ] Bulk update
    -   [ ] **Acceptance**: Cleanup tools work

#### 12.4 Migration Support

-   [ ] **MIG-011**: Create migration templates (5 SP)

    -   [ ] Download templates
    -   [ ] Format documentation
    -   [ ] **Acceptance**: Templates available

-   [ ] **MIG-012**: Build migration log (5 SP)

    -   [ ] Track import history
    -   [ ] Error logging
    -   [ ] **Acceptance**: Logging works

-   [ ] **MIG-013**: Implement rollback capability (8 SP)
    -   [ ] Undo recent imports
    -   [ ] Restore previous state
    -   [ ] **Acceptance**: Rollback works

---

## Final Project Checklist

### System Verification

-   [ ] All user roles function correctly
-   [ ] Multi-tenancy isolation verified
-   [ ] Feature toggles work as expected
-   [ ] All CRUD operations work
-   [ ] Search and filtering function properly
-   [ ] Reports generate accurately
-   [ ] Exports produce correct data
-   [ ] Imports process correctly
-   [ ] Notifications send properly
-   [ ] PDF/certificate generation works

### Performance Verification

-   [ ] Page load times < 3 seconds
-   [ ] Large data sets paginate correctly
-   [ ] Search responds quickly
-   [ ] Reports generate within reasonable time
-   [ ] No memory leaks in long sessions

### Security Verification

-   [ ] Authentication works correctly
-   [ ] Authorization enforced everywhere
-   [ ] Data isolation between organizations
-   [ ] Password policies enforced
-   [ ] Audit logging captures all actions
-   [ ] No sensitive data in client-side storage

### Accessibility Verification

-   [ ] Keyboard navigation works
-   [ ] Screen reader compatible
-   [ ] Color contrast sufficient
-   [ ] Form errors announced
-   [ ] Focus management correct

---

## Resource Allocation Recommendation

### Team Structure

| Role                 | Count | Responsibilities         |
| -------------------- | ----- | ------------------------ |
| Full-Stack Developer | 2     | Core feature development |
| Frontend Developer   | 1     | UI/UX implementation     |
| DevOps Engineer      | 0.5   | Infrastructure, CI/CD    |
| QA Engineer          | 0.5   | Testing, quality         |
| Project Manager      | 0.5   | Coordination             |

### Sprint Cadence

-   **Sprint Duration**: 2 weeks
-   **Releases**: Every 4 weeks (end of each phase)
-   **Retrospectives**: End of each phase

### Risk Mitigation

1. **Technical Risk**: Prototype complex features early (PDF generation, calendar)
2. **Scope Risk**: Prioritize MVP features, defer nice-to-haves
3. **Resource Risk**: Cross-train team members
4. **Integration Risk**: Test integrations (email, SMS) early

---

## Version History

| Version | Date       | Author   | Changes                     |
| ------- | ---------- | -------- | --------------------------- |
| 1.0     | 2026-01-14 | AI Agent | Initial implementation plan |

---

_This document should be reviewed and updated at the end of each phase._
