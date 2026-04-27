import { auth } from "@/auth";
import { OrganizationProfileForm } from "@/components/forms/organization-profile-form";
import db from "@/lib/db";
import { canEditOrganizationProfile } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function OrganizationPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	if (!canEditOrganizationProfile(session.user.role)) {
		redirect("/dashboard");
	}

	const organization = await db.organization.findUnique({
		where: { id: session.user.organizationId },
		select: {
			name: true,
			level: true,
			address: true,
			contactEmail: true,
			contactPhone: true,
		},
	});

	if (!organization) {
		redirect("/dashboard");
	}

	const canEditName = session.user.role !== "OUTSTATION_ADMIN";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
					Organization Profile
				</h1>
				<p className="text-muted-foreground mt-1">
					Update your {organization.level.toLowerCase()} contact
					details.
				</p>
			</div>

			<OrganizationProfileForm
				organization={organization}
				canEditName={canEditName}
			/>
		</div>
	);
}
