"use client";

import { verifyGateCode } from "@/app/actions/parish-gate.actions";
import { ACCESS_CODE_LENGTH } from "@/lib/access-code";
import { crestInitials } from "@/lib/feed/types";
import { cn } from "@/lib/utils";
import { OTPInput } from "input-otp";
import { Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The parish gate.
 *
 * A door with a doorkeeper, not a paywall. Nothing here says "denied" or
 * "restricted" — the parish has simply asked that you get the code from them
 * first, and the fastest route to that is on screen.
 */
export function GateScreen({
	organizationId,
	organizationName,
	contactPhone,
}: {
	organizationId: string;
	organizationName: string;
	contactPhone: string | null;
}) {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [remaining, setRemaining] = useState<number | null>(null);

	async function submit(value: string) {
		if (busy) return;
		setBusy(true);
		setError(null);

		const result = await verifyGateCode(organizationId, value.toUpperCase());
		setBusy(false);

		if (result.success) {
			router.refresh();
			return;
		}

		setCode("");
		setError(result.message);
		setRemaining(result.data?.remaining ?? null);
	}

	const lockedOut = remaining === 0;

	return (
		<div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-12 pt-24">
			<div className="flex flex-col items-center text-center">
				<span
					aria-hidden
					className="flex size-16 items-center justify-center rounded-2xl bg-surface-2 text-title font-semibold text-gold"
				>
					{crestInitials(organizationName)}
				</span>
				<h1 className="mt-4 text-headline font-semibold text-fg">
					{organizationName}
				</h1>
				<p className="mt-2 max-w-[36ch] text-body text-pretty text-fg-muted">
					This parish keeps its timeline for its own community. Enter the
					parish code once and this phone will remember it.
				</p>
			</div>

			<div className="mt-7">
				<OTPInput
					value={code}
					onChange={(next) => {
						setCode(next.toUpperCase());
						setError(null);
					}}
					onComplete={(next) => submit(next)}
					maxLength={ACCESS_CODE_LENGTH}
					disabled={busy || lockedOut}
					autoFocus
					inputMode="text"
					pattern="[A-Za-z0-9]*"
					aria-label="Parish code"
					containerClassName="flex items-center gap-[7px]"
					render={({ slots }) => (
						<>
							{slots.map((slot, index) => (
								<div
									key={index}
									className={cn(
										"flex h-[54px] flex-1 items-center justify-center rounded-[10px] border bg-surface-1 font-plex-mono text-headline text-fg transition-colors",
										error ? "border-critical/60"
										: slot.isActive ? "border-[1.5px] border-gold"
										: slot.char ? "border-fg-dim/60"
										: "border-hairline",
									)}
								>
									{slot.char}
									{slot.hasFakeCaret && (
										<span className="h-5.5 w-0.5 animate-pulse bg-gold" />
									)}
								</div>
							))}
						</>
					)}
				/>
			</div>

			{error && (
				<p role="alert" className="mt-3 text-center text-body-sm text-critical">
					{error}
					{remaining !== null && remaining > 0 && (
						<span className="text-fg-muted">
							{" "}
							{remaining} {remaining === 1 ? "try" : "tries"} left.
						</span>
					)}
				</p>
			)}

			<button
				type="button"
				onClick={() => submit(code)}
				disabled={code.length !== ACCESS_CODE_LENGTH || busy || lockedOut}
				className={cn(
					"mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-title-sm font-semibold transition-colors",
					code.length === ACCESS_CODE_LENGTH && !busy && !lockedOut ?
						"bg-gold text-on-gold hover:brightness-105"
					:	"bg-surface-3 text-fg-dim",
				)}
			>
				{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
				Continue
			</button>

			<div className="mt-6 rounded-xl border border-hairline bg-surface-1 p-4 text-center">
				<p className="text-body-sm text-fg-body">
					Don&rsquo;t have the code? Ask at the parish office — anyone in
					the parish can give it to you.
				</p>
				{contactPhone && (
					<a
						href={`tel:${contactPhone}`}
						className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-hairline text-body font-medium text-fg"
					>
						<Phone className="size-4" aria-hidden />
						Call {organizationName}
					</a>
				)}
			</div>
		</div>
	);
}
