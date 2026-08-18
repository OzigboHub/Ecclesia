import { auth } from "@/auth";
import { RosterImport } from "@/components/features/parishioners/roster-import";
import { canManageParishioners } from "@/lib/permissions";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Import the register · Ecclesia",
};

export default async function RosterImportPage() {
	const session = await auth();
	if (!session?.user) redirect("/auth/login");
	if (!canManageParishioners(session.user.role)) redirect("/dashboard");

	return (
		<div className="mx-auto max-w-4xl">
			<Link
				href="/parishioners"
				className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ChevronLeft className="size-4" aria-hidden />
				Parishioners
			</Link>

			<h1 className="text-2xl font-bold">Import the register</h1>
			<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
				Bring the parish register into Ecclesia. Everyone imported here can
				lock in on their own phone with a code you issue — so the phone
				number matters more than anything else in the file.
			</p>

			<div className="mt-6">
				<RosterImport />
			</div>
		</div>
	);
}
