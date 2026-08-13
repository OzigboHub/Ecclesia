"use client";

import { updatePreferences } from "@/app/actions/preferences.actions";
import { searchPublicParishes } from "@/app/actions/public.actions";
import {
	INTERESTS,
	type FeedPreferences,
	type InterestId,
	type NotifyLevel,
} from "@/lib/feed/preferences";
import { crestInitials } from "@/lib/feed/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Lock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Three questions, no account.
 *
 * Everything is stored in a cookie on this device. Skippable at every step —
 * somebody who wants to look around should be able to, and the invitation to
 * choose a parish stays in the feed for whenever they change their mind.
 */

type Parish = { id: string; name: string; address: string | null };

type Step = "parish" | "interests" | "notify" | "done";

export function Onboarding({
	initial,
	nearby,
}: {
	initial: FeedPreferences;
	nearby: Parish[];
}) {
	const router = useRouter();
	const [step, setStep] = useState<Step>("parish");
	const [parish, setParish] = useState<Parish | null>(null);
	const [interests, setInterests] = useState<InterestId[]>(initial.interests);
	const [notify, setNotify] = useState<NotifyLevel>(initial.notify);
	const [pending, startTransition] = useTransition();

	function finish(next: Partial<FeedPreferences>) {
		startTransition(async () => {
			await updatePreferences({
				organizationId: parish?.id ?? initial.organizationId,
				interests,
				notify,
				...next,
			});
			setStep("done");
			// A beat on the completion screen, then the feed they just chose.
			setTimeout(() => router.push("/feed"), 900);
		});
	}

	return (
		<div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-[calc(16px+env(safe-area-inset-top))]">
			<header className="flex items-center justify-between py-2">
				{step !== "parish" && step !== "done" ?
					<button
						type="button"
						onClick={() =>
							setStep(step === "notify" ? "interests" : "parish")
						}
						className="flex size-11 items-center justify-center rounded-[10px] text-fg-muted"
					>
						<ChevronLeft className="size-5" aria-hidden />
						<span className="sr-only">Back</span>
					</button>
				:	<span className="size-11" />}

				{step !== "done" && (
					<button
						type="button"
						onClick={() => router.push("/feed")}
						className="flex min-h-11 items-center px-2 text-body-sm text-fg-dim"
					>
						Skip
					</button>
				)}
			</header>

			{step === "parish" && (
				<ParishStep
					nearby={nearby}
					onPick={(picked) => {
						setParish(picked);
						setStep("interests");
					}}
				/>
			)}

			{step === "interests" && (
				<InterestsStep
					selected={interests}
					onToggle={(id) =>
						setInterests((current) =>
							current.includes(id) ?
								current.filter((i) => i !== id)
							:	[...current, id],
						)
					}
					onNext={() => setStep("notify")}
				/>
			)}

			{step === "notify" && (
				<NotifyStep
					value={notify}
					onChange={setNotify}
					pending={pending}
					onDone={(level) => {
						setNotify(level);
						finish({ notify: level });
					}}
				/>
			)}

			{step === "done" && <DoneStep parishName={parish?.name ?? "your parish"} />}
		</div>
	);
}

function StepHeading({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<div className="mb-5">
			<h1 className="text-display font-semibold tracking-[-0.02em] text-fg">
				{title}
			</h1>
			{description && (
				<p className="mt-2 text-body text-pretty text-fg-muted">
					{description}
				</p>
			)}
		</div>
	);
}

function ParishStep({
	nearby,
	onPick,
}: {
	nearby: Parish[];
	onPick: (parish: Parish) => void;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Parish[] | null>(null);
	const [searching, setSearching] = useState(false);

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

	const list = results ?? nearby;
	const heading = results ? "Results" : "Parishes";

	return (
		<div className="flex flex-1 flex-col">
			<StepHeading title="Find your parish" />

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
					<Loader2 className="size-4 animate-spin text-fg-dim" aria-hidden />
				)}
			</div>

			<p className="mt-4 font-plex-mono text-caption uppercase tracking-[0.1em] text-fg-dim">
				{heading}
			</p>

			<ul className="mt-1 divide-y divide-hairline border-y border-hairline">
				{list.map((parish) => (
					<li key={parish.id}>
						<button
							type="button"
							onClick={() => onPick(parish)}
							className="flex min-h-16 w-full items-center gap-3 py-2.5 text-left"
						>
							<span
								aria-hidden
								className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-meta font-semibold text-gold"
							>
								{crestInitials(parish.name)}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-title-sm font-medium text-fg">
									{parish.name}
								</span>
								{parish.address && (
									<span className="mt-0.5 block truncate text-meta text-fg-muted">
										{parish.address}
									</span>
								)}
							</span>
							<ChevronRight
								className="size-3.5 shrink-0 text-fg-dim"
								aria-hidden
							/>
						</button>
					</li>
				))}
			</ul>

			{list.length === 0 && (
				<p className="py-8 text-center text-body-sm text-fg-muted">
					{results ?
						"No parish by that name yet. Try the town instead."
					:	"No parishes to show yet."}
				</p>
			)}
		</div>
	);
}

