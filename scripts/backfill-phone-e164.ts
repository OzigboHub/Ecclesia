/**
 * Backfill Parishioner.phoneE164 and Parishioner.userId.
 *
 *   pnpm tsx scripts/backfill-phone-e164.ts          # report only, writes nothing
 *   pnpm tsx scripts/backfill-phone-e164.ts --apply  # write
 *
 * Run this between STEP 1 and STEP 2 of prisma/manual/20260812_parish_feed.sql.
 * It never fails on bad data: it reports. The unique index in STEP 2 is what
 * enforces cleanliness, and it can only be created once this report is empty.
 */

import "dotenv/config";
import db from "../lib/db";
import { normaliseNgPhone } from "../lib/phone";

const APPLY = process.argv.includes("--apply");

async function main() {
	const prisma = db;

	try {
		const parishioners = await prisma.parishioner.findMany({
			where: { deletedAt: null },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				organizationId: true,
				organization: { select: { name: true } },
			},
		});

		const normalised: {
			id: string;
			organizationId: string;
			orgName: string;
			label: string;
			e164: string;
		}[] = [];
		const unparseable: { label: string; phone: string; reason: string }[] = [];
		let missing = 0;

		for (const p of parishioners) {
			const label = `${p.firstName} ${p.lastName}`;
			if (!p.phone?.trim()) {
				missing += 1;
				continue;
			}

			const result = normaliseNgPhone(p.phone);
			if (!result.ok) {
				unparseable.push({ label, phone: p.phone, reason: result.reason });
				continue;
			}

			normalised.push({
				id: p.id,
				organizationId: p.organizationId,
				orgName: p.organization.name,
				label,
				e164: result.e164,
			});
		}

		// Collisions are scoped per parish, matching the unique index. The same
		// number in two different parishes is fine and common.
		const byKey = new Map<string, typeof normalised>();
		for (const row of normalised) {
			const key = `${row.organizationId}::${row.e164}`;
			const bucket = byKey.get(key);
			if (bucket) bucket.push(row);
			else byKey.set(key, [row]);
		}
		const collisions = [...byKey.values()].filter((rows) => rows.length > 1);

		console.log("");
		console.log("  Parishioners scanned      ", parishioners.length);
		console.log("  Normalised successfully   ", normalised.length);
		console.log("  No phone on record        ", missing);
		console.log("  Could not be normalised   ", unparseable.length);
		console.log("  Colliding numbers         ", collisions.length);
		console.log("");

		if (unparseable.length) {
			console.log("  These numbers could not be read. They will have no");
			console.log("  phoneE164 and those people cannot lock in until fixed:");
			console.log("");
			for (const row of unparseable.slice(0, 50)) {
				console.log(
					`    ${row.label.padEnd(30)} ${row.phone.padEnd(20)} ${row.reason}`,
				);
			}
			if (unparseable.length > 50) {
				console.log(`    … and ${unparseable.length - 50} more`);
			}
			console.log("");
		}

		if (collisions.length) {
			console.log("  These numbers appear more than once inside one parish.");
			console.log("  STEP 2 of the migration will fail until each group is");
			console.log("  resolved to a single holder:");
			console.log("");
			for (const group of collisions.slice(0, 50)) {
				console.log(`    ${group[0].orgName} — ${group[0].e164}`);
				for (const row of group) {
					console.log(`        ${row.id}  ${row.label}`);
				}
			}
			if (collisions.length > 50) {
				console.log(`    … and ${collisions.length - 50} more groups`);
			}
			console.log("");
		}

		// Link parishioners to their login account using the email equality the
		// codebase relies on today, so nothing that works now changes behaviour.
		const linkable = await prisma.parishioner.findMany({
			where: { deletedAt: null, userId: null, email: { not: null } },
			select: { id: true, email: true },
		});

		const users = await prisma.user.findMany({
			select: { id: true, email: true, parishioner: { select: { id: true } } },
		});
		const userByEmail = new Map(users.map((u) => [u.email, u]));

		const links: { parishionerId: string; userId: string }[] = [];
		for (const p of linkable) {
			if (!p.email) continue;
			const user = userByEmail.get(p.email);
			if (user && !user.parishioner) {
				links.push({ parishionerId: p.id, userId: user.id });
			}
		}

		console.log("  Parishioner → User links to create ", links.length);
		console.log("");

		if (!APPLY) {
			console.log("  Report only. Re-run with --apply to write.");
			console.log("");
			return;
		}

		if (normalised.length) {
			const chunkSize = 500;
			for (let i = 0; i < normalised.length; i += chunkSize) {
				const chunk = normalised.slice(i, i + chunkSize);
				const cases = chunk.map((r) => `WHEN id = '${r.id}' THEN '${r.e164}'`).join(" ");
				const ids = chunk.map((r) => `'${r.id}'`).join(", ");
				await prisma.$executeRawUnsafe(`UPDATE "Parishioner" SET "phoneE164" = CASE ${cases} END WHERE id IN (${ids})`);
			}
		}
		const written = normalised.length;

		if (links.length) {
			const chunkSize = 500;
			for (let i = 0; i < links.length; i += chunkSize) {
				const chunk = links.slice(i, i + chunkSize);
				const cases = chunk.map((l) => `WHEN id = '${l.parishionerId}' THEN '${l.userId}'`).join(" ");
				const ids = chunk.map((l) => `'${l.parishionerId}'`).join(", ");
				await prisma.$executeRawUnsafe(`UPDATE "Parishioner" SET "userId" = CASE ${cases} END WHERE id IN (${ids})`);
			}
		}
		const linked = links.length;

		console.log(`  Wrote phoneE164 on ${written} parishioners.`);
		console.log(`  Linked ${linked} parishioners to their account.`);
		console.log("");

		if (collisions.length) {
			console.log("  Collisions remain. Do NOT run STEP 2 yet.");
			console.log("");
		}
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
