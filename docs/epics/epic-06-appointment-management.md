# Epic 06: Appointment Management

**Epic ID:** EPIC-06
**Priority:** P1 (High)
**Status:** To Do
**PRD Reference:** Section 3.6

---

## Epic Overview

This epic covers the booking and management of appointments with parish priests, including confession scheduling, counseling sessions, baptism preparation meetings, and other pastoral appointments. Includes both staff-managed and self-service booking options.

---

## Features

### Feature 6.1: Appointment Types Configuration

### Feature 6.2: Appointment Booking

### Feature 6.3: Appointment Management

### Feature 6.4: Self-Service Booking

### Feature 6.5: Reminders and Notifications

---

## User Stories

### Feature 6.1: Appointment Types Configuration

#### US-06-001: Configure Appointment Types

**As a** Parish Admin
**I want to** configure different appointment types
**So that** parishioners can book appropriate meetings

**Acceptance Criteria:**

-   [ ] Create appointment types (Confession, Counseling, Baptism Prep, etc.)
-   [ ] Set duration for each type
-   [ ] Set availability (which days/times)
-   [ ] Set if self-service booking allowed
-   [ ] Enable/disable types
-   [ ] Set any associated fees

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-002: Set Priest Availability

**As a** Parish Admin
**I want to** configure priest availability for appointments
**So that** bookings only occur at valid times

**Acceptance Criteria:**

-   [ ] Define available days of week
-   [ ] Define time slots per day
-   [ ] Block specific dates (holidays, travel)
-   [ ] Set maximum appointments per day
-   [ ] Different availability per appointment type
-   [ ] Multiple priests support (if applicable)

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-002

---

#### US-06-003: Configure Confession Schedule

**As a** Parish Admin
**I want to** set up confession times
**So that** parishioners know when confessions are available

**Acceptance Criteria:**

-   [ ] Regular weekly confession times
-   [ ] Special confession times (holy days)
-   [ ] Walk-in vs appointment-only
-   [ ] Estimated duration per confession
-   [ ] Display on public page

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-001, FR-AP-005

---

### Feature 6.2: Appointment Booking

#### US-06-004: Book Confession Appointment

**As a** Parishioner
**I want to** schedule a confession time
**So that** I can receive the sacrament without long waits

**Acceptance Criteria:**

-   [ ] Select confession as appointment type
-   [ ] View available confession slots
-   [ ] Select preferred date and time
-   [ ] Enter name (optional for confession)
-   [ ] Enter contact information
-   [ ] Receive confirmation

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-005

---

#### US-06-005: Book Counseling Appointment

**As a** Parishioner
**I want to** schedule a counseling session with the priest
**So that** I can discuss personal or spiritual matters

**Acceptance Criteria:**

-   [ ] Select counseling as type
-   [ ] Provide brief reason for visit
-   [ ] Select preferred date/time
-   [ ] Enter full contact information
-   [ ] Notes field for additional info
-   [ ] Confirmation sent

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-006: Book Baptism Preparation Meeting

**As a** Parishioner (Parent)
**I want to** book a baptism preparation meeting
**So that** I can prepare for my child's baptism

**Acceptance Criteria:**

-   [ ] Select Baptism Prep as type
-   [ ] Enter parent(s) information
-   [ ] Enter child's name and DOB
-   [ ] Preferred baptism date (tentative)
-   [ ] Select preparation meeting date
-   [ ] Documentation requirements shown

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-007: Book Marriage Preparation Meeting

**As a** Parishioner (Couple)
**I want to** book marriage preparation appointments
**So that** we can complete pre-marriage requirements

**Acceptance Criteria:**

-   [ ] Select Marriage Prep as type
-   [ ] Enter both partners' information
-   [ ] Proposed wedding date
-   [ ] Select meeting date
-   [ ] Track multiple required sessions
-   [ ] Show documentation checklist

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-008: Book General Appointment

**As a** Parishioner
**I want to** book a general meeting with the priest
**So that** I can discuss parish matters or seek advice

**Acceptance Criteria:**

-   [ ] Select General Meeting type
-   [ ] Enter name and contact info
-   [ ] Brief description of purpose
-   [ ] Select date and time
-   [ ] Estimated duration
-   [ ] Confirmation provided

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

### Feature 6.3: Appointment Management

#### US-06-009: View Appointments List

**As a** Parish Secretary
**I want to** view all appointments
**So that** I can manage the priest's schedule

**Acceptance Criteria:**

-   [ ] List view with pagination
-   [ ] Columns: Date/Time, Type, Name, Status
-   [ ] Filter by appointment type
-   [ ] Filter by status (Scheduled, Completed, Cancelled)
-   [ ] Filter by date range
-   [ ] Search by name
-   [ ] Sort by date/time

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-010: View Daily Appointment Schedule

**As a** Parish Priest
**I want to** view today's appointments
**So that** I know my schedule for the day

**Acceptance Criteria:**

