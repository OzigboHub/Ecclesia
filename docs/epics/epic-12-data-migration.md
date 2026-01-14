# Epic 12: Data Migration & Import

**Epic ID:** EPIC-12
**Priority:** P1 (High)
**Status:** To Do
**PRD Reference:** Section 7 (Data Migration)

---

## Epic Overview

This epic covers the data migration and import capabilities for parishes transitioning from existing systems (spreadsheets, legacy databases, or other parish management software). Includes CSV/Excel imports, data validation, duplicate detection, and migration assistance.

---

## Features

### Feature 12.1: Parishioner Data Import

### Feature 12.2: Financial Data Import

### Feature 12.3: Sacramental Records Import

### Feature 12.4: Organization Data Import

### Feature 12.5: Migration Utilities

---

## User Stories

### Feature 12.1: Parishioner Data Import

#### US-12-001: Download Parishioner Import Template

**As a** Parish Admin
**I want to** download a CSV/Excel template
**So that** I can prepare data for import

**Acceptance Criteria:**

-   [ ] Download CSV template
-   [ ] Download Excel template
-   [ ] All fields documented
-   [ ] Required fields marked
-   [ ] Sample data included
-   [ ] Field format instructions

**Priority:** P0
**Story Points:** 2
**PRD Ref:** DM-001

---

#### US-12-002: Upload Parishioner CSV File

**As a** Parish Admin
**I want to** upload parishioner data file
**So that** bulk records can be imported

**Acceptance Criteria:**

-   [ ] File upload interface
-   [ ] Accept CSV and Excel formats
-   [ ] File size limit validation
-   [ ] Progress indicator
-   [ ] Error on invalid file type

**Priority:** P0
**Story Points:** 3
**PRD Ref:** DM-001

---

#### US-12-003: Validate Imported Parishioner Data

**As a** System
**I want to** validate imported data
**So that** only valid records are created

**Acceptance Criteria:**

-   [ ] Check required fields present
-   [ ] Validate email formats
-   [ ] Validate phone formats
-   [ ] Validate date formats
-   [ ] Validate gender values
-   [ ] Report all validation errors

**Priority:** P0
**Story Points:** 5
**PRD Ref:** DM-001

---

#### US-12-004: Preview Import Data Before Committing

**As a** Parish Admin
**I want to** preview import results
**So that** I can verify before finalizing

**Acceptance Criteria:**

-   [ ] Show number of records to import
-   [ ] Show validation errors per row
-   [ ] Show warnings (potential duplicates)
-   [ ] Option to fix in file and re-upload
-   [ ] Option to proceed with valid only

**Priority:** P0
**Story Points:** 5
**PRD Ref:** DM-001

---

#### US-12-005: Execute Parishioner Data Import

**As a** Parish Admin
**I want to** execute the import
**So that** records are created in the system

**Acceptance Criteria:**

-   [ ] Import valid records
-   [ ] Skip invalid records
-   [ ] Show progress bar
-   [ ] Create import log
-   [ ] Summary of imported vs skipped
-   [ ] Option to download error report

**Priority:** P0
**Story Points:** 8
**PRD Ref:** DM-001

---

#### US-12-006: Detect Duplicate Parishioners on Import

**As a** System
**I want to** detect potential duplicates
**So that** data quality is maintained

**Acceptance Criteria:**

-   [ ] Match on email
-   [ ] Match on name + DOB
-   [ ] Match on phone number
-   [ ] Show potential duplicates
-   [ ] Options: Skip, Merge, Create Anyway
-   [ ] Log duplicate decisions

**Priority:** P1
**Story Points:** 8
**PRD Ref:** DM-001

---

#### US-12-007: Map Custom Fields on Import

**As a** Parish Admin
**I want to** map CSV columns to system fields
**So that** different file formats can be imported

**Acceptance Criteria:**

