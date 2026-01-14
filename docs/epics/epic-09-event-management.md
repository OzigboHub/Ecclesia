# Epic 09: Event Management

**Epic ID:** EPIC-09
**Priority:** P2 (Medium)
**Status:** To Do
**PRD Reference:** Section 3.9

---

## Epic Overview

This epic covers the management of parish events, including masses, feast days, special celebrations, retreats, and community gatherings. Includes event scheduling, recurring event patterns, RSVP management, and calendar integration.

---

## Features

### Feature 9.1: Event Types and Configuration

### Feature 9.2: Event Creation and Scheduling

### Feature 9.3: Event Management

### Feature 9.4: Public Event Calendar

### Feature 9.5: RSVP and Registration

---

## User Stories

### Feature 9.1: Event Types and Configuration

#### US-09-001: Configure Event Types

**As a** Parish Admin
**I want to** configure event categories/types
**So that** events are organized properly

**Acceptance Criteria:**

-   [ ] Create event types (Mass, Feast Day, Retreat, etc.)
-   [ ] Set color for calendar display
-   [ ] Set default duration
-   [ ] Enable/disable types
-   [ ] Set if RSVP required by default

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-001

---

#### US-09-002: Configure Mass Schedule Template

**As a** Parish Admin
**I want to** set up regular mass schedule
**So that** masses auto-populate in calendar

**Acceptance Criteria:**

-   [ ] Set daily mass times
-   [ ] Set Sunday mass times (multiple)
-   [ ] Set Saturday vigil time
-   [ ] Set holy day mass times
-   [ ] Different schedules per location (church/outstation)

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-EV-001

---

#### US-09-003: Configure Parish Locations

**As a** Parish Admin
**I want to** set up parish locations
**So that** events can be assigned to venues

**Acceptance Criteria:**

-   [ ] Add locations (Main Church, Chapel, Hall, etc.)
-   [ ] Location address
-   [ ] Capacity (optional)
-   [ ] Set as default location
-   [ ] Active/inactive status

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-001

---

### Feature 9.2: Event Creation and Scheduling

#### US-09-004: Create One-Time Event

**As a** Parish Secretary
**I want to** create individual events
**So that** special occasions are scheduled

**Acceptance Criteria:**

-   [ ] Enter event title
-   [ ] Select event type
-   [ ] Set date and time
-   [ ] Set end time or duration
-   [ ] Select location
-   [ ] Add description
-   [ ] Set visibility (public/private)

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-005: Create Recurring Event

**As a** Parish Secretary
**I want to** create recurring events
**So that** regular activities auto-schedule

**Acceptance Criteria:**

-   [ ] Select recurrence pattern (daily, weekly, monthly)
-   [ ] Select days of week
-   [ ] Set recurrence end date or count
-   [ ] Generate individual event instances
-   [ ] Edit single instance or entire series

**Priority:** P1
**Story Points:** 8
**PRD Ref:** FR-EV-002

---

#### US-09-006: Schedule Feast Day Events

**As a** Parish Secretary
**I want to** add feast day celebrations
**So that** the liturgical calendar is observed

**Acceptance Criteria:**

-   [ ] Pre-loaded feast day database
-   [ ] Add local feast days
-   [ ] Set special mass times
-   [ ] Add celebration details
-   [ ] Mark as holy day of obligation

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-007: Schedule Sacramental Events

**As a** Parish Secretary
**I want to** schedule sacramental ceremonies
**So that** baptisms, weddings, etc. are organized

**Acceptance Criteria:**

-   [ ] Baptism ceremonies
-   [ ] First Communion ceremonies
-   [ ] Confirmation ceremonies
-   [ ] Wedding ceremonies
-   [ ] Link to specific parishioners
-   [ ] Assign celebrant

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-008: Schedule Retreat or Workshop

**As a** Parish Secretary
**I want to** schedule retreats and workshops
**So that** formation events are managed

**Acceptance Criteria:**

