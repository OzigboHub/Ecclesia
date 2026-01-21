# Epic 07: Pious Organization Management

**Epic ID:** EPIC-07
**Priority:** P2 (Medium)
**Status:** To Do
**PRD Reference:** Section 3.7

---

## Epic Overview

This epic covers the management of pious organizations, societies, and groups within the parish (e.g., Catholic Men Organization, Catholic Women Organization, Legion of Mary, Knights of Columbus, etc.). Includes membership tracking, leadership assignment, dues collection, and meeting management.

---

## Features

### Feature 7.1: Organization Creation and Setup

### Feature 7.2: Membership Management

### Feature 7.3: Leadership Management

### Feature 7.4: Dues and Financial Tracking

### Feature 7.5: Meetings and Activities

---

## User Stories

### Feature 7.1: Organization Creation and Setup

#### US-07-001: Create Pious Organization

**As a** Parish Admin
**I want to** create a new pious organization
**So that** parish groups can be managed in the system

**Acceptance Criteria:**

-   [ ] Enter organization name
-   [ ] Select type (Society, Guild, Association, etc.)
-   [ ] Add description and mission
-   [ ] Set patron saint (optional)
-   [ ] Upload logo/image (optional)
-   [ ] Set meeting schedule (day/time)
-   [ ] Set membership requirements

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-001

---

#### US-07-002: View Pious Organizations List

**As a** Parish Staff
**I want to** view all pious organizations
**So that** I can see what groups exist

**Acceptance Criteria:**

-   [ ] List of all organizations
-   [ ] Shows name, type, member count
-   [ ] Active/inactive status
-   [ ] Search by name
-   [ ] Sort alphabetically or by member count
-   [ ] Filter by type

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-001

---

#### US-07-003: View Organization Details

**As a** Parish Staff
**I want to** view organization details
**So that** I have complete information

**Acceptance Criteria:**

-   [ ] Organization name and type
-   [ ] Description and mission
-   [ ] Current leadership
-   [ ] Member count
-   [ ] Meeting schedule
-   [ ] Recent activities
-   [ ] Financial summary (dues collected)

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-001

---

#### US-07-004: Edit Pious Organization

**As a** Parish Admin
**I want to** edit organization details
**So that** information stays current

**Acceptance Criteria:**

-   [ ] Edit all organization fields
-   [ ] Change meeting schedule
-   [ ] Update description
-   [ ] Change status (active/inactive)
-   [ ] Audit log of changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-001

---

#### US-07-005: Deactivate Organization

**As a** Parish Admin
**I want to** deactivate an organization
**So that** defunct groups are not displayed

**Acceptance Criteria:**

-   [ ] Mark as inactive
-   [ ] Historical data preserved
-   [ ] Members' records maintained
-   [ ] Can be reactivated later
-   [ ] Reason for deactivation (optional)

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-PO-001

---

### Feature 7.2: Membership Management

#### US-07-006: Add Member to Organization

**As a** Organization President
**I want to** add parishioners to my organization
**So that** membership is tracked

**Acceptance Criteria:**

-   [ ] Select from existing parishioners
-   [ ] Set join date
-   [ ] Set membership status (Active, Probation, etc.)
-   [ ] Set position/role within org (if any)
-   [ ] Add notes
-   [ ] Member receives notification (optional)

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-002

---

#### US-07-007: View Organization Members

**As a** Organization President
**I want to** view all members of my organization
**So that** I can manage membership

**Acceptance Criteria:**

-   [ ] Paginated list of members
-   [ ] Shows name, join date, status, role
-   [ ] Filter by status (Active, Inactive)
-   [ ] Search by name
-   [ ] Sort by name, join date
-   [ ] Export member list

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-002

---

#### US-07-008: Update Member Status

**As a** Organization President
**I want to** update a member's status
**So that** membership records are accurate

**Acceptance Criteria:**

-   [ ] Change status (Active, Inactive, Suspended)
-   [ ] Set effective date
-   [ ] Add reason for change
-   [ ] Historical status tracked
-   [ ] Notification to member (optional)

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PO-002

