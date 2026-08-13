"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { canManageParishioners } from "@/lib/permissions";
import { normaliseNgPhone } from "@/lib/phone";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Phone-first roster import.
 *
 * Distinct from importParishionersFromCSV, which dedupes on email and commits
 * row by row — a mid-file failure there leaves a half-imported register with no
 * way to tell which half. This one:
 *
 *   1. always dry-runs first, so the office sees exactly what will happen;
 *   2. dedupes on the normalised phone number, which is the lock-in key;
 *   3. commits in one transaction, so it either all lands or none of it does.
 */

export type RosterRow = {
	firstName: string;
	lastName: string;
	otherNames?: string;
	phone: string;
	email?: string;
	address?: string;
	gender?: string;
	occupation?: string;
};

export type RosterRowVerdict = {
	line: number;
	name: string;
	rawPhone: string;
	/** E.164, or null when the number could not be read. */
	phoneE164: string | null;
	outcome: "create" | "update" | "skip";
	note: string | null;
};

export type RosterPreview = {
	total: number;
	toCreate: number;
	toUpdate: number;
	toSkip: number;
	rows: RosterRowVerdict[];
};

const GENDERS = new Set(["MALE", "FEMALE"]);

/**
 * Analyse the file without writing anything.
 *
 * Every row gets a verdict, including the ones that will be skipped and why —
 * "23 rows imported" tells the office nothing about the 4 that did not.
 */
export async function previewRoster(
	rows: RosterRow[],
): Promise<ActionResponse<RosterPreview>> {
	try {
		const session = await auth();
		if (!session?.user) return { success: false, message: "Unauthorized" };
		if (!canManageParishioners(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const organizationId = session.user.organizationId;

		const existing = await db.parishioner.findMany({
			where: { organizationId, deletedAt: null, phoneE164: { not: null } },
			select: { id: true, phoneE164: true },
		});
		const existingByPhone = new Map(
			existing.map((p) => [p.phoneE164 as string, p.id]),
		);

		// Duplicates *within the file* matter as much as duplicates against the
		// database — a spreadsheet that lists the same person twice would
		// otherwise silently create then overwrite.
		const seenInFile = new Set<string>();
		const verdicts: RosterRowVerdict[] = [];

		rows.forEach((row, index) => {
			const line = index + 2; // header is line 1
			const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();

			if (!row.firstName?.trim() || !row.lastName?.trim()) {
				verdicts.push({
					line,
					name: name || "(no name)",
					rawPhone: row.phone ?? "",
					phoneE164: null,
					outcome: "skip",
					note: "First and last name are both required",
				});
				return;
			}

			const parsed = normaliseNgPhone(row.phone);
			if (!parsed.ok) {
				verdicts.push({
					line,
					name,
					rawPhone: row.phone ?? "",
					phoneE164: null,
					outcome: "skip",
					note:
						parsed.reason === "empty" ? "No phone number"
						: parsed.reason === "too-short" ? "Too few digits"
						: parsed.reason === "too-long" ? "Too many digits"
						: "Not a Nigerian mobile number",
				});
				return;
			}

			if (seenInFile.has(parsed.e164)) {
				verdicts.push({
					line,
					name,
					rawPhone: row.phone,
					phoneE164: parsed.e164,
					outcome: "skip",
					note: "This number appears earlier in the file",
				});
				return;
			}
			seenInFile.add(parsed.e164);

			const match = existingByPhone.get(parsed.e164);
			verdicts.push({
				line,
				name,
				rawPhone: row.phone,
				phoneE164: parsed.e164,
				outcome: match ? "update" : "create",
				note: match ? "Already on the register — details will be updated" : null,
			});
		});

		return {
			success: true,
			message: "Preview ready",
			data: {
				total: rows.length,
				toCreate: verdicts.filter((v) => v.outcome === "create").length,
				toUpdate: verdicts.filter((v) => v.outcome === "update").length,
				toSkip: verdicts.filter((v) => v.outcome === "skip").length,
				rows: verdicts,
			},
		};
	} catch (error) {
		console.error("Failed to preview roster:", error);
		return { success: false, message: "Failed to read that file" };
	}
}

/**
 * Commit the import. Re-derives every verdict server-side rather than trusting
 * a preview the client hands back.
 */
export async function commitRoster(
	rows: RosterRow[],
): Promise<ActionResponse<{ created: number; updated: number; skipped: number }>> {
	try {
		const session = await auth();
		if (!session?.user) return { success: false, message: "Unauthorized" };
		if (!canManageParishioners(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const preview = await previewRoster(rows);
		if (!preview.success || !preview.data) {
			return { success: false, message: preview.message };
		}

		const organizationId = session.user.organizationId;
		const actionable = preview.data.rows.filter((v) => v.outcome !== "skip");

		if (actionable.length === 0) {
			return {
				success: false,
				message:
					"Nothing in that file could be imported. Check the preview for why.",
			};
		}

		let created = 0;
		let updated = 0;

		// One transaction: the register is either as it was, or as the file
		// says. Never half of each.
		await db.$transaction(async (tx) => {
			for (const verdict of actionable) {
				const row = rows[verdict.line - 2];
				const gender =
					row.gender && GENDERS.has(row.gender.trim().toUpperCase()) ?
						(row.gender.trim().toUpperCase() as "MALE" | "FEMALE")
					:	null;

				const data = {
					firstName: row.firstName.trim(),
					lastName: row.lastName.trim(),
					otherNames: row.otherNames?.trim() || null,
					phone: row.phone.trim(),
					phoneE164: verdict.phoneE164,
					email: row.email?.trim().toLowerCase() || null,
					address: row.address?.trim() || null,
					occupation: row.occupation?.trim() || null,
					gender,
				};

				if (verdict.outcome === "update") {
					await tx.parishioner.updateMany({
						where: {
							organizationId,
							phoneE164: verdict.phoneE164,
							deletedAt: null,
						},
						data,
					});
					updated += 1;
				} else {
					await tx.parishioner.create({
						data: { ...data, organizationId },
					});
					created += 1;
				}
			}
		});

		await db.auditLog.create({
			data: {
				action: "CREATE",
				entityType: "Parishioner",
				entityId: organizationId,
				performedBy: session.user.id,
				details: {
					rosterImport: true,
					created,
					updated,
					skipped: preview.data.toSkip,
				},
			},
		});

		revalidatePath("/parishioners");

		return {
			success: true,
			message: `Imported ${created} new and updated ${updated}.`,
			data: { created, updated, skipped: preview.data.toSkip },
		};
	} catch (error) {
		console.error("Failed to import roster:", error);
		return {
			success: false,
			message:
				"The import failed and nothing was saved. Check the file and try again.",
		};
	}
}