-   [ ] Multi-day event support
-   [ ] Session schedule within event
-   [ ] Registration capacity
-   [ ] Fee configuration
-   [ ] Resource/material list
-   [ ] Facilitator assignment

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-009: Duplicate Event

**As a** Parish Secretary
**I want to** duplicate an existing event
**So that** similar events are created quickly

**Acceptance Criteria:**

-   [ ] Copy all event details
-   [ ] Change date to new date
-   [ ] Modify details as needed
-   [ ] Preserves original event

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-EV-002

---

### Feature 9.3: Event Management

#### US-09-010: View Events List

**As a** Parish Staff
**I want to** view all events
**So that** I can manage the schedule

**Acceptance Criteria:**

-   [ ] Paginated list of events
-   [ ] Shows title, date, type, status
-   [ ] Filter by event type
-   [ ] Filter by date range
-   [ ] Filter by status
-   [ ] Search by title
-   [ ] Sort by date

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-001

---

#### US-09-011: View Event Details

**As a** Parish Staff
**I want to** view complete event details
**So that** I have all information

**Acceptance Criteria:**

-   [ ] Event title, type, and description
-   [ ] Date, time, duration
-   [ ] Location
-   [ ] RSVP count (if applicable)
-   [ ] Linked mass intentions
-   [ ] Assigned celebrant/minister
-   [ ] Notes and history

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-001

---

#### US-09-012: Edit Event

**As a** Parish Secretary
**I want to** edit event details
**So that** changes are reflected

**Acceptance Criteria:**

-   [ ] Edit all event fields
-   [ ] For recurring: edit single or series
-   [ ] Notify RSVPs of changes (optional)
-   [ ] Audit log of changes

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-013: Cancel Event

**As a** Parish Secretary
**I want to** cancel events
**So that** attendees are informed

**Acceptance Criteria:**

-   [ ] Cancel with confirmation
-   [ ] Cancellation reason
-   [ ] Notify RSVPs
-   [ ] Event marked cancelled (not deleted)
-   [ ] Frees up calendar slot

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-002

---

#### US-09-014: Assign Celebrant/Minister to Event

**As a** Parish Secretary
**I want to** assign celebrants to masses
**So that** clergy schedules are managed

**Acceptance Criteria:**

-   [ ] Select from available priests
-   [ ] Set primary celebrant
-   [ ] Add concelebrants (optional)
-   [ ] Assign other ministers (readers, servers)
-   [ ] Prevent double-booking

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-EV-002

---

#### US-09-015: Attach Documents to Event

**As a** Parish Secretary
**I want to** attach files to events
**So that** related documents are accessible

**Acceptance Criteria:**

-   [ ] Upload documents (PDF, DOC, etc.)
-   [ ] Add flyers/posters (images)
-   [ ] Add links
-   [ ] Download/view attachments
-   [ ] Delete attachments

**Priority:** P3
**Story Points:** 3
**PRD Ref:** FR-EV-002

---

### Feature 9.4: Public Event Calendar

#### US-09-016: View Public Event Calendar

**As a** Parishioner
**I want to** view the parish calendar
**So that** I know upcoming events

**Acceptance Criteria:**

-   [ ] Monthly calendar view
-   [ ] Weekly view option
-   [ ] Events displayed on dates
-   [ ] Color-coded by type
-   [ ] Click for event details
-   [ ] Navigate between months

**Priority:** P0
**Story Points:** 8
**PRD Ref:** FR-EV-003

---

#### US-09-017: View Event Details (Public)

**As a** Parishioner
**I want to** see event details
**So that** I have necessary information

**Acceptance Criteria:**

-   [ ] Event title and type
-   [ ] Date, time, duration
-   [ ] Location with map/directions
-   [ ] Description
-   [ ] RSVP button (if applicable)
-   [ ] Add to personal calendar option

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-003

---

#### US-09-018: Filter Calendar by Event Type

**As a** Parishioner
**I want to** filter the calendar
**So that** I see only relevant events

**Acceptance Criteria:**

-   [ ] Checkboxes for event types
-   [ ] Show/hide masses
-   [ ] Show/hide community events
-   [ ] Filter persists during navigation
-   [ ] Clear filters option

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-EV-003

