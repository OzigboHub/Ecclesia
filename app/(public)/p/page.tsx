import { PublicParishSearch } from "@/components/public/public-parish-search";
import db from "@/lib/db";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";

export const dynamic = "force-dynamic";

export default async function ParishesPage() {
	const orgs = await db.organization.findMany({
		where: {
			name: { notIn: HIDDEN_ORGANIZATION_NAMES },
		},
		select: {
			id: true,
			name: true,
			address: true,
			contactPhone: true,
			contactEmail: true,
		},
		orderBy: { name: "asc" },
		take: 100,
	});

	const searchItems = orgs.map((o) => ({
		id: o.id,
		name: o.name,
		address: o.address,
		contactPhone: o.contactPhone,
		contactEmail: o.contactEmail,
	}));

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-20">
				<div className="space-y-2 mb-8">
					<h1 className="text-3xl font-bold tracking-tight">Browse Parishes</h1>
					<p className="text-muted-foreground">
						Select a parish to view public events, masses, societies, and campaigns.
					</p>
				</div>

				<PublicParishSearch
					initialParishes={searchItems}
					showMassesCount={false}
				/>
			</div>
		</div>
	);
}
