"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import type { ActionResponse } from "@/types";
import { DayOfWeek, MassScheduleTemplate, MassType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // We'll define schema inline or separate later, for now inline for speed if simple

// Schema for creating/updating template
const massScheduleTemplateSchema = z.object({
	dayOfWeek: z.enum([
		"MONDAY",
		"TUESDAY",
		"WEDNESDAY",
		"THURSDAY",
		"FRIDAY",
		"SATURDAY",
		"SUNDAY",
	]),
	time: z
		.string()
		.regex(
			/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
			"Invalid time format (HH:mm)",
		),
	massType: z.enum([
		"DAILY_MASS",
		"SUNDAY_MASS",
		"HOLY_DAY_MASS",
		"SPECIAL_MASS",
		"WEDDING_MASS",
		"FUNERAL_MASS",
		"THANKSGIVING_MASS",
	]),
	language: z.string().optional(),
	location: z.string().optional(),
	isActive: z.boolean().default(true),
	effectiveFrom: z.string().optional().nullable(), // Date string
	effectiveUntil: z.string().optional().nullable(), // Date string
});

export type MassScheduleTemplateInput = z.infer<
	typeof massScheduleTemplateSchema
>;

export async function createMassScheduleTemplate(
	data: MassScheduleTemplateInput,
): Promise<ActionResponse<MassScheduleTemplate>> {
	try {
		const session = await auth();
		if (
			!session ||
			!["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
				session.user.role,
			)
		) {
			return { success: false, message: "Unauthorized" };
		}

		const validated = massScheduleTemplateSchema.safeParse(data);
		if (!validated.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: validated.error.flatten().fieldErrors,
			};
		}

		const template = await db.massScheduleTemplate.create({
			data: {
				organizationId: session.user.organizationId,
				dayOfWeek: validated.data.dayOfWeek as DayOfWeek,
				time: validated.data.time,
				massType: validated.data.massType as MassType,
				language: validated.data.language,
				location: validated.data.location,
				isActive: validated.data.isActive,
				effectiveFrom:
					validated.data.effectiveFrom ?
						new Date(validated.data.effectiveFrom)
					:	null,
				effectiveUntil:
					validated.data.effectiveUntil ?
						new Date(validated.data.effectiveUntil)
					:	null,
			},
		});

		revalidatePath("/dashboard/mass-schedule");
		return {
			success: true,
			message: "Template created successfully",
			data: template,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to create template",
		};
	}
}

export async function getMassScheduleTemplates(): Promise<
	ActionResponse<MassScheduleTemplate[]>
> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const templates = await db.massScheduleTemplate.findMany({
			where: { organizationId: session.user.organizationId },
			orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
		});

		return {
			success: true,
			message: "Templates retrieved",
			data: templates,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ?
					`Failed to get templates: ${error.message}`
				:	"Failed to get templates",
		};
	}
}

export async function updateMassScheduleTemplate(
	id: string,
	data: Partial<MassScheduleTemplateInput>,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (
			!session ||
			!["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
				session.user.role,
			)
		) {
			return { success: false, message: "Unauthorized" };
		}

		const validated = massScheduleTemplateSchema.partial().safeParse(data);
		if (!validated.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: validated.error.flatten().fieldErrors,
			};
		}

		const existing = await db.massScheduleTemplate.findFirst({
			where: { id, organizationId: session.user.organizationId },
			select: { id: true },
		});

		if (!existing) {
			return { success: false, message: "Template not found" };
		}

		await db.massScheduleTemplate.update({
			where: { id },
			data: {
				...validated.data,
				effectiveFrom:
					validated.data.effectiveFrom ?
						new Date(validated.data.effectiveFrom)
					:	undefined,
				effectiveUntil:
					validated.data.effectiveUntil ?
						new Date(validated.data.effectiveUntil)
					:	undefined,
			},
		});

		revalidatePath("/dashboard/mass-schedule");
		return { success: true, message: "Template updated successfully" };
	} catch (error) {
		console.error("Failed to update template:", error);
		return { success: false, message: "Failed to update template" };
	}
}

export async function deleteMassScheduleTemplate(
	id: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (
			!session ||
			!["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role)
		) {
			return { success: false, message: "Unauthorized" };
		}

		const existing = await db.massScheduleTemplate.findFirst({
			where: { id, organizationId: session.user.organizationId },
			select: { id: true },
		});

		if (!existing) {
			return { success: false, message: "Template not found" };
		}

		await db.massScheduleTemplate.delete({ where: { id } });

		revalidatePath("/dashboard/mass-schedule");
		return { success: true, message: "Template deleted" };
	} catch (error) {
		console.error("Failed to delete template:", error);
		// Fallback: Soft delete if FK constraints fail (though cascade might handle it or not)
		// Actually, Mass generated from template might reference it? schema says templateId String?
		// If we delete template, we might want to keep history.
		// For now, simple delete.
		return { success: false, message: "Failed to delete template" };
	}
}
