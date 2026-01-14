# Ecclesia DPM - Epics & User Stories Summary

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**PRD Reference:** [docs/prd.md](../prd.md)

---

## Overview

This document provides a comprehensive summary of all Epics and User Stories for the Ecclesia Digital Parish Manager system.

---

## Epic Summary

| Epic                                                | Name                          | Stories | Points    | Priority | Status |
| --------------------------------------------------- | ----------------------------- | ------- | --------- | -------- | ------ |
| [EPIC-01](epic-01-user-management.md)               | User Management               | 16      | 48        | P0       | To Do  |
| [EPIC-02](epic-02-organization-management.md)       | Organization Management       | 18      | 72        | P0       | To Do  |
| [EPIC-03](epic-03-parishioner-management.md)        | Parishioner Management        | 22      | 75        | P0       | To Do  |
| [EPIC-04](epic-04-financial-management.md)          | Financial Management          | 32      | 110       | P0       | To Do  |
| [EPIC-05](epic-05-mass-intention-management.md)     | Mass Intention Management     | 18      | 71        | P1       | To Do  |
| [EPIC-06](epic-06-appointment-management.md)        | Appointment Management        | 25      | 98        | P1       | To Do  |
| [EPIC-07](epic-07-pious-organization-management.md) | Pious Organization Management | 27      | 97        | P1       | To Do  |
| [EPIC-08](epic-08-live-streaming.md)                | Live Streaming                | 18      | 77        | P2       | To Do  |
| [EPIC-09](epic-09-event-management.md)              | Event Management              | 26      | 110       | P1       | To Do  |
| [EPIC-10](epic-10-reporting-analytics.md)           | Reporting & Analytics         | 27      | 130       | P1       | To Do  |
| [EPIC-11](epic-11-integrations.md)                  | Integrations                  | 22      | 121       | P1       | To Do  |
| [EPIC-12](epic-12-data-migration.md)                | Data Migration                | 24      | 118       | P1       | To Do  |
|                                                     | **TOTAL**                     | **275** | **1,127** |          |        |

---

## Release Phases

### Phase 1: Foundation (MVP)

**Target:** Core functionality for parish management

| Epic                                       | Stories | Points   |
| ------------------------------------------ | ------- | -------- |
| EPIC-01: User Management                   | 16      | 48       |
| EPIC-02: Organization Management           | 18      | 72       |
| EPIC-03: Parishioner Management            | 22      | 75       |
| EPIC-04: Financial Management (P0 stories) | ~20     | ~65      |
| **Phase Total**                            | **~76** | **~260** |

### Phase 2: Core Features

**Target:** Essential parish operations

| Epic                                      | Stories | Points   |
| ----------------------------------------- | ------- | -------- |
| EPIC-04: Financial Management (remaining) | ~12     | ~45      |
| EPIC-05: Mass Intention Management        | 18      | 71       |
| EPIC-06: Appointment Management           | 25      | 98       |
| EPIC-12: Data Migration (P0-P1)           | ~18     | ~90      |
| **Phase Total**                           | **~73** | **~304** |

### Phase 3: Community Features

**Target:** Organization and engagement

| Epic                                   | Stories | Points   |
| -------------------------------------- | ------- | -------- |
| EPIC-07: Pious Organization Management | 27      | 97       |
| EPIC-09: Event Management              | 26      | 110      |
| EPIC-10: Reporting & Analytics (P0-P1) | ~20     | ~95      |
| **Phase Total**                        | **~73** | **~302** |

### Phase 4: Advanced Features

**Target:** Integrations and advanced capabilities

| Epic                                       | Stories | Points   |
| ------------------------------------------ | ------- | -------- |
| EPIC-08: Live Streaming                    | 18      | 77       |
| EPIC-10: Reporting & Analytics (remaining) | ~7      | ~35      |
| EPIC-11: Integrations                      | 22      | 121      |
| EPIC-12: Data Migration (remaining)        | ~6      | ~28      |
| **Phase Total**                            | **~53** | **~261** |

---

## Dependency Graph

```
EPIC-01: User Management
    │
    └──► EPIC-02: Organization Management
              │
              ├──► EPIC-03: Parishioner Management
              │         │
              │         └──► EPIC-07: Pious Organization Management
              │
              ├──► EPIC-04: Financial Management
              │         │
              │         └──► EPIC-11: Integrations (Payment Gateways)
              │
              ├──► EPIC-05: Mass Intention Management
              │         │
              │         └──► (requires EPIC-04 for payments)
              │
              ├──► EPIC-06: Appointment Management
              │
              ├──► EPIC-08: Live Streaming
              │         │
              │         └──► EPIC-11: Integrations (YouTube/Facebook)
              │
              ├──► EPIC-09: Event Management
              │
              ├──► EPIC-10: Reporting & Analytics
              │         │
              │         └──► (requires all operational epics)
              │
              └──► EPIC-12: Data Migration
```

---

## Feature Toggle Mapping