-   [ ] Today's appointments prominently displayed
-   [ ] Timeline view of the day
-   [ ] Appointment details at a glance
-   [ ] Next appointment highlighted
-   [ ] Quick navigation to tomorrow/yesterday

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-011: View Appointment Calendar

**As a** Parish Staff
**I want to** view appointments on a calendar
**So that** I can see the weekly/monthly schedule

**Acceptance Criteria:**

-   [ ] Weekly and monthly views
-   [ ] Appointments shown in time slots
-   [ ] Color coded by type
-   [ ] Click to view details
-   [ ] Navigate between weeks/months
-   [ ] Filter by appointment type

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-AP-001

---

#### US-06-012: View Appointment Details

**As a** Parish Secretary
**I want to** view complete appointment details
**So that** I have all necessary information

**Acceptance Criteria:**

-   [ ] Appointment type and date/time
-   [ ] Duration
-   [ ] Person's name and contact info
-   [ ] Purpose/notes
-   [ ] Status and history
-   [ ] Related records (if linked to parishioner)

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-AP-001

---

#### US-06-013: Edit Appointment

**As a** Parish Secretary
**I want to** edit appointment details
**So that** changes can be accommodated

**Acceptance Criteria:**

-   [ ] Reschedule to new date/time
-   [ ] Change appointment type
-   [ ] Update contact information
-   [ ] Add/edit notes
-   [ ] Notification sent if rescheduled
-   [ ] Audit log of changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

#### US-06-014: Cancel Appointment

**As a** Parish Secretary
**I want to** cancel appointments
**So that** cancelled bookings are tracked

**Acceptance Criteria:**

-   [ ] Cancel with confirmation
-   [ ] Reason for cancellation required
-   [ ] Option to reschedule instead
-   [ ] Notification to person
-   [ ] Slot becomes available again
-   [ ] Status changed to Cancelled

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

#### US-06-015: Mark Appointment as Complete

**As a** Parish Secretary
**I want to** mark appointments as completed
**So that** we track which occurred

**Acceptance Criteria:**

-   [ ] Mark as Completed
-   [ ] Record actual duration (optional)
-   [ ] Add notes from meeting
-   [ ] Differentiate from No-Show
-   [ ] Status visible in list

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-AP-001

---

#### US-06-016: Mark as No-Show

**As a** Parish Secretary
**I want to** mark when someone doesn't show up
**So that** no-shows are tracked

**Acceptance Criteria:**

-   [ ] No-Show status option
-   [ ] Record time waited
-   [ ] Pattern tracking (multiple no-shows)
-   [ ] Notes field
-   [ ] Consider for future bookings

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-AP-001

---

#### US-06-017: Create Appointment for Walk-In

**As a** Parish Secretary
**I want to** record walk-in appointments
**So that** all meetings are tracked

**Acceptance Criteria:**

-   [ ] Quick create form
-   [ ] Capture basic details
-   [ ] Assign type
-   [ ] Mark as in-progress or completed
-   [ ] Link to parishioner if known

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

### Feature 6.4: Self-Service Booking

#### US-06-018: Self-Service Appointment Booking

**As a** Parishioner
**I want to** book appointments online
**So that** I don't need to call or visit the office

**Acceptance Criteria:**

-   [ ] Public booking page
-   [ ] Select appointment type (allowed types only)
-   [ ] View available slots
-   [ ] Enter required information
-   [ ] Confirmation displayed
-   [ ] Email confirmation sent

**Priority:** P2
**Story Points:** 8
**PRD Ref:** FR-AP-003

---

#### US-06-019: Check Appointment Availability

**As a** Parishioner
**I want to** see available appointment slots
**So that** I can choose a convenient time

**Acceptance Criteria:**

-   [ ] Calendar view of available slots
-   [ ] Filtered by appointment type
-   [ ] Shows only future dates
-   [ ] Indicates remaining slots
-   [ ] Time zone consideration

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-AP-002

---

#### US-06-020: Cancel My Appointment

**As a** Parishioner
**I want to** cancel my own appointment
**So that** the slot becomes available for others

**Acceptance Criteria:**

-   [ ] Cancel via confirmation email link
-   [ ] Cancellation reason (optional)
-   [ ] Minimum notice requirement (configurable)
-   [ ] Confirmation of cancellation
-   [ ] Slot becomes available

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

#### US-06-021: Reschedule My Appointment

**As a** Parishioner
**I want to** reschedule my appointment
**So that** I can change to a better time

**Acceptance Criteria:**

-   [ ] Reschedule via email link
-   [ ] View available alternative slots
-   [ ] Select new date/time
-   [ ] Confirmation sent
-   [ ] Original slot released

**Priority:** P3
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

### Feature 6.5: Reminders and Notifications

#### US-06-022: Send Appointment Confirmation

**As a** System
**I want to** send confirmation when appointment is booked
**So that** the person has record of their booking

**Acceptance Criteria:**

