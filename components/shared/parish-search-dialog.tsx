"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { IoSearch } from "react-icons/io5";

import { searchPublicParishes } from "@/app/actions/public.actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ParishResult = {
	id: string;
	name: string;
	address: string | null;
};

export function ParishSearchDialog() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ParishResult[]>([]);
	const [isPending, startTransition] = useTransition();

	const trimmedQuery = useMemo(() => query.trim(), [query]);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			if (!trimmedQuery) {
				setResults([]);
				return;
			}

			startTransition(async () => {
				const response = await searchPublicParishes(trimmedQuery);
				if (response.success && response.data) {
					setResults(response.data);
					return;
				}
				setResults([]);
			});
		}, 300);

		return () => window.clearTimeout(handle);
	}, [trimmedQuery, startTransition]);

	return (
		<Dialog>
			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
				<DialogTrigger asChild>
					<div className="relative w-full">
						<IoSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="py-[30px] pl-[50px] rounded-[15px] cursor-pointer"
							placeholder="Search by name, city or zip...."
							readOnly
						/>
					</div>
				</DialogTrigger>
				<DialogTrigger asChild>
					<Button className="rounded-[15px] py-[30px]">Search</Button>
				</DialogTrigger>
			</div>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Find your parish</DialogTitle>
					<DialogDescription>
						Search the directory to view local parishes and their
						public pages.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="relative">
						<IoSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="pl-[48px]"
							placeholder="Search parish name, city or diocese"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</div>
					<div className="space-y-3">
						{results.map((parish) => (
							<div
								key={parish.id}
								className="flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="text-sm font-semibold">
										{parish.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{parish.address ??
											"Address unavailable"}
									</p>
								</div>
								<Button asChild variant="outline" size="sm">
									<Link href={`/p/${parish.id}`}>
										View parish
									</Link>
								</Button>
							</div>
						))}
						{trimmedQuery && !isPending && results.length === 0 ?
							<div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
								No parishes found. Try another keyword.
							</div>
						:	null}
					</div>
					<p className="text-xs text-muted-foreground">
						Can&apos;t find your parish? Contact the parish office
						to request listing.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
