# Ecclesia Digital Parish Manager (DPM) — Features & Test Cases Specification

**Document Version:** 1.0  
**Project:** Ecclesia Digital Parish Manager  
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL (Neon), NextAuth v5 (Auth.js), Tailwind CSS v4, shadcn/ui, Paystack API, Resend, Web Push.

---

## 1. System Architecture & High-Level Overview

Ecclesia is a full-featured Catholic parish management platform and community portal supporting multi-tenant hierarchy (Parish & Outstation), fine-grained Role-Based Access Control (RBAC), modular feature toggling, secure authentication with step-up security (2FA/Passkeys/Reauth gates), sacramental records, online/offline financial tracking with Paystack, automated mass schedules & intentions, priest appointments, pious societies, and interactive public/feed experiences.

---

## 2. Comprehensive Feature Matrix

### 2.1 Multi-Tenant Organization & Hierarchy Management
- **Hierarchical Scoping:** Supports two-tier hierarchy: Parent Parish -> Child Outstations.
- **Tenant Isolation:** All data access (parishioners, finances, masses, appointments) is strictly scoped by organizationId.
- **Inheritance & Aggregation:** Parish Admins can view aggregated data across outstations; Outstation Admins are restricted to their outstation scope.
- **Per-Organization Settings:** Configurable mass generation rules, appointment windows, and bank payout details for subaccounts.

### 2.2 Role-Based Access Control (RBAC) & Security Ladder
- **8 Distinct Roles:** SUPER_ADMIN, DIOCESE_ADMIN, DEANERY_ADMIN, PARISH_ADMIN, PARISH_SECRETARY, PARISH_STAFF, SOCIETY_PRESIDENT, PARISHIONER.
- **Step-Up Authentication & Security Ladder:**
  - Password & Email Auth.
  - Parishioner Fast-Track / Access Code Login.
  - TOTP Two-Factor Authentication (2FA) with recovery codes.
  - WebAuthn / Passkeys.
  - Sensitive Action Re-Authentication Gates (e.g., bank payout edits, password resets, role promotions).
  - Session Policy Enforcement (24-hour inactivity timeout, active session revocation, multi-device management).
  - Parish Gate Code (optional shared PIN gate for private parish feeds).

### 2.3 Feature Toggle Management (OrganizationFeatureSettings)
Parishes can toggle capabilities independently:
- **Core:** Parishioner Management, Sacramental Records, Financial Management.
- **Financial:** Tithes, Offerings, Donation Campaigns, Custom Donation Types, Monthly Tracking, Online Payments (Paystack), Recurring Donations.
- **Spiritual & Liturgical:** Mass Intentions, Priest Appointments, Confession Booking.
- **Community & Media:** Live Streaming, Announcements, SMS / Email Notifications, Societies, Event Management, Public Website, Gate Code Requirement.

### 2.4 Parishioner Registry & Sacramental Tracking
- **Parishioner Records:** CRUD operations for parishioners, contact info, outstation affiliation, occupational data, and family groupings.
- **Batch CSV Import:** Bulk onboarding of parishioners with data validation and error handling.
- **Sacramental Logbooks:**
  - **Baptism:** Date, minister, godparents, certificate number, registry folio/page references.
  - **First Holy Communion & Confirmation:** Date, presiding bishop/priest, sponsor.
  - **Marriage:** Spouses, witnesses, officiating minister, pre-cana status.
  - **Holy Orders:** Ordination tracking.
- **Sacrament Certificate Generation:** Printable and downloadable PDF certificates.

### 2.5 Liturgical Mass Management & Mass Intentions
- **Mass Schedule Templates:** Recurring weekly/daily templates (e.g., 6:30 AM Daily Mass, 8:00 AM Sunday High Mass).
- **Automated Mass Generation:** Automatic generation of masses up to N days in advance (configurable 30–90 days).
- **Mass Intentions Booking:**
  - Public and member booking of Mass Intentions (Thanksgiving, Repose of the Soul, Special Intentions).
  - Stipend payment handling (online via Paystack or recorded as manual/cash).
  - Daily/Weekly intention quotas per Mass to avoid liturgical overcrowding.
  - Intention list export for priests/bulletin printing.

