---
title: User Management
description: Authentication, authorization, and user management features
section: features
order: 2
---

# User Management

User management covers authentication, session management, role-based access control, and user administration.

## Authentication Flow

Ecclesia uses Auth.js (NextAuth v5) with a JWT strategy and 24-hour sessions.

### Login

1. User submits email + password
2. Server validates credentials against bcrypt hash
3. Checks account lockout status
4. On success: creates JWT session with extended fields
5. On failure: increments `failedLoginAttempts`, locks after threshold

### Session Structure

The JWT session is extended with organization-specific fields:

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
  };
}
```

### Server-Side Auth Check

```typescript
import { auth } from "@/auth";

const session = await auth();
if (!session) {
  redirect("/auth/login");
}
```

### Client-Side Protected Routes

```tsx
<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>
```

## Role-Based Access Control

### Role Hierarchy

| Role                     | Scope                | Permissions                                     |
| ------------------------ | -------------------- | ----------------------------------------------- |
| `SUPER_ADMIN`            | Platform             | Full access to all organizations and settings   |
| `PARISH_ADMIN`           | Parish + Outstations | Full parish management, user creation, reports  |
| `PARISH_SECRETARY`       | Parish               | Member management, payments, scheduling         |
| `PARISH_STAFF`           | Parish               | Limited data entry and viewing                  |
| `OUTSTATION_ADMIN`       | Outstation           | Outstation-level management only                |
| `ORGANIZATION_PRESIDENT` | Society              | Society member and activity management          |
| `ORGANIZATION_SECRETARY` | Society              | Society record keeping                          |
| `PARISHIONER`            | Self                 | Self-service: intentions, appointments, history |

### Implementing Role Checks

**Server-side:**

```typescript
import { auth } from "@/auth";

export async function adminAction() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const adminRoles = ["SUPER_ADMIN", "PARISH_ADMIN"];
  if (!adminRoles.includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }

  // proceed with action
}
```

**Client-side:**

```typescript
import { useRole } from "@/hooks/use-role";

function AdminPanel() {
  const { role, isAdmin } = useRole();

  if (!isAdmin) return null;

  return <AdminContent />;
}
```

## Account Security

### Lockout Mechanism

- Tracks `failedLoginAttempts` per user
- Locks account after configurable threshold
- `lockoutUntil` timestamp controls lock duration
- Resets on successful login

### Audit Logging

- All authentication events are logged
- Tracks: login success/failure, logout, session creation
- Stores IP address and user agent
- Admin-viewable audit trail in Settings
