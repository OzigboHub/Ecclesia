# Epic 11: Integrations

**Epic ID:** EPIC-11
**Priority:** P2 (Medium)
**Status:** To Do
**PRD Reference:** Section 6 (Integration Requirements)

---

## Epic Overview

This epic covers third-party integrations including payment gateways (Paystack, Flutterwave), communication services (SendGrid, Twilio), and external platforms (YouTube, Facebook). These integrations extend the system's capabilities and provide essential services.

---

## Features

### Feature 11.1: Payment Gateway Integration (Paystack)

### Feature 11.2: Payment Gateway Integration (Flutterwave)

### Feature 11.3: Email Service Integration (SendGrid)

### Feature 11.4: SMS Service Integration (Twilio/Termii)

### Feature 11.5: Streaming Platform Integration

---

## User Stories

### Feature 11.1: Payment Gateway Integration (Paystack)

#### US-11-001: Configure Paystack Integration

**As a** Parish Admin
**I want to** configure Paystack payment gateway
**So that** online payments can be processed

**Acceptance Criteria:**

-   [ ] Enter Paystack public key
-   [ ] Enter Paystack secret key
-   [ ] Select environment (test/live)
-   [ ] Test connection
-   [ ] Set supported payment methods
-   [ ] Configure webhook URL

**Priority:** P1
**Story Points:** 5
**PRD Ref:** IR-001

---

#### US-11-002: Process Online Donation via Paystack

**As a** Parishioner
**I want to** make online donations
**So that** I can give conveniently

**Acceptance Criteria:**

-   [ ] Select donation amount
-   [ ] Choose payment method (card, bank, mobile)
-   [ ] Paystack popup/redirect
-   [ ] Secure payment processing
-   [ ] Confirmation on success
-   [ ] Error handling on failure

**Priority:** P1
**Story Points:** 8
**PRD Ref:** IR-001, FR-FM-007

---

#### US-11-003: Handle Paystack Webhook Events

**As a** System
**I want to** process Paystack webhooks
**So that** payment status is updated automatically

**Acceptance Criteria:**

-   [ ] Webhook endpoint secured
-   [ ] Verify webhook signature
-   [ ] Process charge.success event
-   [ ] Process charge.failed event
-   [ ] Update payment record
-   [ ] Send notification to donor

**Priority:** P1
**Story Points:** 5
**PRD Ref:** IR-001

---

#### US-11-004: View Paystack Transaction History

**As a** Parish Admin
**I want to** see online payment transactions
**So that** I can reconcile with Paystack dashboard

**Acceptance Criteria:**

-   [ ] List of Paystack transactions
-   [ ] Transaction reference
-   [ ] Status (success, failed, pending)
-   [ ] Amount and fees
-   [ ] Sync with Paystack

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-001

---

#### US-11-005: Process Recurring Donations via Paystack

**As a** Parishioner
**I want to** set up recurring donations
**So that** my giving is automatic

**Acceptance Criteria:**

-   [ ] Choose recurring frequency
-   [ ] Authorize recurring charge
-   [ ] Store authorization securely
-   [ ] Process scheduled payments
-   [ ] Manage/cancel subscription
-   [ ] Send receipts

**Priority:** P3
**Story Points:** 8
**PRD Ref:** IR-001, FR-FM-007

---

### Feature 11.2: Payment Gateway Integration (Flutterwave)

#### US-11-006: Configure Flutterwave Integration

**As a** Parish Admin
**I want to** configure Flutterwave as alternative gateway
**So that** we have payment redundancy

**Acceptance Criteria:**

-   [ ] Enter Flutterwave public key
-   [ ] Enter Flutterwave secret key
-   [ ] Select environment (test/live)
-   [ ] Test connection
-   [ ] Configure webhook URL
-   [ ] Set as primary or secondary gateway

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-002

---

#### US-11-007: Process Payment via Flutterwave

