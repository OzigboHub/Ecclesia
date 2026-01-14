// Enhanced Prisma Schema with Advanced Payment Flow
// Ecclesia Digital Parish Manager (DPM)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Hierarchical Structure Models ---
enum HierarchyLevel {
  PARISH
  OUTSTATION
}

model Organization {
  id           String           @id @default(uuid())
  name         String           @unique
  level        HierarchyLevel
  parentId     String?
  parent       Organization?    @relation("ChildOrganizations", fields: [parentId], references: [id])
  children     Organization[]   @relation("ChildOrganizations")
  address      String?
  contactEmail String?
  contactPhone String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  users                User[]
  parishioners         Parishioner[]
  events               Event[]
  donations            Donation[]
  massIntentions       MassIntention[]
  sacraments           Sacrament[]
  piousOrganizations   PiousOrganization[]
  liveStreams          LiveStream[]
  appointments         Appointment[]
  donationCampaigns    DonationCampaign[]
  payments             Payment[]
  featureSettings      OrganizationFeatureSettings?

  @@index([parentId])
}

// --- Feature Toggle Management ---
model OrganizationFeatureSettings {
  id                        String       @id @default(uuid())
  organizationId            String       @unique
  organization              Organization @relation(fields: [organizationId], references: [id])
  
  // Core Features
  enableParishionerManagement Boolean    @default(true)
  enableSacramentalRecords    Boolean    @default(true)
  enableFinancialManagement   Boolean    @default(true)
  
  // Payment Features
  enableOfferings             Boolean    @default(true)
  enableTithes                Boolean    @default(true)
  enableDonationCampaigns     Boolean    @default(true)
  enableCustomDonationTypes   Boolean    @default(true)
  enableMonthlyTracking       Boolean    @default(true)
  
  // Spiritual Features
  enableMassIntentions        Boolean    @default(true)
  enableAppointments          Boolean    @default(true)
  enableConfessionBooking     Boolean    @default(true)
  
  // Communication Features
  enableLiveStreaming         Boolean    @default(false)
  enableAnnouncements         Boolean    @default(true)
  enableSMSNotifications      Boolean    @default(false)
  enableEmailNotifications    Boolean    @default(true)
  
  // Organization Features
  enablePiousOrganizations    Boolean    @default(true)
  enableEventManagement       Boolean    @default(true)
  
  // Advanced Features
  enableOnlinePayments        Boolean    @default(false)
  enableRecurringDonations    Boolean    @default(false)
  enableMobileApp             Boolean    @default(false)
  enablePublicWebsite         Boolean    @default(true)
  
  createdAt                   DateTime   @default(now())
  updatedAt                   DateTime   @updatedAt

  @@index([organizationId])
}

// --- User and Authentication Models ---
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

model User {
  id             String        @id @default(uuid())
  email          String        @unique
  password       String
  firstName      String
  lastName       String
  role           UserRole
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
  isActive       Boolean       @default(true)
  lastLogin      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  piousOrganizationLed      PiousOrganization? @relation("PiousOrganizationPresident")
  piousOrganizationAssisted PiousOrganization? @relation("PiousOrganizationSecretary")
  appointmentsMade          Appointment[]      @relation("AppointmentCreator")
  appointmentsAssigned      Appointment[]      @relation("AppointmentAssignee")
  paymentsRecorded          Payment[]          @relation("PaymentRecorder")

  @@index([organizationId])
  @@index([email])
}

