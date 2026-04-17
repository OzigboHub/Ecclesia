"use client";

import { createUser } from "@/app/actions/user.actions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createUserSchema,
	roleDescriptions,
	roleLabels,
	userRoles,
	type CreateUserInput,
} from "@/lib/validators/user.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldErrorsImpl, useForm } from "react-hook-form";
import { toast } from "sonner";
// Tooltip imports removed - not currently used

interface UserFormProps {
	onSuccess?: () => void;
	currentUserRole?: string;
	outstations?: Array<{ id: string; name: string }>;
	banks?: Array<{ id: number; name: string; code: string }>;
}

export function UserForm({
	onSuccess,
	currentUserRole = "PARISH_ADMIN",
	outstations = [],
	banks = [],
}: UserFormProps) {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const form = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			role: undefined,
			outstationId: undefined,
			paystackProfile: {
				accountNumber: "",
				bankCode: "",
				bankName: "",
				businessName: "",
				contactEmail: "",
				contactPhone: "",
				settlementSchedule: "manual",
				createDedicatedAccount: true,
				dedicatedProviderSlug: "",
			},
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
		setValue,
		watch,
	} = form;

	const selectedRole = watch("role");
	const isOutstationAdmin = selectedRole === "OUTSTATION_ADMIN";
	const paystackErrors = errors.paystackProfile as
		| FieldErrorsImpl<{
				bankCode?: string;
				bankName?: string;
				accountNumber?: string;
				contactEmail?: string;
				contactPhone?: string;
		  }>
		| undefined;

	// Filter roles based on current user's role
	const availableRoles = userRoles.filter((role) => {
		const roleHierarchy: Record<string, number> = {
			SUPER_ADMIN: 100,
			PARISH_ADMIN: 80,
			PARISH_SECRETARY: 60,
			PARISH_STAFF: 40,
			OUTSTATION_ADMIN: 40,
			SOCIETY_PRESIDENT: 30,
			SOCIETY_SECRETARY: 30,
			PARISHIONER: 10,
		};
		const currentLevel = roleHierarchy[currentUserRole] ?? 0;
		const targetLevel = roleHierarchy[role] ?? 0;
		return currentLevel > targetLevel;
	});

	const onSubmit = (data: CreateUserInput) => {
		startTransition(async () => {
			const result = await createUser(data);

			if (result.success) {
				toast.success(result.message);
				reset();
				router.push("/users");
				router.refresh();
				onSuccess?.();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof CreateUserInput, {
								type: "server",
								message: messages[0],
							});
						},
					);
				}
			}
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
					<CardDescription>
						Enter the user&apos;s personal details
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* First Name */}
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name *</Label>
							<Input
								id="firstName"
								{...register("firstName")}
								placeholder="Enter first name"
								disabled={isPending}
								aria-invalid={!!errors.firstName}
								aria-describedby={
									errors.firstName ? "firstName-error" : (
										undefined
									)
								}
							/>
							{errors.firstName && (
								<p
									id="firstName-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{errors.firstName.message}
								</p>
							)}
						</div>

						{/* Last Name */}
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name *</Label>
							<Input
								id="lastName"
								{...register("lastName")}
								placeholder="Enter last name"
								disabled={isPending}
								aria-invalid={!!errors.lastName}
								aria-describedby={
									errors.lastName ? "lastName-error" : (
										undefined
									)
								}
							/>
							{errors.lastName && (
								<p
									id="lastName-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{errors.lastName.message}
								</p>
							)}
						</div>
					</div>

					{/* Email */}
					<div className="space-y-2">
						<Label htmlFor="email">Email Address *</Label>
						<Input
							id="email"
							type="email"
							{...register("email")}
							placeholder="Enter email address"
							disabled={isPending}
							aria-invalid={!!errors.email}
							aria-describedby={
								errors.email ? "email-error" : undefined
							}
						/>
						{errors.email && (
							<p
								id="email-error"
								className="text-sm text-destructive"
								role="alert"
							>
								{errors.email.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Security */}
			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>
						Set a secure password for the user
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Password */}
					<div className="space-y-2">
						<Label htmlFor="password">Password *</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								{...register("password")}
								placeholder="Enter password"
								disabled={isPending}
								aria-invalid={!!errors.password}
								aria-describedby={
									errors.password ? "password-error" : (
										"password-hint"
									)
								}
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								tabIndex={-1}
							>
								{showPassword ?
									<EyeOff className="h-4 w-4" />
								:	<Eye className="h-4 w-4" />}
							</button>
						</div>
						{errors.password ?
							<p
								id="password-error"
								className="text-sm text-destructive"
								role="alert"
							>
								{errors.password.message}
							</p>
						:	<p
								id="password-hint"
								className="text-sm text-muted-foreground"
							>
								Must be at least 8 characters with uppercase,
								number, and special character
							</p>
						}
					</div>
				</CardContent>
			</Card>

			{/* Role Assignment */}
			<Card>
				<CardHeader>
					<CardTitle>Role Assignment</CardTitle>
					<CardDescription>
						Assign a role to define user permissions
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Role */}
					<div className="space-y-2">
						<Label htmlFor="role">Role *</Label>
						<Select
							value={watch("role")}
							onValueChange={(value) =>
								setValue(
									"role",
									value as CreateUserInput["role"],
									{
										shouldValidate: true,
									},
								)
							}
							disabled={isPending}
						>
							<SelectTrigger
								id="role"
								aria-invalid={!!errors.role}
								aria-describedby={
									errors.role ? "role-error" : undefined
								}
							>
								<SelectValue placeholder="Select a role" />
							</SelectTrigger>
							<SelectContent>
								{availableRoles.map((role) => (
									<SelectItem key={role} value={role}>
										<div className="flex items-center gap-2">
											<span>{roleLabels[role]}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.role && (
							<p
								id="role-error"
								className="text-sm text-destructive"
								role="alert"
							>
								{errors.role.message}
							</p>
						)}
					</div>

					{/* Role Description */}
					{watch("role") && (
						<div className="rounded-lg border bg-muted/50 p-4">
							<div className="flex items-start gap-3">
								<Info className="h-5 w-5 text-primary mt-0.5" />
								<div>
									<p className="font-medium">
										{
											roleLabels[
												watch(
													"role",
												) as keyof typeof roleLabels
											]
										}
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										{
											roleDescriptions[
												watch(
													"role",
												) as keyof typeof roleDescriptions
											]
										}
									</p>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{isOutstationAdmin && (
				<Card>
					<CardHeader>
						<CardTitle>Outstation Assignment</CardTitle>
						<CardDescription>
							Select the outstation this admin will manage.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="outstationId">Outstation *</Label>
							<Select
								value={watch("outstationId")}
								onValueChange={(value) =>
									setValue("outstationId", value, {
										shouldValidate: true,
									})
								}
								disabled={isPending}
							>
								<SelectTrigger
									id="outstationId"
									aria-invalid={!!errors.outstationId}
									aria-describedby={
										errors.outstationId ?
											"outstationId-error"
										:	undefined
									}
								>
									<SelectValue placeholder="Select an outstation" />
								</SelectTrigger>
								<SelectContent>
									{outstations.map((outstation) => (
										<SelectItem
											key={outstation.id}
											value={outstation.id}
										>
											{outstation.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.outstationId && (
								<p
									id="outstationId-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{errors.outstationId.message}
								</p>
							)}
							{outstations.length === 0 && (
								<p className="text-xs text-muted-foreground">
									No outstations available for assignment.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{isOutstationAdmin && (
				<Card>
					<CardHeader>
						<CardTitle>Payment Subaccount</CardTitle>
						<CardDescription>
							Required to accept and record outstation payments.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="paystackProfile.bankCode">
								Bank *
							</Label>
							<Select
								value={watch("paystackProfile.bankCode")}
								onValueChange={(value) => {
									const selectedBank = banks.find(
										(bank) => bank.code === value,
									);
									setValue(
										"paystackProfile.bankCode",
										value,
										{
											shouldValidate: true,
										},
									);
									setValue(
										"paystackProfile.bankName",
										selectedBank?.name || "",
									);
								}}
								disabled={isPending}
							>
								<SelectTrigger
									id="paystackProfile.bankCode"
									aria-invalid={!!paystackErrors?.bankCode}
									aria-describedby={
										paystackErrors?.bankCode ?
											"paystackProfile.bankCode-error"
										:	undefined
									}
								>
									<SelectValue placeholder="Select bank" />
								</SelectTrigger>
								<SelectContent>
									{banks.map((bank) => (
										<SelectItem
											key={bank.code}
											value={bank.code}
										>
											{bank.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{paystackErrors?.bankCode && (
								<p
									id="paystackProfile.bankCode-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{paystackErrors.bankCode.message}
								</p>
							)}
							{paystackErrors?.bankName && (
								<p
									className="text-sm text-destructive"
									role="alert"
								>
									{paystackErrors.bankName.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="paystackProfile.accountNumber">
								Account Number *
							</Label>
							<Input
								id="paystackProfile.accountNumber"
								{...register("paystackProfile.accountNumber")}
								placeholder="10-digit account number"
								disabled={isPending}
								aria-invalid={!!paystackErrors?.accountNumber}
								aria-describedby={
									paystackErrors?.accountNumber ?
										"paystackProfile.accountNumber-error"
									:	undefined
								}
							/>
							{paystackErrors?.accountNumber && (
								<p
									id="paystackProfile.accountNumber-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{paystackErrors.accountNumber.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="paystackProfile.contactEmail">
								Contact Email
							</Label>
							<Input
								id="paystackProfile.contactEmail"
								type="email"
								{...register("paystackProfile.contactEmail")}
								placeholder="Optional contact email"
								disabled={isPending}
							/>
							{paystackErrors?.contactEmail && (
								<p
									className="text-sm text-destructive"
									role="alert"
								>
									{paystackErrors.contactEmail.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="paystackProfile.contactPhone">
								Contact Phone
							</Label>
							<Input
								id="paystackProfile.contactPhone"
								type="tel"
								{...register("paystackProfile.contactPhone")}
								placeholder="Optional contact phone"
								disabled={isPending}
							/>
							{paystackErrors?.contactPhone && (
								<p
									className="text-sm text-destructive"
									role="alert"
								>
									{paystackErrors.contactPhone.message}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Form Actions */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isPending}>
					{isPending ?
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating...
						</>
					:	"Create User"}
				</Button>
			</div>
		</form>
	);
}
