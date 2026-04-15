---
title: Financial Management
description: Payment recording, offerings, tithes, and donation management
section: features
order: 3
---

# Financial Management

Ecclesia provides a unified payment system for recording all financial transactions within a parish.

## Payment Model

All payments flow through the unified `Payment` model, which supports multiple purposes and methods.

### Payment Purposes

| Purpose          | Description                     |
| ---------------- | ------------------------------- |
| `OFFERING`       | Weekly/Sunday offerings         |
| `TITHE`          | Monthly tithe payments          |
| `DONATION`       | General donations               |
| `MASS_INTENTION` | Mass intention stipends         |
| `CAMPAIGN`       | Donation campaign contributions |
| `OTHER`          | Custom payment types            |

### Payment Methods

| Method          | Description               |
| --------------- | ------------------------- |
| `CASH`          | Physical cash payment     |
| `BANK_TRANSFER` | Bank transfer             |
| `CARD`          | Credit/debit card         |
| `ONLINE`        | Online payment (Paystack) |
| `POS`           | Point of sale terminal    |
| `CHEQUE`        | Cheque payment            |

## Recording Payments

### Standard Payment

```typescript
// Record an offering
await createPayment({
  amount: 5000,
  purpose: "OFFERING",
  month: 1, // January
  paymentMethod: "CASH",
  payerName: "John Doe",
  organizationId: session.user.organizationId,
});
```

### Payment on Behalf

Record a payment made by someone on behalf of another person:

```typescript
await createPayment({
  amount: 10000,
  purpose: "TITHE",
  paymentMethod: "BANK_TRANSFER",
  payerName: "Jane Smith",
  onBehalfOf: "Mary Johnson",
  organizationId: session.user.organizationId,
});
```

### Mass Intention Payment

Link a payment to a mass intention:

```typescript
await createPayment({
  amount: 2000,
  purpose: "MASS_INTENTION",
  massIntentionId: "intention-uuid",
  paymentMethod: "CASH",
  payerName: "Peter Brown",
  organizationId: session.user.organizationId,
});
```

## Receipt Generation

Every payment automatically receives a unique receipt number. Receipts can be:

- Viewed on the payment detail page
- Downloaded as PDF
- Printed directly

## Donation Campaigns

Create targeted fundraising campaigns with:

- Target amount and deadline
- Progress tracking
- Public contribution pages
- Per-campaign donation recording

## Custom Payment Types

Organizations can define custom payment types beyond the built-in purposes. These are managed through the `PaymentType` model and are organization-scoped.

## Access Control

| Role               | Permissions                                      |
| ------------------ | ------------------------------------------------ |
| `PARISH_ADMIN`     | Full access: create, view, edit, delete, reports |
| `PARISH_SECRETARY` | Create, view, edit payments                      |
| `PARISH_STAFF`     | Create payments, view own entries                |
| `OUTSTATION_ADMIN` | Full access within outstation                    |
| `PARISHIONER`      | View own payment history                         |
