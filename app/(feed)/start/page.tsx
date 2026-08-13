import { getPreferences } from "@/app/actions/preferences.actions";
import { Onboarding } from "@/components/feed/start/onboarding";
import db from "@/lib/db";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";

export const metadata = {
	title: "Find your parish · Ecclesia",
};

export default async function StartPage() {
	const prefs = await getPreferences();

	// There is no location permission at this point in the flow — asking for
	// one before the person has any reason to trust the app is a good way to
	// get refused. Until there is geo data on Organization, "nearby" is simply
	// the parishes that exist, alphabetically.
	const nearby = await db.organization.findMany({
		where: { name: { notIn: HIDDEN_ORGANIZATION_NAMES } },
		select: { id: true, name: true, address: true },
		orderBy: { name: "asc" },
		take: 8,
	});

	return <Onboarding initial={prefs} nearby={nearby} />;
}
