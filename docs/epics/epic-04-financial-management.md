# Epic 04: Financial Management

**Epic ID:** EPIC-04
**Priority:** P0 (Critical)
**Status:** To Do
**PRD Reference:** Section 3.4

---

## Epic Overview

This epic covers all financial operations including payment recording, donation campaigns, custom donation types, and financial reporting. All monetary values are in Nigerian Naira (₦).

---

## Features

### Feature 4.1: Payment Recording

### Feature 4.2: Donation Campaigns

### Feature 4.3: Custom Donation Types

### Feature 4.4: Financial Reporting

---

## User Stories

### Feature 4.1: Payment Recording

#### US-04-001: Record Payment

**As a** Parish Secretary
**I want to** record a payment from a parishioner
**So that** financial contributions are tracked

**Acceptance Criteria:**

-   [ ] Form captures: amount, purpose, method, date
-   [ ] Amount in Nigerian Naira (₦) with proper formatting
-   [ ] Purpose options: Offering, Tithe, Mass Intention, Donation Campaign, Custom Donation, Other
-   [ ] Method options: Cash, Bank Transfer, Card, Mobile Money, Check
-   [ ] Optional parishioner selection (search/autocomplete)
-   [ ] Optional payer name for non-parishioners
-   [ ] Optional notes field
-   [ ] Transaction reference for digital payments
-   [ ] Recorder automatically captured from session
-   [ ] Organization automatically set from session

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-FM-001, FR-FM-002, FR-FM-003

---

#### US-04-002: Record Payment on Behalf of Others

**As a** Parish Secretary
**I want to** record payments for non-registered individuals
**So that** all contributions are tracked

**Acceptance Criteria:**

-   [ ] Option to select "Anonymous" or "Guest"
-   [ ] Capture payer name, email, phone if not registered
-   [ ] Payment still linked to organization
-   [ ] Clear attribution in records
-   [ ] Searchable by payer name

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-FM-005

---

#### US-04-003: View Payment List

**As a** Parish Staff
**I want to** view a list of all payments
**So that** I can track financial activity

**Acceptance Criteria:**

-   [ ] Paginated list (20 per page)
-   [ ] Columns: Date, Payer, Amount, Purpose, Method, Status
-   [ ] Amount formatted with Naira symbol (₦)
-   [ ] Sortable by date, amount
-   [ ] Status badge (Pending, Completed, Failed, Refunded)
-   [ ] Quick view modal for details
-   [ ] Data scoped to organization

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-FM-001

---

#### US-04-004: View Payment Details

**As a** Parish Staff
**I want to** view complete payment details
**So that** I can verify transaction information

**Acceptance Criteria:**

-   [ ] Full payment information displayed
-   [ ] Linked parishioner details (if applicable)
-   [ ] Linked campaign details (if applicable)
-   [ ] Recorder information
-   [ ] Receipt number
-   [ ] Transaction reference
-   [ ] Print receipt option

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-FM-001

---

#### US-04-005: Track Payment Status

**As a** Parish Secretary
**I want to** update payment status
**So that** I can track payment completion

**Acceptance Criteria:**

-   [ ] Status options: Pending, Completed, Failed, Refunded
-   [ ] Status change with reason (for failed/refunded)
-   [ ] Audit log captures status changes
-   [ ] Only authorized roles can change status
-   [ ] Completed payments generate receipt number

**Priority:** P0
**Story Points:** 3
**PRD Ref:** FR-FM-004

---

#### US-04-006: Generate Receipt Number

**As a** system
**I want to** generate unique receipt numbers for completed payments
**So that** payments can be officially tracked

**Acceptance Criteria:**

-   [ ] Auto-generated on payment completion
-   [ ] Format: ORG-YYYY-NNNNNN (e.g., ABC-2026-000001)
-   [ ] Sequential within organization
-   [ ] Unique across system
-   [ ] Displayed on receipt

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-FM-006

---

#### US-04-007: Track Transaction Reference

**As a** Parish Secretary
**I want to** record transaction references for digital payments
**So that** payments can be reconciled with bank records

**Acceptance Criteria:**

-   [ ] Optional field for bank transfer, card, mobile money
-   [ ] Validation for format (if applicable)
-   [ ] Searchable by reference
-   [ ] Displayed in payment details

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-007

---

#### US-04-008: Track Monthly Offerings

**As a** Parish Secretary
**I want to** categorize offerings by month
**So that** we can track monthly contribution patterns

**Acceptance Criteria:**

-   [ ] Month selector (1-12) for offering payments
-   [ ] Optional - not required for non-offering payments
-   [ ] Reports can group by offering month
-   [ ] Year implied from payment date

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-008

---

