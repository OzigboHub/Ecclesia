---
title: Tech Stack
description: Technology choices and their justification
section: architecture
order: 1
---

# Tech Stack

Ecclesia DPM is built on a modern, production-ready stack optimized for server-side rendering, type safety, and developer experience.

## Frontend

### Next.js 16 (App Router)

The application uses the Next.js App Router with React Server Components as the default rendering strategy. This provides:

- **Server Components by default** — Better performance, smaller client bundles
- **Server Actions** — Type-safe mutations without API routes
- **File-based routing** — Intuitive route organization
- **Streaming & Suspense** — Progressive page loading

### React 19

Latest React with concurrent features, server components support, and improved hooks.

### TypeScript (Strict Mode)

Full type safety across the entire codebase. Prisma generates types directly from the database schema.

### Tailwind CSS v4

Utility-first CSS with CSS variables for theming. Dark mode is the default theme with a yellow/amber accent palette.

## Backend

### Prisma 7

Type-safe ORM with:

- Auto-generated TypeScript types from schema
- Migration management
- NeonDB serverless adapter for connection pooling
- Studio GUI for database inspection

### Auth.js (NextAuth v5)

JWT-based authentication with:

- 24-hour session duration
- Extended session with `role`, `organizationId`, `organizationName`
- Prisma adapter for user persistence
- Account lockout after failed attempts

### NeonDB (Serverless PostgreSQL)

Serverless PostgreSQL with:

- WebSocket-based connections
- Auto-scaling
- Branching for development

## Infrastructure

### Paystack

Payment processing for Nigerian parishes:

- Online payment collection
- Transaction verification
- Wallet management

### AWS S3

File storage for:

- Profile images
- Document uploads
- Generated reports

### Resend

Transactional email service for:

- Password resets
- Notifications
- Reports

## UI Libraries

| Library         | Purpose                        |
| --------------- | ------------------------------ |
| shadcn/ui       | Component primitives           |
| Radix UI        | Accessible headless components |
| Lucide React    | Icon library                   |
| React Hook Form | Form state management          |
| Zod             | Schema validation              |
| Recharts        | Dashboard charts               |
| Sonner          | Toast notifications            |
| date-fns        | Date formatting                |
| cmdk            | Command palette                |