| Feature Toggle                | Related Epics                  |
| ----------------------------- | ------------------------------ |
| `enableParishionerManagement` | EPIC-03                        |
| `enableSacramentalRecords`    | EPIC-03 (Feature 3.3)          |
| `enableFinancialManagement`   | EPIC-04                        |
| `enableOfferings`             | EPIC-04 (Feature 4.2)          |
| `enableTithes`                | EPIC-04 (Feature 4.3)          |
| `enableDonationCampaigns`     | EPIC-04 (Feature 4.4)          |
| `enableMonthlyTracking`       | EPIC-04 (Feature 4.2)          |
| `enableMassIntentions`        | EPIC-05                        |
| `enableAppointments`          | EPIC-06                        |
| `enableConfessionBooking`     | EPIC-06                        |
| `enablePiousOrganizations`    | EPIC-07                        |
| `enableLiveStreaming`         | EPIC-08                        |
| `enableEventManagement`       | EPIC-09                        |
| `enableOnlinePayments`        | EPIC-11 (Paystack/Flutterwave) |
| `enableEmailNotifications`    | EPIC-11 (SendGrid)             |
| `enableSMSNotifications`      | EPIC-11 (Twilio/Termii)        |

---

## User Story Distribution by Priority

### P0 (Critical)

Must have for MVP launch

| Epic      | P0 Stories | Points   |
| --------- | ---------- | -------- |
| EPIC-01   | 10         | 29       |
| EPIC-02   | 10         | 42       |
| EPIC-03   | 8          | 27       |
| EPIC-04   | 12         | 42       |
| EPIC-05   | 5          | 16       |
| EPIC-06   | 6          | 18       |
| EPIC-12   | 5          | 23       |
| **Total** | **~56**    | **~197** |

### P1 (High)

Essential for full functionality

| Epic      | P1 Stories | Points |
| --------- | ---------- | ------ |
| All Epics | ~130       | ~550   |

### P2 (Medium)

Nice to have features

| Epic      | P2 Stories | Points |
| --------- | ---------- | ------ |
| All Epics | ~70        | ~300   |

### P3 (Low)

Future enhancements

| Epic      | P3 Stories | Points |
| --------- | ---------- | ------ |
| All Epics | ~19        | ~80    |

---

## RBAC Coverage

| Role                   | Epics with Primary Access      |
| ---------------------- | ------------------------------ |
| SUPER_ADMIN            | All Epics                      |
| PARISH_ADMIN           | EPIC-01 through EPIC-12        |
| PARISH_SECRETARY       | EPIC-03, 04, 05, 06, 09, 10    |
| PARISH_STAFF           | EPIC-03, 04, 05, 06            |
| OUTSTATION_ADMIN       | EPIC-03, 04, 05, 06, 07        |
| ORGANIZATION_PRESIDENT | EPIC-07                        |
| ORGANIZATION_SECRETARY | EPIC-07                        |
| PARISHIONER            | EPIC-05, 06, 09 (self-service) |

---

## Key Metrics

| Metric                   | Value |
| ------------------------ | ----- |
| Total Epics              | 12    |
| Total User Stories       | 275   |
| Total Story Points       | 1,127 |
| Average Stories per Epic | 23    |
| Average Points per Epic  | 94    |
| Average Points per Story | 4.1   |

---

## PRD Section Mapping

| PRD Section                 | Epic(s) |
| --------------------------- | ------- |
| 3.1 User Management         | EPIC-01 |
| 3.2 Organization Management | EPIC-02 |
| 3.3 Parishioner Management  | EPIC-03 |
| 3.4 Financial Management    | EPIC-04 |
| 3.5 Mass Intentions         | EPIC-05 |
| 3.6 Appointments            | EPIC-06 |
| 3.7 Pious Organizations     | EPIC-07 |
| 3.8 Live Streaming          | EPIC-08 |
| 3.9 Event Management        | EPIC-09 |
| Section 4 Reporting         | EPIC-10 |
| Section 6 Integrations      | EPIC-11 |
| Section 7 Data Migration    | EPIC-12 |

---

## Files Index

```
docs/epics/
├── README.md                                  # This file
├── epic-01-user-management.md                 # 16 stories, 48 pts
├── epic-02-organization-management.md         # 18 stories, 72 pts
├── epic-03-parishioner-management.md          # 22 stories, 75 pts
├── epic-04-financial-management.md            # 32 stories, 110 pts
├── epic-05-mass-intention-management.md       # 18 stories, 71 pts
├── epic-06-appointment-management.md          # 25 stories, 98 pts
├── epic-07-pious-organization-management.md   # 27 stories, 97 pts
├── epic-08-live-streaming.md                  # 18 stories, 77 pts
├── epic-09-event-management.md                # 26 stories, 110 pts
├── epic-10-reporting-analytics.md             # 27 stories, 130 pts
├── epic-11-integrations.md                    # 22 stories, 121 pts
└── epic-12-data-migration.md                  # 24 stories, 118 pts
```

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