---

#### US-09-019: Subscribe to Calendar Feed

**As a** Parishioner
**I want to** subscribe to the parish calendar
**So that** events appear in my personal calendar

**Acceptance Criteria:**

-   [ ] iCal/ICS feed URL
-   [ ] Google Calendar subscribe link
-   [ ] Apple Calendar subscribe link
-   [ ] Filter by event type (optional)
-   [ ] Auto-updates

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-EV-003

---

#### US-09-020: Add Event to Personal Calendar

**As a** Parishioner
**I want to** add specific events to my calendar
**So that** I'm reminded of them

**Acceptance Criteria:**

-   [ ] "Add to Calendar" button
-   [ ] Options: Google, Apple, Outlook
-   [ ] Download .ics file option
-   [ ] Includes all event details

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-EV-003

---

### Feature 9.5: RSVP and Registration

#### US-09-021: Enable RSVP for Event

**As a** Parish Secretary
**I want to** enable RSVP for events
**So that** we can plan for attendance

**Acceptance Criteria:**

-   [ ] Toggle RSVP on/off per event
-   [ ] Set RSVP deadline
-   [ ] Set capacity limit (optional)
-   [ ] Waitlist when full (optional)
-   [ ] Custom RSVP questions

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-004

---

#### US-09-022: RSVP to Event

**As a** Parishioner
**I want to** RSVP to events
**So that** organizers know I'm attending

**Acceptance Criteria:**

-   [ ] RSVP button on event page
-   [ ] Enter name, email, phone
-   [ ] Number attending (party size)
-   [ ] Answer custom questions
-   [ ] Confirmation displayed and emailed

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-EV-004

---

#### US-09-023: View RSVP List

**As a** Parish Secretary
**I want to** see who's attending events
**So that** we can prepare appropriately

**Acceptance Criteria:**

-   [ ] List of RSVPs per event
-   [ ] Total count and party size total
-   [ ] Contact information
-   [ ] Export to CSV
-   [ ] Print attendance list

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-EV-004

---

#### US-09-024: Cancel My RSVP

**As a** Parishioner
**I want to** cancel my RSVP
**So that** the spot is available for others

**Acceptance Criteria:**

-   [ ] Cancel via email link
-   [ ] Cancel from dashboard (if logged in)
-   [ ] Confirmation of cancellation
-   [ ] Spot released (or waitlist moved up)

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-EV-004

---

#### US-09-025: Send Reminder to RSVPs

**As a** Parish Secretary
**I want to** send reminders to attendees
**So that** they don't forget

**Acceptance Criteria:**

-   [ ] Select event
-   [ ] Compose reminder message
-   [ ] Send via email (and/or SMS)
-   [ ] Track who received
-   [ ] Schedule reminder (optional)

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-EV-004

---

#### US-09-026: Record Actual Attendance

**As a** Parish Secretary
**I want to** record who actually attended
**So that** we have accurate records

**Acceptance Criteria:**

-   [ ] Check off from RSVP list
-   [ ] Add walk-ins
-   [ ] Record no-shows
-   [ ] Total attendance count
-   [ ] Attendance vs RSVP comparison

**Priority:** P3
**Story Points:** 5
**PRD Ref:** FR-EV-004

---

## Technical Notes

### Event Types

-   **Liturgical**: Mass, Adoration, Confession, Holy Hour
-   **Sacramental**: Baptism, First Communion, Confirmation, Wedding
-   **Community**: Meeting, Social, Fundraiser, Retreat, Workshop
-   **Special**: Feast Day, Holy Day, Parish Anniversary, Bishop Visit

### Event Status

```
DRAFT → PUBLISHED → (CANCELLED)
                ↓
            COMPLETED
```

### Feature Toggle Integration

-   Check `enableEventManagement` before all operations
-   This feature is enabled by default

### Calendar Integration

-   iCalendar (RFC 5545) format for feeds
-   Google Calendar API for deep integration
-   Support for .ics file generation

### Database Schema

