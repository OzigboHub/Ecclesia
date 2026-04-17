import { auth } from "@/auth";
import { AdminOrganizationForm } from "@/components/forms/admin-organization-form";
import { Button } from "@/components/ui/button";
import db from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewParishOutstationPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== "PARISH_ADMIN") {
		redirect("/dashboard");
	}

	const parish = await db.organization.findUnique({
		where: { id: session.user.organizationId },
	});

	if (!parish || parish.level !== "PARISH") {
		redirect("/dashboard");
	}

	return (
		<div className="space-y-6">
			<div>
				<Link href="/dashboard/outstations">
					<Button variant="ghost" size="sm" className="mb-2">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Outstations
					</Button>
				</Link>
				<h1 className="text-3xl font-bold tracking-tight">
					Create New Outstation
				</h1>
				<p className="text-muted-foreground mt-2">
					Create a new outstation under {parish.name}
				</p>
			</div>

			<div className="flex justify-center">
				<AdminOrganizationForm
					type="outstation"
					parishes={[parish]}
					defaultParentId={parish.id}
				/>
			</div>
		</div>
	);
}
