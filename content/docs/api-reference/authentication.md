---
title: Authentication API
description: Auth.js configuration and authentication endpoints
section: api-reference
order: 2
---

# Authentication API

Ecclesia uses Auth.js (NextAuth v5) with JWT strategy for authentication.

## Configuration

Auth configuration lives in three files:

| File                                  | Purpose                    |
| ------------------------------------- | -------------------------- |
| `auth.ts`                             | Main Auth.js config (root) |
| `auth.config.ts`                      | Auth options and callbacks |
| `app/api/auth/[...nextauth]/route.ts` | API route handler          |

## Session Object

The session is extended beyond the default Auth.js session:

```typescript
interface Session {
  user: {
    id: string; // User UUID
    name: string; // Display name
    email: string; // Email address
    role: UserRole; // RBAC role
    organizationId: string; // Scoping organization
    organizationName: string; // Display name
  };
}
```

## Server-Side Authentication

### In Server Components

```typescript
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

### In Server Actions

```typescript
"use server";
import { auth } from "@/auth";

export async function protectedAction() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }
  // proceed...
}
```

### In API Routes

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // proceed...
}
```

## Client-Side Authentication

### Auth Provider

The app wraps children with `<AuthProvider>` in the root layout:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/components/providers/auth-provider";

<AuthProvider>{children}</AuthProvider>;
```

### useSession Hook

```tsx
"use client";
import { useSession } from "next-auth/react";

function UserInfo() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Skeleton />;
  if (!session) return <LoginButton />;

  return <span>{session.user.name}</span>;
}
```

### Sign In / Sign Out

```typescript
import { signIn, signOut } from "next-auth/react";

// Sign in
await signIn("credentials", {
  email: "user@example.com",
  password: "password",
  redirect: false,
});

// Sign out
await signOut({ callbackUrl: "/auth/login" });
```

## Type Extensions

Auth.js types are extended in `types/next-auth.d.ts`:

```typescript
declare module "next-auth" {
  interface User {
    role: UserRole;
    organizationId: string;
    organizationName: string;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}
```
