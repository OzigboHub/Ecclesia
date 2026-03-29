import {
  PrismaClient,
  UserRole,
  HierarchyLevel,
  Gender,
  MaritalStatus,
} from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import WebSocket from "ws";

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding...");

  // 1. Create Default Organization
  const organization = await prisma.organization.upsert({
    where: { name: "Ecclesia Central Parish" },
    update: {},
    create: {
      name: "Ecclesia Central Parish",
      level: HierarchyLevel.PARISH,
      address: "123 Faith Street, Central City",
      contactEmail: "admin@ecclesia.com",
      contactPhone: "+2348000000000",
    },
  });

  console.log(`Created organization: ${organization.name}`);

  // 2. Create Feature Settings for the Organization
  // await prisma.organizationFeatureSettings.upsert({
  //   where: { organizationId: organization.id },
  //   update: {},
  //   create: {
  //     organizationId: organization.id,
  //     enableParishionerManagement: true,
  //     enableSacramentalRecords: true,
  //     enableFinancialManagement: true,
  //     enableOfferings: true,
  //     enableTithes: true,
  //     enableDonationCampaigns: true,
  //     enableCustomDonationTypes: true,
  //     enableMonthlyTracking: true,
  //     enableMassIntentions: true,
  //     enableAppointments: true,
  //     enableConfessionBooking: true,
  //     enableLiveStreaming: true,
  //     enableAnnouncements: true,
  //     enableSMSNotifications: true,
  //     enableEmailNotifications: true,
  //     enableSocieties: true,
  //     enableEventManagement: true,
  //     enableOnlinePayments: true,
  //     enablePublicWebsite: true,
  //   },
  // });

  // 3. Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ecclesia.com" },
    update: {},
    create: {
      email: "admin@ecclesia.com",
      password: adminPassword,
      firstName: "System",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      organizationId: organization.id,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // 4. Create some sample parishioners
  const parishioners = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "08012345678",
      gender: "MALE",
      maritalStatus: "MARRIED",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "08087654321",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
    },
    {
      firstName: "Peter",
      lastName: "Obi",
      email: "peter.obi@example.com",
      phone: "08011122233",
      gender: "MALE",
      maritalStatus: "MARRIED",
    },
  ];

  for (const p of parishioners) {
    await prisma.parishioner.upsert({
      where: { email: p.email },
      update: {},
      create: {
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        gender: p.gender as unknown as Gender, // Type assertion to bypass enum type
        maritalStatus: p.maritalStatus as unknown as MaritalStatus,
        organizationId: organization.id,
      },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
