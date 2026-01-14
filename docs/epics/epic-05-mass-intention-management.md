# Epic 05: Mass Intention Management

**Epic ID:** EPIC-05
**Priority:** P1 (High)
**Status:** To Do
**PRD Reference:** Section 3.5

---

## Epic Overview

This epic covers the booking and management of mass intentions, including thanksgiving, requiem (for the deceased), and special intentions. Mass intentions are linked to specific masses/events and include stipend payment tracking.

---

## Features

### Feature 5.1: Mass Intention Booking

### Feature 5.2: Mass Intention Management

### Feature 5.3: Self-Service Portal

---

## User Stories

### Feature 5.1: Mass Intention Booking

#### US-05-001: Book Thanksgiving Mass Intention

**As a** Parishioner
**I want to** book a thanksgiving mass intention
**So that** I can offer thanks through the Holy Mass

**Acceptance Criteria:**

-   [ ] Select intention type: Thanksgiving
-   [ ] Enter intention details (what you're thankful for)
-   [ ] Enter requester name, email, phone
-   [ ] Select preferred mass date
-   [ ] View suggested stipend amount
-   [ ] Confirm booking
-   [ ] Receive confirmation notification

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-MI-001, FR-MI-002, FR-MI-003

---

#### US-05-002: Book Requiem Mass Intention

**As a** Parishioner
**I want to** book a requiem mass for a deceased person
**So that** I can pray for their eternal rest

**Acceptance Criteria:**

-   [ ] Select intention type: Requiem
-   [ ] Enter deceased person's name
-   [ ] Enter relationship to deceased
-   [ ] Enter date of death (optional)
-   [ ] Select preferred mass date
-   [ ] Enter requester contact information
-   [ ] View suggested stipend amount

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-MI-001, FR-MI-002

---

#### US-05-003: Book Special Intention Mass

**As a** Parishioner
**I want to** book a mass for a special intention
**So that** specific prayer needs are offered at Mass

**Acceptance Criteria:**

-   [ ] Select intention type: Special Intention
-   [ ] Enter intention description
-   [ ] Intention can be private (not announced)
-   [ ] Select preferred mass date
-   [ ] Enter requester contact information
-   [ ] View suggested stipend amount

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-001, FR-MI-002

---

#### US-05-004: Select Mass Date for Intention

**As a** Parishioner
**I want to** select a specific date for my mass intention
**So that** I can attend the mass if desired

**Acceptance Criteria:**

-   [ ] Date picker for future dates
-   [ ] Show available mass times
-   [ ] Show if slots available (if limited)
-   [ ] Highlight Sundays and holy days
-   [ ] Cannot book past dates
-   [ ] Minimum advance notice (e.g., 2 days)

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-003

---

#### US-05-005: Record Stipend Amount

**As a** Parish Secretary
**I want to** record the stipend amount for mass intentions
**So that** financial records are accurate

**Acceptance Criteria:**

-   [ ] Suggested stipend amount displayed
-   [ ] Custom amount can be entered
-   [ ] Minimum stipend amount configurable
-   [ ] Amount stored with intention record
-   [ ] Payment can be linked to intention

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-004

---

#### US-05-006: Link Mass Intention to Event/Mass

**As a** Parish Secretary
**I want to** assign intentions to specific masses
**So that** the priest knows which intentions to offer

**Acceptance Criteria:**

-   [ ] Select from scheduled masses/events
-   [ ] Multiple intentions per mass allowed
-   [ ] Maximum intentions per mass configurable
-   [ ] View intentions for specific mass
-   [ ] Mass schedule integration

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-MI-005

---

#### US-05-007: Link Payment to Mass Intention

**As a** Parish Secretary
**I want to** link payments to mass intentions
**So that** stipend payments are tracked

**Acceptance Criteria:**

-   [ ] Create payment with purpose "Mass Intention"
-   [ ] Link to specific intention record
-   [ ] Payment amount matches stipend
-   [ ] Intention marked as paid
-   [ ] View payment from intention details

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-006

---

### Feature 5.2: Mass Intention Management

#### US-05-008: View Mass Intentions List

**As a** Parish Staff
**I want to** view all mass intentions
**So that** I can manage and track them

**Acceptance Criteria:**

-   [ ] Paginated list of intentions
-   [ ] Columns: Date, Type, Intention, Requester, Status
-   [ ] Filter by type (Thanksgiving, Requiem, Special)
-   [ ] Filter by status (Pending, Scheduled, Offered)
-   [ ] Filter by date range
-   [ ] Sort by date
-   [ ] Search by requester name or intention

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-MI-001

---

#### US-05-009: View Mass Intention Details

**As a** Parish Staff
**I want to** view complete intention details
**So that** I have all information needed

**Acceptance Criteria:**

-   [ ] Intention type and details
-   [ ] Requester contact information
-   [ ] Requested date and assigned mass
-   [ ] Stipend amount and payment status
-   [ ] Notes field
-   [ ] Status and history

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-MI-001

---

#### US-05-010: Edit Mass Intention

**As a** Parish Secretary
**I want to** edit mass intention details
**So that** errors can be corrected

**Acceptance Criteria:**

-   [ ] Edit intention details
-   [ ] Change requested date
-   [ ] Update requester info
-   [ ] Assign/change mass
-   [ ] Add notes
-   [ ] Audit log captures changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-001

---

#### US-05-011: Cancel Mass Intention

**As a** Parish Secretary
**I want to** cancel a mass intention
**So that** cancelled bookings are tracked

**Acceptance Criteria:**

-   [ ] Cancel button with confirmation
-   [ ] Reason for cancellation required
-   [ ] Refund handling for paid intentions
-   [ ] Status changed to Cancelled
-   [ ] Audit log captures cancellation
-   [ ] Notification to requester (optional)

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-MI-001

---

#### US-05-012: Mark Intention as Offered

**As a** Parish Secretary
**I want to** mark intentions as offered
**So that** we know which have been fulfilled

**Acceptance Criteria:**

-   [ ] Change status to "Offered"
-   [ ] Record date offered
-   [ ] Can add notes (which mass, etc.)
-   [ ] Bulk mark multiple intentions
-   [ ] Status visible in list

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-MI-001

---

#### US-05-013: View Intentions by Mass Date

**As a** Parish Priest
**I want to** see intentions scheduled for a specific date
**So that** I know which intentions to offer

**Acceptance Criteria:**

-   [ ] Calendar view option
-   [ ] Date picker to select date
-   [ ] List of all intentions for that date
-   [ ] Grouped by mass time if multiple
-   [ ] Print-friendly list for altar

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-MI-005

---

#### US-05-014: Record Mass Intention by Staff

**As a** Parish Secretary
**I want to** record intentions on behalf of parishioners
**So that** in-person requests are captured

**Acceptance Criteria:**

-   [ ] Full form access for staff
-   [ ] Can link to existing parishioner
-   [ ] Can enter non-parishioner details
-   [ ] Mark payment status (paid cash, pending, etc.)
-   [ ] Same validation as self-service

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-MI-001, FR-MI-002

---

### Feature 5.3: Self-Service Portal

#### US-05-015: Parishioner Self-Service Booking

**As a** Parishioner
**I want to** book mass intentions online
**So that** I don't need to visit the parish office

**Acceptance Criteria:**

-   [ ] Public-facing booking form
-   [ ] No login required for booking
-   [ ] All intention types available
-   [ ] Date selection
-   [ ] Contact information capture
-   [ ] Clear stipend expectations
-   [ ] Confirmation displayed

**Priority:** P2
**Story Points:** 8
**PRD Ref:** FR-MI-007

---

#### US-05-016: Booking Confirmation Notification

**As a** Parishioner
**I want to** receive confirmation of my booking
**So that** I know my request was received

**Acceptance Criteria:**

-   [ ] Email confirmation sent
-   [ ] Includes intention details
-   [ ] Includes requested date
-   [ ] Includes stipend information
-   [ ] Includes parish contact for questions
-   [ ] SMS confirmation (if enabled)

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-MI-008

---

#### US-05-017: View My Mass Intentions (Logged In)

**As a** logged-in Parishioner
**I want to** view my submitted mass intentions
**So that** I can track their status

**Acceptance Criteria:**

-   [ ] List of my intentions
-   [ ] Status of each (Pending, Scheduled, Offered)
-   [ ] Date and details
-   [ ] Payment status
-   [ ] Option to request another

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-MI-001

---

#### US-05-018: Mass Intention Calendar View

**As a** Parish Staff
**I want to** view intentions on a calendar
**So that** I can see the schedule visually

**Acceptance Criteria:**

-   [ ] Monthly calendar view
-   [ ] Intentions shown on dates
-   [ ] Color coded by type
-   [ ] Click date to see details
-   [ ] Navigate months
-   [ ] Filter by intention type

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-MI-003

---

## Technical Notes

### Intention Types

-   **Thanksgiving**: Gratitude for blessings received
-   **Requiem**: For deceased persons
-   **Special Intention**: Personal requests (healing, guidance, etc.)

### Intention Status Flow

```
PENDING → SCHEDULED → OFFERED
              ↓
          CANCELLED
```

### Feature Toggle Integration

-   Check `enableMassIntentions` before all operations
-   Feature depends on `enableFinancialManagement` for payment linking

### Database Schema

```prisma
model MassIntention {
  id             String             @id @default(uuid())
  type           MassIntentionType
  intentionFor   String             // What/who the intention is for
  description    String?            // Additional details
  isPrivate      Boolean            @default(false)
  requestedDate  DateTime
  status         MassIntentionStatus @default(PENDING)

  // Requester info
  requesterName  String
  requesterEmail String?
  requesterPhone String?

  // Stipend
  stipendAmount  Decimal?           @db.Decimal(10, 2)

  // Relations
  parishionerId  String?
  parishioner    Parishioner?       @relation(...)
  paymentId      String?
  payment        Payment?           @relation(...)
  eventId        String?
  event          Event?             @relation(...)

  organizationId String
  organization   Organization       @relation(...)

  offeredDate    DateTime?
  notes          String?

  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

enum MassIntentionType {
  THANKSGIVING
  REQUIEM
  SPECIAL_INTENTION
}

enum MassIntentionStatus {
  PENDING
  SCHEDULED
  OFFERED
  CANCELLED
}
```

### Files to Create/Modify

-   `app/dashboard/mass-intentions/page.tsx` - List view
-   `app/dashboard/mass-intentions/new/page.tsx` - Create form
-   `app/dashboard/mass-intentions/[id]/page.tsx` - Details
-   `app/dashboard/mass-intentions/calendar/page.tsx` - Calendar view
-   `app/mass-intentions/page.tsx` - Public booking form
-   `app/actions/mass-intention.actions.ts` - Server Actions
-   `components/forms/mass-intention-form.tsx` - Form component
-   `lib/validators/mass-intention.schema.ts` - Zod schemas

---

## Dependencies

-   **EPIC-01**: User Management (authentication)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-03**: Parishioner Management (parishioner linking)
-   **EPIC-04**: Financial Management (payment linking)

## Dependent Epics

-   **EPIC-09**: Event Management (mass/event linking)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-05-001 | 5            |
| US-05-002 | 5            |
| US-05-003 | 3            |
| US-05-004 | 3            |
| US-05-005 | 3            |
| US-05-006 | 5            |
| US-05-007 | 3            |
| US-05-008 | 5            |
| US-05-009 | 2            |
| US-05-010 | 3            |
| US-05-011 | 3            |
| US-05-012 | 2            |
| US-05-013 | 5            |
| US-05-014 | 5            |
| US-05-015 | 8            |
| US-05-016 | 3            |
| US-05-017 | 3            |
| US-05-018 | 5            |
| **Total** | **71**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