-   [ ] Column mapping interface
-   [ ] Auto-detect common mappings
-   [ ] Manual mapping override
-   [ ] Save mapping for future imports
-   [ ] Ignore unmapped columns

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-001

---

### Feature 12.2: Financial Data Import

#### US-12-008: Download Payment Import Template

**As a** Parish Admin
**I want to** download payment import template
**So that** I can prepare historical payment data

**Acceptance Criteria:**

-   [ ] CSV/Excel template
-   [ ] Required fields: Amount, Date, Purpose
-   [ ] Optional: Parishioner link
-   [ ] Sample data included
-   [ ] Instructions document

**Priority:** P1
**Story Points:** 2
**PRD Ref:** DM-002

---

#### US-12-009: Import Historical Payments

**As a** Parish Admin
**I want to** import historical payment records
**So that** financial history is preserved

**Acceptance Criteria:**

-   [ ] Upload payment CSV
-   [ ] Validate amounts (positive numbers)
-   [ ] Validate dates (not future)
-   [ ] Validate payment purpose
-   [ ] Link to existing parishioners
-   [ ] Create unlinked if parishioner not found

**Priority:** P1
**Story Points:** 8
**PRD Ref:** DM-002

---

#### US-12-010: Import Offering Records

**As a** Parish Admin
**I want to** import historical offering data
**So that** giving history is available

**Acceptance Criteria:**

-   [ ] Import with offering months
-   [ ] Link to parishioners
-   [ ] Validate offering month format
-   [ ] Calculate totals after import
-   [ ] Update offering tracking records

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-002

---

#### US-12-011: Import Tithe Records

**As a** Parish Admin
**I want to** import historical tithe data
**So that** tithing history is preserved

**Acceptance Criteria:**

-   [ ] Import tithe payments
-   [ ] Link to parishioners
-   [ ] Date validation
-   [ ] Update parishioner tithe totals
-   [ ] Summary report after import

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-002

---

### Feature 12.3: Sacramental Records Import

#### US-12-012: Download Sacrament Import Template

**As a** Parish Admin
**I want to** download sacrament import template
**So that** I can import historical records

**Acceptance Criteria:**

-   [ ] Template per sacrament type
-   [ ] Required fields documented
-   [ ] Register number field
-   [ ] Date formats specified
-   [ ] Minister/celebrant field

**Priority:** P1
**Story Points:** 2
**PRD Ref:** DM-003

---

#### US-12-013: Import Baptism Records

**As a** Parish Admin
**I want to** import historical baptism records
**So that** sacramental history is complete

**Acceptance Criteria:**

-   [ ] Import baptism details
-   [ ] Link to parishioner if exists
-   [ ] Parents and godparents data
-   [ ] Register number
-   [ ] Date and minister
-   [ ] Validate no duplicates

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-003

---

#### US-12-014: Import Confirmation Records

**As a** Parish Admin
**I want to** import confirmation records
**So that** records are complete

**Acceptance Criteria:**

-   [ ] Import confirmation data
-   [ ] Confirmation name
-   [ ] Sponsor details
-   [ ] Date and bishop/minister
-   [ ] Link to parishioners

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-003

---

#### US-12-015: Import First Communion Records

**As a** Parish Admin
**I want to** import First Communion records
**So that** sacrament history is preserved

**Acceptance Criteria:**

-   [ ] Import communion records
-   [ ] Date of First Communion
-   [ ] Link to parishioners
-   [ ] Validate baptism exists first
-   [ ] Register information

**Priority:** P1
**Story Points:** 3
**PRD Ref:** DM-003

---

#### US-12-016: Import Marriage Records

**As a** Parish Admin
**I want to** import marriage records
**So that** marriage register is complete

**Acceptance Criteria:**

-   [ ] Import marriage data
-   [ ] Both spouses' details
-   [ ] Witnesses' names
-   [ ] Date and officiant
-   [ ] Register number
-   [ ] Link to parishioners if they exist

**Priority:** P1
**Story Points:** 5
**PRD Ref:** DM-003

