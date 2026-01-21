# Epic 03: Parishioner Management

**Epic ID:** EPIC-03
**Priority:** P0 (Critical)
**Status:** To Do
**PRD Reference:** Section 3.3

---

## Epic Overview

This epic covers the management of parishioner records, including personal information, contact details, sacramental records, and membership tracking. Parishioners are the core entities around which most other features revolve.

---

## Features

### Feature 3.1: Parishioner Records

### Feature 3.2: Sacramental Records

### Feature 3.3: Parishioner Search & Filtering

### Feature 3.4: Data Import/Export

---

## User Stories

### Feature 3.1: Parishioner Records

#### US-03-001: Create New Parishioner

**As a** Parish Secretary
**I want to** register new parishioners in the system
**So that** we can maintain accurate membership records

**Acceptance Criteria:**

-   [ ] Form captures required fields: first name, last name, email, phone
-   [ ] Form captures optional fields: DOB, gender, marital status, address, occupation
-   [ ] Email and phone validated for Nigerian formats
-   [ ] Email uniqueness enforced within organization
-   [ ] Parishioner assigned to current organization
-   [ ] Success message with option to add another
-   [ ] Form uses React Hook Form with Zod validation

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-PM-001, FR-PM-002, FR-PM-003

---

#### US-03-002: View Parishioner List

**As a** Parish Staff
**I want to** view a list of all parishioners
**So that** I can find and manage member records

**Acceptance Criteria:**

-   [ ] Paginated list with 20 items per page
-   [ ] Columns: Name, Email, Phone, Gender, Status
-   [ ] Sortable by name and date added
-   [ ] Quick view modal for details
-   [ ] Action buttons: View, Edit, Delete
-   [ ] Empty state when no parishioners
-   [ ] Loading skeleton during fetch
-   [ ] Data scoped to user's organization

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-PM-001

---

#### US-03-003: View Parishioner Details

**As a** Parish Staff
**I want to** view complete details of a parishioner
**So that** I can access all their information

**Acceptance Criteria:**

-   [ ] Profile page showing all personal info
-   [ ] Contact information section
-   [ ] Sacraments received section
-   [ ] Organization memberships section
-   [ ] Payment history summary
-   [ ] Mass intentions requested
-   [ ] Appointments history
-   [ ] Edit button for authorized users
-   [ ] Back navigation to list

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-PM-001, FR-PM-002, FR-PM-003

---

#### US-03-004: Edit Parishioner Information

**As a** Parish Secretary
**I want to** update parishioner information
**So that** records stay current

**Acceptance Criteria:**

-   [ ] Pre-populated form with current data
-   [ ] All fields editable except auto-generated IDs
-   [ ] Validation on submit
-   [ ] Audit log captures changes
-   [ ] Success notification on save
-   [ ] Cancel returns to detail page without changes
-   [ ] Only authorized roles can edit

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-PM-001

---

#### US-03-005: Delete Parishioner

**As a** Parish Admin
**I want to** remove parishioner records
**So that** I can clean up duplicate or incorrect entries

**Acceptance Criteria:**

-   [ ] Confirmation dialog before deletion
-   [ ] Warning about associated data (payments, intentions)
-   [ ] Soft delete (mark as inactive) vs hard delete option
-   [ ] Cannot delete parishioners with financial records (soft delete only)
-   [ ] Audit log captures deletion
-   [ ] Success notification after deletion
-   [ ] Only PARISH_ADMIN role can delete

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PM-001

---

#### US-03-006: Validate Email Uniqueness

**As a** system
**I want to** prevent duplicate email addresses
**So that** each parishioner has a unique identifier

**Acceptance Criteria:**

-   [ ] Check email uniqueness on form submission
-   [ ] Check within same organization only
-   [ ] Real-time validation feedback if possible
-   [ ] Clear error message for duplicates
-   [ ] Allow empty email (optional field)

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-PM-004

---

#### US-03-007: Validate Phone Uniqueness

**As a** system
**I want to** prevent duplicate phone numbers
**So that** SMS communications reach correct recipients

**Acceptance Criteria:**

-   [ ] Check phone uniqueness on form submission
-   [ ] Normalize phone format (Nigerian)
-   [ ] Check within same organization only
-   [ ] Clear error message for duplicates
-   [ ] Allow empty phone (optional field)

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PM-004

---

#### US-03-008: Track Parishioner Status

**As a** Parish Secretary
**I want to** mark parishioners as active or inactive
**So that** I can track current vs former members

**Acceptance Criteria:**

-   [ ] Status toggle on parishioner record
-   [ ] Filter list by status
-   [ ] Inactive parishioners dimmed in list
-   [ ] Count excludes inactive by default
-   [ ] Reason for deactivation (optional)
-   [ ] Reactivation possible

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PM-001

