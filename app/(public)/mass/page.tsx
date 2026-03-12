import db from "@/lib/db";
import { format } from "date-fns";
import { Calendar, Church, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MASS_TYPES = [
	"DAILY_MASS",
	"SUNDAY_MASS",
	"HOLY_DAY_MASS",
	"SPECIAL_MASS",
	"WEDDING_MASS",
	"FUNERAL_MASS",
	"THANKSGIVING_MASS",
] as const;

const MASS_STATUSES = [
	"SCHEDULED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
	"RESCHEDULED",
] as const;

type SearchParams = {
	q?: string;
	type?: string;
	status?: string;
	view?: string;
};

export default async function Masses({
	searchParams,
}: {
	searchParams?: SearchParams;
}) {
	const query = searchParams?.q?.trim() ?? "";
	const typeFilter =
		MASS_TYPES.includes(searchParams?.type as any) ?
			(searchParams?.type as (typeof MASS_TYPES)[number])
		:	"ALL";
	const statusFilter =
		MASS_STATUSES.includes(searchParams?.status as any) ?
			(searchParams?.status as (typeof MASS_STATUSES)[number])
		:	"ALL";
	const viewFilter = searchParams?.view === "all" ? "all" : "upcoming";
	const now = new Date();

	const masses = await db.mass.findMany({
		where: {
			...(query ?
				{
					OR: [
						{
							organization: {
								name: { contains: query, mode: "insensitive" },
							},
						},
						{ location: { contains: query, mode: "insensitive" } },
						{ celebrant: { contains: query, mode: "insensitive" } },
					],
				}
			:	{}),
			...(typeFilter !== "ALL" ? { massType: typeFilter } : {}),
			...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
			...(viewFilter === "upcoming" ? { date: { gte: now } } : {}),
		},
		select: {
			id: true,
			date: true,
			time: true,
			massType: true,
			status: true,
			language: true,
			location: true,
			celebrant: true,
			bookedIntentions: true,
			maxIntentions: true,
			organization: {
				select: { id: true, name: true, address: true },
			},
		},
		orderBy: [{ date: "asc" }, { time: "asc" }],
		take: 100,
	});

	const upcomingCount = masses.filter((mass) => mass.date >= now).length;
	const totalCount = masses.length;

	return (
		<div className="min-h-screen pt-[80px] bg-background">
			<section className="border-b bg-gradient-to-b from-muted/50 to-background py-10">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="space-y-2">
							<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
								Public Masses
							</p>
							<h1 className="text-3xl font-bold md:text-4xl">
								All Masses in the Diocese
							</h1>
							<p className="text-sm text-muted-foreground md:text-base">
								Browse upcoming masses across parishes, view
								celebrants, and join live schedules.
							</p>
						</div>
						<Button asChild variant="outline">
							<Link href="/">Back to home</Link>
						</Button>
					</div>
					<div className="mt-6 grid gap-4 md:grid-cols-3">
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Total listed
							</p>
							<p className="mt-2 text-2xl font-semibold">
								{totalCount}
							</p>
						</div>
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Upcoming
							</p>
							<p className="mt-2 text-2xl font-semibold">
								{upcomingCount}
							</p>
						</div>
						<div className="rounded-xl border bg-card p-4 shadow-sm">
							<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Status filter
							</p>
							<p className="mt-2 text-2xl font-semibold">
								{statusFilter === "ALL" ?
									"All"
								:	statusFilter.replace(/_/g, " ")}
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
							defaultValue={query}
							placeholder="Search by parish, celebrant, or location"
						/>
					</div>
					<select
						name="type"
						defaultValue={typeFilter}
						className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="ALL">All types</option>
						{MASS_TYPES.map((type) => (
							<option key={type} value={type}>
								{type.replace(/_/g, " ")}
							</option>
						))}
					</select>
					<select
						name="status"
						defaultValue={statusFilter}
						className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="ALL">All statuses</option>
						{MASS_STATUSES.map((status) => (
							<option key={status} value={status}>
								{status.replace(/_/g, " ")}
							</option>
						))}
					</select>
					<select
						name="view"
						defaultValue={viewFilter}
						className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="upcoming">Upcoming only</option>
						<option value="all">All masses</option>
					</select>
					<Button type="submit">Apply</Button>
					{(
						query ||
						typeFilter !== "ALL" ||
						statusFilter !== "ALL" ||
						viewFilter !== "upcoming"
					) ?
						<Button asChild variant="ghost">
							<Link href="/mass">Clear</Link>
						</Button>
					:	null}
				</form>

				{masses.length > 0 ?
					<div className="grid gap-6 md:grid-cols-2">
						{masses.map((mass) => (
							<div
								key={mass.id}
								className="rounded-xl border bg-card p-6 shadow-sm"
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="space-y-1">
										<h2 className="text-lg font-semibold">
											{mass.massType.replace(/_/g, " ")}
										</h2>
										<p className="text-sm text-muted-foreground">
											{format(
												new Date(mass.date),
												"MMMM d, yyyy",
											)}{" "}
											· {mass.time}
										</p>
									</div>
									<Badge variant="secondary">
										{mass.status.replace(/_/g, " ")}
									</Badge>
								</div>
								<div className="mt-4 space-y-3 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<Church className="h-4 w-4 text-primary" />
										<span>{mass.organization.name}</span>
									</div>
									{(
										mass.location ||
										mass.organization.address
									) ?
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4 text-primary" />
											<span>
												{mass.location ??
													mass.organization.address}
											</span>
										</div>
									:	null}
									{mass.celebrant ?
										<p>Celebrant: {mass.celebrant}</p>
									:	null}
									{mass.language ?
										<p>Language: {mass.language}</p>
									:	null}
									<p>
										Intentions: {mass.bookedIntentions}/
										{mass.maxIntentions}
									</p>
								</div>
								<div className="mt-6 flex flex-col gap-2 sm:flex-row">
									<Button
										asChild
										size="sm"
										className="w-full"
									>
										<Link
											href={`/p/${mass.organization.id}`}
										>
											View parish
										</Link>
									</Button>
									<Button
										asChild
										size="sm"
										variant="outline"
										className="w-full"
									>
										<Link
											href={`/p/${mass.organization.id}/mass-intentions`}
										>
											Book intention
										</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				:	<div className="text-center py-12">
						<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
						<p className="text-lg text-muted-foreground">
							No masses match your filters yet.
						</p>
					</div>
				}
			</div>
		</div>
	);
}
