# 🚀 Quick Start Guide - Ecclesia DPM

Welcome! Follow these steps to get your Ecclesia Digital Parish Manager up and running.

---

## ✅ Prerequisites

Before you begin, ensure you have:

-   ✅ Node.js 20+ installed
-   ✅ pnpm package manager
-   ✅ PostgreSQL database (NeonDB is configured)
-   ✅ Environment variables set in `.env` file

---

## 🎯 Step-by-Step Setup

### 1️⃣ Initialize Database (First Time Only)

**On Windows:**

```bash
.\scripts\setup-db.bat
```

**On Mac/Linux:**

```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

**Or manually:**

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

This will:

-   ✅ Generate Prisma Client
-   ✅ Create database tables
-   ✅ Seed with sample data

### 2️⃣ Start Development Server

```bash
pnpm dev
```

Your app will be available at: **http://localhost:3000**

### 3️⃣ Login

After seeding, you can login with:

**Email:** `admin@ecclesia.com`
**Password:** `SecurePass123!`

---

## 📂 Project Structure

```
ecclesia/
├── app/
│   ├── actions/          # ✅ Server Actions (NEW!)
│   │   └── auth.actions.ts
│   ├── auth/             # Authentication pages
│   │   └── login/
│   ├── dashboard/        # Protected dashboard pages
│   └── api/              # API routes
├── components/
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── validators/       # Zod validation schemas
│   ├── auth.ts          # Auth helper functions
│   ├── db.ts            # Database client
│   └── utils.ts         # Utility functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
└── docs/                # Project documentation
```

---

## 🛠️ Common Commands

### Development

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database

```bash
pnpm prisma studio                    # Open database GUI
pnpm prisma migrate dev               # Create new migration
pnpm prisma migrate dev --name <name> # Named migration
pnpm prisma db seed                   # Seed database
pnpm prisma generate                  # Regenerate Prisma Client
```

### Troubleshooting

```bash
pnpm prisma migrate reset  # Reset database (careful!)
pnpm prisma db push        # Push schema without migration
```

---

## 📋 What's Been Done

✅ **Project Setup**

-   Next.js 16 with App Router
-   TypeScript configured
-   Tailwind CSS v4
-   Prisma ORM with NeonDB

✅ **Authentication**

-   Auth.js (NextAuth v5) configured
-   Login page with React Hook Form
-   Server Actions for auth
-   JWT-based sessions

✅ **Database**

-   Complete schema defined
-   Multi-tenancy support
-   Feature toggle system
-   Role-based access control

✅ **UI Components**

-   shadcn/ui components
-   Sonner toast notifications
-   Mobile-first design

---

## 🎯 Next Steps

### Immediate Tasks (This Week)

1. **Test Authentication** ✓

    - Login with seeded credentials
    - Verify session management
    - Test logout flow

2. **Create Parishioner Management**

    - [ ] Create `app/actions/parishioner.actions.ts`
    - [ ] Implement CRUD operations
    - [ ] Add search and filtering
    - [ ] Complete list and detail pages

3. **Build Dashboard**
    - [ ] Display statistics
    - [ ] Recent activity feed
    - [ ] Quick actions

### This Month

4. **Financial Management**

    - [ ] Payment recording
    - [ ] Payment history
    - [ ] Reports and analytics

5. **Mass Intentions**
    - [ ] Booking system
    - [ ] Calendar view
    - [ ] Payment integration

---

## 📖 Documentation

-   **Full Requirements**: `docs/prd.md`
-   **Implementation Plan**: `docs/implementation-plan.md`
-   **Database Schema**: `docs/schema.md`
-   **Coding Patterns**: `.github/skills/README.md`
-   **Detailed Next Steps**: `NEXT_STEPS.md`

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL in .env file
# Ensure NeonDB is accessible
# Try: pnpm prisma db push
```

### Prisma Client Issues

```bash
# Regenerate client
pnpm prisma generate

# If still broken, try:
rm -rf node_modules/.prisma
pnpm prisma generate
```

### Authentication Not Working

```bash
# Check AUTH_SECRET in .env
# Verify database has users
# Run: pnpm prisma studio
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

---

## 💡 Tips

1. **Use Prisma Studio** to visually manage data: `pnpm prisma studio`
2. **Check the skills directory** for coding patterns: `.github/skills/`
3. **Follow mobile-first** design approach
4. **Always scope by organizationId** for multi-tenancy
5. **Use Server Actions** for all data operations

---

## 🆘 Need Help?

1. Check `NEXT_STEPS.md` for detailed guidance
2. Review `.github/copilot-instructions.md` for project overview
3. Consult `docs/prd.md` for business requirements
4. See `.github/skills/` for implementation patterns

---

## ✨ Your First Feature

Let's implement **Parishioner Management** as your first feature:

```bash
# 1. Create the Server Action
# File: app/actions/parishioner.actions.ts

# 2. Complete the list page
# File: app/dashboard/parishioners/page.tsx

# 3. Test CRUD operations
# - Create a parishioner
# - View list
# - Edit details
# - Delete record

# Estimated time: 2-3 days
```

Refer to `NEXT_STEPS.md` for detailed implementation steps!

---

**Good luck building Ecclesia! 🙏✨**
