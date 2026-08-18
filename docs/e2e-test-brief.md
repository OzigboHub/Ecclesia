# E2E test brief — parish feed & security ladder

> **For an autonomous coding agent.** Everything needed is below; you are not
> expected to have prior context on this repository. Read it fully before
> starting, especially §1 and §3 — §3 describes constraints that will otherwise
> waste hours.

---

## 0. Mission

Branch `feat/parish-feed` adds two things to Ecclesia, a Catholic parish
management app:

1. **A public parish feed** — a social-style timeline anyone can browse, with
   device-local personalization and an optional per-parish gate code.
2. **A security ladder** — parishioners sign in with a phone number and a
   one-time code from the parish office, and can optionally climb to
   email+password, then two-factor, then switch the code door off entirely.

Write and run Playwright end-to-end tests against it, then produce the report
described in §7. **Report what you find — do not fix it.** If a test reveals a
bug, capture it precisely and move on. The value here is an accurate picture,
not a green board.

---

## 1. Safety constraints — read first

- **Use a disposable database.** A local Postgres or a throwaway Neon branch.
  Never point this at production or at a database anyone else is using. The
  setup in §2 writes schema changes and seeds 100 records.
- **Do not run `prisma migrate dev` or `prisma db push` blindly.** This project
  has no `prisma/migrations` directory; migrations are hand-written SQL in
  `prisma/manual/`, and one of them is deliberately staged in steps. Follow §2
  exactly.
- **Do not commit, push, or open a PR.** Leave the working tree as you found it
  apart from test files. Put tests in `e2e/` and any Playwright config at the
  repo root.
- **Do not modify application code**, even to make a test pass. If a selector is
  missing, use a text or role selector and note the friction in your report.

---

## 2. Setup

Stack: Next.js 16 (App Router), React 19, Prisma 7 + Postgres, Auth.js v5 beta,
Tailwind v4. Package manager: `pnpm`.

```bash
pnpm install
```

**Environment** — create `.env` with at minimum:

```
DATABASE_URL=postgresql://…        # your disposable database
AUTH_SECRET=<any 32+ char string>
TWO_FACTOR_ENCRYPTION_KEY=<32 bytes, base64>   # required for TOTP
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`RESEND_API_KEY` is deliberately **omitted** — see §3.

**Database, in this order.** Order matters; step 3 fails if step 2 is skipped.

1. Apply the two manual migrations:
   `prisma/manual/20260812_parish_feed.sql` — **STEP 1 only**, the section above
   the `STEP 2` banner. Then `prisma/manual/20260813_security_ladder.sql` in
   full.
2. `pnpm tsx scripts/backfill-phone-e164.ts --apply`
   Populates `Parishioner.phoneE164`, which is the lock-in lookup key. **Without
   this, every lock-in test fails with "we couldn't find that number" and the
   failure looks like a product bug rather than a setup mistake.**
3. Apply STEP 2 of `20260812_parish_feed.sql` — the commented-out
   `CREATE UNIQUE INDEX`. Uncomment and run it. If it errors on duplicates, the
   backfill report in step 2 will say which; on seeded data it should be clean.
4. `pnpm prisma generate && pnpm tsx prisma/seed.ts`

**Seeded fixtures**

| What | Value |
|---|---|
| Organization | `Ecclesia Central Parish` |
| Super admin | `admin@ecclesialight.com` / `@Ecli#$QAWW@20Cia27$` |
| Parishioners | 100, phones `080…` (11 digits), emails `@example.com` |

Seeded parishioners have **no linked `User`** and **no password**. That is the
correct starting state: they are at rung 0.

**Run it**: `pnpm dev` (port 3000). Confirm the app boots and `/feed` renders
before writing a single test. If it doesn't, stop and report that — everything
downstream is meaningless.

**Playwright is not installed.** Add it yourself
(`pnpm add -D @playwright/test && pnpm exec playwright install`). Use Chromium
plus one mobile project at **360×800** — the feed is designed mobile-first at
that width and desktop-only testing will miss most of it.

---

## 3. Testability constraints — this will save you hours

**One-time codes are stored as one-way hashes. You cannot read them from the
database.**

