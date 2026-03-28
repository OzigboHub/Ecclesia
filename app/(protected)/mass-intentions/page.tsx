import { getMassIntentions } from "@/app/actions/mass-intention.actions";
import { getMassesInRange } from "@/app/actions/mass.actions";
import { auth } from "@/auth";
import { MassIntentionCalendar } from "@/components/features/mass-intentions/mass-intention-calendar";
import { Button } from "@/components/ui/button";
import { canBookMassIntentions } from "@/lib/permissions";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
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
			subMonths(startOfMonth(new Date()), 1),
			addMonths(endOfMonth(new Date()), 1),
			session.user.organizationId,
		),
	]);

	if (!intentionsResult.success) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-bold">Mass Intentions</h1>
						<p className="text-muted-foreground mt-1">
							Book a thanksgiving, requiem, or special intention.
						</p>
					</div>
					<Link href="/masses">
						<Button variant="outline">View Mass Schedule</Button>
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold">Mass Intentions</h1>
					<p className="text-muted-foreground mt-1">
						Book a thanksgiving, requiem, or special intention for
						an available mass.
					</p>
				</div>
				<Link href="/masses">
					<Button variant="outline">View Mass Schedule</Button>
				</Link>
			</div>

			<MassIntentionCalendar
				intentions={intentionsResult.data || []}
				masses={massesResult.data || []}
				initialOrganizationId={session.user.organizationId}
			/>
		</div>
	);
}
