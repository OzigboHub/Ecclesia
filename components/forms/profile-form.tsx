"use client";

import {
	removeProfilePicture,
	saveProfilePictureUrl,
	updateProfile,
} from "@/app/actions/profile.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/utils";
import {
	updateProfileSchema,
	type UpdateProfileInput,
} from "@/lib/validators/user.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User as PrismaUser } from "@prisma/client";
import { Bell, Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SafeUser = Omit<PrismaUser, "password">;

interface ProfileFormProps {
	user: SafeUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
	const [isPending, startTransition] = useTransition();
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [displayPicture, setDisplayPicture] = useState<string | null>(
		user.displayPicture,
	);
	const [pushSupported, setPushSupported] = useState(false);
	const [pushEnabled, setPushEnabled] = useState(false);
	const [pushBusy, setPushBusy] = useState(false);
	const [pushPermission, setPushPermission] = useState<
		NotificationPermission | "unsupported"
	>("unsupported");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const fullName = `${user.firstName} ${user.lastName}`;

	const form = useForm<UpdateProfileInput>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone || "",
			address: user.address || "",
			dateOfBirth:
				user.dateOfBirth ?
					new Date(user.dateOfBirth).toISOString().split("T")[0]
				:	"",
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty },
		setError,
	} = form;

	const onSubmit = (data: UpdateProfileInput) => {
		startTransition(async () => {
			const result = await updateProfile(data);

			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof UpdateProfileInput, {
								message: messages[0],
							});
						},
					);
				}
			}
		});
	};

	const urlBase64ToUint8Array = (value: string) => {
		const padding = "=".repeat((4 - (value.length % 4)) % 4);
		const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; i += 1) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	};

	useEffect(() => {
		if (typeof window === "undefined") return;

		const supported =
			"serviceWorker" in navigator &&
			"PushManager" in window &&
			"Notification" in window;

		setPushSupported(supported);
		if (!supported) {
			setPushPermission("unsupported");
			return;
		}

		setPushPermission(Notification.permission);

		navigator.serviceWorker.ready
			.then((registration) => registration.pushManager.getSubscription())
			.then((subscription) => setPushEnabled(Boolean(subscription)))
			.catch(() => {
				setPushEnabled(false);
			});
	}, []);

	const subscribeToPush = async () => {
		const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		if (!publicKey) {
			throw new Error(
				"Push is not configured. Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.",
			);
		}

		let permission = Notification.permission;
		if (permission === "default") {
			permission = await Notification.requestPermission();
			setPushPermission(permission);
		}
		if (permission !== "granted") {
			throw new Error(
				"Notification permission not granted. Enable it in browser settings.",
			);
		}

		const registration =
			(await navigator.serviceWorker.getRegistration()) ||
			(await navigator.serviceWorker.register("/sw.js"));

		let subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			});
		}

		const response = await fetch("/api/push-subscriptions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(subscription.toJSON()),
		});

		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			throw new Error(payload.message || "Failed to save subscription");
		}
	};

	const unsubscribeFromPush = async () => {
		const registration =
			(await navigator.serviceWorker.getRegistration()) ||
			(await navigator.serviceWorker.register("/sw.js"));
		const subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			await fetch("/api/push-subscriptions", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			});
			return;
		}

		const response = await fetch("/api/push-subscriptions", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ endpoint: subscription.endpoint }),
		});

		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			throw new Error(payload.message || "Failed to remove subscription");
		}

		await subscription.unsubscribe();
	};

	const handleTogglePush = async () => {
		if (!pushSupported) {
			toast.error("Push notifications are not supported on this device.");
			return;
		}

		setPushBusy(true);
		try {
			if (pushEnabled) {
				await unsubscribeFromPush();
				setPushEnabled(false);
				toast.success("Push notifications disabled");
			} else {
				await subscribeToPush();
				setPushEnabled(true);
				toast.success("Push notifications enabled");
			}
		} catch (error) {
			console.error("Push notification error:", error);
			const message =
				error instanceof Error ?
					error.message
				:	"Unable to update push notifications";
			toast.error(message);
		} finally {
			setPushBusy(false);
		}
	};

	const handleImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploadingImage(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folderPrefix", "profile-pictures");

			const response = await fetch("/api/public-upload", {
				method: "POST",
				body: formData,
			});

			const uploadResult = await response.json();
			if (!uploadResult.success) {
				toast.error(uploadResult.message || "Upload failed");
				return;
			}

			const result = await saveProfilePictureUrl(uploadResult.url);
			if (result.success && result.data) {
				setDisplayPicture(result.data.displayPicture);
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error("Failed to upload image");
		} finally {
			setIsUploadingImage(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleRemoveImage = async () => {
		setIsUploadingImage(true);
		try {
			const result = await removeProfilePicture();
			if (result.success) {
				setDisplayPicture(null);
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error("Failed to remove image");
		} finally {
			setIsUploadingImage(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Profile Picture Section */}
			<Card>
				<CardHeader>
					<CardTitle>Profile Picture</CardTitle>
					<CardDescription>
						Upload a photo to personalize your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row items-center gap-6">
						<div className="relative">
							<Avatar className="h-24 w-24">
								<AvatarImage
									src={displayPicture || undefined}
									alt={fullName}
								/>
								<AvatarFallback className="bg-primary text-secondary text-2xl font-bold">
									{getInitials(fullName)}
								</AvatarFallback>
							</Avatar>
							{isUploadingImage && (
								<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
									<Loader2 className="h-6 w-6 animate-spin text-white" />
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isUploadingImage}
									onClick={() =>
										fileInputRef.current?.click()
									}
								>
									<Camera className="mr-2 h-4 w-4" />
									{displayPicture ?
										"Change Photo"
									:	"Upload Photo"}
								</Button>
								{displayPicture && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={isUploadingImage}
										onClick={handleRemoveImage}
										className="text-destructive hover:text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Remove
									</Button>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								JPEG, PNG, WebP, or GIF. Max 5MB.
							</p>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp,image/gif"
								className="hidden"
								onChange={handleImageUpload}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Profile Details Section */}
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>
						Update your personal details
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									{...register("firstName")}
									placeholder="Enter first name"
								/>
								{errors.firstName && (
									<p className="text-sm text-destructive">
										{errors.firstName.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									{...register("lastName")}
									placeholder="Enter last name"
								/>
								{errors.lastName && (
									<p className="text-sm text-destructive">
										{errors.lastName.message}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={user.email}
								disabled
								className="opacity-60"
							/>
							<p className="text-xs text-muted-foreground">
								Contact an administrator to change your email
								address.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									type="tel"
									{...register("phone")}
									placeholder="Enter phone number"
								/>
								{errors.phone && (
									<p className="text-sm text-destructive">
										{errors.phone.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="dateOfBirth">
									Date of Birth
								</Label>
								<Input
									id="dateOfBirth"
									type="date"
									{...register("dateOfBirth")}
								/>
								{errors.dateOfBirth && (
									<p className="text-sm text-destructive">
										{errors.dateOfBirth.message}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							<Textarea
								id="address"
								{...register("address")}
								placeholder="Enter your address"
								rows={3}
							/>
							{errors.address && (
								<p className="text-sm text-destructive">
									{errors.address.message}
								</p>
							)}
						</div>

						<Separator />

						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={isPending || !isDirty}
							>
								{isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save Changes
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Notifications */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-4 w-4" />
						Notifications
					</CardTitle>
					<CardDescription>
						Get notified when new announcements are published
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-medium">
								Push notifications
							</p>
							<p className="text-xs text-muted-foreground">
								Receive instant alerts on this device.
							</p>
						</div>
						<Switch
							checked={pushEnabled}
							onCheckedChange={handleTogglePush}
							disabled={!pushSupported || pushBusy}
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						Email announcements are sent to {user.email}.
					</p>
					{pushPermission === "denied" && (
						<p className="text-xs text-destructive">
							Push notifications are blocked in your browser
							settings.
						</p>
					)}
					{!pushSupported && (
						<p className="text-xs text-muted-foreground">
							Push notifications are unavailable on this device.
						</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>
						These details are managed by your administrator
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Role
							</p>
							<p className="text-sm">
								{user.role.replaceAll("_", " ")}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Member Since
							</p>
							<p className="text-sm">
								{new Date(user.createdAt).toLocaleDateString(
									"en-US",
									{
										year: "numeric",
										month: "long",
										day: "numeric",
									},
								)}
							</p>
						</div>
						{user.lastLogin && (
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									Last Login
								</p>
								<p className="text-sm">
									{new Date(
										user.lastLogin,
									).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
