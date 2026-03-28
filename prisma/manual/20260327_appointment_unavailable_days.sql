-- Manual, non-destructive SQL patch for appointment unavailable days
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "AppointmentUnavailableDay" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentUnavailableDay_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentUnavailableDay_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentUnavailableDay_organizationId_date_key"
  ON "AppointmentUnavailableDay"("organizationId", "date");

CREATE INDEX IF NOT EXISTS "AppointmentUnavailableDay_organizationId_idx"
  ON "AppointmentUnavailableDay"("organizationId");

CREATE INDEX IF NOT EXISTS "AppointmentUnavailableDay_date_idx"
  ON "AppointmentUnavailableDay"("date");