// --- Pious Organizations ---
model PiousOrganization {
  id             String       @id @default(uuid())
  name           String
  description    String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  presidentId    String?      @unique
  president      User?        @relation("PiousOrganizationPresident", fields: [presidentId], references: [id])
  secretaryId    String?      @unique
  secretary      User?        @relation("PiousOrganizationSecretary", fields: [secretaryId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  members PiousOrganizationMembership[]

  @@unique([name, organizationId])
  @@index([organizationId])
  @@index([presidentId])
  @@index([secretaryId])
}

// --- Parishioner/Member Management ---
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum MaritalStatus {
  SINGLE
  MARRIED
  WIDOWED
  DIVORCED
}

model Parishioner {
  id             String         @id @default(uuid())
  firstName      String
  lastName       String
  otherNames     String?
  email          String?        @unique
  phone          String?
  address        String?
  dateOfBirth    DateTime?
  gender         Gender?
  maritalStatus  MaritalStatus?
  organizationId String
  organization   Organization   @relation(fields: [organizationId], references: [id])
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  sacraments                    Sacrament[]
  massIntentions                MassIntention[]
  piousOrganizationMemberships  PiousOrganizationMembership[]
  appointments                  Appointment[]                 @relation("ParishionerAppointment")
  payments                      Payment[]

  @@index([organizationId])
  @@index([email])
  @@index([phone])
}

model PiousOrganizationMembership {
  parishionerId       String
  parishioner         Parishioner       @relation(fields: [parishionerId], references: [id])
  piousOrganizationId String
  piousOrganization   PiousOrganization @relation(fields: [piousOrganizationId], references: [id])
  joinedAt            DateTime          @default(now())

  @@id([parishionerId, piousOrganizationId])
  @@index([piousOrganizationId])
}

// --- Sacramental Records ---
enum SacramentType {
  BAPTISM
  FIRST_COMMUNION
  CONFIRMATION
  MARRIAGE
  ANOINTING_OF_THE_SICK
}

model Sacrament {
  id             String        @id @default(uuid())
  type           SacramentType
  dateReceived   DateTime
  parishionerId  String
  parishioner    Parishioner   @relation(fields: [parishionerId], references: [id])
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
  notes          String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([parishionerId])
  @@index([organizationId])
}

// --- Events Management ---
enum EventStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}

model Event {
  id             String       @id @default(uuid())
  title          String
  description    String?
  startTime      DateTime
  endTime        DateTime
  location       String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  status         EventStatus  @default(SCHEDULED)
  maxAttendees   Int?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  massIntentions MassIntention[]

  @@index([organizationId])
  @@index([startTime])
}

// --- Enhanced Payment System ---

// Donation Campaigns (e.g., Building Fund, Special Projects)
model DonationCampaign {
  id             String       @id @default(uuid())
  name           String
  description    String?
  targetAmount   Float
  startDate      DateTime
  endDate        DateTime?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  payments Payment[]

  @@index([organizationId])
  @@index([isActive])
  @@index([startDate])
}

// Mass Intentions (Enhanced)
enum IntentionType {
  THANKSGIVING
  REQUIEM
  SPECIAL_INTENTION
}

model MassIntention {
  id             String         @id @default(uuid())
  intention      String
  intentionType  IntentionType
  requestedBy    String
  contactEmail   String?
  contactPhone   String?
  massDate       DateTime
  stipend        Float?
  parishionerId  String?
  parishioner    Parishioner?   @relation(fields: [parishionerId], references: [id])
  organizationId String
  organization   Organization   @relation(fields: [organizationId], references: [id])
  eventId        String?
  event          Event?         @relation(fields: [eventId], references: [id])
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  payments Payment[]

  @@index([parishionerId])
  @@index([organizationId])
  @@index([massDate])
  @@index([eventId])
}

// Custom Donation Types (Parish-defined)
model DonationType {
  id             String       @id @default(uuid())
  name           String
  description    String?
  organizationId String
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  donations Donation[]

  @@unique([name, organizationId])
  @@index([organizationId])
  @@index([isActive])
}

// Standalone Donations (not tied to Mass or Campaign)
model Donation {
  id               String         @id @default(uuid())
  donationTypeId   String
  donationType     DonationType   @relation(fields: [donationTypeId], references: [id])
  organizationId   String
  organization     Organization   @relation(fields: [organizationId], references: [id])
  targetAmount     Float?
  startDate        DateTime?
  endDate          DateTime?
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  payments Payment[]

  @@index([donationTypeId])
  @@index([organizationId])
  @@index([isActive])
}

// Universal Payment Model
enum PaymentPurpose {
  OFFERING
  TITHE
  MASS_INTENTION
  DONATION_CAMPAIGN
  CUSTOM_DONATION
  OTHER
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CARD
  MOBILE_MONEY
  CHECK
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model Payment {
  id                  String            @id @default(uuid())
  amount              Float
  currency            String            @default("NGN")
  purpose             PaymentPurpose
  month               Int?              // For monthly offerings (1-12)
  paymentMethod       PaymentMethod
  paymentStatus       PaymentStatus     @default(PENDING)
  transactionRef      String?           @unique
  
  // Payer Information
  parishionerId       String?
  parishioner         Parishioner?      @relation(fields: [parishionerId], references: [id])
  payerName           String            // Required: Name of person making payment (can be on behalf)
  onBehalfOf          String?           // Optional: If paying on behalf of someone else
  payerEmail          String?
  payerPhone          String?
  
  // Link to specific purpose
  massIntentionId     String?
  massIntention       MassIntention?    @relation(fields: [massIntentionId], references: [id])
  donationCampaignId  String?
  donationCampaign    DonationCampaign? @relation(fields: [donationCampaignId], references: [id])
  donationId          String?
  donation            Donation?         @relation(fields: [donationId], references: [id])
  
  // Organization and Audit
  organizationId      String
  organization        Organization      @relation(fields: [organizationId], references: [id])
  recordedById        String
  recordedBy          User              @relation("PaymentRecorder", fields: [recordedById], references: [id])
  
  notes               String?
  receiptNumber       String?           @unique
  paymentDate         DateTime          @default(now())
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([parishionerId])
  @@index([organizationId])
  @@index([purpose])
  @@index([paymentStatus])
  @@index([massIntentionId])
  @@index([donationCampaignId])
  @@index([donationId])
  @@index([paymentDate])
  @@index([month])
  @@index([recordedById])
}

// --- Appointments ---
enum AppointmentType {
  CONFESSION
  COUNSELING
  MEETING
  OTHER
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

model Appointment {
  id             String            @id @default(uuid())
  title          String
  description    String?
  startTime      DateTime
  endTime        DateTime
  type           AppointmentType
  status         AppointmentStatus @default(PENDING)
  parishionerId  String
  parishioner    Parishioner       @relation("ParishionerAppointment", fields: [parishionerId], references: [id])
  assignedToId   String?
  assignedTo     User?             @relation("AppointmentAssignee", fields: [assignedToId], references: [id])
  requestedById  String
  requestedBy    User              @relation("AppointmentCreator", fields: [requestedById], references: [id])
  organizationId String
  organization   Organization      @relation(fields: [organizationId], references: [id])
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([parishionerId])
  @@index([assignedToId])
  @@index([requestedById])
  @@index([organizationId])
  @@index([startTime])
}

// --- Live Streaming ---
model LiveStream {
  id             String       @id @default(uuid())
  title          String
  description    String?
  streamUrl      String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  isLive         Boolean      @default(false)
  scheduledFor   DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId])
  @@index([isLive])
  @@index([scheduledFor])
}

// --- Announcements ---
model Announcement {
  id             String           @id @default(uuid())
  title          String
  content        String
  organizationId String
  targetLevels   HierarchyLevel[]
  isPublished    Boolean          @default(false)
  publishedAt    DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([organizationId])
  @@index([isPublished])
}

// --- Audit Log ---
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  PASSWORD_CHANGE
  PERMISSION_CHANGE
  PAYMENT_RECORDED
  MASS_INTENTION_BOOKED
  APPOINTMENT_BOOKED
  LIVESTREAM_STARTED
  DONATION_CAMPAIGN_CREATED
}

model AuditLog {
  id          String      @id @default(uuid())
  action      AuditAction
  entityType  String
  entityId    String
  performedBy String
  details     Json?
  ipAddress   String?
  createdAt   DateTime    @default(now())

  @@index([action])
  @@index([entityType])
  @@index([entityId])
  @@index([performedBy])
  @@index([createdAt])
}