"use client";

import { getOrganizations, register } from "@/app/actions/auth.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
	registerSchema,
	type RegisterInput,
} from "@/lib/validators/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface Organization {
	id: string;
	name: string;
	level: string;
}

export default function RegisterPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
			<RegisterPageContent />
		</Suspense>
	);
}

function RegisterPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const preselectedOrgId = searchParams.get("organizationId") || "";
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loadingOrgs, setLoadingOrgs] = useState(true);
	const [displayPictureUrl, setDisplayPictureUrl] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const displayPictureRef = useRef<HTMLInputElement>(null);

	const form = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			dateOfBirth: "",
			address: "",
			password: "",
			confirmPassword: "",
		},
	});

	const {
		register: registerField,
		handleSubmit,
		formState: { errors },
		setError,
	} = form;

	const password = useWatch({
		control: form.control,
		name: "password",
	});

	const firstName = useWatch({
		control: form.control,
		name: "firstName",
	});

	const lastName = useWatch({
		control: form.control,
		name: "lastName",
	});

	const initials = `${firstName || ""} ${lastName || ""}`
		.trim()
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

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

	const [selectedOrgId, setSelectedOrgId] = useState<string>(preselectedOrgId);

	const onSubmit = (data: RegisterInput) => {
		if (!selectedOrgId) {
			toast.error("Please select a parish/organization");
			return;
		}

		startTransition(async () => {
			const result = await register({
				...data,
				displayPicture: displayPictureUrl || undefined,
				organizationId: selectedOrgId,
			});

			if (result.success) {
				toast.success(result.message);
				const callbackUrl = searchParams.get("callbackUrl");
				router.push(
					callbackUrl
						? `/auth/login?registered=true&callbackUrl=${encodeURIComponent(
								callbackUrl,
						  )}`
						: "/auth/login?registered=true",
				);
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
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4">
			<div className="w-full max-w-lg mt-[100px]">
				{/* Register Card */}
				<div className="bg-background/80  backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8">
					<h2 className="text-2xl font-semibold mb-6 text-center">
						Create Account
					</h2>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
						autoComplete="off"
					>
						<div className="space-y-2">
							<Label htmlFor="displayPicture">
								Display Picture (optional)
							</Label>
							<div className="flex items-center gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage
										src={displayPictureUrl || undefined}
									/>
									<AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
										{initials || "DP"}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<Input
										id="displayPicture"
										type="file"
										accept="image/*"
										disabled={isPending || isUploading}
										ref={displayPictureRef}
										onChange={async (event) => {
											const file =
												event.target.files?.[0];
											if (!file) return;
											if (
												!file.type.startsWith("image/")
											) {
												toast.error(
													"Please select an image file",
												);
												return;
											}
											if (file.size > 5 * 1024 * 1024) {
												toast.error(
													"Image size must be less than 5MB",
												);
												return;
											}

											setIsUploading(true);
											try {
												const formData = new FormData();
												formData.append("file", file);
												formData.append(
													"folderPrefix",
													"user-avatars",
												);

												const response = await fetch(
													"/api/public-upload",
													{
														method: "POST",
														body: formData,
													},
												);

												const result =
													await response.json();
												if (!result.success) {
													toast.error(
														result.message ||
															"Upload failed",
													);
													return;
												}

												setDisplayPictureUrl(
													result.url,
												);
												toast.success(
													"Display picture uploaded",
												);
											} catch {
												toast.error(
													"Failed to upload image",
												);
											} finally {
												setIsUploading(false);
											}
										}}
									/>
									<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
										<Upload className="h-3 w-3" />
										<span>Upload JPG or PNG (max 5MB)</span>
										{displayPictureUrl && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 px-2 text-xs"
												onClick={() => {
													setDisplayPictureUrl("");
													if (
														displayPictureRef.current
													) {
														displayPictureRef.current.value =
															"";
													}
												}}
											>
												Remove
											</Button>
										)}
									</div>
								</div>
							</div>
						</div>
						{/* Name Fields */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name *</Label>
								<Input
									id="firstName"
									{...registerField("firstName")}
									placeholder="John"
									disabled={isPending}
									autoComplete="given-name"
									aria-invalid={!!errors.firstName}
									className="placeholder:text-muted-foreground/30"
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
									autoComplete="family-name"
									aria-invalid={!!errors.lastName}
									className="placeholder:text-muted-foreground/30"
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
								className="placeholder:text-muted-foreground/30"
							/>
							{errors.email && (
								<p className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number *</Label>
								<Input
									id="phone"
									type="tel"
									{...registerField("phone")}
									placeholder="08012345678"
									disabled={isPending}
									autoComplete="tel"
									aria-invalid={!!errors.phone}
									className="placeholder:text-muted-foreground/30"
								/>
								{errors.phone && (
									<p className="text-xs text-destructive">
										{errors.phone.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="dateOfBirth">
									Date of Birth *
								</Label>
								<Input
									id="dateOfBirth"
									type="date"
									{...registerField("dateOfBirth")}
									disabled={isPending}
									autoComplete="bday"
									max={new Date().toISOString().split("T")[0]}
									aria-invalid={!!errors.dateOfBirth}
									className="placeholder:text-muted-foreground/30"
								/>
								{errors.dateOfBirth && (
									<p className="text-xs text-destructive">
										{errors.dateOfBirth.message}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Resident Address</Label>
							<Input
								id="address"
								{...registerField("address")}
								placeholder="Enter your resident address"
								disabled={isPending}
								autoComplete="address-line1"
								aria-invalid={!!errors.address}
								className="placeholder:text-muted-foreground/30"
							/>
							{errors.address && (
								<p className="text-xs text-destructive">
									{errors.address.message}
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
									className="placeholder:text-muted-foreground/30"
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
									className="placeholder:text-muted-foreground/30"
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