-   [ ] Email sent immediately on booking
-   [ ] Includes date, time, location
-   [ ] Includes appointment type
-   [ ] Includes cancellation link
-   [ ] Includes parish contact info
-   [ ] SMS option (if enabled)

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-AP-004

---

#### US-06-023: Send Appointment Reminder

**As a** System
**I want to** send reminders before appointments
**So that** people don't forget

**Acceptance Criteria:**

-   [ ] Reminder 24 hours before (configurable)
-   [ ] Reminder same-day morning (optional)
-   [ ] Via email and/or SMS
-   [ ] Includes reschedule/cancel option
-   [ ] Configurable per appointment type

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-AP-004

---

#### US-06-024: Notify on Cancellation

**As a** System
**I want to** notify when appointments are cancelled
**So that** everyone is informed

**Acceptance Criteria:**

-   [ ] Notification to person who booked
-   [ ] Notification to parish office (optional)
-   [ ] Includes reason if provided
-   [ ] Includes option to rebook
-   [ ] Via email and/or SMS

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-AP-004

---

#### US-06-025: View My Appointments (Logged In)

**As a** logged-in Parishioner
**I want to** view my upcoming appointments
**So that** I can track my scheduled meetings

**Acceptance Criteria:**

-   [ ] List of my appointments
-   [ ] Status of each
-   [ ] Upcoming appointments highlighted
-   [ ] Past appointments visible
-   [ ] Options to cancel/reschedule

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-AP-001

---

## Technical Notes

### Appointment Types (Configurable)

-   Confession
-   Counseling/Spiritual Direction
-   Baptism Preparation
-   Marriage Preparation
-   First Communion Preparation
-   Confirmation Preparation
-   Anointing of the Sick
-   General Meeting
-   House Blessing

### Appointment Status Flow

```
SCHEDULED → CONFIRMED → COMPLETED
    ↓           ↓
CANCELLED   NO_SHOW
```

### Feature Toggle Integration

-   Check `enableAppointments` before all operations
-   Check `enableConfessionBooking` for confession-specific features
-   Check `enableSMSNotifications` for SMS reminders
-   Check `enableEmailNotifications` for email reminders

### Database Schema

```prisma
model Appointment {
  id              String            @id @default(uuid())
  type            AppointmentType
  date            DateTime
  duration        Int               // minutes
  status          AppointmentStatus @default(SCHEDULED)

  // Person details
  personName      String
  personEmail     String?
  personPhone     String?
  purpose         String?           // Brief description
  notes           String?

  // Relations
  parishionerId   String?
  parishioner     Parishioner?      @relation(...)

  organizationId  String
  organization    Organization      @relation(...)

  completedAt     DateTime?
  completionNotes String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model AppointmentSlot {
  id              String       @id @default(uuid())
  dayOfWeek       Int          // 0-6 (Sunday-Saturday)
  startTime       String       // "09:00"
  endTime         String       // "09:30"
  appointmentType String?      // null = all types
  isActive        Boolean      @default(true)

  organizationId  String
  organization    Organization @relation(...)
}

model BlockedDate {
  id              String       @id @default(uuid())
  date            DateTime
  reason          String?

  organizationId  String
  organization    Organization @relation(...)
}

enum AppointmentType {
  CONFESSION
  COUNSELING
  BAPTISM_PREP
  MARRIAGE_PREP
  FIRST_COMMUNION_PREP
  CONFIRMATION_PREP
  ANOINTING
  GENERAL_MEETING
  HOUSE_BLESSING
  OTHER
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### Files to Create/Modify

-   `app/dashboard/appointments/page.tsx` - List view
-   `app/dashboard/appointments/new/page.tsx` - Create form
-   `app/dashboard/appointments/[id]/page.tsx` - Details
-   `app/dashboard/appointments/calendar/page.tsx` - Calendar view
-   `app/dashboard/appointments/settings/page.tsx` - Configuration
-   `app/appointments/page.tsx` - Public booking
-   `app/actions/appointment.actions.ts` - Server Actions
-   `components/forms/appointment-form.tsx` - Form component
-   `lib/validators/appointment.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-03**: Parishioner Management (parishioner linking)
-   **EPIC-11**: Integrations (email/SMS notifications)

## Dependent Epics

-   None

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-06-001 | 5            |
| US-06-002 | 5            |
| US-06-003 | 3            |
| US-06-004 | 5            |
| US-06-005 | 5            |
| US-06-006 | 5            |
| US-06-007 | 5            |
| US-06-008 | 3            |
| US-06-009 | 5            |
| US-06-010 | 5            |
| US-06-011 | 5            |
| US-06-012 | 2            |
| US-06-013 | 3            |
| US-06-014 | 3            |
| US-06-015 | 2            |
| US-06-016 | 2            |
| US-06-017 | 3            |
| US-06-018 | 8            |
| US-06-019 | 5            |
| US-06-020 | 3            |
| US-06-021 | 3            |
| US-06-022 | 3            |
| US-06-023 | 5            |
| US-06-024 | 2            |
| US-06-025 | 3            |
| **Total** | **98**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
