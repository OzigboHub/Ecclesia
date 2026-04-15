---
title: Features Overview
description: Overview of all Ecclesia DPM features and their current status
section: features
order: 1
---

# Features Overview

Ecclesia DPM provides a comprehensive set of features organized across 12 epics. Features are progressively delivered across 4 release phases.

## Feature Status Legend

| Icon | Status                |
| ---- | --------------------- |
| ✅   | Complete              |
| 🟡   | Partial / In Progress |
| ⏳   | Planned               |

## Epic Summary

| Epic    | Name                      | Stories | Points | Status         |
| ------- | ------------------------- | ------- | ------ | -------------- |
| EPIC-01 | User Management           | 16      | 48     | ✅ Complete    |
| EPIC-02 | Organization Management   | 18      | 72     | ✅ Complete    |
| EPIC-03 | Parishioner Management    | 22      | 75     | 🟡 In Progress |
| EPIC-04 | Financial Management      | 32      | 110    | 🟡 In Progress |
| EPIC-05 | Mass Intention Management | 18      | 71     | 🟡 In Progress |
| EPIC-06 | Appointment Management    | 25      | 98     | 🟡 In Progress |
| EPIC-07 | Society Management        | 27      | 97     | 🟡 In Progress |
| EPIC-08 | Live Streaming            | 18      | 77     | ⏳ Planned     |
| EPIC-09 | Event Management          | 26      | 110    | ⏳ Planned     |
| EPIC-10 | Reporting & Analytics     | 27      | 130    | ⏳ Planned     |
| EPIC-11 | Integrations              | 22      | 121    | 🟡 Partial     |
| EPIC-12 | Data Migration            | 24      | 118    | ⏳ Planned     |

## Phase 1: Foundation (MVP) — 96% Complete

Core functionality for parish management.

### Authentication & User Management ✅

- User registration and login with email/password
- JWT-based sessions (24-hour duration)
- Account lockout after failed login attempts
- Auth audit logging and session management
- Per-session revocation
- Role-based access control (8 roles)

### Organization Management ✅

- Create parishes and outstations
- Hierarchical organization structure
- Organization CRUD operations
- Feature toggle system (per-organization)
- Organization-scoped data isolation

### Settings & Configuration (82%)

- Settings page with tabbed interface
- Basic organization settings
- Feature toggle management UI
- ⏳ Payment configuration UI (pending)
- ⏳ Notification settings (deferred)
- 🟡 Admin audit log (partial)

## Phase 2: Core Features — 27% Complete

### Parishioner Management 🟡

- ✅ Parishioner profiles CRUD
- ✅ Search and filtering
- ✅ Organization-scoped member lists
- ⏳ Family grouping
- ⏳ Sacramental records CRUD
- ⏳ Certificate generation

### Financial Management 🟡

- ✅ Unified payment recording
- ✅ Multiple payment purposes (offerings, tithes, donations)
- ✅ Payment method tracking
- ✅ Receipt generation
- 🟡 Donation campaigns (partial)
- ⏳ Monthly tithe tracking
- ⏳ Financial reports

### Mass Intention Management 🟡

- ✅ Mass intention booking
- ✅ Stipend payment recording
- ✅ Intention types (Thanksgiving, Requiem, Special)
- 🟡 Mass schedule management (baseline)
- ⏳ Mass assignment

### Appointment Management 🟡

- ✅ Appointment booking
- ✅ Staff assignment
- ✅ Status tracking
- ⏳ Calendar view
- ⏳ Notifications

## Phase 3 & 4: Planned Features

### Society Management ⏳

Pious organization membership, dues tracking, and management.

### Live Streaming ⏳

YouTube/Facebook live stream scheduling and embedding.

### Event Management ⏳

Parish event creation, RSVP tracking, and attendance.

### Reporting & Analytics ⏳

Financial reports, member statistics, and dashboard analytics.

### Integrations ⏳

Paystack payments, email (Resend), SMS, and calendar sync.

### Data Migration ⏳

Import tools for existing parish data from spreadsheets.
