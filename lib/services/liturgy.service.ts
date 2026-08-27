import type {
	DailyLiturgy,
	LiturgicalColor,
	RawCelebration,
	RawLiturgicalCalendarResponse,
	RawReadingsResponse,
} from "@/types/liturgy";

const CATHOLIC_READING_API = (
	process.env.CATHOLIC_READING_API ||
	"https://cpbjr.github.io/catholic-readings-api"
).replace(/\/+$/, "");

function parseDateComponents(inputDate?: Date | string): {
	year: number;
	mmDd: string;
	isoDate: string;
	dateObj: Date;
} {
	let dateObj: Date;
	if (!inputDate) {
		dateObj = new Date();
	} else if (typeof inputDate === "string") {
		// Handle YYYY-MM-DD
		const [y, m, d] = inputDate.split("-").map(Number);
		if (y && m && d) {
			dateObj = new Date(y, m - 1, d);
		} else {
			dateObj = new Date(inputDate);
		}
	} else {
		dateObj = inputDate;
	}

	const year = dateObj.getFullYear();
	const month = String(dateObj.getMonth() + 1).padStart(2, "0");
	const day = String(dateObj.getDate()).padStart(2, "0");
	const mmDd = `${month}-${day}`;
	const isoDate = `${year}-${month}-${day}`;

	return { year, mmDd, isoDate, dateObj };
}

function determineLiturgicalColor(
	season: string,
	celebration?: RawCelebration,
): { color: LiturgicalColor; colorName: string } {
	const seasonLower = season?.toLowerCase() ?? "";
	const celebNameLower = celebration?.name?.toLowerCase() ?? "";
	const celebTypeLower = celebration?.type?.toLowerCase() ?? "";

	// Martyrs, Pentecost, Passion, Palm Sunday, Apostles
	if (
		celebNameLower.includes("martyr") ||
		celebNameLower.includes("pentecost") ||
		celebNameLower.includes("passion") ||
		celebNameLower.includes("cross") ||
		celebNameLower.includes("apostle")
	) {
		return { color: "red", colorName: "Red" };
	}

	// Gaudete & Laetare Sundays
	if (
		celebNameLower.includes("gaudete") ||
		celebNameLower.includes("laetare")
	) {
		return { color: "rose", colorName: "Rose" };
	}

	// Lent & Advent
	if (
		seasonLower.includes("lent") ||
		seasonLower.includes("advent")
	) {
		// Solemnities during Lent/Advent (e.g. St Joseph, Annunciation) are White
		if (
			celebTypeLower.includes("solemnity") &&
			(celebNameLower.includes("joseph") ||
				celebNameLower.includes("annunciation") ||
				celebNameLower.includes("mary"))
		) {
			return { color: "white", colorName: "White" };
		}
		return { color: "purple", colorName: "Violet / Purple" };
	}

	// Easter & Christmas seasons, feasts of Our Lord, Mary, and Saints
	if (
		seasonLower.includes("easter") ||
		seasonLower.includes("christmas") ||
		celebTypeLower.includes("solemnity") ||
		celebTypeLower.includes("feast") ||
		celebTypeLower.includes("memorial") ||
		celebNameLower.includes("saint") ||
		celebNameLower.includes("st.") ||
		celebNameLower.includes("mary") ||
		celebNameLower.includes("virgin") ||
		celebNameLower.includes("christ") ||
		celebNameLower.includes("lord")
	) {
		return { color: "white", colorName: "White" };
	}

	// Default Ordinary Time
	return { color: "green", colorName: "Green" };
}

export class LiturgyService {
	/**
	 * Fetch readings for a given date
	 */
	static async getReadings(
		targetDate?: Date | string,
	): Promise<RawReadingsResponse | null> {
		const { year, mmDd } = parseDateComponents(targetDate);
		const url = `${CATHOLIC_READING_API}/readings/${year}/${mmDd}.json`;

		try {
			const res = await fetch(url, {
				next: { revalidate: 86400, tags: [`liturgy-readings-${year}-${mmDd}`] },
			});
			if (!res.ok) {
				return null;
			}
			return (await res.json()) as RawReadingsResponse;
		} catch (error) {
			console.error(`Failed to fetch readings from ${url}:`, error);
			return null;
		}
	}

	/**
	 * Fetch liturgical calendar / saint celebration for a given date
	 */
	static async getCelebration(
		targetDate?: Date | string,
	): Promise<RawLiturgicalCalendarResponse | null> {
		const { year, mmDd } = parseDateComponents(targetDate);
		const url = `${CATHOLIC_READING_API}/liturgical-calendar/${year}/${mmDd}.json`;

		try {
			const res = await fetch(url, {
				next: { revalidate: 86400, tags: [`liturgy-calendar-${year}-${mmDd}`] },
			});
			if (!res.ok) {
				return null;
			}
			return (await res.json()) as RawLiturgicalCalendarResponse;
		} catch (error) {
			console.error(`Failed to fetch celebration from ${url}:`, error);
			return null;
		}
	}

	/**
	 * Get aggregated Daily Liturgy data
	 */
	static async getDailyLiturgy(
		targetDate?: Date | string,
	): Promise<DailyLiturgy> {
		const { year, mmDd, isoDate, dateObj } = parseDateComponents(targetDate);

		const formattedDate = dateObj.toLocaleDateString("en-US", {
			weekday: "long",
			month: "short",
			day: "numeric",
			year: "numeric",
		});

		const [readingsRes, celebrationRes] = await Promise.all([
			this.getReadings(targetDate),
			this.getCelebration(targetDate),
		]);

		const season =
			celebrationRes?.season || readingsRes?.season || "Ordinary Time";
		const celebrationData = celebrationRes?.celebration ?? {
			name: `${season} Weekday`,
			type: "FERIA",
		};

		const { color, colorName } = determineLiturgicalColor(
			season,
			celebrationData,
		);

		const readings = readingsRes?.readings ?? {
			firstReading: "Reading citation available on USCCB",
			psalm: "Responsorial Psalm",
			gospel: "Gospel reading",
		};

		const usccbMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
		const usccbDay = String(dateObj.getDate()).padStart(2, "0");
		const usccbYear = String(year).slice(-2);
		const defaultUsccbLink = `https://bible.usccb.org/bible/readings/${usccbMonth}${usccbDay}${usccbYear}.cfm`;

		return {
			date: isoDate,
			formattedDate,
			monthDay: readingsRes?.monthDay || `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
			season,
			liturgicalColor: color,
			colorName,
			celebration: celebrationData,
			readings,
			usccbLink: readingsRes?.usccbLink || defaultUsccbLink,
		};
	}
}
