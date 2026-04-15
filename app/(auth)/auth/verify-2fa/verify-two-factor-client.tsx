"use client";

import { verifyTwoFactor } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export default function VerifyTwoFactorClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [code, setCode] = useState("");

	const challengeToken = useMemo(
		() => searchParams.get("token") ?? "",
		[searchParams],
	);
	const method = useMemo(
		() => searchParams.get("method") ?? "",
		[searchParams],
	);
	const email = useMemo(
		() => searchParams.get("email") ?? "",
		[searchParams],
	);

	const isMissingContext = !challengeToken || !email;

	const handleVerify = () => {
		if (code.trim().length < 6) {
			toast.error("Enter the 6-digit code");
			return;
		}

		startTransition(async () => {
			const result = await verifyTwoFactor({
				email,
				challengeToken,
				code,
			});

			if (result.success) {
				toast.success("Verification complete");
				router.push("/dashboard");
				router.refresh();
				return;
			}

			toast.error(result.message || "Verification failed");
		});
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
							Verification Required
						</h2>
						<p className="text-muted-foreground">
							Your verification link is missing or expired. Please
							sign in again to request a new code.
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
							Verify Your Sign-in
						</h2>
						<p className="text-muted-foreground mt-2">
							{method === "EMAIL" ?
								"Enter the 6-digit code sent to your email."
							:	"Enter the 6-digit code from your authenticator app."
							}
						</p>
					</div>

					<div className="flex justify-center">
						<InputOTP
							maxLength={6}
							value={code}
							onChange={(value) => setCode(value)}
							disabled={isPending}
						>
							<InputOTPGroup>
								{Array.from({ length: 6 }).map((_, index) => (
									<InputOTPSlot key={index} index={index} />
								))}
							</InputOTPGroup>
						</InputOTP>
					</div>

					<Button
						onClick={handleVerify}
						className="w-full mt-6"
						size="lg"
						disabled={isPending}
					>
						{isPending ? "Verifying..." : "Verify"}
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