---

### Feature 12.4: Organization Data Import

#### US-12-017: Import Pious Organization Members

**As a** Organization President
**I want to** bulk import members
**So that** membership setup is faster

**Acceptance Criteria:**

-   [ ] Upload member list
-   [ ] Match to existing parishioners
-   [ ] Create membership records
-   [ ] Set join dates
-   [ ] Set initial roles
-   [ ] Handle non-matches

**Priority:** P2
**Story Points:** 5
**PRD Ref:** DM-004

---

#### US-12-018: Import Organization Dues History

**As a** Organization President
**I want to** import historical dues
**So that** payment records are complete

**Acceptance Criteria:**

-   [ ] Import dues payments
-   [ ] Link to members
-   [ ] Set periods covered
-   [ ] Validate amounts
-   [ ] Update dues status

**Priority:** P2
**Story Points:** 5
**PRD Ref:** DM-004

---

### Feature 12.5: Migration Utilities

#### US-12-019: View Import History

**As a** Parish Admin
**I want to** see past imports
**So that** I can track what was imported

**Acceptance Criteria:**

-   [ ] List of all imports
-   [ ] Date and type
-   [ ] Records imported/skipped
-   [ ] Who performed import
-   [ ] Download original file
-   [ ] View error log

**Priority:** P1
**Story Points:** 3
**PRD Ref:** DM-005

---

#### US-12-020: Rollback Import

**As a** Parish Admin
**I want to** undo an import
**So that** mistakes can be corrected

**Acceptance Criteria:**

-   [ ] Select import to rollback
-   [ ] Warning about data loss
-   [ ] Delete imported records
-   [ ] Restore previous state
-   [ ] Log rollback action
-   [ ] Time limit for rollback (e.g., 24 hours)

**Priority:** P1
**Story Points:** 8
**PRD Ref:** DM-005

---

#### US-12-021: Export All Data for Migration

**As a** Parish Admin
**I want to** export all parish data
**So that** data can be backed up or transferred

**Acceptance Criteria:**

-   [ ] Export parishioners
-   [ ] Export payments
-   [ ] Export sacraments
-   [ ] Export organizations
-   [ ] ZIP file with all CSVs
-   [ ] Include data dictionary

**Priority:** P2
**Story Points:** 5
**PRD Ref:** DM-005

---

#### US-12-022: Migration Status Dashboard

**As a** Parish Admin
**I want to** see migration progress
**So that** I know what still needs to be imported

**Acceptance Criteria:**

-   [ ] Checklist of data types
-   [ ] Import status per type
-   [ ] Record counts
-   [ ] Completion percentage
-   [ ] Suggested next steps

**Priority:** P2
**Story Points:** 5
**PRD Ref:** DM-005

---

#### US-12-023: Data Cleanup Wizard

**As a** Parish Admin
**I want to** clean up imported data
**So that** data quality is improved

**Acceptance Criteria:**

-   [ ] Find duplicate records
-   [ ] Merge duplicates
-   [ ] Fix formatting issues
-   [ ] Standardize data
-   [ ] Review and approve changes

**Priority:** P2
**Story Points:** 8
**PRD Ref:** DM-005

---

#### US-12-024: Import Validation Report

**As a** Parish Admin
**I want to** download import validation report
**So that** I can fix issues in source data

**Acceptance Criteria:**

-   [ ] PDF/Excel report
-   [ ] List all validation errors
-   [ ] Row numbers indicated
-   [ ] Suggested fixes
-   [ ] Summary statistics

**Priority:** P1
**Story Points:** 3
**PRD Ref:** DM-001

---

## Technical Notes

### Supported File Formats

-   CSV (UTF-8, UTF-16)
-   Excel (.xlsx, .xls)
-   Optional: JSON for API imports

### Import Process Flow

```
Upload → Parse → Validate → Preview → Confirm → Execute → Report
                    ↓
              Fix & Re-upload
```