---

#### US-07-009: Assign Role to Member

**As a** Organization President
**I want to** assign roles to members
**So that** responsibilities are tracked

**Acceptance Criteria:**

-   [ ] Assign role (Secretary, Treasurer, etc.)
-   [ ] Set effective date
-   [ ] Multiple roles allowed
-   [ ] Track role history
-   [ ] Display on member's profile

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PO-002

---

#### US-07-010: Remove Member from Organization

**As a** Organization President
**I want to** remove members from my organization
**So that** membership is accurate

**Acceptance Criteria:**

-   [ ] Remove with confirmation
-   [ ] Reason required
-   [ ] Historical record maintained
-   [ ] Dues balance handled
-   [ ] Option to notify member

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-PO-002

---

#### US-07-011: Transfer Member Between Organizations

**As a** Parish Admin
**I want to** transfer members between organizations
**So that** changes are tracked properly

**Acceptance Criteria:**

-   [ ] Select source organization
-   [ ] Select target organization
-   [ ] Carry over or reset seniority
-   [ ] Transfer date recorded
-   [ ] Both organization records updated

**Priority:** P3
**Story Points:** 3
**PRD Ref:** FR-PO-002

---

#### US-07-012: Bulk Import Members

**As a** Organization President
**I want to** bulk add members
**So that** initial setup is faster

**Acceptance Criteria:**

-   [ ] CSV upload option
-   [ ] Template provided
-   [ ] Match to existing parishioners
-   [ ] Validation and error reporting
-   [ ] Preview before import
-   [ ] Summary after import

**Priority:** P3
**Story Points:** 5
**PRD Ref:** FR-PO-002

---

### Feature 7.3: Leadership Management

#### US-07-013: Assign Organization Leadership

**As a** Parish Admin
**I want to** assign leadership positions
**So that** proper governance exists

**Acceptance Criteria:**

-   [ ] Assign President position
-   [ ] Assign Vice President
-   [ ] Assign Secretary
-   [ ] Assign Treasurer
-   [ ] Other custom positions
-   [ ] Term dates (start/end)

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-003

---

#### US-07-014: View Leadership History

**As a** Parish Admin
**I want to** view past leadership
**So that** there's continuity and record

**Acceptance Criteria:**

-   [ ] List of past leaders
-   [ ] Position held
-   [ ] Term dates
-   [ ] Filter by position
-   [ ] Filter by year

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PO-003

---

#### US-07-015: Organization President Dashboard

**As a** Organization President
**I want to** see my organization's dashboard
**So that** I can manage effectively

**Acceptance Criteria:**

-   [ ] Member count and recent changes
-   [ ] Dues collection summary
-   [ ] Upcoming meetings/events
-   [ ] Outstanding dues list
-   [ ] Quick actions (add member, record dues)

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-003

---

#### US-07-016: Grant Access to Organization Leaders

**As a** Parish Admin
**I want to** grant system access to organization leaders
**So that** they can manage their groups

**Acceptance Criteria:**

-   [ ] Create user accounts for leaders
-   [ ] Assign ORGANIZATION_PRESIDENT or SECRETARY role
-   [ ] Scope access to their organization only
-   [ ] Enable/disable access
-   [ ] Access automatically adjusts with role changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-003

---

### Feature 7.4: Dues and Financial Tracking

#### US-07-017: Configure Dues Structure

**As a** Organization President
**I want to** configure dues requirements
**So that** members know payment expectations

**Acceptance Criteria:**

-   [ ] Set annual/monthly/quarterly dues
-   [ ] Set dues amount
-   [ ] Optional: different rates (new members, seniors)
-   [ ] Due date configuration
-   [ ] Grace period settings

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-004

---

#### US-07-018: Record Member Dues Payment

**As a** Organization Secretary
**I want to** record dues payments
**So that** financial records are accurate

**Acceptance Criteria:**

-   [ ] Select member
-   [ ] Enter payment amount
-   [ ] Select period covered (month/quarter/year)
-   [ ] Payment method
-   [ ] Date received
-   [ ] Issue receipt

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-004

