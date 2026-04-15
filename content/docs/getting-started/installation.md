---
title: Installation
description: Set up your local development environment for Ecclesia DPM
section: getting-started
order: 2
---

# Installation

Ecclesia DPM requires Node.js 18+, pnpm, and PostgreSQL. Follow these steps to set up your development environment.

## Prerequisites

| Requirement | Version | Notes                    |
| ----------- | ------- | ------------------------ |
| Node.js     | 18.x+   | LTS recommended          |
| pnpm        | 9.x+    | Required package manager |
| PostgreSQL  | 14.x+   | NeonDB for production    |
| Git         | 2.x+    | Version control          |

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/ecclesia-dpm.git
cd ecclesia-dpm
```

## 2. Install Dependencies

```bash
pnpm install
```

> **Important**: Always use `pnpm`. Do not use `npm` or `yarn`.

## 3. Environment Setup

Create a `.env` file in the root directory. Reference `env.example` for all available variables:

```env
# Database (NeonDB serverless PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/ecclesia_dpm?sslmode=require"

# Authentication (Auth.js / NextAuth v5)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-auth-secret"

# Application
NODE_ENV="development"

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="your-region"
AWS_BUCKET_NAME="your-bucket"

# Paystack (payment processing)
PAYSTACK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxx"

# Resend (email service)
RESEND_API_KEY="re_xxx"
```

## 4. Database Setup

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# (Optional) Seed the database
pnpm prisma db seed
```

## 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## Development Commands

| Command                                 | Description                  |
| --------------------------------------- | ---------------------------- |
| `pnpm dev`                              | Start dev server (port 3000) |
| `pnpm build`                            | Production build             |
| `pnpm start`                            | Start production server      |
| `pnpm lint`                             | Run ESLint                   |
| `pnpm prisma generate`                  | Regenerate Prisma Client     |
| `pnpm prisma migrate dev --name <name>` | Create & apply migration     |
| `pnpm prisma studio`                    | Open Prisma Studio GUI       |

## Troubleshooting

### Build Fails After Schema Changes

Always run `pnpm prisma generate` before building:

```bash
pnpm prisma generate && pnpm build
```

### Port 3000 Already in Use

Kill the process occupying port 3000 or use a different port:

```bash
pnpm dev -- -p 3001
```

### Prisma Client Out of Sync

If you see type errors after pulling changes:

```bash
pnpm prisma generate
```