---

### Feature 3.2: Sacramental Records

#### US-03-009: Add Sacrament Record

**As a** Parish Secretary
**I want to** record sacraments received by parishioners
**So that** we maintain complete spiritual records

**Acceptance Criteria:**

-   [ ] Support 5 sacrament types:
    -   Baptism
    -   First Communion
    -   Confirmation
    -   Marriage
    -   Anointing of the Sick
-   [ ] Record date received
-   [ ] Record location (organization) where received
-   [ ] Optional notes field
-   [ ] One record per sacrament type per person
-   [ ] Validation prevents duplicate sacrament types

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PM-007, FR-PM-008, FR-PM-009

---

#### US-03-010: View Sacrament Records

**As a** Parish Staff
**I want to** view sacraments received by a parishioner
**So that** I can verify their sacramental status

**Acceptance Criteria:**

-   [ ] List on parishioner detail page
-   [ ] Shows: sacrament type, date, location
-   [ ] Visual indicator for completed sacraments
-   [ ] Expandable notes if present
-   [ ] Empty state for no records

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PM-007

---

#### US-03-011: Edit Sacrament Record

**As a** Parish Secretary
**I want to** update sacrament information
**So that** errors can be corrected

**Acceptance Criteria:**

-   [ ] Edit date, location, notes
-   [ ] Cannot change sacrament type (delete and recreate)
-   [ ] Audit log captures changes
-   [ ] Success notification on save

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PM-007

---

#### US-03-012: Delete Sacrament Record

**As a** Parish Admin
**I want to** remove incorrect sacrament records
**So that** data accuracy is maintained

**Acceptance Criteria:**

-   [ ] Confirmation dialog
-   [ ] Audit log captures deletion
-   [ ] Only PARISH_ADMIN can delete
-   [ ] Success notification

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-PM-007

---

#### US-03-013: Generate Sacrament Certificate

**As a** Parish Secretary
**I want to** generate certificates for sacraments
**So that** parishioners have official documentation

**Acceptance Criteria:**

-   [ ] Generate PDF certificate
-   [ ] Include: parishioner name, sacrament, date, location
-   [ ] Include parish/organization letterhead
-   [ ] Include signature line
-   [ ] Unique certificate number
-   [ ] Download or print option
-   [ ] Certificate template customizable (future)

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-PM-010

---

### Feature 3.3: Parishioner Search & Filtering

#### US-03-014: Search Parishioners by Name

**As a** Parish Staff
**I want to** search parishioners by name
**So that** I can quickly find specific records

**Acceptance Criteria:**

-   [ ] Search input on parishioner list
-   [ ] Search by first name, last name, or both
-   [ ] Case-insensitive search
-   [ ] Partial match support
-   [ ] Results update as user types (debounced)
-   [ ] Clear search option

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-PM-001

---

#### US-03-015: Search Parishioners by Email/Phone

**As a** Parish Staff
**I want to** search parishioners by contact info
**So that** I can find records when name is unknown

**Acceptance Criteria:**

-   [ ] Search matches email or phone
-   [ ] Partial match for email domain
-   [ ] Partial match for phone number
-   [ ] Combined with name search

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PM-001

---

#### US-03-016: Filter Parishioners by Gender

**As a** Parish Staff
**I want to** filter parishioners by gender
**So that** I can segment the membership

**Acceptance Criteria:**

-   [ ] Filter dropdown: All, Male, Female
-   [ ] Combines with other filters
-   [ ] Count updates with filter
-   [ ] URL reflects filter state

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PM-002

---

#### US-03-017: Filter Parishioners by Marital Status

**As a** Parish Staff
**I want to** filter parishioners by marital status
**So that** I can segment for specific programs

**Acceptance Criteria:**

-   [ ] Filter dropdown: All, Single, Married, Widowed, Divorced
-   [ ] Combines with other filters
-   [ ] Count updates with filter

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-PM-002

---

#### US-03-018: Filter by Organization Membership

**As a** Parish Staff
**I want to** filter parishioners by pious organization
**So that** I can find members of specific groups

**Acceptance Criteria:**

-   [ ] Dropdown lists all organizations in parish
-   [ ] Shows parishioners belonging to selected org
-   [ ] Count of members shown
-   [ ] Combines with other filters

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PM-006

---

#### US-03-019: Filter by Sacrament Status

**As a** Parish Staff
**I want to** filter parishioners by sacraments received
**So that** I can identify candidates for sacraments

**Acceptance Criteria:**

-   [ ] Multi-select for sacrament types
-   [ ] "Has received" vs "Has not received" toggle
-   [ ] Find unbaptized, unconfirmed, etc.
-   [ ] Useful for sacrament preparation programs

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PM-007

---

### Feature 3.4: Data Import/Export