**As a** Parishioner
**I want to** pay using Flutterwave
**So that** I have more payment options

**Acceptance Criteria:**

-   [ ] Flutterwave inline checkout
-   [ ] Support for cards, bank transfer
-   [ ] Support for mobile money
-   [ ] Secure transaction handling
-   [ ] Receipt generation

**Priority:** P2
**Story Points:** 8
**PRD Ref:** IR-002

---

#### US-11-008: Handle Flutterwave Webhooks

**As a** System
**I want to** process Flutterwave webhooks
**So that** transactions are tracked

**Acceptance Criteria:**

-   [ ] Webhook endpoint secured
-   [ ] Verify webhook signature
-   [ ] Process successful payments
-   [ ] Handle failed payments
-   [ ] Update system records

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-002

---

### Feature 11.3: Email Service Integration (SendGrid)

#### US-11-009: Configure SendGrid Integration

**As a** Parish Admin
**I want to** configure email service
**So that** system emails are delivered

**Acceptance Criteria:**

-   [ ] Enter SendGrid API key
-   [ ] Configure sender email address
-   [ ] Set sender name
-   [ ] Verify domain (optional)
-   [ ] Test email delivery
-   [ ] Configure email templates

**Priority:** P0
**Story Points:** 5
**PRD Ref:** IR-003

---

#### US-11-010: Send Transactional Emails

**As a** System
**I want to** send automated emails
**So that** users receive notifications

**Acceptance Criteria:**

-   [ ] Welcome email on registration
-   [ ] Password reset emails
-   [ ] Payment receipts
-   [ ] Appointment confirmations
-   [ ] Mass intention confirmations
-   [ ] Event reminders

**Priority:** P0
**Story Points:** 8
**PRD Ref:** IR-003

---

#### US-11-011: Create Email Templates

**As a** Parish Admin
**I want to** customize email templates
**So that** communications reflect our parish

**Acceptance Criteria:**

-   [ ] Template editor (basic HTML)
-   [ ] Variable placeholders
-   [ ] Parish logo/branding
-   [ ] Preview before save
-   [ ] Default templates provided

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-003

---

#### US-11-012: View Email Delivery Status

**As a** Parish Admin
**I want to** see email delivery reports
**So that** I know emails are being received

**Acceptance Criteria:**

-   [ ] Sent emails log
-   [ ] Delivery status (sent, delivered, bounced)
-   [ ] Open/click tracking (optional)
-   [ ] Failed delivery alerts
-   [ ] Retry failed emails

**Priority:** P3
**Story Points:** 5
**PRD Ref:** IR-003

---

#### US-11-013: Send Bulk Emails to Parishioners

**As a** Parish Admin
**I want to** send announcements via email
**So that** I can reach all parishioners

**Acceptance Criteria:**

-   [ ] Select recipients (all, filtered)
-   [ ] Compose message
-   [ ] Use template or custom
-   [ ] Schedule sending
-   [ ] Track delivery
-   [ ] Unsubscribe handling

**Priority:** P2
**Story Points:** 8
**PRD Ref:** IR-003

---

### Feature 11.4: SMS Service Integration (Twilio/Termii)

#### US-11-014: Configure SMS Service

**As a** Parish Admin
**I want to** configure SMS provider
**So that** text messages can be sent

**Acceptance Criteria:**

-   [ ] Select provider (Twilio, Termii)
-   [ ] Enter API credentials
-   [ ] Configure sender ID
-   [ ] Test SMS delivery
-   [ ] Set SMS character limits
-   [ ] Configure cost tracking

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-004

---

#### US-11-015: Send Transactional SMS

**As a** System
**I want to** send automated SMS
**So that** users receive time-sensitive notifications

**Acceptance Criteria:**

-   [ ] Appointment reminders
-   [ ] Payment confirmations
-   [ ] Urgent announcements
-   [ ] OTP/verification codes
-   [ ] Delivery confirmation tracking

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-004

