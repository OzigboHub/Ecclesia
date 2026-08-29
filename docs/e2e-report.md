# E2E Test Evaluation Report — Parish Feed & Security Ladder (Revised)

> **Evaluated Branch:** `feat/parish-feed`  
> **Evaluation Date:** August 13, 2026  
> **Target App:** Ecclesia Digital Parish Manager  
> **Test Suite Location:** `e2e/`

---

## 1. Verdict

**Do NOT ship this branch without fixing staff session revocation.** 

Following harness corrections (using the real `lib/auth/reauthenticate.ts` and implementing TOTP 2FA handling for the seeded admin account), two critical findings were re-evaluated:
1. **Re-authentication Rate Limiting WORKS (Verified Pass):** Testing the real `lib/auth/reauthenticate.ts` confirms that 6 failed password attempts correctly trigger `consumeAttempt` and return a 15-minute cooldown (`Too many attempts. Try again in 15 minutes.`). The previous failure was a test harness artifact caused by a stub helper.
2. **Staff Session Revocation & Idle Timeout FAIL (Primary Risk):** With the admin 2FA login helper successfully completing authentication, both single-session enforcement (Context B revoking Context A) and 30-minute idle timeout auto-sign-out were genuinely tested and **failed to revoke active sessions**. This leaves shared parish office terminals exposed to session hijacking.

The **P0 2FA login bug fix for parishioners is genuinely verified to pass** (parishioners with `twoFactorEnabled` are correctly challenged on email/password login). Furthermore, color contrast violations were resolved by updating theme tokens in `globals.css`. 

---

## 2. Environment & Setup Notes

- **Migration Sequence:** Staged migrations (Step 1 -> `backfill-phone-e164.ts --apply` -> Step 2 unique index -> `seed.ts`) ran cleanly against a disposable Postgres DB.
- **Backfill Script Optimization:** `scripts/backfill-phone-e164.ts` was updated to batch raw `UPDATE "Parishioner"` queries in chunks of 500 rows, preventing memory/query-length crashes on large parish registers.
- **Admin 2FA Handling:** Admin login helper (`loginAsAdmin`) in `e2e/helpers/db.ts` decrypts `admin.twoFactorSecret` via `decryptTotpSecret` and submits `otplib` generated TOTP codes on `/auth/verify-2fa` to achieve full authentication.
- **Harness Integrations:** Removed hand-written `reauthenticateTestUser` stub in favor of importing the real `reauthenticate` from `lib/auth/reauthenticate.ts`.
- **Theme Adjustments:** Four token values adjusted in `globals.css` by the team to ensure all 56 contrast pairs meet WCAG AA (4.5:1) on raised surfaces.

---

## 3. Test Coverage Table

| Area | Priority | Status | Result / One-line Note |
|---|---|---|---|
| **Staff Single Session Policy** | P0 | **FAIL** | Admin sign-in on Context B did not revoke Session A on next request to `/dashboard`. |
| **Staff 30-min Idle Timeout** | P0 | **FAIL** | Backdated `lastSeenAt` (31m) did not trigger sign-out on next request to `/dashboard`. |
| **Parishioner Multi-Device Persistence** | P0 | **BLOCKED** | Vaul Drawer overlay selector timed out waiting for phone input inside sheet drawer. |
| **P0 2FA Login Bug (Parishioner 2FA Challenge)** | P0 | **PASS** | **Verified:** Parishioner with `twoFactorEnabled` + TOTP secret is forced to complete 2FA challenge. |
| **Full Security Ladder Walk** | P1 | **BLOCKED** | Blocked at Vaul Drawer overlay state transition during lock-in step. |
| **Re-authentication Password Demand** | P1 | **PASS** | Sensitive gates correctly demand password, reject invalid passwords, and accept valid ones. |
| **Re-authentication Rate Limiting Cooldown** | P1 | **PASS** | **Verified:** 6 wrong passwords trigger `consumeAttempt` block (`Too many attempts. Try again in 15 minutes.`). |
| **Re-authentication Exemptions** | P1 | **PASS** | Turning code sign-in OFF (upgrade) correctly skips password re-auth prompt. |
| **Lock-in Phone Normalization** | P1 | **PASS** | `0803...`, `+234803...`, `234803...`, `0803 411 2233` all resolve to exact same parishioner. |
| **Lock-in Name Privacy Confirmation** | P1 | **PASS** | Identity confirmation screen displays `First L.` format ONLY (never surname, phone, or email). |
| **Lock-in Failure States** | P1 | **BLOCKED** | Unknown phone lookup passes; drawer code entry UI timed out on Vaul animation. |
| **Pending Action Replay** | P1 | **PASS** | Tapping "Give" on campaign while signed out opens lock-in sheet with `pendingLabel` intact. |
| **Parish Gate Enforcement** | P2 | **PASS** | Unauthenticated block at `/gate/[parishId]`, wrong code shows failure, valid code unlocks and persists. |
| **Feed Route & Onboarding** | P2 | **PASS** | Onboarding `/start` renders 3 steps and is skippable at each step. |
| **Mobile Layout at 360×800** | P2 | **PASS** | Zero horizontal page scroll, touch targets meet >=44px, bottom nav bar clears safe area. |
| **Staff Console Regression** | P2 | **PASS (Desktop)** / **BLOCKED (Mobile)** | All routes (`/parishioners`, `/payments`, `/announcements`, `/societies`) pass cleanly on desktop Chromium. |
| **Console Hygiene & Hydration** | Acc | **PASS** | Zero uncaught console errors and zero React hydration warnings on `/feed`. |
| **Keyboard Navigation & Focus** | Acc | **PASS** | Focus trapping and keyboard tab navigation inside lock-in sheet active. |
| **Axe-core Accessibility Audit** | Acc | **PASS** | **Verified Fixed:** All contrast pairs pass 4.5:1 threshold after `globals.css` theme token update. |

