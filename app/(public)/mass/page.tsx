import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { Calendar, Church, MapPin } from "lucide-react";
import Link from "next/link";

import { PublicMassFilters } from "@/components/mass/public-mass-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

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
	page?: string;
};

const PAGE_SIZE = 12;

export default async function Masses({
	searchParams,
}: {
	searchParams?: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const query = params?.q?.trim() ?? "";
	const typeFilter =
		MASS_TYPES.includes(params?.type as any) ?
			(params?.type as (typeof MASS_TYPES)[number])
		:	"ALL";
	const statusFilter =
		MASS_STATUSES.includes(params?.status as any) ?
			(params?.status as (typeof MASS_STATUSES)[number])
		:	"ALL";
	const viewFilter = params?.view === "all" ? "all" : "upcoming";
	const pageParam = Number.parseInt(params?.page ?? "1", 10);
	const requestedPage = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);
	const now = new Date();

	const buildMassWhere = (forceUpcoming = false): Prisma.MassWhereInput => ({
		...(query ?
			{
				OR: [
					{
						organization: {
							is: {
								name: {
									contains: query,
									mode: Prisma.QueryMode.insensitive,
								},
							},
						},
					},
					{
						location: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
					{
						celebrant: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
				],
			}
		:	{}),
		...(typeFilter !== "ALL" ? { massType: typeFilter } : {}),
		...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
		...(forceUpcoming || viewFilter === "upcoming" ?
			{ date: { gte: now } }
		:	{}),
	});

	const where = buildMassWhere();

	const totalCount = await db.mass.count({ where });
	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
	const currentPage = Math.min(requestedPage, totalPages);

	const masses = await db.mass.findMany({
		where,
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
		skip: (currentPage - 1) * PAGE_SIZE,
		take: PAGE_SIZE,
	});

	const upcomingCount = await db.mass.count({
		where: buildMassWhere(true),
	});

	const buildPageHref = (page: number) => {
		const urlParams = new URLSearchParams();

		if (query) urlParams.set("q", query);
		if (typeFilter !== "ALL") urlParams.set("type", typeFilter);
		if (statusFilter !== "ALL") urlParams.set("status", statusFilter);
		if (viewFilter !== "upcoming") urlParams.set("view", viewFilter);
		if (page > 1) urlParams.set("page", String(page));

		const search = urlParams.toString();
		return search ? `/mass?${search}` : "/mass";
	};

	const pageWindow = Array.from(
		{ length: totalPages },
		(_, i) => i + 1,
	).filter(
		(page) =>
			page === 1 ||
			page === totalPages ||
			Math.abs(page - currentPage) <= 1,
	);

	const displayedCount = masses.length;
	const statusLabel =
		statusFilter === "ALL" ? "All statuses" : (
			statusFilter.replace(/_/g, " ")
		);

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
								{displayedCount}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								of {totalCount} filtered result
								{totalCount === 1 ? "" : "s"}
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
								{statusLabel}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{totalCount} matching result
								{totalCount === 1 ? "" : "s"}
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
				<PublicMassFilters
					query={query}
					typeFilter={typeFilter}
					statusFilter={statusFilter}
					viewFilter={viewFilter}
					massTypes={MASS_TYPES}
					massStatuses={MASS_STATUSES}
				/>

				{masses.length > 0 ?
					<>
						<div className="grid gap-6 md:grid-cols-2">
							{masses.map((mass) => (
								<div
									key={mass.id}
									className="rounded-xl border bg-card p-6 shadow-sm"
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="space-y-1">
											<h2 className="text-lg font-semibold">
												{mass.massType.replace(
													/_/g,
													" ",
												)}
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
											<span>
												{mass.organization.name}
											</span>
										</div>
										{(
											mass.location ||
											mass.organization.address
										) ?
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-primary" />
												<span>
													{mass.location ??
														mass.organization
															.address}
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

						{totalPages > 1 ?
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href={buildPageHref(
												Math.max(1, currentPage - 1),
											)}
											aria-disabled={currentPage === 1}
											className={
												currentPage === 1 ?
													"pointer-events-none opacity-50"
												:	undefined
											}
										/>
									</PaginationItem>

									{pageWindow.map((page, index) => {
										const prev = pageWindow[index - 1];
										const showGap =
											typeof prev === "number" &&
											page - prev > 1;

										return (
											<PaginationItem key={page}>
												{showGap ?
													<PaginationEllipsis />
												:	null}
												<PaginationLink
													href={buildPageHref(page)}
													isActive={
														page === currentPage
													}
												>
													{page}
												</PaginationLink>
											</PaginationItem>
										);
									})}

									<PaginationItem>
										<PaginationNext
											href={buildPageHref(
												Math.min(
													totalPages,
													currentPage + 1,
												),
											)}
											aria-disabled={
												currentPage === totalPages
											}
											className={
												currentPage === totalPages ?
													"pointer-events-none opacity-50"
												:	undefined
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						:	null}
					</>
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
