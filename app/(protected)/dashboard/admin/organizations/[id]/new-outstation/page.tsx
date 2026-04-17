import { auth } from "@/auth";
import { AdminOrganizationForm } from "@/components/forms/admin-organization-form";
import { Button } from "@/components/ui/button";
import db from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface NewOutstationPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function NewOutstationPage({
	params,
}: NewOutstationPageProps) {
	const session = await auth();

	if (!session?.user) {
		redirect("/dashboard");
	}

	const isSuperAdmin = session.user.role === "SUPER_ADMIN";
	const isParishAdmin = session.user.role === "PARISH_ADMIN";
	if (!isSuperAdmin && !isParishAdmin) {
		redirect("/dashboard");
	}

	const { id } = await params;
	const targetParishId = isParishAdmin ? session.user.organizationId : id;

	const currentParish = await db.organization.findUnique({
		where: { id: targetParishId },
	});

	if (!currentParish || currentParish.level !== "PARISH") {
		redirect(
			isParishAdmin ?
				"/dashboard/outstations"
			:	"/dashboard/admin/organizations",
		);
	}

	if (isParishAdmin && currentParish.id !== session.user.organizationId) {
		redirect("/dashboard");
	}

	return (
		<div className="space-y-6">
			<div>
				<Link
					href={
						isParishAdmin ?
							"/dashboard/outstations"
						:	`/dashboard/admin/organizations/${targetParishId}`
					}
				>
					<Button variant="ghost" size="sm" className="mb-2">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to {currentParish.name}
					</Button>
				</Link>
				<h1 className="text-3xl font-bold tracking-tight">
					Create New Outstation
				</h1>
				<p className="text-muted-foreground mt-2">
					Create a new outstation under {currentParish.name}
				</p>
			</div>

			<div className="flex justify-center">
				<AdminOrganizationForm
					type="outstation"
					parishes={[currentParish]}
					defaultParentId={currentParish.id}
				/>
			</div>
		</div>
	);
}