---

#### US-07-019: View Member Dues Status

**As a** Organization President
**I want to** see each member's dues status
**So that** I can follow up on outstanding payments

**Acceptance Criteria:**

-   [ ] Current dues status (Paid, Partial, Owing)
-   [ ] Amount outstanding
-   [ ] Payment history
-   [ ] Periods covered
-   [ ] Last payment date

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-PO-004

---

#### US-07-020: View Outstanding Dues Report

**As a** Organization President
**I want to** see all members with outstanding dues
**So that** I can send reminders

**Acceptance Criteria:**

-   [ ] List of members owing
-   [ ] Amount owed per member
-   [ ] Total outstanding
-   [ ] Sort by amount or name
-   [ ] Export for follow-up
-   [ ] Bulk reminder option

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-PO-004

---

#### US-07-021: Organization Financial Summary

**As a** Organization President
**I want to** see financial summary
**So that** I can report to parish

**Acceptance Criteria:**

-   [ ] Total dues collected (period)
-   [ ] Outstanding dues
-   [ ] Collection rate
-   [ ] Year-over-year comparison
-   [ ] Dues by member breakdown
-   [ ] Export/print report

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-PO-004

---

#### US-07-022: Link Dues to Parish Payments

**As a** System
**I want to** link organization dues to main payments
**So that** financials are unified

**Acceptance Criteria:**

-   [ ] Dues recorded as payment type
-   [ ] Linked to parishioner payment history
-   [ ] Shows in organization reports
-   [ ] Shows in parish financial reports
-   [ ] Proper categorization

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PO-004, FR-FM-001

---

### Feature 7.5: Meetings and Activities

#### US-07-023: Schedule Organization Meeting

**As a** Organization President
**I want to** schedule meetings
**So that** members know when to attend

**Acceptance Criteria:**

-   [ ] Set date and time
-   [ ] Set location
-   [ ] Add agenda (optional)
-   [ ] Mark as regular or special meeting
-   [ ] Notify members (optional)

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PO-001

---

#### US-07-024: Record Meeting Attendance

**As a** Organization Secretary
**I want to** record who attended meetings
**So that** participation is tracked

**Acceptance Criteria:**

-   [ ] Select meeting
-   [ ] Check off attendees
-   [ ] Quick mark all present
-   [ ] Record late arrivals
-   [ ] Record excused absences
-   [ ] Save attendance

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-PO-002

---

#### US-07-025: View Member Attendance History

**As a** Organization President
**I want to** see member attendance patterns
**So that** I can address participation issues

**Acceptance Criteria:**

-   [ ] Attendance percentage per member
-   [ ] Meetings attended/missed
-   [ ] Filter by date range
-   [ ] Identify chronic absentees
-   [ ] Attendance report

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PO-002

---

#### US-07-026: Send Announcement to Organization Members

**As a** Organization President
**I want to** send announcements to members
**So that** important information is shared

**Acceptance Criteria:**

-   [ ] Compose message
-   [ ] Send to all members or selected
-   [ ] Via email or SMS (based on settings)
-   [ ] Schedule for later (optional)
-   [ ] View sent announcements

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-PO-001

---

#### US-07-027: View My Organization Membership

**As a** Parishioner
**I want to** see my organization memberships
**So that** I know my involvement

**Acceptance Criteria:**

-   [ ] List of organizations I belong to
-   [ ] My role in each
-   [ ] Dues status
-   [ ] Upcoming meetings
-   [ ] Leadership contacts

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-PO-002

---

## Technical Notes

### Organization Types

-   Catholic Men Organization (CMO)
-   Catholic Women Organization (CWO)
-   Legion of Mary
-   Knights of Columbus
-   St. Vincent de Paul Society
-   Altar Servers Guild
-   Choir/Music Ministry
-   Youth Group
-   Young Adults
-   Couples for Christ
-   Charismatic Renewal
-   Custom/Other

### Membership Status

```
PENDING → ACTIVE → INACTIVE
             ↓
         SUSPENDED
```

### Feature Toggle Integration

