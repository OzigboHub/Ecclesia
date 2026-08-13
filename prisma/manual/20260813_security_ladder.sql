-- Security ladder: parishioners can add a password, two-factor, and close the
-- parish-code door behind them.
--
-- Additive only. Safe to run against live data in one go, and safe to run
-- twice. No backfill: `allowCodeSignIn` defaults true, which is what every
-- existing account already behaves as, and `emailVerifiedAt` stays null until
-- somebody actually confirms an address.

BEGIN;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowCodeSignIn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  -- The address the code was sent to. Checked at redemption so a code cannot
  -- be used to verify an address the account changed to afterwards.
  "email"      TEXT NOT NULL,
  "codeHash"   TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx"    ON "EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

ALTER TABLE "EmailVerificationToken" DROP CONSTRAINT IF EXISTS "EmailVerificationToken_userId_fkey";
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
