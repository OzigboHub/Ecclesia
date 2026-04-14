import { getParishioners } from "@/app/actions/parishioner.actions";
import { auth } from "@/auth";
import { CsvImportDialog } from "@/components/features/parishioners/csv-import-dialog";
import { ParishionersList } from "@/components/features/parishioners/parishioners-list";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/permissions";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ParishionersPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect("/auth/login");
	}

	const searchParams = await searchParamsPromise;
	const result = await getParishioners(searchParams.organizationId);

	if (!result.success) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold text-destructive">
					Error
				</h2>
				<p className="text-muted-foreground mt-2">{result.message}</p>
			</div>
		);
	}

	const parishioners = result.data || [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
						Parishioners
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage your parish members
					</p>
				</div>
				<div className="flex gap-2">
					<CsvImportDialog />
					<Link href="/dashboard/parishioners/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Parishioner
						</Button>
					</Link>
				</div>
			</div>

			{/* Parishioners List */}
			<ParishionersList parishioners={parishioners} canDelete={isAdminRole(session.user.role)} />
		</div>
	);
}
