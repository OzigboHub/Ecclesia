import { auth } from "@/auth";
import { MassCalendar } from "@/components/mass/mass-calendar";
import { MassGenerateDialog } from "@/components/mass/mass-generate-dialog";
import { canManageMassIntentions } from "@/lib/permissions";

const MASS_GENERATE_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];

export default async function MassesPage() {
	const session = await auth();
	const canGenerate = MASS_GENERATE_ROLES.includes(session?.user?.role ?? "");
	const canManage = canManageMassIntentions(session?.user?.role ?? "");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Mass Calendar
					</h1>
					<p className="text-muted-foreground">
						View and manage daily masses.
					</p>
				</div>
				{canGenerate && <MassGenerateDialog />}
			</div>

			<MassCalendar canManage={canManage} />
		</div>
	);
}
