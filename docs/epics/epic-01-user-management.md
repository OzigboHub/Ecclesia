# Epic 01: User Management

**Epic ID:** EPIC-01
**Priority:** P0 (Critical)
**Status:** To Do
**PRD Reference:** Section 3.1

---

## Epic Overview

This epic covers all user-related functionality including authentication, authorization, session management, and user profile management. It forms the foundation of the system's security model.

---

## Features

### Feature 1.1: Authentication System

### Feature 1.2: User Profile Management

### Feature 1.3: Password Management

### Feature 1.4: Session Management

---

## User Stories

### Feature 1.1: Authentication System

#### US-01-001: User Login

**As a** user (any role)
**I want to** log in with my email and password
**So that** I can access the system based on my role

**Acceptance Criteria:**

-   [ ] User can enter email and password on login page
-   [ ] System validates credentials against database
-   [ ] Successful login redirects to dashboard
-   [ ] Failed login shows appropriate error message
-   [ ] Login form has client-side validation
-   [ ] Password field is masked

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-UM-001

---

#### US-01-002: Role-Based Access Control

**As a** system administrator
**I want to** assign roles to users
**So that** users can only access features appropriate to their role

**Acceptance Criteria:**

-   [ ] System supports 8 distinct roles:
    -   SUPER_ADMIN
    -   PARISH_ADMIN
    -   PARISH_SECRETARY
    -   PARISH_STAFF
    -   OUTSTATION_ADMIN
    -   ORGANIZATION_PRESIDENT
    -   ORGANIZATION_SECRETARY
    -   PARISHIONER
-   [ ] Each role has predefined permissions
-   [ ] Role is stored in JWT token
-   [ ] UI elements are shown/hidden based on role
-   [ ] Server Actions enforce role-based access

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-UM-002

---

#### US-01-003: User Registration by Admin

**As a** Parish Admin
**I want to** create new user accounts
**So that** staff members can access the system

**Acceptance Criteria:**

-   [ ] Admin can access user creation form
-   [ ] Form captures: first name, last name, email, role
-   [ ] System generates temporary password or sends invite email
-   [ ] New user is assigned to admin's organization
-   [ ] Email uniqueness is validated
-   [ ] Confirmation message shown on success

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-UM-008

---

#### US-01-004: User Account Activation/Deactivation

**As a** Parish Admin
**I want to** activate or deactivate user accounts
**So that** I can control who has access to the system

**Acceptance Criteria:**

-   [ ] Admin can view list of users in their organization
-   [ ] Each user has an active/inactive status toggle
-   [ ] Deactivated users cannot log in
-   [ ] Deactivated users see appropriate message when attempting login
-   [ ] Audit log captures status changes
-   [ ] Admin cannot deactivate their own account

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-UM-009

---

### Feature 1.2: User Profile Management

#### US-01-005: View Own Profile

**As a** logged-in user
**I want to** view my profile information
**So that** I can see what data is stored about me

**Acceptance Criteria:**

-   [ ] User can access profile page from navigation/menu
-   [ ] Profile displays: name, email, role, organization, last login
-   [ ] Profile page is accessible from dashboard
-   [ ] Mobile-responsive design

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-UM-007

---

#### US-01-006: Update Own Profile

**As a** logged-in user
**I want to** update my profile information
**So that** my information stays current

**Acceptance Criteria:**

-   [ ] User can edit: first name, last name, phone number
-   [ ] User cannot edit: email, role (admin only)
-   [ ] Changes are validated before saving
-   [ ] Success/error toast notifications shown
-   [ ] Changes reflected immediately in UI

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-UM-007

---

#### US-01-007: View User List

**As a** Parish Admin
**I want to** view all users in my organization
**So that** I can manage access to the system

**Acceptance Criteria:**

-   [ ] Admin sees list of all users in their organization
-   [ ] List shows: name, email, role, status, last login
-   [ ] List supports search by name or email
-   [ ] List supports filtering by role
-   [ ] List supports filtering by status (active/inactive)
-   [ ] Pagination for large lists
-   [ ] Parish admin sees users from parish and all outstations

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-UM-007, FR-OM-004

---

#### US-01-008: Edit User Details

**As a** Parish Admin
**I want to** edit user details and roles
**So that** I can keep user information up to date

**Acceptance Criteria:**

-   [ ] Admin can access user edit form
-   [ ] Admin can update: name, email, role
-   [ ] Admin cannot promote user to higher role than own
-   [ ] Email uniqueness validated
-   [ ] Audit log captures changes
-   [ ] Confirmation shown on success

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-UM-007, FR-UM-008

---

### Feature 1.3: Password Management

#### US-01-009: Password Complexity Enforcement

**As a** system
**I want to** enforce password complexity requirements
**So that** user accounts are secure

**Acceptance Criteria:**

-   [ ] Minimum 8 characters
-   [ ] At least 1 uppercase letter
-   [ ] At least 1 number
-   [ ] At least 1 special character
-   [ ] Real-time validation feedback on password fields
-   [ ] Clear error messages for failed validation

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-UM-003

---

#### US-01-010: Request Password Reset

