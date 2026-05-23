"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useTransition,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import {
	createSociety,
	getSocieties,
	updateSociety,
} from "@/app/actions/society.actions";
import { getSocietyLeaderCandidates } from "@/app/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	CreateSocietyInput,
	UpdateSocietyInput,
	createSocietySchema,
	updateSocietySchema,
} from "@/lib/validators/society.schema";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type MeetingCadence = "MONTHLY" | "EVERY_2_MONTHS";
type MeetingWeek = "FIRST" | "SECOND" | "THIRD" | "FOURTH" | "LAST";
type MeetingWeekday =
	| "SUNDAY"
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY";

type MeetingRule = {
	id: string;
	cadence: MeetingCadence;
	week: MeetingWeek;
	weekday: MeetingWeekday;
	time: string;
	note?: string;
};

const CADENCE_OPTIONS: Array<{ value: MeetingCadence; label: string }> = [
	{ value: "MONTHLY", label: "Every month" },
	{ value: "EVERY_2_MONTHS", label: "Every 2 months" },
];

const WEEK_OPTIONS: Array<{ value: MeetingWeek; label: string }> = [
	{ value: "FIRST", label: "First" },
	{ value: "SECOND", label: "Second" },
	{ value: "THIRD", label: "Third" },
	{ value: "FOURTH", label: "Fourth" },
	{ value: "LAST", label: "Last" },
];

const WEEKDAY_OPTIONS: Array<{ value: MeetingWeekday; label: string }> = [
	{ value: "SUNDAY", label: "Sunday" },
	{ value: "MONDAY", label: "Monday" },
	{ value: "TUESDAY", label: "Tuesday" },
	{ value: "WEDNESDAY", label: "Wednesday" },
	{ value: "THURSDAY", label: "Thursday" },
	{ value: "FRIDAY", label: "Friday" },
	{ value: "SATURDAY", label: "Saturday" },
];

const LEADER_PAGE_SIZE = 5;

function parseMeetingSchedule(value?: string | null): MeetingRule[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.filter((item) => item && typeof item === "object")
			.map((item, index) => ({
				id: String(item.id ?? `${Date.now()}-${index}`),
				cadence:
					item.cadence === "EVERY_2_MONTHS" ?
						"EVERY_2_MONTHS"
					:	"MONTHLY",
				week:
					(
						["FIRST", "SECOND", "THIRD", "FOURTH", "LAST"].includes(
							item.week,
						)
					) ?
						item.week
					:	"LAST",
				weekday:
					(
						[
							"SUNDAY",
							"MONDAY",
							"TUESDAY",
							"WEDNESDAY",
							"THURSDAY",
							"FRIDAY",
							"SATURDAY",
						].includes(item.weekday)
					) ?
						item.weekday
					:	"SUNDAY",
				time:
					(
						typeof item.time === "string" &&
						/^\d{2}:\d{2}$/.test(item.time)
					) ?
						item.time
					:	"18:00",
				note: typeof item.note === "string" ? item.note : "",
			}));
	} catch {
		// Backward compatibility for legacy plain-text meeting schedules
		return [
			{
				id: String(Date.now()),
				cadence: "MONTHLY",
				week: "LAST",
				weekday: "SUNDAY",
				time: "18:00",
				note: value,
			},
		];
	}
}

function formatRuleLabel(rule: MeetingRule) {
	const week =
		WEEK_OPTIONS.find((w) => w.value === rule.week)?.label ?? rule.week;
	const day =
		WEEKDAY_OPTIONS.find((d) => d.value === rule.weekday)?.label ??
		rule.weekday;
	const cadence =
		CADENCE_OPTIONS.find((c) => c.value === rule.cadence)?.label ??
		rule.cadence;
	return `${week} ${day}, ${rule.time} (${cadence})`;
}

