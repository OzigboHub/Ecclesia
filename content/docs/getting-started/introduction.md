---
title: Introduction
description: Welcome to the Ecclesia DPM developer documentation
section: getting-started
order: 1
---

# Welcome to Ecclesia DPM

**v1.0.0**

Ecclesia DPM (Digital Parish Manager) is a comprehensive Catholic parish management system built for simplicity, accountability, and efficiency. It provides an intuitive, secure platform that streamlines administrative tasks, enhances financial transparency, and improves engagement between parish leadership and members.

---

## Quick Navigation

### Getting Started

Get up and running in under 5 minutes with our installation guide.

[Get Started →](/developer-documentation/getting-started/installation)

### API Reference

Server Actions-based API for building integrations and extensions.

[View API Docs →](/developer-documentation/api-reference/server-actions)

### User Guide

Learn how the system manages parishes, parishioners, and finances.

[Learn More →](/developer-documentation/features/overview)

---

## Core Capabilities

- **Parish & Outstation Management** — Hierarchical organization structure with multi-parish support
- **Parishioner Management** — Comprehensive profiles, sacramental records, and family grouping
- **Financial Management** — Unified payment recording for offerings, tithes, donations, and campaigns
- **Mass Intention Management** — Book intentions, track stipends, and assign to masses
- **Appointment Booking** — Schedule confessions, counseling, and meetings with staff
- **Society Management** — Manage pious organizations (CWO, CMO, CYON, etc.)
- **Live Streaming** — Schedule and broadcast masses and events
- **Role-Based Access Control** — 8 granular roles from Super Admin to Parishioner

## Technology Stack

| Concern         | Technology                     |
| --------------- | ------------------------------ |
| Framework       | Next.js 16 (App Router)        |
| Language        | TypeScript (strict)            |
| Database        | PostgreSQL (NeonDB serverless) |
| ORM             | Prisma 7                       |
| Authentication  | Auth.js (NextAuth v5)          |
| Styling         | Tailwind CSS v4                |
| Components      | shadcn/ui + Radix UI           |
| Forms           | React Hook Form + Zod          |
| Package Manager | pnpm                           |

## Project Status

| Phase                       | Completion | Story Points     |
| --------------------------- | ---------- | ---------------- |
| Phase 1: Foundation (MVP)   | 96%        | 193/201 SP       |
| Phase 2: Core Features      | 27%        | 82/303 SP        |
| Phase 3: Community Features | Planned    | 0/302 SP         |
| Phase 4: Advanced Features  | Planned    | 0/261 SP         |
| **Total**                   | **37%**    | **418/1,127 SP** |
