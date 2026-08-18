import "dotenv/config";
import db from "../lib/db";
import * as fs from "fs";
import * as path from "path";

async function main() {
	try {
		console.log("=== Step 1: Running 20260812_parish_feed.sql STEP 1 ===");
		const sql1 = fs.readFileSync(
			path.join(__dirname, "../prisma/manual/20260812_parish_feed.sql"),
			"utf-8"
		);
		// Extract content between BEGIN; and COMMIT; for Step 1 (before STEP 2 banner)
		const step1Content = sql1.split("-- STEP 2")[0];
		console.log("Executing Step 1 SQL...");
		await db.$executeRawUnsafe(step1Content);
		console.log("Step 1 applied successfully.");

		console.log("\n=== Step 1b: Running 20260813_security_ladder.sql ===");
		const sql2 = fs.readFileSync(
			path.join(__dirname, "../prisma/manual/20260813_security_ladder.sql"),
			"utf-8"
		);
		console.log("Executing Security Ladder SQL...");
		await db.$executeRawUnsafe(sql2);
		console.log("Security Ladder SQL applied successfully.");
	} catch (error) {
		console.error("Migration error:", error);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

main();
