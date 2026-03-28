import { auth } from "@/auth";
import { MassScheduleManager } from "@/components/mass/mass-schedule-manager";
import { canManageMassIntentions } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function MassSchedulePage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	if (!canManageMassIntentions(session.user.role)) {
		redirect("/masses");
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Mass Schedule
				</h1>
				<p className="text-muted-foreground">
					Manage recurring mass schedules and templates.
				</p>
			</div>

			<MassScheduleManager />
		</div>
	);
}
