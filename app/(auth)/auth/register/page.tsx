"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	registerSchema,
	type RegisterInput,
} from "@/lib/validators/auth.schema";
import { register, getOrganizations } from "@/app/actions/auth.actions";
import { toast } from "sonner";
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
import { Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react";

interface Organization {
	id: string;
	name: string;
	level: string;
}

export default function RegisterPage() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loadingOrgs, setLoadingOrgs] = useState(true);

	const form = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const {
		register: registerField,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		setError,
	} = form;

	const password = watch("password");

	// Password requirements check
	const passwordRequirements = [
		{ label: "At least 8 characters", met: password?.length >= 8 },
		{ label: "One uppercase letter", met: /[A-Z]/.test(password || "") },
		{ label: "One lowercase letter", met: /[a-z]/.test(password || "") },
		{ label: "One number", met: /[0-9]/.test(password || "") },
		{
			label: "One special character",
			met: /[^A-Za-z0-9]/.test(password || ""),
		},
	];

	// Fetch organizations on mount
	useEffect(() => {
		async function fetchOrganizations() {
			const result = await getOrganizations();
			if (result.success && result.data) {
				setOrganizations(result.data);
			}
			setLoadingOrgs(false);
		}
		fetchOrganizations();
	}, []);

	const [selectedOrgId, setSelectedOrgId] = useState<string>("");

	const onSubmit = (data: RegisterInput) => {
		if (!selectedOrgId) {
			toast.error("Please select a parish/organization");
			return;
		}

		startTransition(async () => {
			const result = await register({
				...data,
				organizationId: selectedOrgId,
			});

			if (result.success) {
				toast.success(result.message);
				router.push("/auth/login?registered=true");
			} else {
				toast.error(result.message);

				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							if (
								Array.isArray(messages) &&
								typeof messages[0] === "string"
							) {
								setError(field as keyof RegisterInput, {
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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pSrimary/10 via-background to-accent/20 p-4">
			<div className="w-full max-w-md">
				{/* Back to Login */}
				<Link
					href="/auth/login"
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Login
				</Link>

				{/* Logo/Branding */}
				<div className="text-center mb-6">
					<h1 className="text-4xl font-bold text-primary mb-2">
						Ecclesia
					</h1>
					<p className="text-muted-foreground">
						Digital Parish Manager
					</p>
				</div>

				{/* Register Card */}
				<div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8">
					<h2 className="text-2xl font-semibold mb-6 text-center">
						Create Account
					</h2>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						{/* Name Fields */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name *</Label>
								<Input
									id="firstName"
									{...registerField("firstName")}
									placeholder="John"
									disabled={isPending}
									aria-invalid={!!errors.firstName}
								/>
								{errors.firstName && (
									<p className="text-xs text-destructive">
										{errors.firstName.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name *</Label>
								<Input
									id="lastName"
									{...registerField("lastName")}
									placeholder="Doe"
									disabled={isPending}
									aria-invalid={!!errors.lastName}
								/>
								{errors.lastName && (
									<p className="text-xs text-destructive">
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
								{...registerField("email")}
								placeholder="john.doe@example.com"
								disabled={isPending}
								autoComplete="email"
								aria-invalid={!!errors.email}
							/>
							{errors.email && (
								<p className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>

						{/* Organization Select */}
						<div className="space-y-2">
							<Label htmlFor="organization">
								Parish/Organization *
							</Label>
							<Select
								value={selectedOrgId}
								onValueChange={setSelectedOrgId}
								disabled={isPending || loadingOrgs}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											loadingOrgs ? "Loading..." : (
												"Select your parish"
											)
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{organizations.map((org) => (
										<SelectItem key={org.id} value={org.id}>
											{org.name}
											{org.level === "OUTSTATION" && (
												<span className="text-muted-foreground ml-2">
													(Outstation)
												</span>
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Password */}
						<div className="space-y-2">
							<Label htmlFor="password">Password *</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									{...registerField("password")}
									placeholder="••••••••"
									disabled={isPending}
									autoComplete="new-password"
									aria-invalid={!!errors.password}
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									tabIndex={-1}
								>
									{showPassword ?
										<EyeOff className="h-4 w-4" />
									:	<Eye className="h-4 w-4" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-xs text-destructive">
									{errors.password.message}
								</p>
							)}

							{/* Password Requirements */}
							{password && (
								<div className="mt-2 space-y-1">
									{passwordRequirements.map((req, index) => (
										<div
											key={index}
											className="flex items-center gap-2 text-xs"
										>
											{req.met ?
												<Check className="h-3 w-3 text-green-500" />
											:	<X className="h-3 w-3 text-muted-foreground" />
											}
											<span
												className={
													req.met ? "text-green-600"
													:	"text-muted-foreground"
												}
											>
												{req.label}
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Confirm Password */}
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">
								Confirm Password *
							</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={
										showConfirmPassword ? "text" : (
											"password"
										)
									}
									{...registerField("confirmPassword")}
									placeholder="••••••••"
									disabled={isPending}
									autoComplete="new-password"
									aria-invalid={!!errors.confirmPassword}
								/>
								<button
									type="button"
									onClick={() =>
										setShowConfirmPassword(
											!showConfirmPassword,
										)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									tabIndex={-1}
								>
									{showConfirmPassword ?
										<EyeOff className="h-4 w-4" />
									:	<Eye className="h-4 w-4" />}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className="text-xs text-destructive">
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={isPending}
						>
							{isPending ?
								"Creating Account..."
							:	"Create Account"}
						</Button>
					</form>

					<div className="mt-6 text-center text-sm">
						<p className="text-muted-foreground">
							Already have an account?{" "}
							<Link
								href="/auth/login"
								className="text-primary hover:underline font-medium"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-6 text-center text-xs text-muted-foreground">
					<p>© 2026 Ecclesia DPM. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