### 2.6 Financial Management & Paystack Wallet Integration
- **Category Accounting:** Tithes, Sunday Collections/Offerings, Thanksgiving, Harvest, Building Fund, Society Dues, Mass Stipends.
- **Paystack Subaccount Integration:** Split payments, dedicated virtual accounts (DVA) per parish, and direct automated payouts.
- **Manual/Cash Entry:** Offline entry for envelope tracking, cash count sheets, and bank teller receipts.
- **Withdrawal Requests:** Multi-step withdrawal approval workflow for disbursement to verified parish bank accounts.
- **Financial Analytics & Reporting:** Monthly comparisons, income vs. expenditure reports, exportable spreadsheets.

### 2.7 Appointments & Confession Booking
- **Priest Availability Schedule:** Weekly available slots and blocked/unavailable dates (retreats, pastoral visits).
- **Appointment Booking:** Parishioners schedule pastoral counseling, marriage preparation, confession, or general inquiries.
- **Status Workflow:** PENDING -> APPROVED -> REJECTED -> COMPLETED / CANCELLED.
- **Notifications:** Automated email/push updates when appointment status changes.

### 2.8 Societies & Pious Associations
- **Society Directory:** Sacred Heart, CWO, CMO, CYON, Legion of Mary, St. Vincent de Paul, Choir, etc.
- **Executive Roster:** President, Secretary, Financial Secretary, Treasurer roles.
- **Society Dues & Levies:** Tracking individual member compliance and society balances.
- **Society Announcements & Attendance:** Targeted notices and meeting reminders.

### 2.9 Public Parish Portal & Feed Experience (/feed, /start, /give, /p/[slug])
- **Public Parish Timeline:** Pinned announcements, liturgical reflections, daily saint quotes, event calendar.
- **Quick Giving (/give):** One-tap mobile-friendly giving via Card, USSD, or Bank Transfer.
- **Explore & Parish Gate:** Discover parishes across dioceses or enter via gate PIN.
- **Parishioner Self-Service (/me):** My giving history, registered masses, upcoming appointments, and linked devices.

---

## 3. Test Cases & Verification Matrix

### 3.1 Authentication, RBAC & Security (E2E & Unit)

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Standard Email & Password Login | User exists with active status | 1. Navigate to /auth/login<br>2. Enter email & password<br>3. Submit | Session created, redirected to role dashboard (/dashboard or /feed) | P0 |
| **TC-AUTH-002** | 2FA Challenge & Verification | 2FA enabled on user account | 1. Enter email & password<br>2. System prompts for TOTP<br>3. Enter valid 6-digit code | Access granted; session flag 	woFactorVerified: true | P0 |
| **TC-AUTH-003** | 2FA Recovery Code Fallback | User lost authenticator app | 1. Select  Use recovery code<br>2. Submit valid unused recovery code | Code consumed, user logged in, warning banner to regenerate keys | P0 |
| **TC-AUTH-004** | Role-Based Access Isolation | Logged in as PARISH_STAFF | 1. Attempt access to /dashboard/admin/organizations<br>2. Attempt direct API mutations on financial withdrawals | Access denied (HTTP 403 / Redirected to unauthorized page) | P0 |
| **TC-AUTH-005** | Step-Up Re-Authentication Gate | Logged in as PARISH_ADMIN | 1. Navigate to Organization Settings -> Payout Bank Account<br>2. Click Update Payout Details | Prompt for password/passkey re-auth before committing changes | P1 |
| **TC-AUTH-006** | Session Expiry & Inactivity Invalidation | Active user session | 1. Advance session clock past 24 hours of inactivity<br>2. Perform protected request | Session rejected, redirected to login with return URL preserved | P1 |
| **TC-AUTH-007** | Parish Gate Code Protection | Parish has equireGateCode: true | 1. Access /feed or /gate/[parishId] without gate cookie<br>2. Enter correct gate code<br>3. Enter invalid code | Invalid: error shown. Valid: feed unlocked and cookie set for parish scope | P1 |

