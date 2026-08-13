# Ecclesia Digital Parish Manager (DPM)

Ecclesia is a Catholic parish management system that supports parish/outstation hierarchies, parishioner records, payments, mass intentions, appointments, societies, and announcements.

## Highlights

- Multi-tenant organization scoping with parish and outstation support
- Feature toggles per organization (live streaming, online payments, SMS, etc.)
- Role-based access control with 8 roles
- Unified payments and monthly tracking 
- Society management with dues and announcements
 
## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript.
- Prisma ORM + PostgreSQL (Neon compatible)
- Auth.js (NextAuth v5).
- Tailwind CSS v4 + shadcn/ui
- Zod validation
 
## Getting Started

### 1) Install dependencies

```bash
pnpm install 
``` 

### 2) Configure environment

Copy the sample environment file and update values as needed.

```bash
cp env.example .env
```

Key variables typically include:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 3) Database setup

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 4) Run the app

```bash
pnpm dev
```

App runs at http://localhost:3000

## Useful Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm prisma generate
pnpm prisma migrate dev --name <name>
pnpm prisma studio
```

## Project Structure

```text
app/                 Next.js App Router
	(auth)/            Auth routes
	(public)/          Public routes
	(protected)/       Authenticated routes
actions/             Server actions
components/          UI, layout, and feature components
docs/                Product and architecture docs
hooks/               Custom hooks
lib/                 Auth, db, utils, permissions
prisma/              Schema and seed
public/              Static assets
types/               TypeScript types
```

## Documentation

- Product requirements: [docs/prd.md](docs/prd.md)
- Schema overview: [docs/schema.md](docs/schema.md)
- Feature toggles: [docs/feature_toggled_guide.md](docs/feature_toggled_guide.md)
- Auth guide: [docs/AUTHENTICATION_GUIDE.md](docs/AUTHENTICATION_GUIDE.md)
- Implementation notes: [docs/implementation.md](docs/implementation.md)

## Notes

- All data access is organization-scoped via `session.user.organizationId`.
- Feature flags are enforced via `OrganizationFeatureSettings`.
- Use `@/` path alias for imports.