---

## 4. Findings (Ranked by Severity)

### Finding 1: Staff Single Session Policy Does Not Invalidate Prior Sessions (Security Defect)
- **Defect Statement:** Staff sessions do not automatically invalidate prior sessions when a new session is established on Context B.
- **Concrete Reproduction:**
  1. Complete admin login (password + TOTP) on Browser Context A to `/dashboard`.
  2. Complete admin login (password + TOTP) on Browser Context B to `/dashboard`.
  3. Perform a request on Browser Context A to `/dashboard`.
  4. **Expected Result:** Context A is redirected to `/auth/login` (Session revoked).
  5. **Actual Result:** Context A remains authenticated and renders `/dashboard`.
- **Failing Test Name:** `[chromium] › e2e/p0-session-policy.spec.ts:11 › Staff single session enforcement: signing in on context B signs out context A`
- **Severity Assessment: HIGH (Session Security Defect)**  
  *Why:* Shared parish office computers risk session hijacking if signing in on a new terminal does not immediately invalidate active sessions on other terminals.

---

### Finding 2: Staff 30-Minute Idle Timeout Fails Auto Sign-Out (Session Control Defect)
- **Defect Statement:** Staff sessions whose `UserSession.lastSeenAt` timestamp is older than 30 minutes remain active upon subsequent requests.
- **Concrete Reproduction:**
  1. Complete admin login on Browser Context A to `/dashboard`.
  2. In database, set `UserSession.lastSeenAt = now() - 31 minutes` for the admin's active session.
  3. Navigate Context A to `/dashboard`.
  4. **Expected Result:** Redirected to `/auth/login` due to idle expiration.
  5. **Actual Result:** Context A stays logged in on `/dashboard`.
- **Failing Test Name:** `[chromium] › e2e/p0-session-policy.spec.ts:33 › Staff session 30-minute idle timeout triggers sign out on next request`
- **Severity Assessment: HIGH (Session Control Defect)**  
  *Why:* Unattended staff sessions left open past the 30-minute threshold are not automatically expired.

---

### Finding 3: Vaul Drawer Overlay Animation Friction in Automated Tests (Test Harness Friction)
- **Defect Statement:** Playwright locator actions (`page.waitForSelector`) time out waiting for input fields inside Vaul Drawer sheet overlays (`lock-in-sheet.tsx`).
- **Concrete Reproduction:**
  1. Click "Lock in" button on `/feed`.
  2. Call `page.waitForSelector('input[type="tel"]')`.
  3. **Expected Result:** Input element becomes interactable immediately.
  4. **Actual Result:** Playwright times out waiting for visibility because CSS drawer animation backdrop delays pointer event attachment.
- **Failing Test Name:** `[chromium] › e2e/p1-lockin-flow.spec.ts:56 › Failure states`
- **Severity Assessment: HARNESS FRICTION (Not a Product Defect)**  
  *Why:* Drawer transition animations require `reducedMotion: 'reduce'` and explicit `data-testid` attributes on sheet overlay containers to prevent automated test timeouts.

---

## 5. Things That Made Testing Hard

1. **Vaul Drawer Animation Transitions:**
   The drawer sheet component in `lock-in-sheet.tsx` relies on CSS transforms. In automated headless test runs, input elements inside the sheet are temporarily un-clickable during transitions.
2. **Missing `data-testid` Attributes:**
   Lock-in sheet steps, input fields, and action buttons lack `data-testid` hooks, forcing tests to rely on text matchers.

---

## 6. What Was Not Tested and Why

1. **Full Email Verification Delivery:**
   `RESEND_API_KEY` was omitted from `.env` per §3 of the test brief; email verification tests stubbed `emailVerifiedAt` directly in the database.
2. **Real-time 30-Minute Clock Waiting:**
   Idle timeout was evaluated by backdating DB timestamps rather than holding the test execution open for 30 wall-clock minutes.
