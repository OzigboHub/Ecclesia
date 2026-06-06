import { getMassIntentions } from "@/app/actions/mass-intention.actions";
import { getMassesInRange } from "@/app/actions/mass.actions";
import { auth } from "@/auth";
import { MassIntentionCalendar } from "@/components/features/mass-intentions/mass-intention-calendar";
import { MassIntentionExportButton } from "@/components/features/mass-intentions/mass-intention-export-button";
import { ParishionerMassIntentions } from "@/components/features/mass-intentions/parishioner-mass-intentions";
import { Button } from "@/components/ui/button";
import {
	canBookMassIntentions,
	canManageMassIntentions,
} from "@/lib/permissions";
import {
	addMonths,
	endOfMonth,
	format,
	startOfMonth,
	subMonths,
} from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Mass Intentions | Ecclesia DPM",
	description: "Book mass intentions and thanksgivings",
};

export default async function MassIntentionsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	if (!canBookMassIntentions(session.user.role)) {
		redirect("/dashboard");
	}

	const [intentionsResult, massesResult] = await Promise.all([
		getMassIntentions(),
		getMassesInRange(
			format(subMonths(startOfMonth(new Date()), 1), "yyyy-MM-dd"),
			format(addMonths(endOfMonth(new Date()), 1), "yyyy-MM-dd"),
			session.user.organizationId,
		),
	]);

	if (!intentionsResult.success) {
		return (
			<div className="space-y-4">
				hbgv{" "}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold">
							Mass Intentions
						</h1>
						<p className="text-muted-foreground text-sm mt-1">
							Book a thanksgiving, requiem, or special intention.
						</p>
					</div>
					<Link href="/masses">
						<Button variant="outline" size="sm">
							View Mass Schedule
						</Button>
					</Link>
				</div>
				<div className="rounded-lg border border-destructive bg-destructive/10 p-4">
					<p className="text-sm text-destructive">
						{intentionsResult.message ||
							"Failed to load mass intentions"}
					</p>
				</div>
			</div>
		);
	}

	const isParishioner = session.user.role === "PARISHIONER";
	const canExport = canManageMassIntentions(session.user.role);
	const isParishAdminOrSecretary =
		session.user.role === "PARISH_ADMIN" ||
		session.user.role === "PARISH_SECRETARY";
	const canReviewIntentions = isParishAdminOrSecretary;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold">
						Mass Intentions
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						{isParishioner ?
							"Select a mass below and book your intention."
						:	"Book a thanksgiving, requiem, or special intention for an available mass."
						}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{canExport && <MassIntentionExportButton />}
					{!isParishioner && (
						<Link href="/masses">
							<Button variant="outline" size="sm">
								View Mass Schedule
							</Button>
						</Link>
					)}
				</div>
			</div>

			{isParishioner ?
				<ParishionerMassIntentions
					masses={massesResult.data || []}
					intentions={intentionsResult.data || []}
				/>
			:	<MassIntentionCalendar
					intentions={intentionsResult.data || []}
					masses={massesResult.data || []}
					initialOrganizationId={session.user.organizationId}
					canReviewIntentions={canReviewIntentions}
					allowOrganizationChange={!isParishAdminOrSecretary}
				/>
			}
		</div>
	);
}
