export type LiturgicalColor = "green" | "purple" | "white" | "red" | "rose";

export type CelebrationType =
	| "SOLEMNITY"
	| "FEAST"
	| "MEMORIAL"
	| "OPTIONAL MEMORIAL"
	| "COMMEMORATION"
	| "FERIA"
	| "SUNDAY"
	| string;

export interface RawReadingsResponse {
	date: string; // YYYY-MM-DD
	monthDay: string; // M/D
	season: string; // Ordinary Time, Lent, Easter, Advent, etc.
	readings: {
		firstReading: string;
		psalm: string;
		secondReading?: string;
		gospel: string;
	};
	usccbLink: string;
	apiEndpoint?: string;
}

export interface RawCelebration {
	name: string;
	type: CelebrationType;
	quote?: string;
	description?: string;
	image?: string;
}

export interface RawLiturgicalCalendarResponse {
	date: string;
	monthDay: string;
	season: string;
	celebration?: RawCelebration;
	apiEndpoint?: string;
}

export interface DailyLiturgy {
	date: string; // YYYY-MM-DD
	formattedDate: string; // e.g. Thursday, Aug 27, 2026
	monthDay: string;
	season: string;
	liturgicalColor: LiturgicalColor;
	colorName: string; // "Green", "White", etc.
	celebration: {
		name: string;
		type: CelebrationType;
		quote?: string;
		description?: string;
		image?: string;
	};
	readings: {
		firstReading: string;
		psalm: string;
		secondReading?: string;
		gospel: string;
	};
	usccbLink: string;
}
