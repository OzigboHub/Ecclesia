"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Church, MapPin, Phone, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";

export type ParishSearchItem = {
	id: string;
	name: string;
	address: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	massesCount?: number;
};

interface PublicParishSearchProps {
	initialParishes: ParishSearchItem[];
	initialQuery?: string;
	showMassesCount?: boolean;
}

function PublicParishSearchContent({
	initialParishes,
	initialQuery = "",
	showMassesCount = true,
}: PublicParishSearchProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const urlQuery = searchParams.get("q") ?? initialQuery;
	const [query, setQuery] = useState(urlQuery);

	const updateUrl = (newQuery: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (newQuery.trim()) {
			params.set("q", newQuery.trim());
		} else {
			params.delete("q");
		}
		const next = params.toString();
		startTransition(() => {
			router.replace(next ? `${pathname}?${next}` : pathname, {
				scroll: false,
			});
		});
	};

	const handleSearchChange = (value: string) => {
		setQuery(value);
		updateUrl(value);
	};

	const handleClear = () => {
		setQuery("");
		updateUrl("");
	};

	const filteredParishes = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return initialParishes;
		return initialParishes.filter((p) => {
			const nameMatch = p.name.toLowerCase().includes(q);
			const addressMatch = p.address
				? p.address.toLowerCase().includes(q)
				: false;
			return nameMatch || addressMatch;
		});
	}, [initialParishes, query]);

	return (
		<div className="space-y-6">
			{/* Search Bar */}
			<div className="relative max-w-md">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					value={query}
					placeholder="Search parishes by name or location..."
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10 pr-10 h-11 text-sm bg-card"
				/>
				{query && (
					<button
						type="button"
						onClick={handleClear}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
						aria-label="Clear search"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Results Header / Stats */}
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<p>
					{query.trim() ? (
						<>
							Found{" "}
							<span className="font-semibold text-foreground">
								{filteredParishes.length}
							</span>{" "}
							parish{filteredParishes.length === 1 ? "" : "es"} for &quot;
							<span className="text-foreground">{query}</span>&quot;
						</>
					) : (
						<>
							Showing{" "}
							<span className="font-semibold text-foreground">
								{filteredParishes.length}
							</span>{" "}
							parish{filteredParishes.length === 1 ? "" : "es"}
						</>
					)}
				</p>
				{query.trim() && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="h-8 text-xs text-muted-foreground hover:text-foreground"
					>
						Reset search
					</Button>
				)}
			</div>

			{/* Parish Grid */}
			{filteredParishes.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredParishes.map((parish) => (
						<Link
							key={parish.id}
							href={`/p/${parish.id}`}
							className="group flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs transition hover:shadow-md hover:border-primary/50"
						>
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
										<Church className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<h2 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
											{parish.name}
										</h2>
										{parish.address && (
											<p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex items-start gap-1">
												<MapPin className="h-3 w-3 shrink-0 mt-0.5" />
												<span>{parish.address}</span>
											</p>
										)}
									</div>
								</div>

								{parish.contactPhone && (
									<p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
										<Phone className="h-3 w-3" />
										<span>{parish.contactPhone}</span>
									</p>
								)}
							</div>

							{showMassesCount && (
								<div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
									<span>
										<strong className="text-foreground font-semibold">
											{parish.massesCount ?? 0}
										</strong>{" "}
										upcoming mass
										{(parish.massesCount ?? 0) !== 1 ? "es" : ""}
									</span>
									<span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform">
										View &rarr;
									</span>
								</div>
							)}
						</Link>
					))}
				</div>
			) : (
				<div className="text-center py-16 rounded-xl border bg-card/50">
					<Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-40" />
					<h3 className="text-lg font-semibold text-foreground">
						No parishes found
					</h3>
					<p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
						{query.trim()
							? `We couldn't find any parish matching "${query}". Try checking your spelling or searching by city/town.`
							: "No parishes are currently registered in the system."}
					</p>
					{query.trim() && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleClear}
							className="mt-4"
						>
							Clear search filter
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export function PublicParishSearch(props: PublicParishSearchProps) {
	return (
		<Suspense fallback={<div className="min-h-48 animate-pulse rounded-xl bg-card/40" />}>
			<PublicParishSearchContent {...props} />
		</Suspense>
	);
}