#### US-04-009: Audit Payment Recording

**As a** Parish Admin
**I want to** see who recorded each payment
**So that** accountability is maintained

**Acceptance Criteria:**

-   [ ] Recorder ID stored with payment
-   [ ] Recorder name displayed in details
-   [ ] Cannot be changed after creation
-   [ ] Audit log for all modifications

**Priority:** P0
**Story Points:** 2
**PRD Ref:** FR-FM-009

---

#### US-04-010: Edit Payment Details

**As a** Parish Admin
**I want to** edit payment details
**So that** errors can be corrected

**Acceptance Criteria:**

-   [ ] Only PARISH_ADMIN can edit
-   [ ] Editable: payer info, notes, reference
-   [ ] NOT editable: amount, purpose (create reversal instead)
-   [ ] Audit log captures all changes
-   [ ] Confirmation dialog

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-001

---

#### US-04-011: Delete/Void Payment

**As a** Parish Admin
**I want to** void incorrect payments
**So that** records can be corrected

**Acceptance Criteria:**

-   [ ] Soft delete (mark as voided) only
-   [ ] Reason required for voiding
-   [ ] Voided payments shown separately
-   [ ] Voided payments excluded from reports
-   [ ] Audit log captures voids
-   [ ] Only PARISH_ADMIN can void

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-001

---

### Feature 4.2: Donation Campaigns

#### US-04-012: Create Donation Campaign

**As a** Parish Admin
**I want to** create fundraising campaigns
**So that** we can track progress toward specific goals

**Acceptance Criteria:**

-   [ ] Form captures: name, description, target amount
-   [ ] Start date and end date
-   [ ] Target amount in Naira
-   [ ] Campaign status: Draft, Active, Completed, Cancelled
-   [ ] Campaign image/banner (optional, future)
-   [ ] Unique name within organization

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-FM-010

---

#### US-04-013: View Campaign List

**As a** Parish Staff
**I want to** view all donation campaigns
**So that** I can direct donations appropriately

**Acceptance Criteria:**

-   [ ] List of all campaigns
-   [ ] Shows: name, target, raised, progress %, status
-   [ ] Progress bar visualization
-   [ ] Filter by status (Active, Completed, etc.)
-   [ ] Sort by date, progress

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-010

---

#### US-04-014: Track Campaign Progress

**As a** Parish Admin
**I want to** see real-time campaign progress
**So that** I can monitor fundraising efforts

**Acceptance Criteria:**

-   [ ] Total raised calculated from linked payments
-   [ ] Progress percentage toward target
-   [ ] Number of donors
-   [ ] Average donation amount
-   [ ] Days remaining
-   [ ] Donor list (optional view)

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-FM-011

---

#### US-04-015: Link Payment to Campaign

**As a** Parish Secretary
**I want to** link payments to specific campaigns
**So that** campaign progress is tracked

**Acceptance Criteria:**

-   [ ] Campaign selector on payment form (when purpose is Donation Campaign)
-   [ ] Only active campaigns shown
-   [ ] Payment contributes to campaign total
-   [ ] Campaign linkage shown in payment details

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-012

---

#### US-04-016: Manage Campaign Status

**As a** Parish Admin
**I want to** change campaign status
**So that** campaigns reflect current state

**Acceptance Criteria:**

-   [ ] Status transitions: Draft → Active → Completed
-   [ ] Can cancel at any status
-   [ ] Completed campaigns stop accepting donations
-   [ ] End date auto-triggers completion (optional)
-   [ ] Audit log captures status changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-013

---

#### US-04-017: Generate Campaign Report

**As a** Parish Admin
**I want to** generate campaign progress reports
**So that** I can share with stakeholders

**Acceptance Criteria:**

-   [ ] PDF report with campaign details
-   [ ] Total raised and percentage
-   [ ] Donor list (optional)
-   [ ] Payment breakdown by method
-   [ ] Organization letterhead
-   [ ] Export to PDF

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-FM-014

---

#### US-04-018: Record Standalone Donation

**As a** Parish Secretary
**I want to** record donations without a campaign
**So that** general donations are tracked

**Acceptance Criteria:**

-   [ ] Payment with purpose "Other" or "Custom Donation"
-   [ ] No campaign linkage required
-   [ ] Still tracked in financial reports
-   [ ] Can add custom description

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-015

---

### Feature 4.3: Custom Donation Types

#### US-04-019: Create Custom Donation Type

**As a** Parish Admin
**I want to** define custom donation categories
**So that** we can track specific giving patterns

**Acceptance Criteria:**

-   [ ] Form: name, description
-   [ ] Unique name within organization
-   [ ] Active/inactive status
-   [ ] Examples: Building Fund, Youth Ministry, Charity

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-016, FR-FM-017

