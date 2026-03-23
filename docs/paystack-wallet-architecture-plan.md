# Paystack Wallet Architecture Plan (Parish Subaccounts)

## Goal
Enable each parish/outstation organization to operate its own wallet using Paystack subaccounts, while keeping Ecclesia multi-tenant boundaries strict.

## Core Model
- Main Paystack account = platform owner account.
- Each organization = one Paystack subaccount (`ACCT_*`).
- Every online payment is initialized with the payer organization’s subaccount.
- Verification/webhook always maps to organization and local payment record by transaction reference.

## Data Model Additions
- `Organization.paystackSubaccountCode` (nullable, unique)
- `Organization.paystackSubaccountStatus` (`PENDING | ACTIVE | DISABLED`)
- `Organization.paystackSubaccountName` (business name snapshot)
- `Payment.gateway` (`PAYSTACK` etc.)
- `Payment.gatewayReference` (Paystack reference, unique)
- `Payment.gatewayStatus` (raw/normalized status)
- `Payment.gatewayMeta` (JSON payload snapshot)

## Payment Flow (Online)
1. User creates payment intent in Ecclesia for a specific organization.
2. Server validates amount, purpose, and organization scope.
3. Server initializes Paystack transaction with:
   - `amount` in subunits
   - `email`
   - `reference` (generated in Ecclesia)
   - `subaccount` = organization subaccount code
4. Client redirects to `authorization_url`.
5. On callback + webhook, server verifies using `/transaction/verify/:reference`.
6. Ecclesia marks local payment `COMPLETED` only after verified success and exact amount/currency match.

## Webhook Design
- Endpoint: `/api/webhooks/paystack`
- Validate `x-paystack-signature` (HMAC SHA512).
- Idempotent processing keyed by `reference`.
- Accept only known Paystack IPs as secondary check.
- Persist raw payload for audit (`Payment.gatewayMeta`).

## Wallet Visibility Rules
- Parish admin sees only own organization wallet summary and payments.
- Parent parish can optionally see child outstation roll-ups if policy allows.
- No cross-organization payment list/read without explicit hierarchy authorization.

## Operational Setup
- Admin action: “Create/Link Subaccount” per organization.
- Validate bank details before creation.
- Support subaccount update (bank/account/name changes).
- Add health check for missing/disabled subaccount before checkout.

## Rollout Phases
1. **Foundation**: Paystack client wrapper + env setup + typed request helper.
2. **Subaccount Provisioning**: create/list/update/link organization subaccounts.
3. **Checkout Integration**: initialize + callback verify flow.
4. **Webhook & Reconciliation**: idempotent webhook, retries, status sync jobs.
5. **Reporting**: wallet balance proxy, settlement history, org-level financial reports.

## Security Requirements
- Keep `PAYSTACK_SECRET_KEY` server-only.
- Never trust frontend success callback without server verification.
- Enforce strict org scoping at every read/write.
- Log all gateway transitions for audit.

## Open Decisions Before Build
- Whether each outstation also gets its own subaccount or inherits parent parish wallet.
- Whether Paystack fees are borne by organization subaccount or platform account.
- Whether platform commission is required (`split_code`) or pure direct subaccount routing.
- Settlement schedule policy (`auto`, `weekly`, `monthly`, `manual`) per organization.