---

#### US-11-016: Send Bulk SMS to Parishioners

**As a** Parish Admin
**I want to** send mass SMS
**So that** urgent announcements reach everyone

**Acceptance Criteria:**

-   [ ] Select recipients
-   [ ] Compose message (160 char limit)
-   [ ] Preview message count
-   [ ] Estimate cost
-   [ ] Schedule sending
-   [ ] Track delivery

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-004

---

#### US-11-017: View SMS Delivery Report

**As a** Parish Admin
**I want to** see SMS delivery status
**So that** I know messages were received

**Acceptance Criteria:**

-   [ ] List sent messages
-   [ ] Delivery status per recipient
-   [ ] Failed delivery count
-   [ ] Cost per message
-   [ ] Total spend tracking

**Priority:** P3
**Story Points:** 3
**PRD Ref:** IR-004

---

#### US-11-018: Manage SMS Credits/Budget

**As a** Parish Admin
**I want to** manage SMS spending
**So that** we stay within budget

**Acceptance Criteria:**

-   [ ] View current balance/credits
-   [ ] Set monthly budget limit
-   [ ] Alert when low balance
-   [ ] Cost estimation before send
-   [ ] Spending history

**Priority:** P3
**Story Points:** 3
**PRD Ref:** IR-004

---

### Feature 11.5: Streaming Platform Integration

#### US-11-019: Configure YouTube API Integration

**As a** Parish Admin
**I want to** connect YouTube channel
**So that** live streams are auto-detected

**Acceptance Criteria:**

-   [ ] YouTube API key configuration
-   [ ] Channel ID setup
-   [ ] Test API connection
-   [ ] Auto-fetch live stream status
-   [ ] Fetch video details

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-005

---

#### US-11-020: Fetch YouTube Live Stream Status

**As a** System
**I want to** check YouTube live status
**So that** website shows current stream

**Acceptance Criteria:**

-   [ ] Poll YouTube API periodically
-   [ ] Detect live broadcast
-   [ ] Get embed URL
-   [ ] Get viewer count
-   [ ] Handle API errors gracefully

**Priority:** P2
**Story Points:** 5
**PRD Ref:** IR-005

---

#### US-11-021: Configure Facebook Graph API

**As a** Parish Admin
**I want to** connect Facebook page
**So that** Facebook streams can be embedded

**Acceptance Criteria:**

-   [ ] Facebook app configuration
-   [ ] OAuth connection flow
-   [ ] Page selection
-   [ ] Permission scopes
-   [ ] Test connection

**Priority:** P3
**Story Points:** 5
**PRD Ref:** IR-005

---

#### US-11-022: Fetch Facebook Live Status

**As a** System
**I want to** check Facebook live status
**So that** streams are shown on website

**Acceptance Criteria:**

-   [ ] Query Graph API
-   [ ] Detect live video
-   [ ] Get embed URL
-   [ ] Handle token refresh
-   [ ] Error handling

**Priority:** P3
**Story Points:** 5
**PRD Ref:** IR-005

---

## Technical Notes

### Payment Gateway Selection

-   **Paystack**: Primary gateway for Nigeria
-   **Flutterwave**: Alternative gateway
-   Support for gateway switching if one fails
-   Unified payment interface for consistency

### Email Provider

-   **SendGrid**: Primary email service
-   Alternatives: Amazon SES, Mailgun
-   Support for templates and transactional emails
-   Bounce and complaint handling

### SMS Providers

-   **Twilio**: International reach
-   **Termii**: Nigeria-focused, cost-effective
-   Support for sender ID customization
-   Character encoding handling (GSM vs Unicode)

### API Security

-   All API keys encrypted at rest
-   Environment separation (test vs production)
-   Webhook signature verification
-   Rate limiting on outbound calls

### Feature Toggle Integration