---

### 3.2 Organization & Feature Toggles (E2E & Integration)

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ORG-001** | Multi-Tenant Data Isolation | 2 Parishes (Parish A & Parish B) | 1. Create parishioner in Parish A<br>2. Query parishioners as Parish B Admin | Parish A parishioner does not appear in Parish B queries | P0 |
| **TC-ORG-002** | Parish -> Outstation Hierarchy | Parish Admin has 2 Outstations | 1. Open Parishioner list as Parish Admin<br>2. Filter by Outstation 1, Outstation 2, or All | Parish Admin views all; Outstation Admin only sees respective outstation records | P0 |
| **TC-ORG-003** | Feature Toggle Enforcement (Mass Intentions) | Parish disables enableMassIntentions | 1. Access /mass-intentions in dashboard<br>2. Check public feed for Mass Intention button | Dashboard navigation hides item; direct route returns 404/disabled banner | P1 |
| **TC-ORG-004** | Feature Toggle Enforcement (Live Stream) | Parish enables enableLiveStreaming | 1. Configure YouTube live stream URL<br>2. View public parish page | Embedded player renders active stream or next scheduled broadcast | P2 |

---

### 3.3 Parishioner Records & Sacraments

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PAR-001** | Create Parishioner Record | PARISH_ADMIN or PARISH_STAFF | 1. Open /dashboard/parishioners/new<br>2. Fill required fields (Name, Phone, DOB, Gender)<br>3. Submit | Record saved in database with unique ID scoped to organization | P0 |
| **TC-PAR-002** | CSV Batch Import | Valid CSV with 50 member rows | 1. Go to /parishioners/import<br>2. Upload CSV & map headers<br>3. Trigger import | 50 records created, duplicate emails skipped/flagged, summary displayed | P1 |
| **TC-PAR-003** | Record Baptism & Issue Certificate | Existing parishioner record | 1. Navigate to Sacraments -> Baptism<br>2. Add baptism details (Godparents, Minister, Date)<br>3. Click Generate Certificate | Record saved with folio number; PDF certificate downloads with parish header | P1 |
| **TC-PAR-004** | Duplicate Sacrament Validation | Parishioner has Baptism record | 1. Attempt to add a second Baptism record for same person | Form validator blocks duplicate baptism with clear validation error | P2 |

---

### 3.4 Mass Schedules & Mass Intentions

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MASS-001** | Automated Mass Generation | Template created (e.g. Daily 6:30am) | 1. Run mass generation service for 30 days<br>2. Check calendar view | 30 daily mass records instantiated with correct times and max intention caps | P0 |
| **TC-MASS-002** | Book Mass Intention with Stipend (Online) | Online payments enabled | 1. Select Mass on calendar<br>2. Enter Intention details & stipend amount<br>3. Complete Paystack checkout | Payment verified via webhook, Intention status set to CONFIRMED, receipt emailed | P0 |
| **TC-MASS-003** | Max Intentions Limit Exceeded | Mass has limit of 5 intentions (5 booked) | 1. Attempt to book 6th intention for same Mass | System displays Mass Intention Capacity Full and suggests next available mass | P1 |
| **TC-MASS-004** | Export Intention Bulletin for Priest | Masses booked for upcoming Sunday | 1. Navigate to /masses<br>2. Select Date -> Click Print / Export Intention Sheet | Formatted PDF/Print layout generated grouping intentions by Mass time | P2 |

---

