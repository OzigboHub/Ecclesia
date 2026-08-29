"use client";

import { updateAppointment } from "@/app/actions/appointment.actions";
import { getParishioners } from "@/app/actions/parishioner.actions";
import { createUser, getStaffMembers } from "@/app/actions/user.actions";
import { Button } from "@/components/ui/button";
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
	updateAppointmentSchema,
	type UpdateAppointmentInput,
} from "@/lib/validators/appointment.schema";
import {
	createUserSchema,
	type CreateUserInput,
} from "@/lib/validators/user.schema";
import {
	zodResolver,
	zodResolver as zodStaffResolver,
} from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useForm as useStaffForm } from "react-hook-form";
import { toast } from "sonner";

interface AppointmentEditFormProps {
	appointment: {
		id: string;
		title: string;
		description: string | null;
		startTime: Date | string;
		endTime: Date | string;
		type: string;
		status: string;
		source?: string;
		publicRequesterName?: string | null;
		parishionerId: string | null;
		assignedToId: string | null;
	};
}

interface Parishioner {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
}

interface StaffMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	role: string;
}

export function AppointmentEditForm({ appointment }: AppointmentEditFormProps) {
	const [isPending, startTransition] = useTransition();
	const [parishioners, setParishioners] = useState<Parishioner[]>([]);
	const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
	const [isLoadingParishioners, setIsLoadingParishioners] = useState(true);
	const [isLoadingStaff, setIsLoadingStaff] = useState(true);
	const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
	const [isCreatingStaff, setIsCreatingStaff] = useState(false);
	const router = useRouter();

	// Format datetime-local input value
	const formatDateTimeLocal = (date: Date | string) => {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		const hours = String(d.getHours()).padStart(2, "0");
		const minutes = String(d.getMinutes()).padStart(2, "0");
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	// Extract notes from description if it contains "Additional Notes:"
	const extractNotes = (description: string | null): string => {
		if (!description) return "";
		// Only match "Additional Notes:" at the end, non-greedy, without using /s flag for max compatibility
		const notesMatch = description.match(/Additional Notes:\s*([\s\S]+)$/);
		return notesMatch ? notesMatch[1].trim() : "";
	};

	const extractDescription = (description: string | null): string => {
		if (!description) return "";
		const notesMatch = description.match(/Additional Notes:/);
		if (notesMatch) {
			return description.substring(0, notesMatch.index).trim();
		}
		return description;
	};

	const form = useForm<UpdateAppointmentInput>({
		resolver: zodResolver(updateAppointmentSchema),
		defaultValues: {
			title: appointment.title,
			description: extractDescription(appointment.description),
			type: appointment.type as any,
			startTime: formatDateTimeLocal(appointment.startTime),
			endTime: formatDateTimeLocal(appointment.endTime),
			assignedToId: appointment.assignedToId || undefined,
			parishionerId: appointment.parishionerId || null,
			notes: extractNotes(appointment.description),
			status: appointment.status as any,
		},
	});

	const staffForm = useStaffForm<CreateUserInput>({
		resolver: zodStaffResolver(createUserSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			role: "PARISH_STAFF",
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		setValue,
	} = form;

	// Load parishioners and staff
	useEffect(() => {
		async function loadData() {
			try {
				const [parishionersResult, staffResult] = await Promise.all([
					getParishioners(),
					getStaffMembers(),
				]);

				if (parishionersResult.success && parishionersResult.data) {
					setParishioners(parishionersResult.data);
				}
				if (staffResult.success && staffResult.data) {
					setStaffMembers(staffResult.data);
				}
			} catch (error) {
				console.error("Failed to load data:", error);
			} finally {
				setIsLoadingParishioners(false);
				setIsLoadingStaff(false);
			}
		}
		loadData();
	}, []);

	const onSubmit = (data: UpdateAppointmentInput) => {
		startTransition(async () => {
			const result = await updateAppointment(appointment.id, data);

			if (result.success) {
				toast.success("Appointment updated successfully");
				router.push(`/dashboard/appointments/${appointment.id}`);
				router.refresh();
			} else {
				toast.error(result.message);

				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof UpdateAppointmentInput, {
								type: "server",
								message: messages[0],
							});
						},
					);
				}
			}
		});
	};

	const handleCreateStaff = async (data: CreateUserInput) => {
		setIsCreatingStaff(true);
		try {
			const result = await createUser(data);
			if (result.success && result.data) {
				toast.success("Staff member created successfully");
				setStaffMembers((prev) => [...prev, result.data!]);
				setValue("assignedToId", result.data.id);
				setIsCreateStaffModalOpen(false);
				staffForm.reset();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error("Failed to create staff member");
		} finally {
			setIsCreatingStaff(false);
		}
	};

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Title */}
				<div className="space-y-2">
					<Label htmlFor="title">Title *</Label>
					<Input
						id="title"
						{...register("title")}
						placeholder="e.g., Wedding Counseling Session"
						disabled={isPending}
						aria-invalid={!!errors.title}
					/>
					{errors.title && (
						<p className="text-sm text-destructive">
							{errors.title.message}
						</p>
					)}
				</div>

				{/* Description */}
				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						{...register("description")}
						placeholder="Brief description of the appointment..."
						rows={3}
						disabled={isPending}
					/>
					{errors.description && (
						<p className="text-sm text-destructive">
							{errors.description.message}
						</p>
					)}
				</div>

				{/* Type */}
				<div className="space-y-2">
					<Label htmlFor="type">Type *</Label>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending}
							>
								<SelectTrigger id="type">
									<SelectValue placeholder="Select appointment type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="CONFESSION">
										Confession
									</SelectItem>
									<SelectItem value="COUNSELING">
										Counseling
									</SelectItem>
									<SelectItem value="MEETING">
										Meeting
									</SelectItem>
									<SelectItem value="OTHER">Other</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.type && (
						<p className="text-sm text-destructive">
							{errors.type.message}
						</p>
					)}
				</div>

				{/* Status */}
				<div className="space-y-2">
					<Label htmlFor="status">Status</Label>
					<Controller
						name="status"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PENDING">
										Pending
									</SelectItem>
									<SelectItem value="CONFIRMED">
										Confirmed
									</SelectItem>
									<SelectItem value="COMPLETED">
										Completed
									</SelectItem>
									<SelectItem value="CANCELLED">
										Cancelled
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.status && (
						<p className="text-sm text-destructive">
							{errors.status.message}
						</p>
					)}
				</div>

				{/* Parishioner */}
				<div className="space-y-2">
					<Label htmlFor="parishionerId">Linked Parishioner</Label>
					<Controller
						name="parishionerId"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value || "none"}
								onValueChange={(value) =>
									field.onChange(
										value === "none" ? null : value,
									)
								}
								disabled={isPending || isLoadingParishioners}
							>
								<SelectTrigger id="parishionerId">
									<SelectValue
										placeholder={
											isLoadingParishioners ? "Loading..."
											:	"Select parishioner"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										No linked parishioner
									</SelectItem>
									{parishioners.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.firstName} {p.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.parishionerId && (
						<p className="text-sm text-destructive">
							{errors.parishionerId.message}
						</p>
					)}
					{appointment.source === "PUBLIC" &&
						appointment.publicRequesterName && (
							<p className="text-xs text-muted-foreground">
								Public requester:{" "}
								{appointment.publicRequesterName}
							</p>
						)}
				</div>

				{/* Date & Time */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="startTime">Start Date & Time *</Label>
						<Input
							id="startTime"
							type="datetime-local"
							{...register("startTime")}
							disabled={isPending}
							aria-invalid={!!errors.startTime}
						/>
						{errors.startTime && (
							<p className="text-sm text-destructive">
								{errors.startTime.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="endTime">End Date & Time *</Label>
						<Input
							id="endTime"
							type="datetime-local"
							{...register("endTime")}
							disabled={isPending}
							aria-invalid={!!errors.endTime}
						/>
						{errors.endTime && (
							<p className="text-sm text-destructive">
								{errors.endTime.message}
							</p>
						)}
					</div>
				</div>

				{/* Assigned To */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="assignedToId">
							Assign To (Optional - Staff Member)
						</Label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => setIsCreateStaffModalOpen(true)}
							disabled={isPending}
						>
							<UserPlus className="mr-1 h-3 w-3" />
							Create Staff
						</Button>
					</div>
					<Controller
						name="assignedToId"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value || undefined}
								onValueChange={(value) =>
									field.onChange(value || undefined)
								}
								disabled={isPending || isLoadingStaff}
							>
								<SelectTrigger id="assignedToId">
									<SelectValue
										placeholder={
											isLoadingStaff ? "Loading staff..."
											: staffMembers.length === 0 ?
												"No staff members (click Create Staff)"
											:	"Select staff member (optional)"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{staffMembers.map((staff) => (
										<SelectItem
											key={staff.id}
											value={staff.id}
										>
											{staff.firstName} {staff.lastName}
											{staff.email && (
												<span className="text-muted-foreground ml-2 text-xs">
													({staff.email})
												</span>
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.assignedToId && (
						<p className="text-sm text-destructive">
							{errors.assignedToId.message}
						</p>
					)}
				</div>

				{/* Notes */}
				<div className="space-y-2">
					<Label htmlFor="notes">Additional Notes</Label>
					<Textarea
						id="notes"
						{...register("notes")}
						placeholder="Any additional notes or comments..."
						rows={3}
						disabled={isPending}
					/>
					{errors.notes && (
						<p className="text-sm text-destructive">
							{errors.notes.message}
						</p>
					)}
				</div>

				{/* Submit Button */}
				<div className="flex gap-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Update Appointment
					</Button>
				</div>
			</form>

			{/* Create Staff Modal */}
			<Modal
				isOpen={isCreateStaffModalOpen}
				onClose={() => setIsCreateStaffModalOpen(false)}
				title="Create New Staff Member"
			>
				<form
					onSubmit={staffForm.handleSubmit(handleCreateStaff)}
					className="space-y-4"
				>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="staffFirstName">First Name *</Label>
							<Input
								id="staffFirstName"
								{...staffForm.register("firstName")}
								disabled={isCreatingStaff}
							/>
							{staffForm.formState.errors.firstName && (
								<p className="text-sm text-destructive">
									{
										staffForm.formState.errors.firstName
											.message
									}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="staffLastName">Last Name *</Label>
							<Input
								id="staffLastName"
								{...staffForm.register("lastName")}
								disabled={isCreatingStaff}
							/>
							{staffForm.formState.errors.lastName && (
								<p className="text-sm text-destructive">
									{
										staffForm.formState.errors.lastName
											.message
									}
								</p>
							)}
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="staffEmail">Email *</Label>
						<Input
							id="staffEmail"
							type="email"
							{...staffForm.register("email")}
							disabled={isCreatingStaff}
						/>
						{staffForm.formState.errors.email && (
							<p className="text-sm text-destructive">
								{staffForm.formState.errors.email.message}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="staffPassword">Password *</Label>
						<Input
							id="staffPassword"
							type="password"
							{...staffForm.register("password")}
							disabled={isCreatingStaff}
						/>
						{staffForm.formState.errors.password && (
							<p className="text-sm text-destructive">
								{staffForm.formState.errors.password.message}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="staffRole">Role *</Label>
						<Controller
							name="role"
							control={staffForm.control}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isCreatingStaff}
								>
									<SelectTrigger id="staffRole">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PARISH_STAFF">
											Parish Staff
										</SelectItem>
										<SelectItem value="PARISH_SECRETARY">
											Parish Secretary
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="flex gap-2 justify-end pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsCreateStaffModalOpen(false)}
							disabled={isCreatingStaff}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isCreatingStaff}>
							{isCreatingStaff && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create Staff
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
