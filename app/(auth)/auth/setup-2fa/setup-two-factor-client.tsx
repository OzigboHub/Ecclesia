"use client";

import {
	confirmTwoFactorEnrollment,
	startTwoFactorEnrollment,
} from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export default function SetupTwoFactorClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [method, setMethod] = useState<"EMAIL" | "TOTP">("EMAIL");
	const [code, setCode] = useState("");
	const [challengeToken, setChallengeToken] = useState<string | null>(null);
	const [totpSecret, setTotpSecret] = useState<string | null>(null);
	const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
	const [hasStarted, setHasStarted] = useState(false);

	const setupToken = useMemo(
		() => searchParams.get("token") ?? "",
		[searchParams],
	);
	const email = useMemo(
		() => searchParams.get("email") ?? "",
		[searchParams],
	);

	const isMissingContext = !setupToken || !email;

	const handleStart = () => {
		startTransition(async () => {
			const result = await startTwoFactorEnrollment({
				setupToken,
				method,
			});

			if (!result.success || !result.data) {
				toast.error(result.message || "Failed to start setup");
				return;
			}

			setChallengeToken(result.data.challengeToken);
			setTotpSecret(result.data.secret ?? null);
			setOtpauthUrl(result.data.otpauthUrl ?? null);
			setHasStarted(true);
			toast.success("Enter your verification code to continue");
		});
	};

	const handleConfirm = () => {
		if (!challengeToken) {
			toast.error("Start setup before confirming");
			return;
		}
		if (code.trim().length < 6) {
			toast.error("Enter the 6-digit code");
			return;
		}

		startTransition(async () => {
			const result = await confirmTwoFactorEnrollment({
				setupToken,
				challengeToken,
				method,
				code,
			});

			if (result.success) {
				toast.success("Two-factor enabled");
				router.push("/dashboard");
				router.refresh();
				return;
			}

			toast.error(result.message || "Failed to confirm setup");
		});
	};

	const handleCopySecret = async () => {
		if (!totpSecret) {
			return;
		}
		if (!navigator?.clipboard?.writeText) {
			toast.error("Copy is not available on this device");
			return;
		}

		try {
			await navigator.clipboard.writeText(totpSecret);
			toast.success("Secret copied to clipboard");
		} catch {
			toast.error("Failed to copy secret");
		}
	};

	if (isMissingContext) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
				<div className="w-full max-w-md">
					<div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8 text-center space-y-4">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<ShieldCheck className="h-6 w-6 text-primary" />
						</div>
						<h2 className="text-2xl font-semibold">
							Set up two-factor authentication
						</h2>
						<p className="text-muted-foreground">
							Your setup link is missing or expired. Please sign
							in again to continue.
						</p>
						<Button asChild className="w-full">
							<Link href="/auth/login">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Login
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
			<div className="w-full max-w-md">
				<div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8">
					<div className="text-center mb-6">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<ShieldCheck className="h-6 w-6 text-primary" />
						</div>
						<h2 className="text-2xl font-semibold">
							Set up two-factor authentication
						</h2>
						<p className="text-muted-foreground mt-2">
							Choose how you want to verify your sign-in.
						</p>
					</div>

					<RadioGroup
						value={method}
						onValueChange={(value) =>
							setMethod(value as "EMAIL" | "TOTP")
						}
						className="gap-3"
						disabled={hasStarted}
					>
						<label className="flex items-center gap-3 rounded-lg border p-3">
							<RadioGroupItem value="EMAIL" />
							<div>
								<p className="text-sm font-medium">
									Email Code
								</p>
								<p className="text-xs text-muted-foreground">
									Receive a 6-digit code in your inbox.
								</p>
							</div>
						</label>
						<label className="flex items-center gap-3 rounded-lg border p-3">
							<RadioGroupItem value="TOTP" />
							<div>
								<p className="text-sm font-medium">
									Authenticator App
								</p>
								<p className="text-xs text-muted-foreground">
									Use Google Authenticator, Authy, or similar.
								</p>
							</div>
						</label>
					</RadioGroup>

					<Button
						className="w-full mt-4"
						onClick={handleStart}
						disabled={isPending || hasStarted}
					>
						{isPending ? "Starting..." : "Start setup"}
					</Button>

					{method === "TOTP" && otpauthUrl && totpSecret && (
						<div className="mt-4 rounded-lg border border-dashed border-muted-foreground/40 p-4 text-xs text-muted-foreground space-y-3">
							<p className="font-medium text-foreground">
								Authenticator setup
							</p>
							<div className="flex justify-center">
								<QRCodeCanvas
									value={otpauthUrl}
									size={160}
									includeMargin
									className="bg-background p-2 rounded-md"
								/>
							</div>
							<p>
								Add this secret in your authenticator app if you
								cannot scan the QR code.
							</p>
							<div className="flex items-center justify-between gap-2 rounded-md bg-background/60 p-2">
								<p className="font-mono text-foreground break-all">
									{totpSecret}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCopySecret}
								>
									Copy
								</Button>
							</div>
							<p className="break-all">{otpauthUrl}</p>
						</div>
					)}

					<div className="mt-6 space-y-2">
						<Label htmlFor="verification-code">
							Verification code
						</Label>
						<div className="flex justify-center">
							<InputOTP
								maxLength={6}
								value={code}
								onChange={(value) => setCode(value)}
								disabled={!hasStarted || isPending}
							>
								<InputOTPGroup>
									{Array.from({ length: 6 }).map(
										(_, index) => (
											<InputOTPSlot
												key={index}
												index={index}
											/>
										),
									)}
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>

					<Button
						className="w-full mt-6"
						onClick={handleConfirm}
						disabled={!hasStarted || isPending}
						size="lg"
					>
						{isPending ? "Confirming..." : "Confirm & continue"}
					</Button>

					<div className="mt-6 text-center text-sm">
						<Link
							href="/auth/login"
							className="text-muted-foreground hover:text-foreground"
						>
							Use a different account
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
