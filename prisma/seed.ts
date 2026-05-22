import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
	Gender,
	HierarchyLevel,
	MaritalStatus,
	PrismaClient,
	UserRole,
} from "@prisma/client";
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

	// // 1. Create Default Organization
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

	// console.log(`Created organization: ${organization.name}`);

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
	const adminPassword = await bcrypt.hash("@Ecli#$QAWW@20Cia27$", 10);
	const admin = await prisma.user.upsert({
		where: { email: "admin@ecclesialight.com" },
		update: {},
		create: {
			email: "admin@ecclesialight.com",
			password: adminPassword,
			firstName: "System",
			lastName: "Admin",
			role: UserRole.SUPER_ADMIN,
			organizationId: organization.id,
		},
	});

	console.log(`Created admin user: ${admin.email}`);

	// 4. Create 100 parishioners
	const seedParishioners: Array<{
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		gender: "MALE" | "FEMALE";
		maritalStatus: "SINGLE" | "MARRIED";
	}> = [];
	const firstNames = [
		"Grace",
		"Michael",
		"Esther",
		"Paul",
		"Mary",
		"Joseph",
		"Agnes",
		"Daniel",
		"Ruth",
		"Samuel",
	];
	const lastNames = [
		"Okoro",
		"Eze",
		"Balogun",
		"Nwosu",
		"Adebayo",
		"Ibrahim",
		"Udo",
		"Chukwu",
		"Ojo",
		"Kalu",
	];
	const genders: Array<"MALE" | "FEMALE"> = ["MALE", "FEMALE"];
	const maritalStatuses: Array<"SINGLE" | "MARRIED"> = ["SINGLE", "MARRIED"];
	const usedEmails = new Set<string>();
	const usedPhones = new Set<string>();

	const pickRandom = <T>(values: T[]): T =>
		values[Math.floor(Math.random() * values.length)];

	while (seedParishioners.length < 100) {
		const firstName = pickRandom(firstNames);
		const lastName = pickRandom(lastNames);
		const suffix = Math.floor(Math.random() * 900000) + 100000;
		const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@example.com`;
		const phone = `080${String(10000000 + (suffix % 900000)).padStart(8, "0")}`;
		const gender = pickRandom(genders);
		const maritalStatus = pickRandom(maritalStatuses);

		if (usedEmails.has(email) || usedPhones.has(phone)) {
			continue;
		}

		usedEmails.add(email);
		usedPhones.add(phone);
		seedParishioners.push({
			firstName,
			lastName,
			email,
			phone,
			gender,
			maritalStatus,
		});
	}

	for (const p of seedParishioners) {
		await prisma.parishioner.upsert({
			where: { email: p.email },
			update: {},
			create: {
				firstName: p.firstName,
				lastName: p.lastName,
				email: p.email,
				phone: p.phone,
				gender: p.gender as unknown as Gender,
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