**As a** user who forgot their password
**I want to** request a password reset link
**So that** I can regain access to my account

**Acceptance Criteria:**

-   [ ] User can access "Forgot Password" link on login page
-   [ ] User enters their email address
-   [ ] System sends reset link if email exists (no indication if it doesn't)
-   [ ] Reset link expires after 1 hour
-   [ ] Reset link is single-use
-   [ ] Confirmation message shown after submission

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-UM-004

---

#### US-01-011: Reset Password via Link

**As a** user with a reset link
**I want to** set a new password
**So that** I can access my account again

**Acceptance Criteria:**

-   [ ] Reset link opens password reset form
-   [ ] User enters new password and confirmation
-   [ ] Password complexity is enforced
-   [ ] Expired or used links show appropriate error
-   [ ] Successful reset redirects to login
-   [ ] Previous sessions are invalidated

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-UM-004

---

#### US-01-012: Change Password (Logged In)

**As a** logged-in user
**I want to** change my password
**So that** I can maintain account security

**Acceptance Criteria:**

-   [ ] User can access password change from profile/settings
-   [ ] User must enter current password
-   [ ] User enters new password and confirmation
-   [ ] Password complexity is enforced
-   [ ] Success message shown after change
-   [ ] User remains logged in after change

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-UM-003

---

### Feature 1.4: Session Management

#### US-01-013: Automatic Session Expiry

**As a** system
**I want to** automatically expire sessions after 24 hours
**So that** abandoned sessions don't pose security risks

**Acceptance Criteria:**

-   [ ] JWT tokens expire after 24 hours
-   [ ] Expired sessions redirect to login
-   [ ] User sees appropriate message about session expiry
-   [ ] "Remember me" functionality extends to 24 hours max

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-UM-005

---

#### US-01-014: Track Last Login

**As a** Parish Admin
**I want to** see when users last logged in
**So that** I can identify inactive accounts

**Acceptance Criteria:**

-   [ ] Last login timestamp recorded on successful login
-   [ ] Last login displayed in user list
-   [ ] Last login displayed on user profile
-   [ ] Timestamp shows relative time (e.g., "2 hours ago")

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-UM-006

---

#### US-01-015: Manual Logout

**As a** logged-in user
**I want to** log out of the system
**So that** I can secure my session when done

**Acceptance Criteria:**

-   [ ] Logout button accessible from navigation
-   [ ] Clicking logout invalidates session
-   [ ] User redirected to login page
-   [ ] Protected routes no longer accessible
-   [ ] Session token cleared from storage

**Priority:** P0
**Story Points:** 1
**PRD Ref:** FR-UM-005

---

#### US-01-016: Protected Route Access

**As a** system
**I want to** protect dashboard routes from unauthenticated access
**So that** only logged-in users can access the application

**Acceptance Criteria:**

-   [ ] Dashboard routes require authentication
-   [ ] Unauthenticated users redirected to login
-   [ ] After login, user redirected to intended page
-   [ ] Server-side session validation for all protected routes

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-UM-001, NFR-SEC-005

---

## Technical Notes

### Authentication Implementation

-   Use NextAuth.js v4 with Credentials provider
-   JWT strategy with 24-hour expiration
-   Store session data: `id`, `role`, `organizationId`, `organizationName`
-   bcrypt for password hashing (cost factor 12)

### Database Schema

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password       String
  firstName      String
  lastName       String
  role           UserRole
  isActive       Boolean  @default(true)
  lastLoginAt    DateTime?
  organizationId String
  organization   Organization @relation(...)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum UserRole {
  SUPER_ADMIN
  PARISH_ADMIN
  PARISH_SECRETARY
  PARISH_STAFF
  OUTSTATION_ADMIN
  ORGANIZATION_PRESIDENT
  ORGANIZATION_SECRETARY
  PARISHIONER
}
```

### Files to Create/Modify

-   `app/auth/login/page.tsx` - Login page
-   `app/auth/forgot-password/page.tsx` - Password reset request
-   `app/auth/reset-password/page.tsx` - Password reset form
-   `app/dashboard/settings/page.tsx` - Profile & password change
-   `app/dashboard/users/page.tsx` - User management (admin)
-   `app/actions/auth.actions.ts` - Auth Server Actions
-   `app/actions/user.actions.ts` - User CRUD Server Actions
-   `lib/validators/auth.schema.ts` - Zod schemas
-   `lib/validators/user.schema.ts` - User validation schemas

---

## Dependencies

-   None (Foundation epic)

## Dependent Epics

-   All other epics depend on this for authentication and authorization

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-01-001 | 3            |
| US-01-002 | 5            |
| US-01-003 | 5            |
| US-01-004 | 3            |
| US-01-005 | 2            |
| US-01-006 | 3            |
| US-01-007 | 5            |
| US-01-008 | 3            |
| US-01-009 | 2            |
| US-01-010 | 3            |
| US-01-011 | 3            |
| US-01-012 | 3            |
| US-01-013 | 2            |
| US-01-014 | 2            |
| US-01-015 | 1            |
| US-01-016 | 3            |
| **Total** | **48**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
