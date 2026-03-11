# Authentication Quick Reference

## 🔐 Authentication Setup - Quick Start

### Folder Structure
```
app/
├── (auth)/auth/
│   ├── login/          ← Login page
│   ├── register/       ← Register page
│   ├── forgot-password/ ← Password reset request
│   ├── reset-password/  ← Password reset with token
│   └── error/          ← Error page (NEW)
└── actions/
    └── auth.actions.ts  ← All auth server actions

lib/validators/
└── auth.schema.ts       ← Zod schemas

proxy.ts                ← Route protection (Next.js 16)
auth.config.ts          ← Auth configuration
auth.ts                 ← Auth instance
types/next-auth.d.ts    ← Type extensions
```

## 🔑 Server Actions Reference

### Login
```typescript
const result = await login({
  email: 'user@example.com',
  password: 'SecurePass123!'
});
```

### Register
```typescript
const result = await register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  organizationId: 'org-id-123'
});
```

### Logout
```typescript
await logout(); // Auto-redirects to /auth/login
```

### Password Reset
```typescript
// Step 1: Request reset
const result = await requestPasswordReset('user@example.com');

// Step 2: Validate token
const valid = await validateResetToken(token);

// Step 3: Reset password
const result = await resetPassword({
  token,
  password: 'NewSecurePass123!',
  confirmPassword: 'NewSecurePass123!'
});
```

## 💻 Component Usage

### In Server Component
```typescript
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();
  console.log(session.user.organizationId); // Access org context
  console.log(session.user.role); // Access role
}
```

### In Client Component with Server Action
```typescript
'use client';

import { login } from '@/app/actions/auth.actions';
import { useTransition } from 'react';

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const handleLogin = (email: string, password: string) => {
    startTransition(async () => {
      const result = await login({ email, password });
      if (result.success) {
        // Redirect handled by server action
        router.push('/dashboard');
      } else {
        // Show error: result.message
      }
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### Protected Route Component
```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      {/* Dashboard content */}
    </ProtectedRoute>
  );
}
```

## 🛣️ Routes Overview

| Route | Protected | Requires Auth | Purpose |
|-------|-----------|---------------|---------|
| `/auth/login` | No | No | Login form |
| `/auth/register` | No | No | Registration form |
| `/auth/forgot-password` | No | No | Password reset request |
| `/auth/reset-password` | No | No | Password reset form |
| `/auth/error` | No | No | Auth error display |
| `/dashboard` | Yes | **Yes** | Dashboard (protected) |
| `/dashboard/*` | Yes | **Yes** | All dashboard routes |
| `/` | No | No | Public home page |
| `/p/*` | No | No | Public pages |
| `/donate/*` | No | No | Public donate page |

## 🔒 Session Data

```typescript
const session = await auth();

// Available properties:
session.user.id              // User UUID
session.user.email           // User email
session.user.name            // "FirstName LastName"
session.user.role            // UserRole enum
session.user.organizationId  // Organization UUID
session.user.organizationName // Organization name
session.user.parishionerId   // Parishioner UUID (if exists)

// Session expires in 24 hours
```

## 📝 Form Validation

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (!@#$%^&*)

### Email
- ✅ Valid email format
- ✅ Case-insensitive
- ✅ Trimmed whitespace

### Names
- ✅ Minimum 2 characters
- ✅ Maximum 50 characters
- ✅ Trimmed whitespace

## 🐛 Common Issues & Solutions

### Issue: "Invalid email or password"
**Solution:** Check email/password are correct, account is active, and user exists

### Issue: Session not persisting
**Solution:** Ensure cookies are enabled in browser

### Issue: Redirect loop on login
**Solution:** Check proxy.ts matcher config, verify session data is complete

### Issue: Password reset token invalid
**Solution:** Token expires after 1 hour, verify it's not used already

### Issue: Organization not found on register
**Solution:** Ensure organization exists in database with correct ID

## 🔄 Common Workflows

### Complete Login Flow
```typescript
'use client';

import { login } from '@/app/actions/auth.actions';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data) => {
    startTransition(async () => {
      const result = await login(data);

      if (result.success) {
        toast.success('Login successful!');
        router.push('/dashboard');
        router.refresh(); // Refresh server components
      } else {
        toast.error(result.message);
      }
    });
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Authenticated Link
```typescript
import Link from 'next/link';
import { auth } from '@/auth';

export async function AuthLink() {
  const session = await auth();

  if (!session) {
    return <Link href="/auth/login">Login</Link>;
  }

  return (
    <Link href="/dashboard">
      {session.user.name}
    </Link>
  );
}
```

### Logout Button
```typescript
'use client';

import { logout } from '@/app/actions/auth.actions';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <Button 
      onClick={() => logout()}
      variant="destructive"
    >
      Logout
    </Button>
  );
}
```

## 📊 ActionResponse Pattern

```typescript
// Success response
{
  success: true,
  message: "Login successful",
  data: { id: "user-123" }
}

// Validation error response
{
  success: false,
  message: "Validation failed",
  errors: {
    email: ["Invalid email address"],
    password: ["Password must contain uppercase letter"]
  }
}

// Server error response
{
  success: false,
  message: "An unexpected error occurred"
}
```

## 🌐 Environment Variables

Ensure these are set in `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL=your-database-connection-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔨 Useful Commands

```bash
# Start dev server
pnpm dev

# Check for type errors
pnpm tsc --noEmit

# Generate Prisma Client
pnpm prisma generate

# Create migration after schema update
pnpm prisma migrate dev --name add_optional_feature

# Open Prisma Studio (GUI)
pnpm prisma studio
```

## 📚 Additional Resources

- **Full Guide:** [docs/AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
- **Implementation Details:** [docs/AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md)
- **Auth.js Docs:** https://authjs.dev/
- **Next.js Auth Guide:** https://nextjs.org/docs/app/building-your-application/authentication

---

**Last Updated:** March 10, 2026  
**Status:** ✅ Production Ready