interface SocietyFormProps {
	initialData?: {
		id: string;
		name: string;
		description?: string | null;
		patronSaint?: string | null;
		presidentId?: string | null;
		secretaryId?: string | null;
		meetingSchedule?: string | null;
	};
	onSuccess?: () => void;
}

export function SocietyForm({ initialData, onSuccess }: SocietyFormProps) {
	const [isPending, startTransition] = useTransition();
	const [presidentCandidates, setPresidentCandidates] = useState<
		Array<{ id: string; firstName: string; lastName: string }>
	>([]);
	const [secretaryCandidates, setSecretaryCandidates] = useState<
		Array<{ id: string; firstName: string; lastName: string }>
	>([]);
	const [isLoadingPresidentCandidates, setIsLoadingPresidentCandidates] =
		useState(false);
	const [isLoadingSecretaryCandidates, setIsLoadingSecretaryCandidates] =
		useState(false);
	const isLoadingPresidentRef = useRef(false);
	const isLoadingSecretaryRef = useRef(false);
	const [presidentSearch, setPresidentSearch] = useState("");
	const [secretarySearch, setSecretarySearch] = useState("");
	const [debouncedPresidentSearch, setDebouncedPresidentSearch] =
		useState("");
	const [debouncedSecretarySearch, setDebouncedSecretarySearch] =
		useState("");
	const [assignedPresidentIds, setAssignedPresidentIds] = useState<string[]>(
		[],
	);
	const [assignedSecretaryIds, setAssignedSecretaryIds] = useState<string[]>(
		[],
	);
	const [meetingRules, setMeetingRules] = useState<MeetingRule[]>(
		parseMeetingSchedule(initialData?.meetingSchedule),
	);
	const [newRule, setNewRule] = useState<Omit<MeetingRule, "id">>({
		cadence: "MONTHLY",
		week: "LAST",
		weekday: "SUNDAY",
		time: "18:00",
		note: "",
	});
	const router = useRouter();

	const allowNone = Boolean(initialData);
	const schema = allowNone ? updateSocietySchema : createSocietySchema;

	const form = useForm<CreateSocietyInput | UpdateSocietyInput>({
		resolver: zodResolver(schema) as Resolver<
			CreateSocietyInput | UpdateSocietyInput
		>,
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			patronSaint: initialData?.patronSaint ?? "",
			presidentId: initialData?.presidentId ?? "",
			secretaryId: initialData?.secretaryId ?? "",
			meetingSchedule: initialData?.meetingSchedule ?? "",
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		reset,
	} = form;

	const loadLeaderCandidates = useCallback(
		async (options: {
			page: number;
			append: boolean;
			query?: string;
			setCandidates: Dispatch<
				SetStateAction<
					Array<{ id: string; firstName: string; lastName: string }>
				>
			>;
			setLoading: Dispatch<SetStateAction<boolean>>;
			loadingRef: MutableRefObject<boolean>;
		}) => {
			if (options.loadingRef.current) return;
			options.loadingRef.current = true;
			options.setLoading(true);
			try {
				const normalizedQuery = options.query?.trim();
				const result = await getSocietyLeaderCandidates({
					page: options.page,
					limit: LEADER_PAGE_SIZE,
					query: normalizedQuery ? normalizedQuery : undefined,
				});

				if (result.success && result.data) {
					options.setCandidates((prev) => {
						const next =
							options.append ?
								[...prev, ...result.data!.users]
							:	result.data!.users;
						const unique = new Map(
							next.map((item) => [item.id, item]),
						);
						return Array.from(unique.values());
					});
				}
			} finally {
				options.loadingRef.current = false;
				options.setLoading(false);
			}
		},
		[],
	);

	// Fetch parishioners for president/secretary selection
	useEffect(() => {
		async function fetchUsers() {
			const societiesResult = await getSocieties();

			if (societiesResult.success && societiesResult.data) {
				setAssignedPresidentIds(
					societiesResult.data
						.map((s) => s.president?.id)
						.filter((id): id is string => Boolean(id)),
				);
				setAssignedSecretaryIds(
					societiesResult.data
						.map((s) => s.secretary?.id)
						.filter((id): id is string => Boolean(id)),
				);
			}
		}
		fetchUsers();
	}, []);

	useEffect(() => {
		const handle = setTimeout(() => {
			setDebouncedPresidentSearch(presidentSearch.trim());
		}, 300);

		return () => clearTimeout(handle);
	}, [presidentSearch]);

	useEffect(() => {
		const handle = setTimeout(() => {
			setDebouncedSecretarySearch(secretarySearch.trim());
		}, 300);

		return () => clearTimeout(handle);
	}, [secretarySearch]);

	useEffect(() => {
		setPresidentCandidates([]);
		void loadLeaderCandidates({
			page: 1,
			append: false,
			query: debouncedPresidentSearch || undefined,
			setCandidates: setPresidentCandidates,
			setLoading: setIsLoadingPresidentCandidates,
			loadingRef: isLoadingPresidentRef,
		});
	}, [debouncedPresidentSearch, loadLeaderCandidates]);

	useEffect(() => {
		setSecretaryCandidates([]);
		void loadLeaderCandidates({
			page: 1,
			append: false,
			query: debouncedSecretarySearch || undefined,
			setCandidates: setSecretaryCandidates,
			setLoading: setIsLoadingSecretaryCandidates,
			loadingRef: isLoadingSecretaryRef,
		});
	}, [debouncedSecretarySearch, loadLeaderCandidates]);

	useEffect(() => {
		if (
			debouncedPresidentSearch.length === 0 &&
			presidentCandidates.length === 0 &&
			!isLoadingPresidentRef.current
		) {
			void loadLeaderCandidates({
				page: 1,
				append: false,
				query: undefined,
				setCandidates: setPresidentCandidates,
				setLoading: setIsLoadingPresidentCandidates,
				loadingRef: isLoadingPresidentRef,
			});
		}
	}, [
		debouncedPresidentSearch,
		presidentCandidates.length,
		loadLeaderCandidates,
	]);

	useEffect(() => {
		if (
			debouncedSecretarySearch.length === 0 &&
			secretaryCandidates.length === 0 &&
			!isLoadingSecretaryRef.current
		) {
			void loadLeaderCandidates({
				page: 1,
				append: false,
				query: undefined,
				setCandidates: setSecretaryCandidates,
				setLoading: setIsLoadingSecretaryCandidates,
				loadingRef: isLoadingSecretaryRef,
			});
		}
	}, [
		debouncedSecretarySearch,
		secretaryCandidates.length,
		loadLeaderCandidates,
	]);

	const availablePresidents = presidentCandidates.filter((u) => {
		// Preserve currently selected president when editing this society.
		if (initialData?.presidentId && u.id === initialData.presidentId)
			return true;
		// Exclude parishioners already serving as president or secretary in any society.
		if (assignedPresidentIds.includes(u.id)) return false;
		if (assignedSecretaryIds.includes(u.id)) return false;
		return true;
	});

	const availableSecretaries = secretaryCandidates.filter((u) => {
		// Preserve currently selected secretary when editing this society.
		if (initialData?.secretaryId && u.id === initialData.secretaryId)
			return true;
		// Exclude parishioners already serving as secretary or president in any society.
		if (assignedSecretaryIds.includes(u.id)) return false;
		if (assignedPresidentIds.includes(u.id)) return false;
		return true;
	});

	const onSubmit = (data: CreateSocietyInput | UpdateSocietyInput) => {
		startTransition(async () => {
			const payload: CreateSocietyInput | UpdateSocietyInput = {
				...data,
				meetingSchedule:
					meetingRules.length > 0 ?
						JSON.stringify(meetingRules)
					:	undefined,
			};

			const result =
				initialData?.id ?
					await updateSociety(initialData.id, payload)
				:	await createSociety(payload);

			if (result.success) {
				toast.success(result.message);
				reset();
				router.refresh();
				onSuccess?.();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							if (
								Array.isArray(messages) &&
								messages.length > 0
							) {
								setError(field as keyof CreateSocietyInput, {
									type: "server",
									message: messages[0],
								});
							}
						},
					);
				}
			}
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Society Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Society Name *</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g., Catholic Women Organization"
					disabled={isPending}
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? "name-error" : undefined}
				/>
				{errors.name && (
					<p
						id="name-error"
						className="text-sm text-destructive"
						role="alert"
					>
						{errors.name.message}
					</p>
				)}
			</div>

			{/* Patron Saint */}
			<div className="space-y-2">
				<Label htmlFor="patronSaint">Patron Saint</Label>
				<Input
					id="patronSaint"
					{...register("patronSaint")}
					placeholder="e.g., St. Monica"
					disabled={isPending}
					aria-invalid={!!errors.patronSaint}
				/>
				{errors.patronSaint && (
					<p className="text-sm text-destructive" role="alert">
						{errors.patronSaint.message}
					</p>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					{...register("description")}
					placeholder="Describe the society's purpose and activities..."
					rows={4}
					disabled={isPending}
					aria-invalid={!!errors.description}
				/>
				{errors.description && (
					<p className="text-sm text-destructive" role="alert">
						{errors.description.message}
					</p>
				)}
			</div>

			{/* Leaders */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* President */}
				<div className="space-y-2">
					<Label htmlFor="presidentId">President</Label>
					<Controller
						name="presidentId"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? undefined}
								onValueChange={(value) =>
									field.onChange(
										allowNone && value === "__none__" ?
											null
										:	value,
									)
								}
								disabled={isPending}
							>
								<SelectTrigger id="presidentId">
									<SelectValue placeholder="Select President" />
								</SelectTrigger>
								<SelectContent
									className="bg-primary"
									viewportClassName="max-h-64"
								>
									<div className="px-3 pb-2">
										<Input
											placeholder="Search parishioners..."
											value={presidentSearch}
											onChange={(event) =>
												setPresidentSearch(
													event.target.value,
												)
											}
											disabled={isPending}
										/>
									</div>
									<div>
										{allowNone && (
											<SelectItem value="__none__">
												None
											</SelectItem>
										)}
										{isLoadingPresidentCandidates &&
											presidentCandidates.length ===
												0 && (
												<div className="px-3 py-2 text-sm text-muted-foreground">
													Loading parishioners...
												</div>
											)}
										{availablePresidents.length === 0 && (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												No candidates available.
											</div>
										)}
										{availablePresidents.map((u) => (
											<SelectItem key={u.id} value={u.id}>
												{u.firstName} {u.lastName}
											</SelectItem>
										))}
									</div>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.presidentId && (
						<p className="text-sm text-destructive" role="alert">
							{errors.presidentId.message}
						</p>
					)}
				</div>

				{/* Secretary */}
				<div className="space-y-2">
					<Label htmlFor="secretaryId">Secretary</Label>
					<Controller
						name="secretaryId"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? undefined}
								onValueChange={(value) =>
									field.onChange(
										allowNone && value === "__none__" ?
											null
										:	value,
									)
								}
								disabled={isPending}
							>
								<SelectTrigger id="secretaryId">
									<SelectValue placeholder="Select Secretary" />
								</SelectTrigger>
								<SelectContent
									className="bg-primary"
									viewportClassName="max-h-64"
								>
									<div className="px-3 pb-2">
										<Input
											placeholder="Search parishioners..."
											value={secretarySearch}
											onChange={(event) =>
												setSecretarySearch(
													event.target.value,
												)
											}
											disabled={isPending}
										/>
									</div>
									<div>
										{allowNone && (
											<SelectItem value="__none__">
												None
											</SelectItem>
										)}
										{isLoadingSecretaryCandidates &&
											secretaryCandidates.length ===
												0 && (
												<div className="px-3 py-2 text-sm text-muted-foreground">
													Loading parishioners...
												</div>
											)}
										{availableSecretaries.length === 0 && (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												No candidates available.
											</div>
										)}
										{availableSecretaries.map((u) => (
											<SelectItem key={u.id} value={u.id}>
												{u.firstName} {u.lastName}
											</SelectItem>
										))}
									</div>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.secretaryId && (
						<p className="text-sm text-destructive" role="alert">
							{errors.secretaryId.message}
						</p>
					)}
				</div>
			</div>

			{/* Meeting Schedule */}
			<div className="space-y-3">
				<Label>Meeting Schedule Rules</Label>
				<div className="rounded-md border border-border p-3 space-y-3">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs">Cadence</Label>
							<Select
								value={newRule.cadence}
								onValueChange={(value: MeetingCadence) =>
									setNewRule((prev) => ({
										...prev,
										cadence: value,
									}))
								}
								disabled={isPending}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-primary">
									{CADENCE_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Week of month</Label>
							<Select
								value={newRule.week}
								onValueChange={(value: MeetingWeek) =>
									setNewRule((prev) => ({
										...prev,
										week: value,
									}))
								}
								disabled={isPending}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-primary">
									{WEEK_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Day</Label>
							<Select
								value={newRule.weekday}
								onValueChange={(value: MeetingWeekday) =>
									setNewRule((prev) => ({
										...prev,
										weekday: value,
									}))
								}
								disabled={isPending}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-primary">
									{WEEKDAY_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Time</Label>
							<Input
								type="time"
								value={newRule.time}
								onChange={(e) =>
									setNewRule((prev) => ({
										...prev,
										time: e.target.value,
									}))
								}
								disabled={isPending}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label className="text-xs">Notes (optional)</Label>
						<Input
							value={newRule.note ?? ""}
							onChange={(e) =>
								setNewRule((prev) => ({
									...prev,
									note: e.target.value,
								}))
							}
							placeholder="e.g., After second mass"
							disabled={isPending}
						/>
					</div>

					<div className="flex justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={isPending || !newRule.time}
							onClick={() => {
								setMeetingRules((prev) => [
									...prev,
									{ id: String(Date.now()), ...newRule },
								]);
								setNewRule({
									cadence: "MONTHLY",
									week: "LAST",
									weekday: "SUNDAY",
									time: "18:00",
									note: "",
								});
							}}
						>
							<Plus className="h-4 w-4 mr-2" /> Add Schedule Rule
						</Button>
					</div>
				</div>

				{meetingRules.length > 0 && (
					<div className="space-y-2">
						{meetingRules.map((rule) => (
							<div
								key={rule.id}
								className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
							>
								<div>
									<p className="text-sm font-medium">
										{formatRuleLabel(rule)}
									</p>
									{rule.note && (
										<p className="text-xs text-muted-foreground mt-1">
											{rule.note}
										</p>
									)}
								</div>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									onClick={() =>
										setMeetingRules((prev) =>
											prev.filter(
												(item) => item.id !== rule.id,
											),
										)
									}
									disabled={isPending}
									aria-label="Remove schedule rule"
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						))}
					</div>
				)}

				{errors.meetingSchedule && (
					<p className="text-sm text-destructive" role="alert">
						{errors.meetingSchedule.message}
					</p>
				)}
			</div>

			{/* Submit Button */}
			<div className="flex justify-end gap-3 pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={() => reset()}
					disabled={isPending}
				>
					Reset
				</Button>
				<Button type="submit" disabled={isPending}>
					{isPending ?
						"Saving..."
					: initialData ?
						"Update Society"
					:	"Create Society"}
				</Button>
			</div>
		</form>
	);
}
