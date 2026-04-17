import { config } from "dotenv";
config();

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import WebSocket from "ws";

neonConfig.webSocketConstructor =
	WebSocket as unknown as typeof globalThis.WebSocket;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as any);

async function main() {
	const outstations = await db.organization.findMany({
		where: { level: "OUTSTATION" },
		select: { id: true, name: true },
	});

	console.log(`Found ${outstations.length} outstation(s).`);

	let updated = 0;
	for (const outstation of outstations) {
		await db.organizationFeatureSettings.upsert({
			where: { organizationId: outstation.id },
			create: {
				organizationId: outstation.id,
				enableParishionerManagement: true,
			},
			update: { enableParishionerManagement: true },
		});
		updated += 1;
		console.log(
			`Enabled parishioner management for ${outstation.name} (${outstation.id})`,
		);
	}

	console.log(`Updated ${updated} outstation(s).`);
}

main()
	.catch((error) => {
		console.error("Failed to update outstations:", error);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
