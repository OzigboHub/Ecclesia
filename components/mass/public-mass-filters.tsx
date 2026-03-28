"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PublicMassFiltersProps = {
	query: string;
	typeFilter: string;
	statusFilter: string;
	viewFilter: "all" | "upcoming";
	massTypes: readonly string[];
	massStatuses: readonly string[];
};

export function PublicMassFilters({
	query,
	typeFilter,
	statusFilter,
	viewFilter,
	massTypes,
	massStatuses,
}: PublicMassFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const updateParams = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams.toString());

		for (const [key, value] of Object.entries(updates)) {
			if (
				!value ||
				value === "ALL" ||
				(key === "view" && value === "upcoming")
			) {
				params.delete(key);
				continue;
			}

			params.set(key, value);
		}

		const next = params.toString();
		startTransition(() => {
			router.replace(next ? `${pathname}?${next}` : pathname);
		});
	};

	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center">
			<div className="flex-1">
				<Input
					name="q"
					defaultValue={query}
					placeholder="Search by parish, celebrant, or location"
					onChange={(event) => {
						const value = event.target.value;
						updateParams({ q: value ? value : null, page: null });
					}}
				/>
			</div>
			<select
				name="type"
				defaultValue={typeFilter}
				className="h-9 rounded-md border border-input bg-background px-3 text-sm"
				onChange={(event) => {
					updateParams({ type: event.target.value, page: null });
				}}
			>
				<option value="ALL">All types</option>
				{massTypes.map((type) => (
					<option key={type} value={type}>
						{type.replace(/_/g, " ")}
					</option>
				))}
			</select>
			<select
				name="status"
				defaultValue={statusFilter}
				className="h-9 rounded-md border border-input bg-background px-3 text-sm"
				onChange={(event) => {
					updateParams({ status: event.target.value, page: null });
				}}
			>
				<option value="ALL">All statuses</option>
				{massStatuses.map((status) => (
					<option key={status} value={status}>
						{status.replace(/_/g, " ")}
					</option>
				))}
			</select>
			<select
				name="view"
				defaultValue={viewFilter}
				className="h-9 rounded-md border border-input bg-background px-3 text-sm"
				onChange={(event) => {
					updateParams({ view: event.target.value, page: null });
				}}
			>
				<option value="upcoming">Upcoming only</option>
				<option value="all">All masses</option>
			</select>
			{(
				query ||
				typeFilter !== "ALL" ||
				statusFilter !== "ALL" ||
				viewFilter !== "upcoming"
			) ?
				<Button
					variant="ghost"
					onClick={() => {
						startTransition(() => {
							router.replace(pathname);
						});
					}}
				>
					Clear
				</Button>
			:	null}
		</div>
	);
}
