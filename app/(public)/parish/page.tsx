import { PublicParishSearch } from "@/components/public/public-parish-search";
import { Button } from "@/components/ui/button";
import db from "@/lib/db";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";
import Link from "next/link";

type SearchParams = {
	q?: string;
};

export default async function Masses({
	searchParams,
}: {
	searchParams?: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const query = params?.q?.trim() ?? "";
	const now = new Date();

	const parishes = await db.organization.findMany({
		where: {
			name: { notIn: HIDDEN_ORGANIZATION_NAMES },
		},
		select: {
			id: true,
			name: true,
			address: true,
			contactPhone: true,
			contactEmail: true,
			_count: {
				select: {
					masses: {
						where: {
							date: { gte: now },
							status: { not: "CANCELLED" },
						},
					},
				},
			},
		},
		orderBy: { name: "asc" },
	});

	const searchItems = parishes.map((p) => ({
		id: p.id,
		name: p.name,
		address: p.address,
		contactPhone: p.contactPhone,
		contactEmail: p.contactEmail,
		massesCount: p._count.masses,
	}));

	return (
		<div className="min-h-screen pt-20 bg-background">
			<section className="border-b bg-gradient-to-b from-muted/50 to-background py-10">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="space-y-2">
							<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
								Parish Directory
							</p>
							<h1 className="text-3xl font-bold md:text-4xl">
								Browse Parishes
							</h1>
							<p className="text-sm text-muted-foreground md:text-base">
								Find your parish to view upcoming masses, societies, and public updates.
							</p>
						</div>
						<div className="flex gap-2">
							<Button asChild variant="outline">
								<Link href="/parish/intentions">
									Mass intentions
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/">Back to home</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-4 py-12">
				<PublicParishSearch
					initialParishes={searchItems}
					initialQuery={query}
					showMassesCount={true}
				/>
			</div>
		</div>
	);
}
