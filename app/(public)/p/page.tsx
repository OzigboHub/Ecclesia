import db from "@/lib/db";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ParishesPage() {
	// List a few public organizations
	const orgs = await db.organization.findMany({
		where: {
			name: { notIn: HIDDEN_ORGANIZATION_NAMES },
		},
		select: {
			id: true,
			name: true,
			contactPhone: true,
			contactEmail: true,
		},
		orderBy: { name: "asc" },
		take: 50,
	});

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-4xl px-4 py-20">
				<h1 className="text-2xl font-bold mb-4">Browse Parishes</h1>
				<p className="text-muted-foreground mb-6">
					Select a parish to view public events, livestreams and
					campaigns.
				</p>

				<div className="grid gap-4 sm:grid-cols-2">
					{orgs.map((o: any) => (
						<Link
							key={o.id}
							href={`/p/${o.id}`}
							className="rounded-lg border bg-card p-4 hover:shadow-md transition"
						>
							<h3 className="font-semibold">{o.name}</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{o.contactPhone ||
									o.contactEmail ||
									"No contact info"}
							</p>
						</Link>
					))}
				</div>

				{orgs.length === 0 && (
					<div className="mt-8 text-center text-muted-foreground">
						No parishes available.
					</div>
				)}
			</div>
		</div>
	);
}
