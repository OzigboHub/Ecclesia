"use client";

import { updatePreferences } from "@/app/actions/preferences.actions";
import { searchPublicParishes } from "@/app/actions/public.actions";
import { crestInitials } from "@/lib/feed/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Parish = { id: string; name: string; address: string | null };

/**
 * Search and switch parish.
 *
 * Switching writes the preference cookie and lands on the feed. If the new
 * parish is gated, /feed redirects to its gate — the switcher does not need to
 * know about that, which keeps the gate check in exactly one place.
 */
export function ParishSwitcher({
	parishes,
	currentId,
}: {
	parishes: Parish[];
	currentId: string | null;
}) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Parish[] | null>(null);
	const [searching, setSearching] = useState(false);
	const [switchingTo, setSwitchingTo] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	// Debounced so a slow connection isn't hit on every keystroke. Clearing
	// the results is done in the change handler, not here — an effect should
	// synchronise with the outside world, not reset React state.
	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < 2) return;

		let cancelled = false;
		const timer = setTimeout(async () => {
			const result = await searchPublicParishes(trimmed);
			if (cancelled) return;
			setResults(result.data ?? []);
			setSearching(false);
		}, 280);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	function onQueryChange(next: string) {
		setQuery(next);
		const trimmed = next.trim();
		if (trimmed.length < 2) {
			setResults(null);
			setSearching(false);
		} else {
			setSearching(true);
		}
	}

	function choose(parish: Parish) {
		setSwitchingTo(parish.id);
		startTransition(async () => {
			await updatePreferences({ organizationId: parish.id });
			router.push("/feed");
		});
	}

	const list = results ?? parishes;

	return (
		<div>
			<div className="px-4 py-3">
				<div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-hairline bg-surface-2 px-3">
					<Search className="size-4 shrink-0 text-fg-dim" aria-hidden />
					<input
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder="Parish name or town"
						aria-label="Search parishes"
						autoComplete="off"
						className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-dim"
					/>
					{searching && (
						<Loader2
							className="size-4 animate-spin text-fg-dim"
							aria-hidden
						/>
					)}
				</div>
			</div>

			<ul className="divide-y divide-hairline border-y border-hairline">
				{list.map((parish) => {
					const current = parish.id === currentId;
					return (
						<li key={parish.id}>
							<button
								type="button"
								onClick={() => choose(parish)}
								disabled={switchingTo !== null}
								className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left disabled:opacity-60"
							>
								<span
									aria-hidden
									className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-meta font-semibold text-gold"
								>
									{crestInitials(parish.name)}
								</span>
								<span className="min-w-0 flex-1">
									<span
										className={cn(
											"block truncate text-title-sm",
											current ?
												"font-semibold text-gold"
											:	"font-medium text-fg",
										)}
									>
										{parish.name}
									</span>
									{parish.address && (
										<span className="mt-0.5 block truncate text-meta text-fg-muted">
											{parish.address}
										</span>
									)}
								</span>
								{switchingTo === parish.id ?
									<Loader2
										className="size-4 shrink-0 animate-spin text-fg-dim"
										aria-hidden
									/>
								: current ?
									<Check
										className="size-4 shrink-0 text-gold"
										aria-hidden
									/>
								:	null}
							</button>
						</li>
					);
				})}
			</ul>

			{list.length === 0 && (
				<p className="px-4 py-8 text-center text-body-sm text-fg-muted">
					No parish by that name yet. Try the town instead.
				</p>
			)}
		</div>
	);
}
