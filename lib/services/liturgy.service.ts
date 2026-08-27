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

	/**
	 * Fetch full Scripture texts for a set of readings citations
	 */
	static async getDailyScriptureTexts(
		readings: {
			firstReading: string;
			psalm: string;
			secondReading?: string;
			gospel: string;
		},
		season = "Ordinary Time",
	) {
		const [firstReading, psalm, secondReading, alleluia, gospel] = await Promise.all([
			this.fetchPassage(readings.firstReading, "First Reading"),
			this.fetchPassage(readings.psalm, "Responsorial Psalm"),
			readings.secondReading ?
				this.fetchPassage(readings.secondReading, "Second Reading")
			:	Promise.resolve(undefined),
			this.getGospelAcclamationPassage(readings.gospel, season),
			this.fetchPassage(readings.gospel, "Holy Gospel"),
		]);

		return {
			firstReading,
			psalm,
			secondReading,
			alleluia,
			gospel,
		};
	}

	/**
	 * Lectionary Verse before the Gospel: fetches the exact designated verse
	 * from the Gospel pericopae (e.g. Matthew 24:42 for Matthew 24:42-51)
	 */
	static async getGospelAcclamationPassage(
		gospelCitation: string,
		season = "Ordinary Time",
	): Promise<{ citation: string; label: string; text: string }> {
		const isLent = season?.toLowerCase().includes("lent");
		const label = isLent ? "Gospel Acclamation" : "Alleluia";
		const refrain = isLent ?
			"R. Praise to you, Lord Jesus Christ, King of endless glory!"
		:	"R. Alleluia, alleluia.";

		let citation = "";
		let verseText = "";

		// Extract opening verse from the gospel pericope citation (e.g. "Matthew 24:42-51" -> "Matthew 24:42")
		const match = (gospelCitation || "").match(/^([1-3]?\s*[a-zA-Z\s]+)\s*(\d+):(\d+)/);
		if (match) {
			const book = match[1].trim();
			const chapter = match[2];
			const startVerse = match[3];
			citation = `${book} ${chapter}:${startVerse}`;

			try {
				const res = await fetch(`https://bible-api.com/${encodeURIComponent(citation)}`, {
					next: { revalidate: 604800 },
				});
				if (res.ok) {
					const data = await res.json();
					if (data.text) {
						verseText = data.text
							.replace(/\bYahweh\b/g, "the LORD")
							.replace(/\byahweh\b/g, "the Lord")
							.replace(/\bYAHWEH\b/g, "THE LORD")
							.replace(/\n+/g, " ")
							.trim();
					}
				}
			} catch (e) {
				// Continue to fallback
			}
		}

		if (!verseText) {
			const fallback = this.getGospelAcclamationVerse(gospelCitation);
			citation = fallback.citation;
			verseText = fallback.text;
		}

		return {
			citation,
			label,
			text: `${refrain}\n\n${verseText}\n\n${refrain}`,
		};
	}

	/**
	 * Lectionary Fallback Verse before the Gospel based on evangelist
	 */
	static getGospelAcclamationVerse(gospelCitation: string): {
		citation: string;
		text: string;
	} {
		const gLower = (gospelCitation || "").toLowerCase();
		if (gLower.includes("john") || gLower.includes("jn")) {
			return {
				citation: "Jn 8:12",
				text: "I am the light of the world, says the Lord; whoever follows me will have the light of life.",
			};
		}
		if (gLower.includes("matthew") || gLower.includes("mt")) {
			return {
				citation: "Mt 24:42",
				text: "Stay awake! For you do not know on which day your Lord will come.",
			};
		}
		if (gLower.includes("mark") || gLower.includes("mk")) {
			return {
				citation: "Mk 1:15",
				text: "The Kingdom of God is at hand; repent and believe in the Gospel.",
			};
		}
		if (gLower.includes("luke") || gLower.includes("lk")) {
			return {
				citation: "Lk 19:38",
				text: "Blessed is the King who comes in the name of the Lord. Glory to God in the highest and peace to his people on earth.",
			};
		}
		return {
			citation: "Jn 14:6",
			text: "I am the way, the truth and the life, says the Lord; no one comes to the Father, except through me.",
		};
	}

	/**
	 * Helper to fetch and format scripture passage text
	 */
	/**
	 * Helper to fetch and format scripture passage text
	 */
	static async fetchPassage(citation: string, label: string) {
		if (!citation) {
			return { citation: "", label, text: "No citation provided" };
		}

		// Clean citation string (remove verse sub-letters like 18b -> 18, replace "and" with comma)
		let cleaned = citation
			.replace(/(\d+)[a-z]/gi, "$1")
			.replace(/\s+and\s+/gi, ", ")
			.replace(/\s+/g, " ")
			.trim();

		const primaryUrl = `https://bible-api.com/${encodeURIComponent(cleaned)}`;

		try {
			const res = await fetch(primaryUrl, {
				next: { revalidate: 604800 }, // 7 days cache
			});

			if (res.ok) {
				const data = await res.json();
				const formattedText = this.formatLiturgicalText(
					data.text || "",
					label,
					data.verses || [],
					citation,
				);
				return {
					citation,
					label,
					text: formattedText,
					verses: data.verses || [],
					translationName: data.translation_name || "Scripture Text",
				};
			}

			// Fallback: if range syntax was too complex, try book + chapter
			const match = cleaned.match(/^([1-3]?\s*[a-zA-Z\s]+)\s*(\d+)/);
			if (match) {
				const fallbackQuery = `${match[1].trim()} ${match[2]}`;
				const fallbackRes = await fetch(
					`https://bible-api.com/${encodeURIComponent(fallbackQuery)}`,
					{ next: { revalidate: 604800 } },
				);
				if (fallbackRes.ok) {
					const data = await fallbackRes.json();
					const formattedText = this.formatLiturgicalText(
						data.text || "",
						label,
						data.verses || [],
						citation,
					);
					return {
						citation,
						label,
						text: formattedText,
						verses: data.verses || [],
						translationName: data.translation_name || "Scripture Text",
					};
				}
			}

			return {
				citation,
				label,
				text: `Passage for ${citation}. Click below to view the official text on USCCB.`,
				error: "Could not load full text directly",
			};
		} catch (error) {
			return {
				citation,
				label,
				text: `Passage for ${citation}. Click below to view the official text on USCCB.`,
				error: "Network error loading scripture",
			};
		}
	}

	/**
	 * Formats Catholic liturgical texts in accordance with Holy See Lectionary standards:
	 * 1. Replaces Tetragrammaton translations ("Yahweh") with "the LORD" / "The LORD".
	 * 2. Structures Responsorial Psalms with 'R.' refrains between strophes.
	 */
	static formatLiturgicalText(
		rawText: string,
		label: string,
		verses: Array<{ verse?: number; text: string }>,
		citation: string,
	): string {
		// Catholic Liturgical Directive: Replace "Yahweh" with "the LORD" / "The LORD"
		let text = rawText
			.replace(/\bYahweh\b/g, "the LORD")
			.replace(/\byahweh\b/g, "the Lord")
			.replace(/\bYAHWEH\b/g, "THE LORD");

		const isPsalm =
			label.toLowerCase().includes("psalm") ||
			citation.toLowerCase().startsWith("psalm") ||
			citation.toLowerCase().startsWith("ps");

		if (!isPsalm) {
			return text.trim();
		}

		// Clean up verses text
		const cleanedVerses = verses.map((v) => ({
			verse: v.verse,
			text: v.text
				.replace(/\bYahweh\b/g, "the LORD")
				.replace(/\byahweh\b/g, "the Lord")
				.replace(/\bYAHWEH\b/g, "THE LORD")
				.replace(/\n+/g, " ")
				.trim(),
		})).filter((v) => v.text.length > 0);

		if (cleanedVerses.length === 0) {
			const lines = text
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length === 0) return text.trim();

			const responseLine = lines[0].replace(/^[0-9:\s]+/, "");
			const result: string[] = [`R. ${responseLine}`];

			for (let i = 0; i < lines.length; i += 2) {
				const strophe = lines.slice(i, i + 2).join("\n");
				result.push(strophe);
				result.push(`R. ${responseLine}`);
			}
			return result.join("\n\n");
		}

		// Determine response refrain from the first verse
		const firstVerse = cleanedVerses[0]?.text || "";
		// Extract first sentence or phrase for the refrain
		const sentenceMatch = firstVerse.match(/^([^.;!]+[.;!]?)/);
		const refrain = (sentenceMatch ? sentenceMatch[1] : firstVerse)
			.replace(/^[0-9:\s]+/, "")
			.trim();

		const responseRefrain = `R. ${refrain}`;
		const output: string[] = [responseRefrain];

		// Group verses into strophes of 2
		for (let i = 0; i < cleanedVerses.length; i += 2) {
			const stropheLines = cleanedVerses
				.slice(i, i + 2)
				.map((v) => v.text)
				.join("\n");
			output.push(stropheLines);
			output.push(responseRefrain);
		}

		return output.join("\n\n");
	}
}