| Secret | Storage | How to obtain it in a test |
|---|---|---|
| Parishioner access code | bcrypt | **Readable in the UI**: sign in as admin → parishioner detail page → "Issue a code". Shown once. |
| Parish gate code | bcrypt | **You choose it**: set it as admin under Organization settings. |
| Email verification code | SHA-256 | **Not recoverable.** See below. |
| 2FA email code | SHA-256 | **Not recoverable.** Use TOTP instead. |

**Consequences you must design around:**

- **Use TOTP for every two-factor test, never the EMAIL method.** The TOTP
  secret is displayed in the UI during setup. Generate valid codes with
  `otplib`, already a dependency:
  ```ts
  import { authenticator } from "otplib";
  authenticator.options = { digits: 6, step: 30, window: 1 }; // must match lib/auth/two-factor.ts
  const code = authenticator.generate(secretFromUi);
  ```
- **Email verification cannot be completed through the UI** without a mail
  service. With `RESEND_API_KEY` unset, `sendEmailVerification` returns a clean
  failure — **test that failure path through the UI**, then, for tests that need
  to get past this rung, set `User.emailVerifiedAt` directly via a Prisma helper
  in your test setup. Note in your report that this rung is not end-to-end
  coverable as built.
- **The 30-minute idle timeout cannot be waited out.** To test it, set
  `UserSession.lastSeenAt` to 31+ minutes ago directly in the database, then
  make a request.
- **Sessions are JWT cookies.** Use Playwright storage states to hold several
  identities at once, and separate browser contexts to simulate two devices.

---

## 4. What matters most

Ordered by risk. If you run out of time, having P0 done properly beats partial
coverage of everything.

### P0 — Session policy, both directions

The rule: **staff are held to one live session and a 30-minute idle timeout;
parishioners hold several devices for six months.** This was recently rekeyed
from "how you signed in" to "what role you are", and it touches every account in
the system.

- Staff sign in on context A, then context B → **A is signed out.**
- Staff session with `lastSeenAt` backdated 31 minutes → next request signs them
  out.
- Parishioner locks in on context A, then context B → **both stay live**, and
  both appear under `/me/devices`.
- A parishioner **who has set a password** and signs in with it → still holds two
  devices, still survives a backdated `lastSeenAt`. *This is the specific
  regression the rekey was meant to fix: improving your security must not
  downgrade your session.*

### P0 — The two-factor login bug

Previously, an account outside the three staff roles had `twoFactorEnabled`
silently ignored at login — enabled, never challenged.

- Set `twoFactorEnabled` + a TOTP secret on a **PARISHIONER** directly in the
  database, then sign in with email and password. **A challenge must be
  demanded.** This is the single highest-value assertion in the brief.

### P1 — The ladder, walked end to end

On one parishioner: lock in with phone + code → set a password → sign out → sign
back in with the password *inside the feed's lock-in sheet* → (stub
`emailVerifiedAt`) → enable TOTP two-factor → sign out → sign in and confirm the
challenge appears **as a step in the sheet, not a redirect to `/auth/verify-2fa`**
→ turn code sign-in off.

Then, with code sign-in off:
- `issueAccessCode` refuses in the admin UI, with copy explaining why.
- The lock-in sheet routes that phone number to the **password** step, not the
  code step. It must never say "that code didn't match".
- An admin can restore code sign-in from the parishioner detail page, and the
  code path works again afterwards.

### P1 — Re-authentication gates

Three actions require the password even with a live session. For each: confirm
it is demanded, that a **wrong** password is rejected, and that the action
succeeds with the right one.

- Turn two-factor off (feed `/me/security`, and the console
  `/settings/security/2fa`)
- Re-enable parish-code sign-in
- Sign out a device **other than** the current one

And the deliberate exceptions — these must **not** ask for a password:
- Signing out **the current** device
- Turning code sign-in **off** (an upgrade)

Rate limiting: 6 wrong passwords in a row should produce a cool-down message
with a time, not an endless retry.

### P1 — Lock-in, including the failure states

Phone → confirm ("Adaobi O." — first name and last initial only, **never** a
full surname, phone or email) → code → done. Then each failure branch:
unknown number, wrong code (shows attempts remaining), too many attempts
(cool-down), and phone-number formats: `0803…`, `+234803…`, `234803…`,
`0803 411 2233` must all resolve to the same person.

