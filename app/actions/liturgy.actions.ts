"use server";

import { LiturgyService } from "@/lib/services/liturgy.service";
import type { ActionResponse } from "@/types";
import type { DailyLiturgy } from "@/types/liturgy";

/**
 * Get the daily liturgy for today
 */
export async function getTodayLiturgyAction(): Promise<ActionResponse<DailyLiturgy>> {
	try {
		const data = await LiturgyService.getDailyLiturgy();
		return {
			success: true,
			message: "Daily liturgy retrieved successfully",
			data,
		};
	} catch (error) {
		console.error("Error in getTodayLiturgyAction:", error);
		return {
			success: false,
			message: "Failed to retrieve daily liturgy",
		};
	}
}

/**
 * Get the daily liturgy for a specific date (YYYY-MM-DD)
 */
export async function getLiturgyForDateAction(
	dateStr: string,
): Promise<ActionResponse<DailyLiturgy>> {
	try {
		const data = await LiturgyService.getDailyLiturgy(dateStr);
		return {
			success: true,
			message: `Liturgy for ${dateStr} retrieved successfully`,
			data,
		};
	} catch (error) {
		console.error(`Error in getLiturgyForDateAction for ${dateStr}:`, error);
		return {
			success: false,
			message: "Failed to retrieve liturgy for the specified date",
		};
	}
}

/**
 * Get liturgy for multiple days around a date (e.g. 7 days starting from a date)
 */
export async function getLiturgyRangeAction(
	startDateStr: string,
	daysCount = 7,
): Promise<ActionResponse<DailyLiturgy[]>> {
	try {
		const [y, m, d] = startDateStr.split("-").map(Number);
		const start = new Date(y, m - 1, d);

		const promises: Promise<DailyLiturgy>[] = [];
		for (let i = 0; i < daysCount; i++) {
			const current = new Date(start);
			current.setDate(start.getDate() + i);
			promises.push(LiturgyService.getDailyLiturgy(current));
		}

		const results = await Promise.all(promises);
		return {
			success: true,
			message: "Liturgy range retrieved successfully",
			data: results,
		};
	} catch (error) {
		console.error("Error in getLiturgyRangeAction:", error);
		return {
			success: false,
			message: "Failed to retrieve liturgy range",
		};
	}
}

/**
 * Get full scripture texts for the given readings
 */
export async function getDailyScriptureTextsAction(
	readings: {
		firstReading: string;
		psalm: string;
		secondReading?: string;
		gospel: string;
	},
	season = "Ordinary Time",
) {
	try {
		const data = await LiturgyService.getDailyScriptureTexts(readings, season);
		return {
			success: true,
			message: "Scripture texts retrieved successfully",
			data,
		};
	} catch (error) {
		console.error("Error in getDailyScriptureTextsAction:", error);
		return {
			success: false,
			message: "Failed to retrieve scripture texts",
		};
	}
}