```prisma
model Event {
  id              String        @id @default(uuid())
  title           String
  type            EventType
  description     String?

  // Schedule
  startTime       DateTime
  endTime         DateTime
  isAllDay        Boolean       @default(false)

  // Location
  locationId      String?
  location        Location?     @relation(...)
  locationName    String?       // Override or custom

  // Recurrence
  isRecurring     Boolean       @default(false)
  recurrenceRule  String?       // RRULE format
  parentEventId   String?       // For recurring instances
  parentEvent     Event?        @relation("RecurringSeries", ...)
  instances       Event[]       @relation("RecurringSeries")

  // RSVP
  rsvpEnabled     Boolean       @default(false)
  rsvpDeadline    DateTime?
  capacity        Int?

  // Status
  status          EventStatus   @default(PUBLISHED)
  visibility      Visibility    @default(PUBLIC)

  // Relations
  organizationId  String
  organization    Organization  @relation(...)
  celebrantId     String?
  celebrant       User?         @relation(...)

  massIntentions  MassIntention[]
  liveStream      LiveStream?
  rsvps           EventRsvp[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Location {
  id              String        @id @default(uuid())
  name            String
  address         String?
  capacity        Int?
  isDefault       Boolean       @default(false)
  isActive        Boolean       @default(true)

  organizationId  String
  organization    Organization  @relation(...)

  events          Event[]
}

model EventRsvp {
  id              String        @id @default(uuid())
  eventId         String
  event           Event         @relation(...)

  name            String
  email           String
  phone           String?
  partySize       Int           @default(1)
  responses       Json?         // Custom question responses
  attended        Boolean?

  parishionerId   String?
  parishioner     Parishioner?  @relation(...)

  createdAt       DateTime      @default(now())
  cancelledAt     DateTime?
}

enum EventType {
  MASS
  ADORATION
  CONFESSION
  HOLY_HOUR
  BAPTISM
  FIRST_COMMUNION
  CONFIRMATION
  WEDDING
  FUNERAL
  FEAST_DAY
  MEETING
  SOCIAL
  FUNDRAISER
  RETREAT
  WORKSHOP
  OTHER
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

enum Visibility {
  PUBLIC
  PRIVATE
  MEMBERS_ONLY
}
```

### Files to Create/Modify

-   `app/dashboard/events/page.tsx` - List view
-   `app/dashboard/events/new/page.tsx` - Create form
-   `app/dashboard/events/[id]/page.tsx` - Details
-   `app/dashboard/events/[id]/rsvps/page.tsx` - RSVP management
-   `app/dashboard/events/calendar/page.tsx` - Admin calendar
-   `app/calendar/page.tsx` - Public calendar
-   `app/events/[id]/page.tsx` - Public event details
-   `app/api/calendar/feed/route.ts` - iCal feed
-   `app/actions/event.actions.ts` - Server Actions
-   `components/features/events/event-calendar.tsx` - Calendar component
-   `lib/validators/event.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-05**: Mass Intention Management (linking intentions to masses)
-   **EPIC-08**: Live Streaming (linking streams to events)
-   **EPIC-11**: Integrations (email notifications for RSVPs)

## Dependent Epics

-   None

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-09-001 | 3            |
| US-09-002 | 5            |
| US-09-003 | 3            |
| US-09-004 | 5            |
| US-09-005 | 8            |
| US-09-006 | 5            |
| US-09-007 | 5            |
| US-09-008 | 5            |
| US-09-009 | 2            |
| US-09-010 | 5            |
| US-09-011 | 3            |
| US-09-012 | 5            |
| US-09-013 | 3            |
| US-09-014 | 5            |
| US-09-015 | 3            |
| US-09-016 | 8            |
| US-09-017 | 3            |
| US-09-018 | 3            |
| US-09-019 | 5            |
| US-09-020 | 3            |
| US-09-021 | 5            |
| US-09-022 | 5            |
| US-09-023 | 3            |
| US-09-024 | 2            |
| US-09-025 | 3            |
| US-09-026 | 5            |
| **Total** | **110**      |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
