import { auth } from "@/auth";
import { MassCalendar } from "@/components/mass/mass-calendar";
import { MassCreateDialog } from "@/components/mass/mass-create-dialog";
import { MassGenerateDialog } from "@/components/mass/mass-generate-dialog";
import { Button } from "@/components/ui/button";
import { canManageMassIntentions } from "@/lib/permissions";
import Link from "next/link";

const MASS_GENERATE_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];

export default async function MassesPage() {
	const session = await auth();
	const canGenerate = MASS_GENERATE_ROLES.includes(session?.user?.role ?? "");
	const canManage = canManageMassIntentions(session?.user?.role ?? "");

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
						Mass Calendar
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						View and manage daily masses, including special
						celebrations and schedule updates for your parish
						community.
					</p>
				</div>
				{canGenerate && (
					<div className="flex flex-wrap gap-2 md:justify-end">
						<Button variant="outline" asChild>
							<Link href="/mass-schedule">Manage Templates</Link>
						</Button>
						<MassCreateDialog />
						<MassGenerateDialog />
					</div>
				)}
			</div>

			<MassCalendar canManage={canManage} />
		</div>
	);
}
