import { auth } from "@/auth";
import { MassScheduleManager } from "@/components/mass/mass-schedule-manager";
import db from "@/lib/db";
import { canManageMassIntentions, isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function MassSchedulePage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	if (!canManageMassIntentions(session.user.role)) {
		redirect("/masses");
	}

	const initialTemplates = await db.massScheduleTemplate.findMany({
		where: { organizationId: session.user.organizationId },
		orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Mass Schedule
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage recurring mass schedules and templates.
				</p>
			</div>

			<MassScheduleManager
				initialTemplates={initialTemplates}
				canDelete={isAdminRole(session.user.role)}
				canEdit={[
					"SUPER_ADMIN",
					"PARISH_ADMIN",
					"PARISH_SECRETARY",
				].includes(session.user.role)}
			/>
		</div>
	);
}