---

#### US-04-020: View Custom Donation Types

**As a** Parish Staff
**I want to** see available donation types
**So that** I can categorize payments correctly

**Acceptance Criteria:**

-   [ ] List of custom types
-   [ ] Shows name, description, status
-   [ ] Active types shown in payment form
-   [ ] Inactive types hidden from selection

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-016

---

#### US-04-021: Edit Custom Donation Type

**As a** Parish Admin
**I want to** modify donation type details
**So that** categories stay relevant

**Acceptance Criteria:**

-   [ ] Edit name and description
-   [ ] Validate unique name
-   [ ] Audit log captures changes
-   [ ] Success notification

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-017

---

#### US-04-022: Activate/Deactivate Donation Type

**As a** Parish Admin
**I want to** control which donation types are available
**So that** outdated categories are hidden

**Acceptance Criteria:**

-   [ ] Toggle active status
-   [ ] Inactive types hidden from payment form
-   [ ] Historical payments retain type reference
-   [ ] Cannot deactivate type with pending payments

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-019

---

#### US-04-023: Prevent Deletion of Used Donation Types

**As a** system
**I want to** prevent deletion of donation types with payments
**So that** historical data is preserved

**Acceptance Criteria:**

-   [ ] Check for existing payments before deletion
-   [ ] Show error if payments exist
-   [ ] Suggest deactivation instead
-   [ ] Allow deletion only if no payments

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-FM-020

---

### Feature 4.4: Financial Reporting

#### US-04-024: Generate Financial Summary Report

**As a** Parish Admin
**I want to** generate summary financial reports
**So that** I can review overall financial status

**Acceptance Criteria:**

-   [ ] Date range selector
-   [ ] Total income by period
-   [ ] Breakdown by purpose
-   [ ] Breakdown by method
-   [ ] Comparison to previous period (optional)
-   [ ] Export to PDF and Excel

**Priority:** P0
**Story Points:** 8
**PRD Ref:** FR-FM-021

---

#### US-04-025: Report by Payment Purpose

**As a** Parish Admin
**I want to** see payments grouped by purpose
**So that** I can analyze giving patterns

**Acceptance Criteria:**

-   [ ] Pie/bar chart by purpose
-   [ ] Table with amounts per purpose
-   [ ] Percentage breakdown
-   [ ] Filter by date range
-   [ ] Compare across periods

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-FM-022

---

#### US-04-026: Report by Payment Method

**As a** Parish Admin
**I want to** see payments grouped by method
**So that** I can understand payment preferences

**Acceptance Criteria:**

-   [ ] Chart by payment method
-   [ ] Cash vs digital breakdown
-   [ ] Trend over time
-   [ ] Filter by date range

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-023

---

#### US-04-027: Monthly Offering Report

**As a** Parish Admin
**I want to** see offering trends by month
**So that** I can track seasonal patterns

**Acceptance Criteria:**

-   [ ] Monthly totals for offerings
-   [ ] Year-over-year comparison
-   [ ] Chart visualization
-   [ ] Average per month
-   [ ] Top contributing months

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-FM-024

---

#### US-04-028: Campaign Progress Report

**As a** Parish Admin
**I want to** see progress across all campaigns
**So that** I can prioritize fundraising efforts

**Acceptance Criteria:**

-   [ ] List all campaigns with progress
-   [ ] Highlight behind-schedule campaigns
-   [ ] Total raised across campaigns
-   [ ] Filter by status, date range

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-025

---

#### US-04-029: Export Financial Report to PDF

**As a** Parish Admin
**I want to** export reports as PDF
**So that** I can share with stakeholders

**Acceptance Criteria:**

-   [ ] Professional formatting
-   [ ] Organization letterhead
-   [ ] Date generated
-   [ ] Page numbers
-   [ ] Charts and tables included
-   [ ] Print-ready format

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-FM-026

---

#### US-04-030: Export Financial Report to Excel

**As a** Parish Admin
**I want to** export reports as Excel
**So that** I can do further analysis

**Acceptance Criteria:**

-   [ ] Proper column headers
-   [ ] Formatted amounts
-   [ ] Multiple sheets if needed
-   [ ] Filter-friendly format
-   [ ] Summary row

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-026

---

#### US-04-031: View Parishioner Contribution History

**As a** Parish Secretary
**I want to** view a parishioner's payment history
**So that** I can provide contribution statements

**Acceptance Criteria:**

-   [ ] List all payments by parishioner
-   [ ] Total contributions for period
-   [ ] Breakdown by purpose
-   [ ] Downloadable statement
-   [ ] Date range filter

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-FM-001

---

#### US-04-032: Print Payment Receipt