### Data Validation Rules

-   Required fields cannot be empty
-   Email: RFC 5322 compliant
-   Phone: Nigerian format (+234 or 0...)
-   Date: ISO 8601 or configurable formats
-   Currency: Numeric, max 2 decimal places

### Duplicate Detection Algorithm

1. Exact email match → High confidence duplicate
2. Full name + DOB match → High confidence duplicate
3. Full name + phone match → Medium confidence
4. Fuzzy name match (Levenshtein) → Low confidence
5. Present all matches for user decision

### Performance Considerations

-   Process large files in batches (1000 records)
-   Use background jobs for large imports
-   Progress updates via WebSocket
-   Transaction management (commit per batch)

### Database Schema

```prisma
model ImportJob {
  id              String       @id @default(uuid())
  type            ImportType
  status          ImportStatus @default(PENDING)
  fileName        String
  fileUrl         String?      // Stored file
  totalRecords    Int          @default(0)
  validRecords    Int          @default(0)
  importedRecords Int          @default(0)
  skippedRecords  Int          @default(0)
  errorLog        Json?
  fieldMapping    Json?        // Column mapping

  startedAt       DateTime?
  completedAt     DateTime?
  rollbackedAt    DateTime?

  importedById    String
  importedBy      User         @relation(...)

  organizationId  String
  organization    Organization @relation(...)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model ImportedRecord {
  id              String       @id @default(uuid())
  importJobId     String
  importJob       ImportJob    @relation(...)
  recordType      String       // parishioner, payment, etc.
  recordId        String       // ID of created record
  originalData    Json         // Original row data

  createdAt       DateTime     @default(now())
}

enum ImportType {
  PARISHIONER
  PAYMENT
  OFFERING
  TITHE
  BAPTISM
  CONFIRMATION
  FIRST_COMMUNION
  MARRIAGE
  ORGANIZATION_MEMBER
  ORGANIZATION_DUES
}

enum ImportStatus {
  PENDING
  VALIDATING
  VALIDATED
  IMPORTING
  COMPLETED
  FAILED
  ROLLED_BACK
}
```

### Files to Create/Modify

-   `app/dashboard/settings/import/page.tsx` - Import hub
-   `app/dashboard/settings/import/parishioners/page.tsx` - Parishioner import
-   `app/dashboard/settings/import/payments/page.tsx` - Payment import
-   `app/dashboard/settings/import/sacraments/page.tsx` - Sacrament import
-   `app/dashboard/settings/import/history/page.tsx` - Import history
-   `app/actions/import.actions.ts` - Server Actions
-   `lib/import/parsers/` - File parsers
-   `lib/import/validators/` - Data validators
-   `lib/import/processors/` - Import processors
-   `components/features/import/` - Import UI components

---

## Dependencies

-   **EPIC-01**: User Management (authentication, permissions)
-   **EPIC-02**: Organization Management (org scoping)

## Dependent Epics

-   **EPIC-03**: Parishioner Management (parishioner records created)
-   **EPIC-04**: Financial Management (payment records created)
-   **EPIC-07**: Pious Organization Management (membership records)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-12-001 | 2            |
| US-12-002 | 3            |
| US-12-003 | 5            |
| US-12-004 | 5            |
| US-12-005 | 8            |
| US-12-006 | 8            |
| US-12-007 | 5            |
| US-12-008 | 2            |
| US-12-009 | 8            |
| US-12-010 | 5            |
| US-12-011 | 5            |
| US-12-012 | 2            |
| US-12-013 | 5            |
| US-12-014 | 5            |
| US-12-015 | 3            |
| US-12-016 | 5            |
| US-12-017 | 5            |
| US-12-018 | 5            |
| US-12-019 | 3            |
| US-12-020 | 8            |
| US-12-021 | 5            |
| US-12-022 | 5            |
| US-12-023 | 8            |
| US-12-024 | 3            |
| **Total** | **118**      |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
