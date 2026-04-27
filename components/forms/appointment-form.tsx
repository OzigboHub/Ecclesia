"use client";

import { createAppointment } from "@/app/actions/appointment.actions";
import { createUser } from "@/app/actions/user.actions";
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
	createAppointmentSchema,
	type CreateAppointmentInput,
} from "@/lib/validators/appointment.schema";
import {
	createUserSchema,
	type CreateUserInput,
} from "@/lib/validators/user.schema";
import {
	zodResolver,
	zodResolver as zodStaffResolver,
} from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useForm as useStaffForm } from "react-hook-form";
import { toast } from "sonner";

interface AppointmentFormProps {
	onSuccess?: () => void;
	parishioners?: Parishioner[];
	staffMembers?: StaffMember[];
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
	email: string;
	role: string;
}

export function AppointmentForm({
	onSuccess,
	parishioners = [],
	staffMembers = [],
}: AppointmentFormProps) {
	const [isPending, startTransition] = useTransition();
	const [localParishioners, setLocalParishioners] =
		useState<Parishioner[]>(parishioners);
	const [localStaffMembers, setLocalStaffMembers] =
		useState<StaffMember[]>(staffMembers);
	const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
	const [isCreatingStaff, setIsCreatingStaff] = useState(false);
	const router = useRouter();

	const form = useForm<CreateAppointmentInput>({
		resolver: zodResolver(createAppointmentSchema),
		defaultValues: {
			title: "",
			description: "",
			type: "MEETING",
			startTime: "",
			endTime: "",
			assignedToId: "",
			parishionerId: "",
			notes: "",
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
		reset,
		setValue,
	} = form;

	const onSubmit = (data: CreateAppointmentInput) => {
		startTransition(async () => {
			const result = await createAppointment(data);

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
							setError(field as keyof CreateAppointmentInput, {
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
				// Add new staff to the list
				setLocalStaffMembers((prev) => [...prev, result.data!]);
				// Select the newly created staff member
				setValue("assignedToId", result.data.id);
				// Close modal and reset form
				setIsCreateStaffModalOpen(false);
				staffForm.reset();
			} else {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							staffForm.setError(field as keyof CreateUserInput, {
								type: "server",
								message: messages[0],
							});
						},
					);
				}
			}
		} catch (error) {
			toast.error("Failed to create staff member");
		} finally {
			setIsCreatingStaff(false);
		}
	};

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{/* Appointment Title */}
				<div className="space-y-2">
					<Label htmlFor="title">Appointment Title *</Label>
					<Input
						id="title"
						{...register("title")}
						placeholder="e.g., Wedding Counseling"
						disabled={isPending}
						aria-invalid={!!errors.title}
						aria-describedby={
							errors.title ? "title-error" : undefined
						}
					/>
					{errors.title && (
						<p
							id="title-error"
							className="text-sm text-destructive"
						>
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
						placeholder="Briefly describe the purpose of the meeting..."
						rows={3}
						disabled={isPending}
					/>
					{errors.description && (
						<p className="text-sm text-destructive">
							{errors.description.message}
						</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Appointment Type */}
					<div className="space-y-2">
						<Label htmlFor="type">Appointment Type *</Label>
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
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent className="bg-accent">
										<SelectItem value="CONFESSION">
											Confession
										</SelectItem>
										<SelectItem value="COUNSELING">
											Counseling
										</SelectItem>
										<SelectItem value="MEETING">
											Meeting with Parish Priest
										</SelectItem>
										<SelectItem value="OTHER">
											Other
										</SelectItem>
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

					{/* Parishioner Selection */}
					<div className="space-y-2">
						<Label htmlFor="parishionerId">Parishioner *</Label>
						<Controller
							name="parishionerId"
							control={control}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isPending}
								>
									<SelectTrigger id="parishionerId">
										<SelectValue
											placeholder={
												localParishioners.length === 0 ?
													"No parishioners available"
												:	"Select parishioner"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{localParishioners.map((p) => (
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
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Start Time */}
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

					{/* End Time */}
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

				{/* Assigned To - Staff Selection */}
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
								disabled={isPending}
							>
								<SelectTrigger id="assignedToId">
									<SelectValue
										placeholder={
											localStaffMembers.length === 0 ?
												"No staff members (click Create Staff)"
											:	"Select staff member (optional)"
										}
									/>
								</SelectTrigger>
								<SelectContent className="bg-muted hover:bg-none">
									{localStaffMembers.map((staff) => (
										<SelectItem
											key={staff.id}
											value={staff.id}
											className=""
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
						placeholder="Any special requirements or notes..."
						rows={2}
						disabled={isPending}
					/>
					{errors.notes && (
						<p className="text-sm text-destructive">
							{errors.notes.message}
						</p>
					)}
				</div>

				<div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
					<Button
						type="button"
						variant="outline"
						onClick={() => reset()}
						disabled={isPending}
						className="w-full sm:w-auto"
					>
						Reset
					</Button>
					<Button
						type="submit"
						disabled={isPending}
						className="w-full sm:w-auto"
					>
						{isPending ? "Scheduling..." : "Schedule Appointment"}
					</Button>
				</div>
			</form>

			{/* Create Staff Modal */}
			<Modal
				isOpen={isCreateStaffModalOpen}
				onClose={() => {
					setIsCreateStaffModalOpen(false);
					staffForm.reset();
				}}
				title="Create New Staff Member"
			>
				<form
					onSubmit={staffForm.handleSubmit(handleCreateStaff)}
					className="space-y-4"
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="staff-firstName">
								First Name *
							</Label>
							<Input
								id="staff-firstName"
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
							<Label htmlFor="staff-lastName">Last Name *</Label>
							<Input
								id="staff-lastName"
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
						<Label htmlFor="staff-email">Email *</Label>
						<Input
							id="staff-email"
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
						<Label htmlFor="staff-password">Password *</Label>
						<Input
							id="staff-password"
							type="password"
							{...staffForm.register("password")}
							disabled={isCreatingStaff}
							placeholder="Minimum 8 characters"
						/>
						{staffForm.formState.errors.password && (
							<p className="text-sm text-destructive">
								{staffForm.formState.errors.password.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="staff-role">Role *</Label>
						<Controller
							name="role"
							control={staffForm.control}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isCreatingStaff}
								>
									<SelectTrigger id="staff-role">
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
						{staffForm.formState.errors.role && (
							<p className="text-sm text-destructive">
								{staffForm.formState.errors.role.message}
							</p>
						)}
					</div>

					<div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateStaffModalOpen(false);
								staffForm.reset();
							}}
							disabled={isCreatingStaff}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isCreatingStaff}
							className="w-full sm:w-auto"
						>
							{isCreatingStaff ? "Creating..." : "Create Staff"}
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