#### US-03-020: Bulk Import Parishioners via CSV

**As a** Parish Admin
**I want to** import parishioners from a CSV file
**So that** I can migrate existing data quickly

**Acceptance Criteria:**

-   [ ] Upload CSV file interface
-   [ ] Download template CSV
-   [ ] Column mapping: first name, last name, email, phone, DOB, gender, marital status, address
-   [ ] Validation before import
-   [ ] Error report for invalid rows
-   [ ] Skip vs fail options for errors
-   [ ] Progress indicator for large imports
-   [ ] Summary of imported vs skipped records
-   [ ] Audit log captures bulk import

**Priority:** P1
**Story Points:** 8
**PRD Ref:** FR-PM-005

---

#### US-03-021: Export Parishioners to CSV

**As a** Parish Admin
**I want to** export parishioner data to CSV
**So that** I can use data in other systems

**Acceptance Criteria:**

-   [ ] Export all or filtered list
-   [ ] Select columns to include
-   [ ] Include sacrament status optionally
-   [ ] File downloads to browser
-   [ ] Progress indicator for large exports
-   [ ] Audit log captures export

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PM-005

---

#### US-03-022: Export Parishioners to PDF

**As a** Parish Admin
**I want to** export parishioner list to PDF
**So that** I can print physical records

**Acceptance Criteria:**

-   [ ] Generate formatted PDF report
-   [ ] Include organization header
-   [ ] Table format with key columns
-   [ ] Date generated footer
-   [ ] Page numbers
-   [ ] Landscape option for more columns

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-PM-001

---

## Technical Notes

### Data Validation

-   Nigerian phone: `/^(\+234|0)[789][01]\d{8}$/`
-   Email: standard email regex
-   DOB: must be in the past
-   Names: 2-100 characters, trimmed

### Organization Scoping

-   All queries filtered by `organizationId`
-   Parish admin sees parish + outstations
-   Outstation admin sees only outstation

### Database Schema

```prisma
model Parishioner {
  id             String   @id @default(uuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  dateOfBirth    DateTime?
  gender         Gender?
  maritalStatus  MaritalStatus?
  address        String?
  occupation     String?
  isActive       Boolean  @default(true)
  organizationId String
  organization   Organization @relation(...)
  sacraments     Sacrament[]
  payments       Payment[]
  massIntentions MassIntention[]
  appointments   Appointment[]
  memberships    societyMember[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([email, organizationId])
  @@unique([phone, organizationId])
}

enum Gender {
  MALE
  FEMALE
}

enum MaritalStatus {
  SINGLE
  MARRIED
  WIDOWED
  DIVORCED
}

model Sacrament {
  id             String        @id @default(uuid())
  type           SacramentType
  date           DateTime
  location       String?
  notes          String?
  parishionerId  String
  parishioner    Parishioner   @relation(...)
  organizationId String
  organization   Organization  @relation(...)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@unique([parishionerId, type])
}

enum SacramentType {
  BAPTISM
  FIRST_COMMUNION
  CONFIRMATION
  MARRIAGE
  ANOINTING_OF_THE_SICK
}
```

### Files to Create/Modify

-   `app/dashboard/parishioners/page.tsx` - List view
-   `app/dashboard/parishioners/new/page.tsx` - Create form
-   `app/dashboard/parishioners/[id]/page.tsx` - Detail view
-   `app/dashboard/parishioners/[id]/edit/page.tsx` - Edit form
-   `app/dashboard/parishioners/import/page.tsx` - CSV import
-   `app/actions/parishioner.actions.ts` - Server Actions
-   `app/actions/sacrament.actions.ts` - Sacrament CRUD
-   `components/forms/parishioner-form.tsx` - Form component
-   `lib/validators/parishioner.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication, authorization)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)

## Dependent Epics

-   **EPIC-04**: Financial Management (payments linked to parishioners)
-   **EPIC-05**: Mass Intention Management (intentions linked to parishioners)
-   **EPIC-06**: Appointment Management (appointments linked to parishioners)
-   **EPIC-07**: Pious Organization Management (memberships)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-03-001 | 5            |
| US-03-002 | 5            |
| US-03-003 | 5            |
| US-03-004 | 3            |
| US-03-005 | 3            |
| US-03-006 | 2            |
| US-03-007 | 2            |
| US-03-008 | 3            |
| US-03-009 | 5            |
| US-03-010 | 2            |
| US-03-011 | 2            |
| US-03-012 | 2            |
| US-03-013 | 5            |
| US-03-014 | 3            |
| US-03-015 | 2            |
| US-03-016 | 2            |
| US-03-017 | 2            |
| US-03-018 | 3            |
| US-03-019 | 3            |
| US-03-020 | 8            |
| US-03-021 | 3            |
| US-03-022 | 5            |
| **Total** | **75**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