function InterestsStep({
	selected,
	onToggle,
	onNext,
}: {
	selected: InterestId[];
	onToggle: (id: InterestId) => void;
	onNext: () => void;
}) {
	return (
		<div className="flex flex-1 flex-col">
			<StepHeading
				title="What do you want to see?"
				description="Pick as many as you like. You can change this later."
			/>

			<div className="flex flex-wrap gap-2">
				{INTERESTS.map((interest) => {
					const active = selected.includes(interest.id);
					return (
						<button
							key={interest.id}
							type="button"
							aria-pressed={active}
							onClick={() => onToggle(interest.id)}
							className={cn(
								"flex min-h-11 items-center rounded-full border px-4 text-body transition-colors",
								active ?
									"border-gold bg-gold/12 font-medium text-gold"
								:	"border-hairline text-fg-body hover:bg-surface-2",
							)}
						>
							{interest.label}
						</button>
					);
				})}
			</div>

			<div className="mt-auto pt-8">
				<button
					type="button"
					onClick={onNext}
					className="flex h-12 w-full items-center justify-center rounded-xl bg-gold text-title-sm font-semibold text-on-gold"
				>
					Continue
				</button>
			</div>
		</div>
	);
}

const NOTIFY_OPTIONS: { value: NotifyLevel; label: string; hint: string }[] = [
	{
		value: "all",
		label: "Everything",
		hint: "Every announcement, event and livestream.",
	},
	{
		value: "important",
		label: "Just important",
		hint: "Mass changes, funerals and urgent notices.",
	},
	{ value: "none", label: "Nothing", hint: "No notifications at all." },
];

function NotifyStep({
	value,
	onChange,
	onDone,
	pending,
}: {
	value: NotifyLevel;
	onChange: (level: NotifyLevel) => void;
	onDone: (level: NotifyLevel) => void;
	pending: boolean;
}) {
	return (
		<div className="flex flex-1 flex-col">
			<StepHeading
				title="How often should we tell you?"
				description="We'll ask permission to send notifications after this — not before."
			/>

			<div
				role="radiogroup"
				aria-label="Notification frequency"
				className="flex flex-col gap-2"
			>
				{NOTIFY_OPTIONS.map((option) => {
					const active = value === option.value;
					return (
						<button
							key={option.value}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => onChange(option.value)}
							className={cn(
								"rounded-xl border p-3.5 text-left transition-colors",
								active ?
									"border-gold bg-gold/8"
								:	"border-hairline hover:bg-surface-2",
							)}
						>
							<span
								className={cn(
									"block text-title-sm font-semibold",
									active ? "text-gold" : "text-fg",
								)}
							>
								{option.label}
							</span>
							<span className="mt-0.5 block text-body-sm text-fg-muted">
								{option.hint}
							</span>
						</button>
					);
				})}
			</div>

			<div className="mt-auto pt-8">
				<button
					type="button"
					disabled={pending}
					onClick={() => onDone(value)}
					className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold text-title-sm font-semibold text-on-gold disabled:opacity-70"
				>
					{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
					Done
				</button>
				<p className="mt-3 flex items-start gap-2 text-meta leading-[18px] text-fg-dim">
					<Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
					All of this stays on this device. No account, nothing shared.
				</p>
			</div>
		</div>
	);
}

function DoneStep({ parishName }: { parishName: string }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center text-center">
			<span
				aria-hidden
				className="flex size-16 items-center justify-center rounded-2xl bg-surface-2 text-title font-semibold text-gold"
			>
				{crestInitials(parishName)}
			</span>
			<h1 className="mt-5 text-display font-semibold tracking-[-0.02em] text-fg">
				{parishName}
			</h1>
			<p className="mt-2 max-w-[30ch] text-body text-pretty text-fg-muted">
				Your feed now shows what&rsquo;s happening here.
			</p>
			<Loader2
				className="mt-6 size-4 animate-spin text-fg-dim"
				aria-hidden
			/>
		</div>
	);
}
