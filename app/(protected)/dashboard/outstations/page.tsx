import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import db from "@/lib/db";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ParishOutstationsPageProps {
	searchParams: Promise<{ page?: string }>;
}

export default async function ParishOutstationsPage({
	searchParams,
}: ParishOutstationsPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== "PARISH_ADMIN") {
		redirect("/dashboard");
	}

	const sParams = await searchParams;
	const page = parseInt(sParams.page || "1");
	const limit = 20;
	const skip = (page - 1) * limit;

	const parish = await db.organization.findUnique({
		where: { id: session.user.organizationId },
		select: { id: true, name: true, level: true },
	});

	if (!parish || parish.level !== "PARISH") {
		redirect("/dashboard");
	}

	const [outstations, total] = await Promise.all([
		db.organization.findMany({
			where: { parentId: parish.id },
			orderBy: { name: "asc" },
			skip,
			take: limit,
		}),
		db.organization.count({ where: { parentId: parish.id } }),
	]);

	const totalPages = Math.ceil(total / limit);

	return (
		<div className="space-y-6">
			<div className="space-y-2 flex justify-between items-start">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Outstations
					</h1>
					<p className="text-muted-foreground">
						All outstations belonging to {parish.name}
					</p>
				</div>
				<Link href="/dashboard/outstations/new">
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Add Outstation
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						{total} Outstation{total !== 1 ? "s" : ""}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Address</TableHead>
								<TableHead>Contact Phone</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{outstations.map((org) => (
								<TableRow key={org.id}>
									<TableCell className="font-medium">
										{org.name}
									</TableCell>
									<TableCell>{org.address || "-"}</TableCell>
									<TableCell>
										{org.contactPhone || "-"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Link
								href={`/dashboard/outstations?page=${Math.max(1, page - 1)}`}
							>
								<Button
									variant="outline"
									size="sm"
									disabled={page === 1}
								>
									Previous
								</Button>
							</Link>
							<span className="text-sm text-muted-foreground">
								Page {page} of {totalPages}
							</span>
							<Link
								href={`/dashboard/outstations?page=${Math.min(totalPages, page + 1)}`}
							>
								<Button
									variant="outline"
									size="sm"
									disabled={page === totalPages}
								>
									Next
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
