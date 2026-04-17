"use client";

import { createUserAccountRequest } from "@/app/actions/user-account-request.actions";
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
	requestUserAccountSchema,
	roleLabels,
	type RequestUserAccountInput,
} from "@/lib/validators/user.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const REQUEST_ROLE_OPTIONS = [
	"PARISH_STAFF",
	"OUTSTATION_ADMIN",
	"SOCIETY_PRESIDENT",
	"SOCIETY_SECRETARY",
	"PARISHIONER",
] as const;

export function OutstationUserAccountRequest() {
	const [isPending, startTransition] = useTransition();

	const form = useForm<RequestUserAccountInput>({
		resolver: zodResolver(requestUserAccountSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			role: "PARISH_STAFF",
			message: "",
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		reset,
		watch,
	} = form;

	const onSubmit = (data: RequestUserAccountInput) => {
		startTransition(async () => {
			const result = await createUserAccountRequest(data);
			if (result.success) {
				toast.success(result.message);
				reset();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<Card className="border border-dashed">
			<CardHeader>
				<CardTitle>Request a New User Account</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="request-first-name">
								First Name *
							</Label>
							<Input
								id="request-first-name"
								{...register("firstName")}
								disabled={isPending}
								aria-invalid={!!errors.firstName}
							/>
							{errors.firstName && (
								<p className="text-sm text-destructive">
									{errors.firstName.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="request-last-name">
								Last Name *
							</Label>
							<Input
								id="request-last-name"
								{...register("lastName")}
								disabled={isPending}
								aria-invalid={!!errors.lastName}
							/>
							{errors.lastName && (
								<p className="text-sm text-destructive">
									{errors.lastName.message}
								</p>
							)}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="request-email">Email *</Label>
							<Input
								id="request-email"
								type="email"
								{...register("email")}
								disabled={isPending}
								aria-invalid={!!errors.email}
							/>
							{errors.email && (
								<p className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="request-role">
								Requested Role *
							</Label>
							<Select
								value={watch("role")}
								onValueChange={(value) =>
									setValue(
										"role",
										value as RequestUserAccountInput["role"],
										{
											shouldValidate: true,
										},
									)
								}
								disabled={isPending}
							>
								<SelectTrigger
									id="request-role"
									aria-invalid={!!errors.role}
								>
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{REQUEST_ROLE_OPTIONS.map((role) => (
										<SelectItem key={role} value={role}>
											{roleLabels[role]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.role && (
								<p className="text-sm text-destructive">
									{errors.role.message}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="request-message">
							Message (optional)
						</Label>
						<Textarea
							id="request-message"
							{...register("message")}
							placeholder="Add context for the parish admin"
							disabled={isPending}
							rows={3}
						/>
						{errors.message && (
							<p className="text-sm text-destructive">
								{errors.message.message}
							</p>
						)}
					</div>

					<div className="flex justify-end">
						<Button type="submit" disabled={isPending}>
							{isPending ? "Submitting..." : "Submit Request"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
