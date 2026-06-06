"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	appointmentTypeEnum,
	parishionerAppointmentSchema,
	type ParishionerAppointmentInput,
} from "@/lib/validators/appointment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarDays, Clock3, Loader2, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type ParishionerAvailabilitySlot = {
	id: string;
	title: string;
	type: string;
	startTime: Date | string;
	endTime: Date | string;
	maxBookings: number;
	remainingBookings: number;
	assignedTo: {
		firstName: string;
		lastName: string;
	} | null;
};

interface ParishionerAppointmentBookingProps {
	parishionerName: string;
	availabilities: ParishionerAvailabilitySlot[];
	bookAppointmentAction: (data: ParishionerAppointmentInput) => Promise<{
		success: boolean;
		message: string;
		errors?: Record<string, string[]>;
	}>;
}

export function ParishionerAppointmentBooking({
	parishionerName,
	availabilities,
	bookAppointmentAction,
}: ParishionerAppointmentBookingProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isBookingOpen, setIsBookingOpen] = useState(false);
	const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(
		availabilities[0]?.id ?? "",
	);

	const form = useForm<ParishionerAppointmentInput>({
		resolver: zodResolver(parishionerAppointmentSchema),
		defaultValues: {
			availabilityId: "",
			title: "",
			description: "",
			type: "MEETING",
			notes: "",
		},
	});

	const selectedAvailability = availabilities.find(
		(item) => item.id === selectedAvailabilityId,
	);

	const openBookingForSelectedSlot = () => {
		if (!selectedAvailability) return;

		form.reset({
			availabilityId: selectedAvailability.id,
			title: "",
			description: "",
			type: selectedAvailability.type as ParishionerAppointmentInput["type"],
			notes: "",
		});
		setIsBookingOpen(true);
	};

	const onSubmit = (data: ParishionerAppointmentInput) => {
		startTransition(async () => {
			const result = await bookAppointmentAction(data);
			if (!result.success) {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							form.setError(
								field as keyof ParishionerAppointmentInput,
								{
									type: "server",
									message: (messages as string[])[0],
								},
							);
						},
					);
				}
				return;
			}

			toast.success(result.message);
			setIsBookingOpen(false);
			form.reset({
				availabilityId: "",
				title: "",
				description: "",
				type: "MEETING",
				notes: "",
			});
			router.refresh();
		});
	};

	return (
		<>
			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<Card>
					<CardHeader>
						<CardTitle>Available Appointment Slots</CardTitle>
						<div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
							<UserCircle className="h-4 w-4 shrink-0 text-primary" />
							<span>
								Booking as{" "}
								<span className="font-medium text-foreground">
									{parishionerName}
								</span>
							</span>
						</div>
					</CardHeader>
					<CardContent>
						{availabilities.length === 0 ?
							<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								No appointment slots are currently available.
								Please check back later or contact your parish
								office.
							</p>
						:	<div className="space-y-2">
								{availabilities.map((slot) => {
									const isSelected =
										slot.id === selectedAvailabilityId;
									return (
										<button
											type="button"
											key={slot.id}
											onClick={() =>
												setSelectedAvailabilityId(
													slot.id,
												)
											}
											className={`w-full rounded-lg border p-3 text-left transition-colors ${
												isSelected ?
													"border-primary bg-primary/5"
												:	"hover:bg-accent"
											}`}
										>
											<p className="font-medium text-sm text-foreground">
												{slot.title}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{format(
													new Date(slot.startTime),
													"EEE, MMM d • h:mm a",
												)}{" "}
												-{" "}
												{format(
													new Date(slot.endTime),
													"h:mm a",
												)}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{slot.remainingBookings} spaces
												remaining
											</p>
										</button>
									);
								})}
							</div>
						}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Selected slot</CardTitle>
					</CardHeader>
					<CardContent>
						{selectedAvailability ?
							<div className="space-y-4">
								<div>
									<p className="font-semibold">
										{selectedAvailability.title}
									</p>
									<p className="text-sm text-muted-foreground">
										{selectedAvailability.type.replace(
											/_/g,
											" ",
										)}
									</p>
								</div>
								<div className="space-y-2 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<CalendarDays className="h-4 w-4 text-primary" />
										<span>
											{format(
												new Date(
													selectedAvailability.startTime,
												),
												"EEEE, MMMM d, yyyy",
											)}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Clock3 className="h-4 w-4 text-primary" />
										<span>
											{format(
												new Date(
													selectedAvailability.startTime,
												),
												"h:mm a",
											)}{" "}
											-{" "}
											{format(
												new Date(
													selectedAvailability.endTime,
												),
												"h:mm a",
											)}
										</span>
									</div>
								</div>
								<p className="text-sm text-muted-foreground">
									{selectedAvailability.assignedTo ?
										`Meeting owner: ${selectedAvailability.assignedTo.firstName} ${selectedAvailability.assignedTo.lastName}`
									:	"A parish team member will review and assign this request."
									}
								</p>
								<p className="text-sm text-muted-foreground">
									{selectedAvailability.remainingBookings} of{" "}
									{selectedAvailability.maxBookings} spaces
									remaining.
								</p>
								<Button
									type="button"
									onClick={openBookingForSelectedSlot}
									disabled={isPending}
									className="w-full sm:w-auto"
								>
									Book this slot
								</Button>
							</div>
						:	<p className="text-sm text-muted-foreground">
								Select a slot to see its details.
							</p>
						}
					</CardContent>
				</Card>
			</div>

			<Modal
				isOpen={isBookingOpen}
				onClose={() => setIsBookingOpen(false)}
				title="Book Appointment"
				className="max-w-xl"
			>
				<form
					className="space-y-4"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<input type="hidden" {...form.register("availabilityId")} />

					{selectedAvailability && (
						<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
							<p className="font-medium text-foreground">
								{selectedAvailability.title}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{format(
									new Date(selectedAvailability.startTime),
									"EEEE, MMMM d, yyyy • h:mm a",
								)}{" "}
								-{" "}
								{format(
									new Date(selectedAvailability.endTime),
									"h:mm a",
								)}
							</p>
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="parish-title">
								Appointment title
							</Label>
							<Input
								id="parish-title"
								{...form.register("title")}
								disabled={isPending}
								placeholder="e.g. Marriage guidance"
							/>
							{form.formState.errors.title && (
								<p className="text-sm text-destructive">
									{form.formState.errors.title.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="parish-type">Type</Label>
							<Controller
								name="type"
								control={form.control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={isPending}
									>
										<SelectTrigger id="parish-type">
											<SelectValue placeholder="Choose type" />
										</SelectTrigger>
										<SelectContent>
											{appointmentTypeEnum.options.map(
												(type) => (
													<SelectItem
														key={type}
														value={type}
													>
														{type.replace(
															/_/g,
															" ",
														)}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								)}
							/>
							{form.formState.errors.type && (
								<p className="text-sm text-destructive">
									{form.formState.errors.type.message}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="parish-description">Description</Label>
						<Textarea
							id="parish-description"
							rows={3}
							{...form.register("description")}
							disabled={isPending}
							placeholder="Briefly describe what you would like to discuss."
						/>
						{form.formState.errors.description && (
							<p className="text-sm text-destructive">
								{form.formState.errors.description.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="parish-notes">Additional notes</Label>
						<Textarea
							id="parish-notes"
							rows={2}
							{...form.register("notes")}
							disabled={isPending}
							placeholder="Accessibility needs, preferred contact window, or other context."
						/>
						{form.formState.errors.notes && (
							<p className="text-sm text-destructive">
								{form.formState.errors.notes.message}
							</p>
						)}
					</div>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsBookingOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Submit Request
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
