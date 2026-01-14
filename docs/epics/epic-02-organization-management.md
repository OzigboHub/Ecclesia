# Epic 02: Organization Management

**Epic ID:** EPIC-02
**Priority:** P0 (Critical)
**Status:** To Do
**PRD Reference:** Section 3.2

---

## Epic Overview

This epic covers the management of organizational hierarchy (Parish and Outstations), feature toggle system, and organization settings. It establishes the multi-tenant architecture that isolates data between parishes.

---

## Features

### Feature 2.1: Organization Hierarchy

### Feature 2.2: Feature Toggle System

### Feature 2.3: Organization Settings

---

## User Stories

### Feature 2.1: Organization Hierarchy

#### US-02-001: Create Parish Organization

**As a** Super Admin
**I want to** create a new parish organization
**So that** a new parish can start using the system

**Acceptance Criteria:**

-   [ ] Form captures: parish name, address, contact email, phone
-   [ ] Parish level is set to "PARISH"
-   [ ] Default feature settings are created
-   [ ] Parish admin user can be assigned during creation
-   [ ] Validation ensures unique parish name
-   [ ] Success confirmation with option to add outstations

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-001

---

#### US-02-002: Create Outstation Organization

**As a** Parish Admin
**I want to** create outstations under my parish
**So that** I can manage multiple worship locations

**Acceptance Criteria:**

-   [ ] Form captures: outstation name, address, contact info
-   [ ] Outstation level is set to "OUTSTATION"
-   [ ] Parent parish is automatically set to admin's parish
-   [ ] Feature settings inherit from parent parish
-   [ ] Outstation admin can be assigned
-   [ ] Validation ensures unique name within parish

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-001, FR-OM-002

---

#### US-02-003: View Organization Hierarchy

**As a** Parish Admin
**I want to** view my parish and all its outstations
**So that** I can understand my organization structure

**Acceptance Criteria:**

-   [ ] Tree view showing parish at root
-   [ ] Outstations listed under parish
-   [ ] Each node shows: name, admin, member count
-   [ ] Click to view organization details
-   [ ] Visual distinction between parish and outstations

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-OM-001, FR-OM-004

---

#### US-02-004: Edit Organization Details

**As a** Parish Admin
**I want to** update organization information
**So that** contact details stay current

**Acceptance Criteria:**

-   [ ] Edit form for: name, address, email, phone
-   [ ] Parish admin can edit parish and all outstations
-   [ ] Outstation admin can only edit their outstation
-   [ ] Validation on all fields
-   [ ] Audit log captures changes
-   [ ] Success notification on save

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-OM-001

---

#### US-02-005: Prevent Circular References

**As a** system
**I want to** prevent circular references in organization hierarchy
**So that** data integrity is maintained

**Acceptance Criteria:**

-   [ ] Cannot set an outstation as parent of its own parish
-   [ ] Validation error shown for invalid hierarchy
-   [ ] Database constraints prevent circular references
-   [ ] Only two levels allowed (Parish → Outstation)

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-OM-003

---

#### US-02-006: Hierarchical Data Access - Parish Admin

**As a** Parish Admin
**I want to** view data from my parish and all outstations
**So that** I have complete oversight of my parish

**Acceptance Criteria:**

-   [ ] Dashboard shows aggregated stats from parish + outstations
-   [ ] Parishioner list includes all from parish hierarchy
-   [ ] Payment reports aggregate across hierarchy
-   [ ] Filter option to view specific organization data
-   [ ] Clear indication of which organization data belongs to

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-004

---

#### US-02-007: Hierarchical Data Access - Outstation Admin

**As an** Outstation Admin
**I want to** only see data for my outstation
**So that** I focus on my responsibility

**Acceptance Criteria:**

-   [ ] Dashboard shows only outstation stats
-   [ ] Parishioner list shows only outstation members
-   [ ] Cannot view other outstations' data
-   [ ] Cannot view parish-level aggregate data
-   [ ] Clear indication of current organization context

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-OM-005

---

### Feature 2.2: Feature Toggle System

#### US-02-008: View Feature Settings

**As a** Parish Admin
**I want to** view current feature settings for my organization
**So that** I know which features are enabled

**Acceptance Criteria:**