**The pending action must replay.** Tap "Give" on a campaign while signed out,
complete lock-in, and the give flow should resume by itself — no second tap, no
lost scroll position. This is the point of the whole flow.

### P2 — Everything else

- **Parish gate**: set a code as admin, confirm a fresh context is stopped at
  `/gate/[parishId]`, wrong code shows attempts remaining, correct code lets
  them through and the device is remembered on reload.
- **Feed**: `/start` onboarding (3 steps, skippable at each), parish switching,
  the 8 card types rendering where data exists, empty state, loading skeleton.
- **Theme**: light and dark both legible; toggle persists across reload. Assert
  computed contrast on body text if you can.
- **Mobile at 360×800**: no horizontal page scroll anywhere; every interactive
  element ≥44×44px; the bottom tab bar clears the safe area.
- **Roster import** (`/parishioners/import`): CSV with mixed phone formats and a
  deliberate duplicate → the preview must show per-row verdicts before anything
  is written, and the commit must be all-or-nothing.
- **Staff console regression**: parishioners, payments, announcements, societies
  still load and function for the seeded admin. The feed work touched shared
  auth; confirm it broke nothing.

---

## 5. Accessibility & console hygiene

While you are in there, on the feed routes:

- Zero uncaught console errors and zero unhandled promise rejections.
- No React hydration warnings.
- Keyboard-only: the lock-in sheet and gate screen must be completable, and
  focus must be trapped inside the sheet while it is open.
- Run `@axe-core/playwright` on `/feed`, `/me`, `/me/security` and report
  serious/critical violations only.

---

## 6. Notes on the codebase

Useful landmarks, so you are not reverse-engineering from scratch:

| Concern | Where |
|---|---|
| Both auth providers, session policy | `auth.config.ts` |
| Login, 2FA, password reset | `app/actions/auth.actions.ts` |
| The ladder | `app/actions/member-security.actions.ts` |
| Re-auth helper | `lib/auth/reauthenticate.ts` |
| Lock-in codes, phone lookup | `app/actions/parish-code.actions.ts` |
| Gate codes | `app/actions/parish-gate.actions.ts` |
| Phone normalization | `lib/phone.ts` (+ `scripts/check-phone.ts`, 26 cases, already passing) |
| Feed routes | `app/(feed)/` |
| Lock-in sheet | `components/feed/lock-in/lock-in-sheet.tsx` |
| Public/protected route boundary | `proxy.ts` |

Known-good already, so don't spend time re-deriving it: `pnpm exec tsc --noEmit`
and `pnpm build` are clean, and `pnpm tsx scripts/check-phone.ts` passes 26/26.

`pnpm exec eslint` reports a handful of **pre-existing** errors in files this
branch never touched — `app/actions/payment.actions.ts`,
`components/ui/sidebar.tsx`, `components/mass/mass-calendar.tsx`,
`components/providers/sw-registration.tsx`,
`app/(protected)/payments/new/page.tsx`. Ignore those; they are not yours to
fix and not evidence of anything. Everything the branch added lints clean.

---

## 7. The report

Write `docs/e2e-report.md`. Structure it as:

1. **Verdict** — one paragraph. Would you ship this branch? What is the single
   biggest risk you found?
2. **Environment** — how the database was set up, which steps of §2 you ran, and
   anything you had to work around.
3. **Coverage table** — every area in §4, with pass / fail / blocked / not-run
   and a one-line note. Be honest about "not run"; a gap named is more useful
   than a gap hidden.
4. **Findings**, most severe first. For each:
   - a one-sentence statement of the defect
   - concrete reproduction: exact inputs, exact expected vs actual
   - the failing test name and a screenshot or trace
   - your assessment of severity, and *why* — not just a label
5. **Things that made testing hard** — missing test ids, timing races,
   unreachable states. This directly informs what gets fixed next.
6. **What you did not test, and why.**

Keep the tests themselves in `e2e/`, runnable with `pnpm exec playwright test`,
and leave them behind — they are as much a deliverable as the report.

**On honesty:** if setup defeats you, say so plainly and report how far you got.
A report saying "blocked at migration step 3, here is the exact error" is
genuinely useful. A report claiming passes that were never executed is worse
than no report, because it will be believed.
