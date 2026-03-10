# Authentication Implementation Guide

## Overview

The authentication system has been fully implemented using **Auth.js (NextAuth v5)** with **server actions** and a modern proxy-based middleware architecture following Next.js 16 best practices.

## Architecture

### 1. **Auth Configuration** (`auth.config.ts`, `auth.ts`, `auth.proxy.config.ts`)

- **Split configuration pattern**: Separates database-dependent config from edge-safe proxy config
- **Credentials provider**: Email/password authentication with bcrypt hashing
- **JWT session strategy**: 24-hour session duration with custom claim extensions
- **Extended session**: Added `id`, `role`, `organizationId`, `organizationName`, `parishionerId` to JWT

### 2. **Middleware → Proxy Migration** (`proxy.ts`)

Replaced deprecated `middleware.ts` with modern `proxy.ts`:

- Validates authentication on protected routes
- Redirects authenticated users away from auth pages
- Redirects unauthenticated users to login (except public pages)

## Server Actions Implementation

### Login Action

```typescript
export async function login(data: {
  email: string;
  password: string;
}): Promise<ActionResponse>;
```

**Features:**

- Zod validation for input sanitization
- Credentials provider integration
- Comprehensive error handling with specific error messages
- Returns `ActionResponse` with structured data

### Register Action

```typescript
export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationId: string;
  role?: string;
}): Promise<ActionResponse>;
```

**Features:**

- Full Zod validation including password confirmation
- Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
- Organization existence verification
- Duplicate email detection
- Bcrypt password hashing (cost: 10)

### Logout Action

```typescript
export async function logout(): Promise<ActionResponse>;
```

**Features:**

- Server-side session termination
- Automatic redirect to login page
- No client-side router dependency

### Password Reset Actions

**requestPasswordReset()** - Generates time-limited reset token
**validateResetToken()** - Validates token validity
**resetPassword()** - Updates password using valid token

## Pages & UI

### 1. **Login Page** (`/auth/login`)

- Clean two-column layout (desktop) / centered mobile
- Email and password fields with validation
- Password visibility toggle
- "Forgot password?" link
- Register account link
- Loading states with disabled inputs

### 2. **Register Page** (`/auth/register`)

- First name, last name, email, password fields
- Organization/parish selector dropdown with hierarchy display
- Real-time password requirement indicator
- Password confirmation with visibility toggles
- Validation error display per field
- Loading states

### 3. **Forgot Password Page** (`/auth/forgot-password`)

- Email field for account lookup
- Success screen showing email confirmation message
- Security-aware: Shows success even if email doesn't exist
- Option to try different email

### 4. **Reset Password Page** (`/auth/reset-password`)

- Token validation on mount
- Password fields with requirements indicator
- Real-time requirement validation
- Success screen with login redirect
- Handles expired/invalid tokens gracefully

### 5. **Error Page** (`/auth/error`)

- Comprehensive error messages for all Auth.js error types
- Visual error indicator (alert icon)
- Options to return to login or home
- Error code display for debugging

## Security Features

### Password Security

- ✅ Minimum 8 characters
- ✅ Uppercase letter requirement
- ✅ Lowercase letter requirement
- ✅ Number requirement
- ✅ Special character requirement
- ✅ Bcrypt hashing (cost: 10)

### Session Security

- ✅ JWT-based sessions (no database lookups on every request)
- ✅ 24-hour expiration
- ✅ Secure random token generation for password resets
- ✅ One-time use tokens (checked via `usedAt` field)
- ✅ Token expiration (1 hour default)

### Route Protection

- ✅ Middleware-level protection for dashboard routes
- ✅ Server-side auth checks in server actions
- ✅ Client-side protection with `ProtectedRoute` component
- ✅ Automatic redirection on unauthorized access

### Data Validation

- ✅ Zod schemas for all inputs
- ✅ Email format validation
- ✅ Password confirmation matching
- ✅ Organization existence verification
- ✅ Duplicate account prevention

## File Structure

