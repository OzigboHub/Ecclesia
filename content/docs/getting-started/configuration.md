---
title: Configuration
description: Configure environment variables, feature toggles, and application settings
section: getting-started
order: 4
---

# Configuration

Ecclesia DPM uses environment variables for service configuration and database-driven feature toggles for per-organization settings.

## Environment Variables

### Required Variables

| Variable          | Description                    | Example                               |
| ----------------- | ------------------------------ | ------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string   | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Auth.js session encryption key | Random 32+ char string                |
| `NEXTAUTH_URL`    | Application base URL           | `http://localhost:3000`               |
| `AUTH_SECRET`     | Auth.js secret                 | Random 32+ char string                |

### Optional Variables

| Variable                          | Description             | Default |
| --------------------------------- | ----------------------- | ------- |
| `AWS_ACCESS_KEY_ID`               | S3 file uploads         | —       |
| `AWS_SECRET_ACCESS_KEY`           | S3 file uploads         | —       |
| `AWS_REGION`                      | S3 bucket region        | —       |
| `AWS_BUCKET_NAME`                 | S3 bucket name          | —       |
| `PAYSTACK_SECRET_KEY`             | Payment processing      | —       |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client-side Paystack    | —       |
| `RESEND_API_KEY`                  | Email service           | —       |
| `YOUTUBE_API_KEY`                 | Live stream integration | —       |

## Feature Toggle System

Features are controlled per-organization via the `OrganizationFeatureSettings` model. This allows each parish to enable only the features they need.

### Default-Enabled Features

| Feature                | Toggle                        | Description                 |
| ---------------------- | ----------------------------- | --------------------------- |
| Parishioner Management | `enableParishionerManagement` | Core member management      |
| Sacramental Records    | `enableSacramentalRecords`    | Baptism, Confirmation, etc. |
| Financial Management   | `enableFinancialManagement`   | Payments and offerings      |
| Mass Intentions        | `enableMassIntentions`        | Intention booking           |
| Appointments           | `enableAppointments`          | Booking system              |
| Announcements          | `enableAnnouncements`         | Parish announcements        |
| Email Notifications    | `enableEmailNotifications`    | Email service               |

### Default-Disabled Features

| Feature           | Toggle                   | Description              |
| ----------------- | ------------------------ | ------------------------ |
| Live Streaming    | `enableLiveStreaming`    | YouTube/Facebook streams |
| SMS Notifications | `enableSMSNotifications` | SMS service              |
| Online Payments   | `enableOnlinePayments`   | Paystack integration     |
| Mobile App        | `enableMobileApp`        | PWA features             |

### Checking Feature Toggles

**Server-side (Server Actions / API Routes):**

```typescript
import db from "@/lib/db";

const settings = await db.organizationFeatureSettings.findUnique({
  where: { organizationId: session.user.organizationId },
});

if (!settings?.enableMassIntentions) {
  return { error: "Mass intentions are not enabled for this organization" };
}
```

**Client-side (React Components):**

```typescript
import { useFeatureSettings } from "@/hooks/use-feature-settings";

function MassIntentionButton() {
  const { settings } = useFeatureSettings();

  if (!settings?.enableMassIntentions) return null;

  return <Button>Book Mass Intention</Button>;
}
```