### 3.5 Financial Management & Paystack

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-FIN-001** | Record Offline Sunday Collection | PARISH_ADMIN or PARISH_SECRETARY | 1. Go to /parish-finances/new<br>2. Select Category: Sunday Collection<br>3. Enter Cash amount and notes<br>4. Submit | Entry saved, updates monthly balance chart and summary statistics | P0 |
| **TC-FIN-002** | Online Donation via Paystack (/give) | Paystack subaccount active | 1. Parishioner opens /give<br>2. Selects Harvest Levy, enters NGN 5,000<br>3. Pays with test card on Paystack popup | Webhook processes transaction, updates parish wallet balance, generates receipt | P0 |
| **TC-FIN-003** | Paystack Webhook Idempotency | Webhook event charge.success | 1. Send identical webhook payload twice from Paystack | First creates entry; second is recognized as duplicate (idempotent) without double credit | P0 |
| **TC-FIN-004** | Withdrawal Request Workflow | Parish wallet has positive balance | 1. Parish Admin submits withdrawal request<br>2. Super Admin reviews & approves | Payout initiated via Paystack Transfer API to parish verified bank account | P1 |

---

### 3.6 Appointments & Confession Booking

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-APT-001** | Parishioner Book Appointment | Priest availability slots set | 1. Select Priest & available Tuesday 10:00 AM slot<br>2. Specify purpose: Spiritual Direction<br>3. Submit | Appointment created in PENDING state; Priest/Secretary notified | P1 |
| **TC-APT-002** | Approve / Reject Appointment | Appointment in PENDING state | 1. Secretary opens /appointments<br>2. Selects appointment and clicks Approve (or Reschedule) | Status changes to APPROVED, parishioner receives push/email confirmation | P1 |
| **TC-APT-003** | Slot Collision Prevention | 10:00 AM slot already booked | 1. Another parishioner attempts to book the same 10:00 AM slot | Slot displays as disabled/booked in UI; API rejects concurrent booking | P1 |

---

### 3.7 Societies & Groups

| ID | Test Case | Precondition | Test Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SOC-001** | Create Society & Assign Executives | PARISH_ADMIN logged in | 1. Go to /dashboard/societies/new<br>2. Enter name Catholic Men Organization<br>3. Assign President and Secretary from member list | Society created with assigned executive roles and scoped permissions | P1 |
| **TC-SOC-002** | Society Dues Recording & Arrears | Society members roster populated | 1. Set monthly dues = NGN 1,000<br>2. Record member payment for January & February | Member shows zero arrears for Jan-Feb; unpaid members flagged in dues report | P2 |

---

### 3.8 Non-Functional, Accessibility & Performance

| ID | Test Category | Specification | Target | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **TC-NFR-001** | Accessibility (a11y) | WCAG 2.1 Level AA compliance | 0 axe violations on dashboard and giving pages | Automated Playwright @axe-core/playwright run |
| **TC-NFR-002** | Mobile Responsiveness | Viewport 375px to 1920px | No layout shift or horizontal overflow | Mobile viewport test on Chrome, iOS Safari simulator |
| **TC-NFR-003** | API Rate Limiting | Sensitive endpoints (/auth/*, /api/payments/*) | 5 req/min on login; 60 req/min on standard endpoints | Automated load test simulating brute-force requests |
| **TC-NFR-004** | Page Load Performance | Server-rendered dashboard & feed | LCP < 2.0s, TTFB < 400ms on standard broadband | Lighthouse / Next.js Server Timing metrics |

---

## 4. Running Automated Tests

`ash
# Run all Playwright E2E test suites
pnpm exec playwright test

# Run specific high-priority auth & security tests
pnpm exec playwright test e2e/p0-2fa-login-bug.spec.ts e2e/p1-security-ladder.spec.ts e2e/p1-reauth-gates.spec.ts

# Run accessibility hygiene audit
pnpm exec playwright test e2e/accessibility-and-hygiene.spec.ts

# Run Typecheck and Linting
pnpm tsc --noEmit
pnpm lint
`