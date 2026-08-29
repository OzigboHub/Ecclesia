import { getPublicSocietiesForParish } from "@/app/actions/society.actions";
import { auth } from "@/auth";
import { PublicSocietiesSection } from "@/components/public/public-societies-section";
import db from "@/lib/db";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ParishSocietiesPage({
	params,
}: {
	params: Promise<{ parishId: string }>;
}) {
	const { parishId } = await params;
	if (!parishId) {
		notFound();
	}

	const [org, societiesResult, session] = await Promise.all([
		db.organization.findUnique({
			where: { id: parishId },
			select: { id: true, name: true, address: true },
		}),
		getPublicSocietiesForParish(parishId),
		auth(),
	]);

	if (!org) {
		notFound();
	}

	const societies = societiesResult.data ?? [];

	return (
		<div className="min-h-screen pt-20 pb-16 bg-background">
			{/* Page Header */}
			<section className="border-b bg-gradient-to-b from-muted/50 to-background py-10">
				<div className="mx-auto max-w-6xl px-4">
					<div className="space-y-3">
						<Link
							href={`/p/${parishId}`}
							className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
						>
							<ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
							Back to {org.name}
						</Link>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Users className="h-5 w-5" />
							</div>
							<div>
								<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
									Societies & Ministries
								</h1>
								<p className="text-sm text-muted-foreground">
									{org.name}
									{org.address ? ` · ${org.address}` : ""}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Societies Content */}
			<div className="mx-auto max-w-6xl px-4 py-10">
				<PublicSocietiesSection
					parishId={parishId}
					societies={societies}
					currentRole={session?.user?.role}
					userOrganizationId={session?.user?.organizationId}
					showViewAllLink={false}
				/>
			</div>
		</div>
	);
}