**As a** Parish Secretary
**I want to** print payment receipts
**So that** parishioners have proof of payment

**Acceptance Criteria:**

-   [ ] Receipt with all payment details
-   [ ] Receipt number
-   [ ] Organization info
-   [ ] Date and amount
-   [ ] Purpose and method
-   [ ] Print-optimized layout
-   [ ] Duplicate prevention (same receipt)

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-FM-006

---

## Technical Notes

### Currency Handling

-   All amounts stored as Decimal in database
-   Display with Nigerian Naira symbol: ₦
-   Format: ₦1,234,567.89
-   Use `formatNaira()` utility function

### Feature Toggle Integration

-   Check `enableFinancialManagement` before all operations
-   Check `enableOfferings`, `enableTithes`, etc. for specific purposes
-   Check `enableDonationCampaigns` for campaign features
-   Check `enableCustomDonationTypes` for custom types

### Database Schema

```prisma
model Payment {
  id                   String         @id @default(uuid())
  amount               Decimal        @db.Decimal(12, 2)
  purpose              PaymentPurpose
  method               PaymentMethod
  status               PaymentStatus  @default(PENDING)
  receiptNumber        String?        @unique
  transactionReference String?
  payerName            String?
  payerEmail           String?
  payerPhone           String?
  offeringMonth        Int?           // 1-12
  notes                String?
  parishionerId        String?
  parishioner          Parishioner?   @relation(...)
  campaignId           String?
  campaign             DonationCampaign? @relation(...)
  customDonationTypeId String?
  customDonationType   CustomDonationType? @relation(...)
  recordedById         String
  recordedBy           User           @relation(...)
  organizationId       String
  organization         Organization   @relation(...)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
}

enum PaymentPurpose {
  OFFERING
  TITHE
  MASS_INTENTION
  DONATION_CAMPAIGN
  CUSTOM_DONATION
  OTHER
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CARD
  MOBILE_MONEY
  CHECK
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model DonationCampaign {
  id             String   @id @default(uuid())
  name           String
  description    String?
  targetAmount   Decimal  @db.Decimal(12, 2)
  startDate      DateTime
  endDate        DateTime
  status         CampaignStatus @default(DRAFT)
  payments       Payment[]
  organizationId String
  organization   Organization @relation(...)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([name, organizationId])
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

model CustomDonationType {
  id             String   @id @default(uuid())
  name           String
  description    String?
  isActive       Boolean  @default(true)
  payments       Payment[]
  organizationId String
  organization   Organization @relation(...)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([name, organizationId])
}
```

### Files to Create/Modify

-   `app/dashboard/payments/page.tsx` - Payment list
-   `app/dashboard/payments/new/page.tsx` - Record payment
-   `app/dashboard/payments/[id]/page.tsx` - Payment details
-   `app/dashboard/campaigns/page.tsx` - Campaign list
-   `app/dashboard/campaigns/new/page.tsx` - Create campaign
-   `app/dashboard/campaigns/[id]/page.tsx` - Campaign details
-   `app/dashboard/reports/financial/page.tsx` - Financial reports
-   `app/actions/payment.actions.ts` - Payment CRUD
-   `app/actions/campaign.actions.ts` - Campaign CRUD
-   `components/forms/payment-form.tsx` - Payment form
-   `lib/validators/payment.schema.ts` - Zod schemas
-   `lib/currency.ts` - Currency formatting utilities

---

## Dependencies

-   **EPIC-01**: User Management (authentication, authorization)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-03**: Parishioner Management (parishioner linking)

## Dependent Epics

-   **EPIC-05**: Mass Intention Management (payment linking)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-04-001 | 5            |
| US-04-002 | 3            |
| US-04-003 | 5            |
| US-04-004 | 3            |
| US-04-005 | 3            |
| US-04-006 | 2            |
| US-04-007 | 2            |
| US-04-008 | 2            |
| US-04-009 | 2            |
| US-04-010 | 3            |
| US-04-011 | 3            |
| US-04-012 | 5            |
| US-04-013 | 3            |
| US-04-014 | 5            |
| US-04-015 | 3            |
| US-04-016 | 3            |
| US-04-017 | 5            |
| US-04-018 | 2            |
| US-04-019 | 3            |
| US-04-020 | 2            |
| US-04-021 | 2            |
| US-04-022 | 2            |
| US-04-023 | 2            |
| US-04-024 | 8            |
| US-04-025 | 5            |
| US-04-026 | 3            |
| US-04-027 | 5            |
| US-04-028 | 3            |
| US-04-029 | 5            |
| US-04-030 | 3            |
| US-04-031 | 3            |
| US-04-032 | 5            |
| **Total** | **110**      |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
