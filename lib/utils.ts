import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getInitials(value: string): string {
	if (!value) return "";

	const words = value.trim().split(/\s+/);

	const first = words[0]?.[0] ?? "";
	const second = words[1]?.[0] ?? "";

	return (first + second).toUpperCase();
}