-   [ ] Feature settings page accessible from dashboard
-   [ ] All features listed with current status (enabled/disabled)
-   [ ] Features grouped by category:
    -   Core (Parishioner, Sacraments, Financial)
    -   Payments (Offerings, Tithes, Campaigns, Custom)
    -   Spiritual (Mass Intentions, Appointments, Confession)
    -   Communication (Live Streaming, Announcements, SMS, Email)
    -   Organizations (Pious Orgs, Events)
    -   Advanced (Online Payments, Recurring, Mobile)
-   [ ] Description for each feature
-   [ ] Mobile-responsive layout

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-006, FR-OM-011

---

#### US-02-009: Toggle Features On/Off

**As a** Parish Admin
**I want to** enable or disable features for my organization
**So that** I can customize the system for our needs

**Acceptance Criteria:**

-   [ ] Toggle switch for each feature
-   [ ] Confirmation dialog before disabling
-   [ ] Warning about dependent features
-   [ ] Changes take effect immediately
-   [ ] Audit log captures toggle changes
-   [ ] Success/error toast notifications

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-007, FR-OM-012

---

#### US-02-010: Hide UI for Disabled Features

**As a** user
**I want to** not see disabled features in the UI
**So that** the interface is not cluttered

**Acceptance Criteria:**

-   [ ] Sidebar hides links to disabled features
-   [ ] Dashboard hides widgets for disabled features
-   [ ] Forms hide options for disabled features
-   [ ] Feature check happens on page load
-   [ ] Graceful fallback if feature settings unavailable

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-008

---

#### US-02-011: Block API Access to Disabled Features

**As a** system
**I want to** prevent API access to disabled features
**So that** security and data integrity are maintained

**Acceptance Criteria:**

-   [ ] Server Actions check feature status before execution
-   [ ] Returns appropriate error for disabled features
-   [ ] Error message: "Feature not enabled for your organization"
-   [ ] No data modification allowed for disabled features
-   [ ] Audit log captures blocked access attempts

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-009

---

#### US-02-012: Default Feature Settings for New Organizations

**As a** system
**I want to** create default feature settings for new organizations
**So that** they have a baseline configuration

**Acceptance Criteria:**

-   [ ] Default enabled: Parishioner Management, Sacraments, Financial, Mass Intentions, Appointments, Announcements, Email, Pious Orgs, Events, Public Website
-   [ ] Default disabled: Live Streaming, SMS, Online Payments, Recurring Donations, Mobile App
-   [ ] Settings record created automatically with organization
-   [ ] Admin can modify after creation

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-OM-010

---

#### US-02-013: Feature Dependencies Validation

**As a** system
**I want to** enforce feature dependencies
**So that** features work correctly together

**Acceptance Criteria:**

-   [ ] Cannot enable Online Payments without Financial Management
-   [ ] Cannot enable Mass Intentions without Financial Management
-   [ ] Cannot enable Recurring Donations without Online Payments
-   [ ] Cannot enable SMS Notifications without Communication feature
-   [ ] Warning shown when disabling a feature that others depend on
-   [ ] Dependent features auto-disabled when parent disabled

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-OM-013

---

#### US-02-014: Outstation Feature Inheritance

**As an** Outstation Admin
**I want to** inherit feature settings from my parent parish
**So that** we have consistent capabilities

**Acceptance Criteria:**

-   [ ] New outstations inherit parent parish settings
-   [ ] Outstation cannot enable features disabled at parish level
-   [ ] Outstation can disable features enabled at parish level
-   [ ] Visual indicator for inherited vs overridden settings
-   [ ] Parish admin can reset outstation to inherit

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-OM-014

---

### Feature 2.3: Organization Settings

#### US-02-015: Configure Organization Contact Info

**As a** Parish Admin
**I want to** set my organization's contact information
**So that** parishioners know how to reach us

**Acceptance Criteria:**

-   [ ] Settings form for: address, phone, email, website
-   [ ] Mass schedule information
-   [ ] Office hours
-   [ ] Validation for email and phone formats
-   [ ] Changes saved with confirmation

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-OM-001

---

#### US-02-016: Configure Currency Settings

**As a** Parish Admin
**I want to** confirm currency settings for my organization
**So that** financial records display correctly

**Acceptance Criteria:**

-   [ ] Default currency: Nigerian Naira (₦)
-   [ ] Currency symbol displayed consistently
-   [ ] Number formatting: Nigerian locale (comma thousands, period decimals)
-   [ ] Setting is read-only (Naira only for v1.0)

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-001

---

#### US-02-017: View Organization Dashboard