-   Check `enablesocietys` before all operations
-   Dues tracking depends on `enableFinancialManagement`
-   Notifications depend on `enableEmailNotifications` / `enableSMSNotifications`

### Database Schema

```prisma
model society {
  id                String                  @id @default(uuid())
  name              String
  type              societyType
  description       String?
  mission           String?
  patronSaint       String?
  logoUrl           String?
  meetingSchedule   String?                 // e.g., "Every Sunday 4PM"
  isActive          Boolean                 @default(true)

  // Dues configuration
  duesAmount        Decimal?                @db.Decimal(10, 2)
  duesFrequency     DuesFrequency?          // MONTHLY, QUARTERLY, ANNUALLY

  organizationId    String
  organization      Organization            @relation(...)

  memberships       societyMember[]
  meetings          societyMeeting[]

  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
}

model societyMember {
  id                    String                   @id @default(uuid())
  societyId   String
  society     society        @relation(...)
  parishionerId         String
  parishioner           Parishioner              @relation(...)

  role                  String?                  // President, Secretary, etc.
  status                MembershipStatus         @default(ACTIVE)
  joinDate              DateTime

  createdAt             DateTime                 @default(now())
  updatedAt             DateTime                 @updatedAt

  @@unique([societyId, parishionerId])
}

model societyMeeting {
  id                    String            @id @default(uuid())
  societyId   String
  society     society @relation(...)
  date                  DateTime
  location              String?
  agenda                String?
  type                  MeetingType       @default(REGULAR)

  attendance            societyAttendance[]

  createdAt             DateTime          @default(now())
}

model societyAttendance {
  id           String                    @id @default(uuid())
  meetingId    String
  meeting      societyMeeting  @relation(...)
  memberId     String
  member       societyMember   @relation(...)
  present      Boolean
  notes        String?

  @@unique([meetingId, memberId])
}

enum societyType {
  SOCIETY
  GUILD
  ASSOCIATION
  MINISTRY
  CONFRATERNITY
  OTHER
}

enum DuesFrequency {
  MONTHLY
  QUARTERLY
  ANNUALLY
}

enum MembershipStatus {
  PENDING
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum MeetingType {
  REGULAR
  SPECIAL
  EMERGENCY
  ANNUAL
}
```

### Files to Create/Modify

-   `app/dashboard/organizations/page.tsx` - List view
-   `app/dashboard/organizations/new/page.tsx` - Create form
-   `app/dashboard/organizations/[id]/page.tsx` - Details
-   `app/dashboard/organizations/[id]/members/page.tsx` - Members list
-   `app/dashboard/organizations/[id]/dues/page.tsx` - Dues tracking
-   `app/dashboard/organizations/[id]/meetings/page.tsx` - Meetings
-   `app/actions/pious-organization.actions.ts` - Server Actions
-   `components/forms/pious-organization-form.tsx` - Form component
-   `lib/validators/pious-organization.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication, role assignment)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-03**: Parishioner Management (member linking)
-   **EPIC-04**: Financial Management (dues as payment type)
-   **EPIC-11**: Integrations (email/SMS for announcements)

## Dependent Epics

-   None

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-07-001 | 5            |
| US-07-002 | 3            |
| US-07-003 | 3            |
| US-07-004 | 3            |
| US-07-005 | 2            |
| US-07-006 | 3            |
| US-07-007 | 5            |
| US-07-008 | 2            |
| US-07-009 | 2            |
| US-07-010 | 2            |
| US-07-011 | 3            |
| US-07-012 | 5            |
| US-07-013 | 5            |
| US-07-014 | 3            |
| US-07-015 | 5            |
| US-07-016 | 3            |
| US-07-017 | 3            |
| US-07-018 | 5            |
| US-07-019 | 3            |
| US-07-020 | 5            |
| US-07-021 | 5            |
| US-07-022 | 3            |
| US-07-023 | 3            |
| US-07-024 | 5            |
| US-07-025 | 3            |
| US-07-026 | 5            |
| US-07-027 | 3            |
| **Total** | **97**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
