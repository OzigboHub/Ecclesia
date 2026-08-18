-- Parish feed: phone-first identity, access codes, gate codes.
--
-- RUN THIS IN THREE STEPS. Do not run the whole file at once, and do not run
-- `prisma db push` until step 3 is done.
--
--   1. Run STEP 1 below.
--   2. Run `pnpm tsx scripts/backfill-phone-e164.ts` and resolve every collision
--      it reports. Until the report is clean, step 3 will fail.
--   3. Run STEP 2 below.
--
-- The unique index on (organizationId, phoneE164) is the reason for the
-- staging. Parish registers accumulate duplicate phone numbers over years —
-- shared family handsets, typos, a number reused after someone moved away —
-- and creating the index against unclean data aborts the whole migration.

-- ===========================================================================
-- STEP 1 — additive only, safe to run against live data
-- ===========================================================================

BEGIN;

-- Members authenticate by phone + code, so they have neither.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "Parishioner" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Parishioner" ADD COLUMN IF NOT EXISTS "phoneE164" TEXT;
ALTER TABLE "Parishioner" ADD COLUMN IF NOT EXISTS "shareMoments" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "Parishioner_userId_key" ON "Parishioner"("userId");
CREATE INDEX IF NOT EXISTS "Parishioner_phoneE164_idx" ON "Parishioner"("phoneE164");

ALTER TABLE "Parishioner"
  DROP CONSTRAINT IF EXISTS "Parishioner_userId_fkey";
ALTER TABLE "Parishioner"
  ADD CONSTRAINT "Parishioner_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserSession" ADD COLUMN IF NOT EXISTS "authMethod" TEXT NOT NULL DEFAULT 'password';
ALTER TABLE "UserSession" ADD COLUMN IF NOT EXISTS "deviceLabel" TEXT;

ALTER TABLE "OrganizationFeatureSettings"
  ADD COLUMN IF NOT EXISTS "requireGateCode" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ParishAccessCode" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "parishionerId"  TEXT NOT NULL,
  "codeHash"       TEXT NOT NULL,
  "issuedById"     TEXT NOT NULL,
  "issuedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "consumedAt"     TIMESTAMP(3),
  "revokedAt"      TIMESTAMP(3),
  "attempts"       INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ParishAccessCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ParishAccessCode_organizationId_idx" ON "ParishAccessCode"("organizationId");
CREATE INDEX IF NOT EXISTS "ParishAccessCode_parishionerId_idx"  ON "ParishAccessCode"("parishionerId");
CREATE INDEX IF NOT EXISTS "ParishAccessCode_expiresAt_idx"      ON "ParishAccessCode"("expiresAt");

ALTER TABLE "ParishAccessCode" DROP CONSTRAINT IF EXISTS "ParishAccessCode_organizationId_fkey";
ALTER TABLE "ParishAccessCode" ADD CONSTRAINT "ParishAccessCode_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ParishAccessCode" DROP CONSTRAINT IF EXISTS "ParishAccessCode_parishionerId_fkey";
ALTER TABLE "ParishAccessCode" ADD CONSTRAINT "ParishAccessCode_parishionerId_fkey"
  FOREIGN KEY ("parishionerId") REFERENCES "Parishioner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParishAccessCode" DROP CONSTRAINT IF EXISTS "ParishAccessCode_issuedById_fkey";
ALTER TABLE "ParishAccessCode" ADD CONSTRAINT "ParishAccessCode_issuedById_fkey"
  FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ParishGateCode" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "codeHash"       TEXT NOT NULL,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "updatedById"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParishGateCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParishGateCode_organizationId_key" ON "ParishGateCode"("organizationId");

ALTER TABLE "ParishGateCode" DROP CONSTRAINT IF EXISTS "ParishGateCode_organizationId_fkey";
ALTER TABLE "ParishGateCode" ADD CONSTRAINT "ParishGateCode_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuthAttemptBucket" (
  "id"           TEXT NOT NULL,
  "key"          TEXT NOT NULL,
  "count"        INTEGER NOT NULL DEFAULT 0,
  "resetAt"      TIMESTAMP(3) NOT NULL,
  "blockedUntil" TIMESTAMP(3),
  CONSTRAINT "AuthAttemptBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthAttemptBucket_key_key"     ON "AuthAttemptBucket"("key");
CREATE INDEX        IF NOT EXISTS "AuthAttemptBucket_resetAt_idx" ON "AuthAttemptBucket"("resetAt");

COMMIT;

-- ===========================================================================
-- STEP 2 — run only after the backfill reports zero collisions
-- ===========================================================================

-- Sanity check. This must return no rows before you continue.
--
--   SELECT "organizationId", "phoneE164", COUNT(*)
--   FROM "Parishioner"
--   WHERE "phoneE164" IS NOT NULL AND "deletedAt" IS NULL
--   GROUP BY 1, 2 HAVING COUNT(*) > 1;

-- CREATE UNIQUE INDEX "Parishioner_organizationId_phoneE164_key"
--   ON "Parishioner"("organizationId", "phoneE164");
