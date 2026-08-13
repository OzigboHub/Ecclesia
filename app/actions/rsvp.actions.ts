"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * "I'll be there" on an event card.
 *
 * Backed by EventAttendance, which is unique on (eventId, parishionerId) — so
 * the toggle is idempotent and a double-tap cannot inflate the count. Status is
 * "RSVP" rather than the default "PRESENT": intending to come and having come
 * are different facts, and the parish office should be able to tell them apart.
 */
export async function toggleEventRsvp(
	eventId: string,
): Promise<ActionResponse<{ going: boolean; count: number }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const parishionerId = session.user.parishionerId;
		if (!parishionerId) {
			return {
				success: false,
				message: "Only parishioners on the register can RSVP",
			};
		}

		const event = await db.event.findFirst({
			where: {
				id: eventId,
				organizationId: session.user.organizationId,
				status: "SCHEDULED",
			},
			select: { id: true, maxAttendees: true },
		});

		if (!event) {
			return { success: false, message: "Event not found" };
		}

		const existing = await db.eventAttendance.findUnique({
			where: { eventId_parishionerId: { eventId, parishionerId } },
			select: { id: true },
		});

		if (existing) {
			await db.eventAttendance.delete({ where: { id: existing.id } });
		} else {
			if (event.maxAttendees) {
				const count = await db.eventAttendance.count({ where: { eventId } });
				if (count >= event.maxAttendees) {
					return {
						success: false,
						message: "This event is full.",
					};
				}
			}
			await db.eventAttendance.create({
				data: { eventId, parishionerId, status: "RSVP" },
			});
		}

		const count = await db.eventAttendance.count({ where: { eventId } });

		revalidatePath("/feed");
		return {
			success: true,
			message: existing ? "RSVP removed" : "You're on the list",
			data: { going: !existing, count },
		};
	} catch (error) {
		console.error("Failed to toggle RSVP:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}
