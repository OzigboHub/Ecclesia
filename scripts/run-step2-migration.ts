import "dotenv/config";
import db from "../lib/db";

async function main() {
	try {
		console.log("=== Step 3: Running 20260812_parish_feed.sql STEP 2 ===");
		await db.$executeRawUnsafe(
			'CREATE UNIQUE INDEX IF NOT EXISTS "Parishioner_organizationId_phoneE164_key" ON "Parishioner"("organizationId", "phoneE164");'
		);
		console.log("Step 2 unique index created successfully.");
	} catch (error) {
		console.error("Step 2 migration error:", error);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

main();
