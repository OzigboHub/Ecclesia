"use client";

import {
	confirmTwoFactorSetup,
	disableTwoFactor,
	getTwoFactorStatus,
	startTwoFactorSetup,
} from "@/app/actions/auth.actions";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useRole } from "@/hooks/use-role";
import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export default function TwoFactorSettingsPage() {
	const router = useRouter();
	const { hasRole, isLoading } = useRole();
	const [isPending, startTransition] = useTransition();
	const [enabled, setEnabled] = useState(false);
	const [method, setMethod] = useState("EMAIL");
	const [code, setCode] = useState("");
	const [challengeToken, setChallengeToken] = useState<string | null>(null);
	const [totpSecret, setTotpSecret] = useState<string | null>(null);
	const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
	const [isSetupReady, setIsSetupReady] = useState(false);

	useEffect(() => {
		if (isLoading) return;
		if (!hasRole(["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"])) {
			router.replace("/dashboard");
		}
	}, [hasRole, isLoading, router]);

	useEffect(() => {
		if (isLoading) return;
		startTransition(async () => {
			const result = await getTwoFactorStatus();
			if (result.success && result.data) {
				setEnabled(result.data.enabled);
				setMethod(result.data.method ?? "EMAIL");
			}
		});
	}, [isLoading]);

	const handleToggle = () => {
		if (enabled) {
			startTransition(async () => {
				const result = await disableTwoFactor();
				if (result.success) {
					toast.success("Two-factor disabled");
					setEnabled(false);
					setCode("");
					setChallengeToken(null);
					setTotpSecret(null);
					setOtpauthUrl(null);
					setIsSetupReady(false);
					return;
				}
				toast.error(result.message || "Failed to disable two-factor");
			});
			return;
		}

		startTransition(async () => {
			const result = await startTwoFactorSetup({
				method: method === "TOTP" ? "TOTP" : "EMAIL",
			});
			if (result.success) {
				setChallengeToken(result.data?.challengeToken ?? null);
				setTotpSecret(result.data?.secret ?? null);
				setOtpauthUrl(result.data?.otpauthUrl ?? null);
				setIsSetupReady(true);
				toast.success("Verification started");
				return;
			}
			toast.error(result.message || "Failed to start setup");
		});
	};

	const handleConfirm = () => {
		startTransition(async () => {
			const result = await confirmTwoFactorSetup({
				method: method === "TOTP" ? "TOTP" : "EMAIL",
				code,
				challengeToken: challengeToken ?? undefined,
			});
			if (result.success) {
				toast.success("Two-factor enabled");
				setEnabled(true);
				setIsSetupReady(false);
				setCode("");
				return;
			}
			toast.error(result.message || "Failed to confirm setup");
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<ShieldCheck className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold">
						Two-Factor Authentication
					</h1>
					<p className="text-muted-foreground">
						Add a second step to protect admin and secretary
						accounts.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Protection Status</CardTitle>
					<CardDescription>
						Enable two-factor authentication for this account.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							{enabled ? "Enabled" : "Disabled"}
						</p>
						<p className="text-xs text-muted-foreground">
							Single-device login and 1-minute idle timeout apply.
						</p>
					</div>
					<Switch
						checked={enabled}
						onCheckedChange={handleToggle}
						disabled={isPending}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Verification Method</CardTitle>
					<CardDescription>
						Choose how you want to receive verification codes.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<RadioGroup
						value={method}
						onValueChange={setMethod}
						className="gap-3"
						disabled={enabled}
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

					{method === "TOTP" && otpauthUrl && totpSecret && (
						<div className="rounded-lg border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
							<p className="font-medium text-foreground mb-1">
								Authenticator setup
							</p>
							<p>
								Add this secret in your authenticator app if you
								cannot scan a QR code.
							</p>
							<p className="mt-2 font-mono text-foreground break-all">
								{totpSecret}
							</p>
							<p className="mt-2 break-all">{otpauthUrl}</p>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="verification-code">Confirm Code</Label>
						<Input
							id="verification-code"
							value={code}
							onChange={(event) => setCode(event.target.value)}
							placeholder="Enter verification code"
							disabled={!isSetupReady}
						/>
					</div>

					<Button
						className="w-full"
						onClick={handleConfirm}
						disabled={!isSetupReady || isPending}
					>
						<Lock className="mr-2 h-4 w-4" />
						Confirm & Enable
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
