"use client";

import { submitPublicAppointment } from "@/app/actions/appointment.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	appointmentTypeEnum,
	publicAppointmentSchema,
	type PublicAppointmentInput,
} from "@/lib/validators/appointment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type PublicAvailability = {
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

interface PublicAppointmentBookingProps {
	organizationId: string;
	organizationName: string;
	availabilities: PublicAvailability[];
}

export function PublicAppointmentBooking({
	organizationId,
	organizationName,
	availabilities,
}: PublicAppointmentBookingProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const form = useForm<PublicAppointmentInput>({
		resolver: zodResolver(publicAppointmentSchema),
		defaultValues: {
			availabilityId: availabilities[0]?.id ?? "",
			title: "",
			description: "",
			type:
				(availabilities[0]?.type as PublicAppointmentInput["type"]) ??
				"MEETING",
			requesterName: "",
			requesterEmail: "",
			requesterPhone: "",
			notes: "",
		},
	});

	const selectedAvailabilityId = form.watch("availabilityId");
	const selectedAvailability = availabilities.find(
		(item) => item.id === selectedAvailabilityId,
	);

	const onSubmit = (data: PublicAppointmentInput) => {
		startTransition(async () => {
			const result = await submitPublicAppointment(organizationId, data);
			if (!result.success) {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							form.setError(
								field as keyof PublicAppointmentInput,
								{
									type: "server",
									message: messages[0],
								},
							);
						},
					);
				}
				return;
			}

			toast.success(result.message);
			form.reset({
				availabilityId: availabilities[0]?.id ?? "",
				title: "",
				description: "",
				type:
					(availabilities[0]
						?.type as PublicAppointmentInput["type"]) ?? "MEETING",
				requesterName: "",
				requesterEmail: "",
				requesterPhone: "",
				notes: "",
			});
			router.refresh();
		});
	};

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<Card>
				<CardHeader>
					<CardTitle>Send an appointment request</CardTitle>
				</CardHeader>
				<CardContent>
					{availabilities.length === 0 ?
						<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
							No appointment slots are currently available for{" "}
							{organizationName}.
						</p>
					:	<form
							className="space-y-4"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							<div className="space-y-2">
								<Label htmlFor="public-availability">
									Available slot
								</Label>
								<Controller
									name="availabilityId"
									control={form.control}
									render={({ field }) => (
										<Select
											value={field.value}
											onValueChange={(value) => {
												field.onChange(value);
												const nextSlot =
													availabilities.find(
														(slot) =>
															slot.id === value,
													);
												if (nextSlot) {
													form.setValue(
														"type",
														nextSlot.type as PublicAppointmentInput["type"],
													);
												}
											}}
											disabled={isPending}
										>
											<SelectTrigger id="public-availability">
												<SelectValue placeholder="Choose a slot" />
											</SelectTrigger>
											<SelectContent>
												{availabilities.map((slot) => (
													<SelectItem
														key={slot.id}
														value={slot.id}
													>
														{slot.title} ·{" "}
														{format(
															new Date(
																slot.startTime,
															),
															"MMM d, h:mm a",
														)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{form.formState.errors.availabilityId && (
									<p className="text-sm text-destructive">
										{
											form.formState.errors.availabilityId
												.message
										}
									</p>
								)}
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="public-requester-name">
										Your name
									</Label>
									<Input
										id="public-requester-name"
										{...form.register("requesterName")}
										disabled={isPending}
									/>
									{form.formState.errors.requesterName && (
										<p className="text-sm text-destructive">
											{
												form.formState.errors
													.requesterName.message
											}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="public-requester-phone">
										Phone number
									</Label>
									<Input
										id="public-requester-phone"
										{...form.register("requesterPhone")}
										disabled={isPending}
										placeholder="08012345678"
									/>
									{form.formState.errors.requesterPhone && (
										<p className="text-sm text-destructive">
											{
												form.formState.errors
													.requesterPhone.message
											}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="public-requester-email">
									Email address
								</Label>
								<Input
									id="public-requester-email"
									type="email"
									{...form.register("requesterEmail")}
									disabled={isPending}
								/>
								{form.formState.errors.requesterEmail && (
									<p className="text-sm text-destructive">
										{
											form.formState.errors.requesterEmail
												.message
										}
									</p>
								)}
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="public-title">
										Appointment title
									</Label>
									<Input
										id="public-title"
										{...form.register("title")}
										disabled={isPending}
										placeholder="Marriage guidance session"
									/>
									{form.formState.errors.title && (
										<p className="text-sm text-destructive">
											{
												form.formState.errors.title
													.message
											}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="public-type">Type</Label>
									<Controller
										name="type"
										control={form.control}
										render={({ field }) => (
											<Select
												value={field.value}
												onValueChange={field.onChange}
												disabled={isPending}
											>
												<SelectTrigger id="public-type">
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
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="public-description">
									Description
								</Label>
								<Textarea
									id="public-description"
									rows={3}
									{...form.register("description")}
									disabled={isPending}
									placeholder="Tell the parish what you need help with."
								/>
								{form.formState.errors.description && (
									<p className="text-sm text-destructive">
										{
											form.formState.errors.description
												.message
										}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="public-notes">
									Additional notes
								</Label>
								<Textarea
									id="public-notes"
									rows={3}
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

							<Button
								type="submit"
								disabled={isPending}
								className="w-full sm:w-auto"
							>
								{isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Submit Request
							</Button>
						</form>
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
						</div>
					:	<p className="text-sm text-muted-foreground">
							Select a slot to see its details.
						</p>
					}
				</CardContent>
			</Card>
		</div>
	);
}
