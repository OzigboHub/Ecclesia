---
title: Project Backlog
description: Sprint backlog, story points, and implementation priorities
section: development
order: 2
---

# Project Backlog

The backlog is organized into 12 epics with 275 total user stories and 1,127 story points.

## Priority Levels

| Level  | Description                            |
| ------ | -------------------------------------- |
| **P0** | Critical — Must have for launch        |
| **P1** | High — Required for full functionality |
| **P2** | Medium — Important but deferrable      |
| **P3** | Low — Nice to have, future enhancement |

## Story Point Scale

| Points | Effort                        |
| ------ | ----------------------------- |
| 1      | Less than 4 hours             |
| 2      | 4-8 hours (half day)          |
| 3      | 1 day                         |
| 5      | 2-3 days                      |
| 8      | 1 week                        |
| 13     | 2 weeks (needs decomposition) |

## Release Phases

### Phase 1: Foundation (MVP) — 96% Complete

| Epic                        | Stories | Points   | Status  |
| --------------------------- | ------- | -------- | ------- |
| User Management             | 16      | 48       | ✅      |
| Organization Management     | 18      | 72       | ✅      |
| Parishioner Management (P0) | 8       | 27       | ✅      |
| Financial Management (P0)   | ~20     | ~65      | 🟡      |
| **Phase Total**             | **~76** | **~260** | **96%** |

### Phase 2: Core Features — 27% Complete

| Epic                             | Stories | Points   | Status  |
| -------------------------------- | ------- | -------- | ------- |
| Financial Management (remaining) | ~12     | ~45      | ⏳      |
| Mass Intention Management        | 18      | 71       | 🟡      |
| Appointment Management           | 25      | 98       | 🟡      |
| Data Migration (P0-P1)           | ~18     | ~90      | ⏳      |
| **Phase Total**                  | **~73** | **~304** | **27%** |

### Phase 3: Community Features — Planned

| Epic                          | Stories | Points   |
| ----------------------------- | ------- | -------- |
| Society Management            | 27      | 97       |
| Event Management              | 26      | 110      |
| Reporting & Analytics (P0-P1) | ~20     | ~95      |
| **Phase Total**               | **~73** | **~302** |

### Phase 4: Advanced Features — Planned

| Epic                              | Stories | Points   |
| --------------------------------- | ------- | -------- |
| Live Streaming                    | 18      | 77       |
| Reporting & Analytics (remaining) | ~7      | ~35      |
| Integrations                      | 22      | 121      |
| Data Migration (remaining)        | ~6      | ~28      |
| **Phase Total**                   | **~53** | **~261** |

## Current Priorities

Top recommended next items:

1. **Mass Schedule Management** (13 SP) — Replace hardcoded mass times with configurable schedule
2. **Family Management** (21 SP) — Implement family grouping for parishioners
3. **Tithes & Donation Campaigns** (40 SP) — Monthly tracking and campaign management
4. **Sacramental Records** — Full CRUD for baptism, confirmation, marriage certificates
5. **Financial Reports** — Generate and export financial summaries

## Dependency Graph

```
User Management
  └── Organization Management
        ├── Parishioner Management
        │     └── Society Management
        ├── Financial Management
        │     └── Integrations (Payments)
        ├── Mass Intention Management
        ├── Appointment Management
        ├── Live Streaming
        │     └── Integrations (YouTube)
        ├── Event Management
        ├── Reporting & Analytics
        └── Data Migration
```
