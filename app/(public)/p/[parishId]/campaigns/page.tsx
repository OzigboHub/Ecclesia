import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import db from "@/lib/db";
import { differenceInDays, format } from "date-fns";
import { Calendar, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CampaignsPage({
	params,
	searchParams,
}: {
	params: Promise<{ parishId: string }>;
	searchParams?: { q?: string; sort?: string };
}) {
	const { parishId } = await params;
	if (!parishId) {
		notFound();
	}

	const searchQuery =
		typeof searchParams?.q === "string" ? searchParams.q : "";
	const sortKey =
		typeof searchParams?.sort === "string" ? searchParams.sort : "newest";

	// Verify organization exists
	const org = await db.organization.findUnique({
		where: { id: parishId },
		select: { id: true, name: true },
	});

	if (!org) {
		notFound();
	}

	// Get all active campaigns
	const campaigns = await db.donationCampaign.findMany({
		where: {
			organizationId: parishId,
			isActive: true,
			...(searchQuery ?
				{
					OR: [
						{
							name: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
						{
							description: {
								contains: searchQuery,
								mode: "insensitive",
							},
						},
					],
				}
			:	{}),
		},
		select: {
			id: true,
			name: true,
			description: true,
			targetAmount: true,
			startDate: true,
			endDate: true,
			createdAt: true,
		},
		orderBy:
			sortKey === "ending" ? { endDate: "asc" }
			: sortKey === "goal" ? { targetAmount: "desc" }
			: sortKey === "name" ? { name: "asc" }
			: { createdAt: "desc" },
	});

	// Calculate campaign progress
	let campaignsWithProgress = await Promise.all(
		campaigns.map(async (c) => {
			const raised = await db.payment.aggregate({
				where: {
					donationCampaignId: c.id,
					paymentStatus: "COMPLETED",
				},
				_sum: { amount: true },
			});
			return {
				...c,
				raisedAmount: raised._sum.amount || 0,
				progress: Math.min(
					100,
					((raised._sum.amount || 0) / c.targetAmount) * 100,
				),
			};
		}),
	);

	if (sortKey === "progress") {
		campaignsWithProgress = [...campaignsWithProgress].sort(
			(a, b) => b.progress - a.progress,
		);
	}

	const totalRaised = campaignsWithProgress.reduce(
		(sum, c) => sum + c.raisedAmount,
		0,
	);
	const totalTarget = campaignsWithProgress.reduce(
		(sum, c) => sum + c.targetAmount,
		0,
	);

	return (
		<div className="min-h-screen pt-[70px] bg-background">
			{/* Header */}
			<section className="border-b bg-gradient-to-b from-muted/50 to-background py-10">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<Heart className="h-6 w-6 text-red-500" />
								<h1 className="text-3xl font-bold">
									Support {org.name}
								</h1>
							</div>
							<p className="text-sm text-muted-foreground">
								Active campaigns and fundraising initiatives
							</p>
						</div>
						<Button asChild variant="outline">
							<Link href={`/p/${parishId}`}>Back to parish</Link>
						</Button>
					</div>
					<div className="mt-6 grid gap-4 md:grid-cols-3">
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Active campaigns
							</p>
							<p className="mt-2 text-2xl font-semibold">
								{campaignsWithProgress.length}
							</p>
						</div>
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Total raised
							</p>
							<p className="mt-2 text-2xl font-semibold">
								₦{totalRaised.toLocaleString()}
							</p>
						</div>
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Total goal
							</p>
							<p className="mt-2 text-2xl font-semibold">
								₦{totalTarget.toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
				<form
					className="flex flex-col gap-3 md:flex-row md:items-center"
					method="get"
				>
					<div className="flex-1">
						<Input
							name="q"
							defaultValue={searchQuery}
							placeholder="Search campaigns by name or description"
						/>
					</div>
					<select
						name="sort"
						defaultValue={sortKey}
						className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="newest">Newest</option>
						<option value="ending">Ending soon</option>
						<option value="goal">Highest goal</option>
						<option value="progress">Top progress</option>
						<option value="name">Name A-Z</option>
					</select>
					<Button type="submit">Apply</Button>
					{searchQuery ?
						<Button asChild variant="ghost">
							<Link href={`/p/${parishId}/campaigns`}>Clear</Link>
						</Button>
					:	null}
				</form>

				{campaignsWithProgress.length > 0 ?
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{campaignsWithProgress.map((campaign) => {
							const daysLeft =
								campaign.endDate ?
									differenceInDays(
										new Date(campaign.endDate),
										new Date(),
									)
								:	null;

							return (
								<div
									key={campaign.id}
									className="rounded-xl border bg-card overflow-hidden shadow-sm transition hover:shadow-md"
								>
									<div className="p-6 space-y-4">
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<h3 className="text-lg font-semibold">
													{campaign.name}
												</h3>
												<Badge variant="secondary">
													Active
												</Badge>
											</div>
											{campaign.description && (
												<p className="text-sm text-muted-foreground line-clamp-3">
													{campaign.description}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span className="font-medium">
													₦
													{campaign.raisedAmount.toLocaleString()}
												</span>
												<span className="text-muted-foreground">
													of ₦
													{campaign.targetAmount.toLocaleString()}
												</span>
											</div>
											<div className="h-2 w-full rounded-full bg-muted">
												<div
													className="h-2 rounded-full bg-red-500 transition-all"
													style={{
														width: `${campaign.progress}%`,
													}}
												/>
											</div>
											<p className="text-xs text-muted-foreground">
												{Math.round(campaign.progress)}%
												of goal reached
											</p>
										</div>

										<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
											<div className="flex items-center gap-2">
												<MapPin className="h-3 w-3" />
												{org.name}
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="h-3 w-3" />
												{campaign.endDate ?
													`${format(new Date(campaign.endDate), "MMM d, yyyy")} (${daysLeft ?? 0} days left)`
												:	`Started ${format(new Date(campaign.startDate), "MMM d, yyyy")}`
												}
											</div>
										</div>

										<div className="flex flex-col gap-2 sm:flex-row">
											<Button
												asChild
												size="sm"
												className="w-full"
											>
												<Link
													href={`/p/${parishId}/campaigns/${campaign.id}`}
												>
													Contribute now
												</Link>
											</Button>
											<Button
												asChild
												size="sm"
												variant="outline"
												className="w-full"
											>
												<Link
													href={`/p/${parishId}/campaigns/${campaign.id}`}
												>
													View details
												</Link>
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				:	<div className="text-center py-12">
						<Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
						<p className="text-lg text-muted-foreground mb-4">
							{searchQuery ?
								"No campaigns match your search."
							:	"No active campaigns right now"}
						</p>
						<Button asChild variant="outline">
							<Link href={`/p/${parishId}`}>
								Back to {org.name}
							</Link>
						</Button>
					</div>
				}
			</div>
		</div>
	);
}