**As a** Parish Admin
**I want to** see a dashboard of my organization's status
**So that** I have a quick overview of operations

**Acceptance Criteria:**

-   [ ] Total parishioners count
-   [ ] Total revenue (this month)
-   [ ] Pending mass intentions
-   [ ] Upcoming appointments
-   [ ] Recent activity feed
-   [ ] Quick action buttons
-   [ ] Data scoped to organization hierarchy

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-OM-004

---

#### US-02-018: Switch Organization Context (Super Admin)

**As a** Super Admin
**I want to** switch between organizations
**So that** I can manage multiple parishes

**Acceptance Criteria:**

-   [ ] Organization selector in header
-   [ ] Can view any parish and its outstations
-   [ ] Context clearly indicated in UI
-   [ ] Data updates when context changes
-   [ ] Session remembers last selected organization

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-OM-004

---

## Technical Notes

### Multi-Tenancy Implementation

-   All queries must include `organizationId` filter
-   Use `session.user.organizationId` for scoping
-   Parish admins: query with `organizationId IN (parish, ...outstations)`
-   Never trust client-provided organizationId

### Feature Toggle Implementation

-   Cache feature settings in session or Zustand store
-   Check features in Server Actions before operations
-   Check features in Client Components for UI rendering
-   Use `useFeatureSettings()` hook for client-side checks

### Database Schema

```prisma
model Organization {
  id              String   @id @default(uuid())
  name            String
  level           OrgLevel
  parentId        String?
  parent          Organization? @relation("OrgHierarchy", fields: [parentId], references: [id])
  children        Organization[] @relation("OrgHierarchy")
  address         String?
  email           String?
  phone           String?
  featureSettings OrganizationFeatureSettings?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum OrgLevel {
  PARISH
  OUTSTATION
}

model OrganizationFeatureSettings {
  id                          String       @id @default(uuid())
  organizationId              String       @unique
  organization                Organization @relation(...)

  // Core Features
  enableParishionerManagement Boolean      @default(true)
  enableSacramentalRecords    Boolean      @default(true)
  enableFinancialManagement   Boolean      @default(true)

  // Payment Features
  enableOfferings             Boolean      @default(true)
  enableTithes                Boolean      @default(true)
  enableDonationCampaigns     Boolean      @default(true)
  enableCustomDonationTypes   Boolean      @default(true)
  enableMonthlyTracking       Boolean      @default(true)

  // Spiritual Features
  enableMassIntentions        Boolean      @default(true)
  enableAppointments          Boolean      @default(true)
  enableConfessionBooking     Boolean      @default(true)

  // Communication Features
  enableLiveStreaming         Boolean      @default(false)
  enableAnnouncements         Boolean      @default(true)
  enableSMSNotifications      Boolean      @default(false)
  enableEmailNotifications    Boolean      @default(true)

  // Organization Features
  enablePiousOrganizations    Boolean      @default(true)
  enableEventManagement       Boolean      @default(true)

  // Advanced Features
  enableOnlinePayments        Boolean      @default(false)
  enableRecurringDonations    Boolean      @default(false)
  enableMobileApp             Boolean      @default(false)
  enablePublicWebsite         Boolean      @default(true)

  createdAt                   DateTime     @default(now())
  updatedAt                   DateTime     @updatedAt
}
```

### Files to Create/Modify

-   `app/dashboard/settings/organization/page.tsx` - Org settings
-   `app/dashboard/settings/features/page.tsx` - Feature toggles
-   `app/actions/organization.actions.ts` - Organization CRUD
-   `lib/features.ts` - Feature toggle helpers
-   `hooks/use-feature-settings.ts` - Client-side feature hook
-   `lib/validators/organization.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication, roles)

## Dependent Epics

-   All other epics depend on organization scoping and feature toggles

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-02-001 | 5            |
| US-02-002 | 5            |
| US-02-003 | 3            |
| US-02-004 | 3            |
| US-02-005 | 2            |
| US-02-006 | 5            |
| US-02-007 | 3            |
| US-02-008 | 5            |
| US-02-009 | 5            |
| US-02-010 | 5            |
| US-02-011 | 5            |
| US-02-012 | 3            |
| US-02-013 | 5            |
| US-02-014 | 5            |
| US-02-015 | 3            |
| US-02-016 | 2            |
| US-02-017 | 5            |
| US-02-018 | 3            |
| **Total** | **72**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