-   `enableOnlinePayments` for payment gateways
-   `enableEmailNotifications` for SendGrid
-   `enableSMSNotifications` for Twilio/Termii
-   `enableLiveStreaming` for YouTube/Facebook

### Database Schema

```prisma
model IntegrationConfig {
  id              String           @id @default(uuid())
  provider        IntegrationProvider
  environment     Environment      @default(TEST)
  config          Json             // Encrypted credentials
  isActive        Boolean          @default(false)
  lastTestedAt    DateTime?

  organizationId  String
  organization    Organization     @relation(...)

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([organizationId, provider])
}

model WebhookEvent {
  id              String          @id @default(uuid())
  provider        String
  eventType       String
  payload         Json
  status          WebhookStatus   @default(PENDING)
  processedAt     DateTime?
  errorMessage    String?

  organizationId  String
  organization    Organization    @relation(...)

  createdAt       DateTime        @default(now())
}

model EmailLog {
  id              String          @id @default(uuid())
  templateId      String?
  recipient       String
  subject         String
  status          EmailStatus     @default(PENDING)
  messageId       String?         // Provider message ID
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  errorMessage    String?

  organizationId  String
  organization    Organization    @relation(...)

  createdAt       DateTime        @default(now())
}

model SmsLog {
  id              String          @id @default(uuid())
  recipient       String
  message         String
  status          SmsStatus       @default(PENDING)
  messageId       String?
  sentAt          DateTime?
  deliveredAt     DateTime?
  cost            Decimal?        @db.Decimal(10, 4)
  errorMessage    String?

  organizationId  String
  organization    Organization    @relation(...)

  createdAt       DateTime        @default(now())
}

enum IntegrationProvider {
  PAYSTACK
  FLUTTERWAVE
  SENDGRID
  TWILIO
  TERMII
  YOUTUBE
  FACEBOOK
}

enum Environment {
  TEST
  PRODUCTION
}

enum WebhookStatus {
  PENDING
  PROCESSED
  FAILED
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  BOUNCED
  FAILED
}

enum SmsStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

### Files to Create/Modify

-   `app/dashboard/settings/integrations/page.tsx` - Integration settings
-   `app/api/webhooks/paystack/route.ts` - Paystack webhook
-   `app/api/webhooks/flutterwave/route.ts` - Flutterwave webhook
-   `lib/integrations/paystack.ts` - Paystack client
-   `lib/integrations/flutterwave.ts` - Flutterwave client
-   `lib/integrations/sendgrid.ts` - SendGrid client
-   `lib/integrations/twilio.ts` - Twilio client
-   `lib/integrations/youtube.ts` - YouTube API client
-   `lib/integrations/facebook.ts` - Facebook API client
-   `app/actions/integration.actions.ts` - Server Actions

---

## Dependencies

-   **EPIC-01**: User Management (authentication)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)

## Dependent Epics

-   **EPIC-04**: Financial Management (uses payment gateways)
-   **EPIC-05**: Mass Intention Management (uses email/SMS for confirmations)
-   **EPIC-06**: Appointment Management (uses email/SMS for reminders)
-   **EPIC-08**: Live Streaming (uses YouTube/Facebook APIs)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-11-001 | 5            |
| US-11-002 | 8            |
| US-11-003 | 5            |
| US-11-004 | 5            |
| US-11-005 | 8            |
| US-11-006 | 5            |
| US-11-007 | 8            |
| US-11-008 | 5            |
| US-11-009 | 5            |
| US-11-010 | 8            |
| US-11-011 | 5            |
| US-11-012 | 5            |
| US-11-013 | 8            |
| US-11-014 | 5            |
| US-11-015 | 5            |
| US-11-016 | 5            |
| US-11-017 | 3            |
| US-11-018 | 3            |
| US-11-019 | 5            |
| US-11-020 | 5            |
| US-11-021 | 5            |
| US-11-022 | 5            |
| **Total** | **121**      |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |
