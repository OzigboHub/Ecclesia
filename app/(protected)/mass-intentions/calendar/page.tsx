import { redirect } from "next/navigation";

export const metadata = {
	title: "Mass Intention Calendar | Ecclesia DPM",
	description: "View and manage mass intention calendar",
};

export default function MassIntentionCalendarPage() {
	redirect("/mass-intentions");
}