```
app/
├── (auth)/
│   └── auth/
│       ├── login/page.tsx          ← Login UI
│       ├── register/page.tsx        ← Register UI
│       ├── forgot-password/page.tsx ← Password reset request
│       ├── reset-password/page.tsx  ← Reset with token
│       └── error/page.tsx           ← Error handling
├── actions/
│   └── auth.actions.ts             ← All auth server actions
├── api/
│   └── auth/[...nextauth]/route.ts ← NextAuth API route
lib/
├── validators/
│   └── auth.schema.ts              ← Zod schemas
├── db.ts                            ← Prisma client
└── features/
    └── auth.ts                      ← Auth utilities
types/
└── next-auth.d.ts                  ← Session type extensions
auth.config.ts                       ← Auth configuration
auth.ts                              ← Auth instance
auth.proxy.config.ts                 ← Edge-safe proxy config
proxy.ts                             ← Route protection middleware
```

## Usage Examples

### Server Component - Check Authentication

```typescript
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      Welcome {session.user.name}!
      Organization: {session.user.organizationId}
    </div>
  );
}
```

### Client Component - Server Action Form

```typescript
'use client';

import { register } from '@/app/actions/auth.actions';
import { useTransition } from 'react';

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await register(data);

      if (result.success) {
        // Redirect to login
        router.push('/auth/login');
      } else {
        // Show error
        toast.error(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
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
      variant="ghost"
    >
      Logout
    </Button>
  );
}
```

## Database Schema Requirements

Your Prisma schema should include:

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  firstName         String
  lastName          String
  password          String?
  role              UserRole
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  isActive          Boolean  @default(true)
  lastLogin         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

enum UserRole {
  SUPER_ADMIN
  PARISH_ADMIN
  PARISH_SECRETARY
  PARISH_STAFF
  OUTSTATION_ADMIN
  ORGANIZATION_PRESIDENT
  ORGANIZATION_SECRETARY
  PARISHIONER
}
```

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Generate Prisma Client after schema changes
pnpm prisma generate

# Create and apply migrations
pnpm prisma migrate dev --name <migration_name>

# Open database GUI
pnpm prisma studio
```

## Testing the Auth Flow

### Test 1: Register User

1. Navigate to `/auth/register`
2. Fill in form with valid organization selection
3. Should redirect to `/auth/login` with success message

### Test 2: Login

1. Navigate to `/auth/login`
2. Enter registered email and password
3. Should redirect to `/dashboard` automatically

### Test 3: Protected Routes

1. Try accessing `/dashboard` without auth
2. Should redirect to `/auth/login`

### Test 4: Authenticated User on Auth Pages

1. Login to account
2. Navigate to `/auth/login`
3. Should redirect to `/dashboard`

### Test 5: Forgot Password

1. Navigate to `/auth/forgot-password`
2. Enter email
3. Should show success message
4. (In dev, token appears in server logs)

### Test 6: Reset Password

1. Use token from password reset email
2. Navigate to `/auth/reset-password?token=<TOKEN>`
3. Enter new password
4. Should redirect to login with success message

## Troubleshooting

### Issue: "Unauthorized" on login

**Solution:** Check that credentials are being validated correctly in `auth.config.ts`

### Issue: Session not persisting

**Solution:** Verify JWT setup in `auth.config.ts` callbacks and ensure `session.user` properties match your custom fields

### Issue: Redirect loops

**Solution:** Check `proxy.ts` matcher configuration - ensure public routes are excluded

### Issue: Password reset token not working

**Solution:** Verify `PasswordResetToken` table exists and token format matches generation

## Next Steps

1. **Email Integration**: Implement email sending in `requestPasswordReset()` using your email provider (Resend, SendGrid, etc.)
2. **Two-Factor Authentication**: Add 2FA support if needed
3. **OAuth Integration**: Add Google/GitHub OAuth providers in `auth.config.ts`
4. **Account Confirmation**: Add email confirmation requirement for new accounts
5. **Audit Logging**: Log auth events for security monitoring

## Key Files Modified

- ✅ `app/actions/auth.actions.ts` - Enhanced server actions with full validation
- ✅ `app/(auth)/auth/register/page.tsx` - Register UI already well-implemented
- ✅ `app/(auth)/auth/login/page.tsx` - Login UI already well-implemented
- ✅ `app/(auth)/auth/error/page.tsx` - New comprehensive error page
- ✅ `proxy.ts` - Created from migrated middleware.ts
- ✅ `auth.config.ts` - Existing, fully configured
- ✅ `auth.ts` - Existing, properly split from config

## References

- [Auth.js Documentation](https://authjs.dev/)
- [Next.js 16 Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Bcrypt Security](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
