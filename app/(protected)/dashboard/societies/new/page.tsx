import { auth } from "@/auth";
import { SocietyForm } from "@/components/forms/society-form";
import { canManageSocieties } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function NewSocietyPage() {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect("/auth/login");
	}

	const canCreate = canManageSocieties(session.user.role);
	if (!canCreate) {
		redirect("/dashboard");
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Create Society
				</h1>
				<p className="text-muted-foreground">
					Register a new church society or group.
				</p>
			</div>

			<SocietyForm />
		</div>
	);
}
