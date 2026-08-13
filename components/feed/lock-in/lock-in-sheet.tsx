"use client";

import { verifyTwoFactor } from "@/app/actions/auth.actions";
import { memberPasswordSignIn } from "@/app/actions/member-security.actions";
import {
	lookupParishionerByPhone,
	redeemAccessCode,
	type ParishionerPreview,
} from "@/app/actions/parish-code.actions";
import { ACCESS_CODE_LENGTH } from "@/lib/access-code";
import { normaliseNgPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { OTPInput } from "input-otp";
import { Check, Loader2, Lock, Phone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

type Step = "phone" | "confirm" | "code" | "password" | "twoFactor" | "done";

type Failure =
	| { kind: "not-found" }
	| { kind: "message"; text: string }
	| null;

const STEP_INDEX: Record<Step, number> = {
	phone: 0,
	confirm: 1,
	code: 2,
	// The password route replaces the code step rather than extending the rail —
	// it is the same journey through a different door, not a longer one.
	password: 2,
	twoFactor: 2,
	done: 3,
};

export function LockInSheet({
	open,
	onOpenChange,
	organizationId,
	organizationName,
	pendingLabel,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationName: string;
	pendingLabel: string | null;
	onSuccess: () => void;
}) {
	const router = useRouter();
	const [step, setStep] = useState<Step>("phone");
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [match, setMatch] = useState<ParishionerPreview | null>(null);
	const [failure, setFailure] = useState<Failure>(null);
	const [busy, setBusy] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [twoFactor, setTwoFactor] = useState<{
		challengeToken: string;
		method: string;
	} | null>(null);
	const [twoFactorCode, setTwoFactorCode] = useState("");
	const phoneRef = useRef<HTMLInputElement>(null);

	// Reset on close so reopening never resumes somebody else's half-finished
	// attempt on a shared handset.
	useEffect(() => {
		if (open) return;
		const timer = setTimeout(() => {
			setStep("phone");
			setPhone("");
			setCode("");
			setMatch(null);
			setFailure(null);
			setHelpOpen(false);
			setEmail("");
			setPassword("");
			setTwoFactor(null);
			setTwoFactorCode("");
		}, 250);
		return () => clearTimeout(timer);
	}, [open]);

	const phoneValid = normaliseNgPhone(phone).ok;

	async function submitPhone() {
		if (!phoneValid || busy) return;
		setBusy(true);
		setFailure(null);

		const result = await lookupParishionerByPhone(organizationId, phone);
		setBusy(false);

		if (!result.success) {
			setFailure({ kind: "message", text: result.message });
			return;
		}
		if (!result.data) {
			setFailure({ kind: "not-found" });
			return;
		}

		setMatch(result.data);
		setStep("confirm");
	}

	async function submitCode(value: string) {
		if (!match || busy) return;
		setBusy(true);
		setFailure(null);

		const result = await redeemAccessCode({
			organizationId,
			parishionerId: match.parishionerId,
			phone,
			code: value,
		});
		setBusy(false);

		if (!result.success) {
			setCode("");
			setFailure({ kind: "message", text: result.message });
			return;
		}

		setStep("done");
		// Pull the new session into every server component on the page.
		router.refresh();
	}

	async function submitPassword() {
		if (busy) return;
		setBusy(true);
		setFailure(null);

		const result = await memberPasswordSignIn({ email, password });
		setBusy(false);

		if (!result.success || !result.data) {
			setPassword("");
			setFailure({ kind: "message", text: result.message });
			return;
		}

		if (result.data.outcome === "two-factor") {
			setTwoFactor({
				challengeToken: result.data.challengeToken,
				method: result.data.method,
			});
			setStep("twoFactor");
			return;
		}

		setStep("done");
		router.refresh();
	}

	async function submitTwoFactor(value: string) {
		if (!twoFactor || busy) return;
		setBusy(true);
		setFailure(null);

		const result = await verifyTwoFactor({
			email,
			challengeToken: twoFactor.challengeToken,
			code: value,
		});
		setBusy(false);

		if (!result.success) {
			setTwoFactorCode("");
			setFailure({ kind: "message", text: result.message });
			return;
		}

		setStep("done");
		router.refresh();
	}

	function finish() {
		onOpenChange(false);
		onSuccess();
	}

	return (
		<Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-50 bg-scrim" />
				<Drawer.Content
					className={cn(
						"fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] border-t border-hairline bg-surface-2 px-5 pt-2 outline-none",
						"pb-[calc(22px+env(safe-area-inset-bottom))]",
						// On a wide screen the same content reads as a centred
						// dialog rather than a sheet pinned to the bottom edge.
						"lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[440px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-card lg:border lg:pb-6",
					)}
				>
					<Drawer.Title className="sr-only">
						Confirm it&rsquo;s you
					</Drawer.Title>

					<div
						aria-hidden
						className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-fg-dim/50 lg:hidden"
					/>

					<ProgressRail index={STEP_INDEX[step]} />

					{step === "phone" && (
						<PhoneStep
							inputRef={phoneRef}
							value={phone}
							onChange={(next) => {
								setPhone(next);
								setFailure(null);
							}}
							onSubmit={submitPhone}
							valid={phoneValid}
							busy={busy}
							organizationName={organizationName}
							failure={failure}
						/>
					)}

					{step === "confirm" && match && (
						<ConfirmStep
							match={match}
							onYes={() =>
								// Somebody who closed the code door gets sent
								// straight to the password step. Asking them for
								// a code and then rejecting it would be a lie.
								setStep(match.allowsCodeSignIn ? "code" : "password")
							}
							onNo={() => {
								setMatch(null);
								setPhone("");
								setStep("phone");
							}}
						/>
					)}

					{step === "code" && match && (
						<CodeStep
							match={match}
							value={code}
							onChange={(next) => {
								setCode(next);
								setFailure(null);
							}}
							onComplete={submitCode}
							busy={busy}
							failure={failure}
							helpOpen={helpOpen}
							onToggleHelp={() => setHelpOpen((v) => !v)}
							onUsePassword={() => {
								setCode("");
								setFailure(null);
								setStep("password");
							}}
						/>
					)}

					{step === "password" && (
						<PasswordStep
							match={match}
							email={email}
							password={password}
							onEmailChange={(next) => {
								setEmail(next);
								setFailure(null);
							}}
							onPasswordChange={(next) => {
								setPassword(next);
								setFailure(null);
							}}
							onSubmit={submitPassword}
							onUseCode={
								match?.allowsCodeSignIn ?
									() => {
										setFailure(null);
										setStep("code");
									}
								:	undefined
							}
							busy={busy}
							failure={failure}
						/>
					)}

					{step === "twoFactor" && twoFactor && (
						<TwoFactorStep
							method={twoFactor.method}
							value={twoFactorCode}
							onChange={(next) => {
								setTwoFactorCode(next);
								setFailure(null);
							}}
							onSubmit={submitTwoFactor}
							busy={busy}
							failure={failure}
						/>
					)}

					{step === "done" && (
						<DoneStep
							name={match?.displayName ?? "friend"}
							organizationName={organizationName}
							pendingLabel={pendingLabel}
							onContinue={finish}
						/>
					)}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

function ProgressRail({ index }: { index: number }) {
	return (
		<div className="mb-3.5 flex items-center gap-1.5" aria-hidden>
			{[0, 1, 2, 3].map((i) => (
				<span
					key={i}
					className={cn(
						"h-[3px] flex-1 rounded-full transition-colors",
						i <= index ? "bg-gold" : "bg-surface-3",
					)}
				/>
			))}
		</div>
	);
}

function SheetHeading({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<>
			<h2 className="text-headline font-semibold tracking-[-0.01em] text-fg">
				{title}
			</h2>
			<p className="mt-1.5 text-body-sm text-pretty text-fg-muted">
				{description}
			</p>
		</>
	);
}

function PrimaryButton({
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			{...props}
			className={cn(
				"flex h-12 w-full items-center justify-center gap-2 rounded-xl text-title-sm font-semibold transition-colors",
				props.disabled ?
					"bg-surface-3 text-fg-dim"
				:	"bg-gold text-on-gold hover:brightness-105",
				props.className,
			)}
		>
			{children}
		</button>
	);
}

function FailureNote({ failure }: { failure: Failure }) {
	if (!failure || failure.kind === "not-found") return null;
	return (
		<p
			role="alert"
			className="mt-3 text-body-sm text-critical"
		>
			{failure.text}
		</p>
	);
}

// --- Step 1 ----------------------------------------------------------------

function PhoneStep({
	inputRef,
	value,
	onChange,
	onSubmit,
	valid,
	busy,
	organizationName,
	failure,
}: {
	inputRef: React.RefObject<HTMLInputElement | null>;
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	valid: boolean;
	busy: boolean;
	organizationName: string;
	failure: Failure;
}) {
	if (failure?.kind === "not-found") {
		return (
			<NotFoundStep
				organizationName={organizationName}
				onRetry={() => onChange("")}
			/>
		);
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
		>
			<SheetHeading
				title="What's your phone number?"
				description={`We'll look for you in ${organizationName}'s parish register. Nothing is posted to anyone.`}
			/>

			<div className="mt-4 flex h-14 items-center gap-2.5 rounded-xl border-[1.5px] border-gold bg-surface-0 px-3.5 focus-within:ring-2 focus-within:ring-gold/40">
				<span className="text-title-sm tabular-nums text-fg-muted">
					🇳🇬 +234
				</span>
				<span className="h-5.5 w-px bg-hairline" aria-hidden />
				<input
					ref={inputRef}
					// The OS keypad, not a hand-drawn one. inputMode gets the
					// numeric pad on every phone that matters, and autoComplete
					// lets the handset offer its own number.
					inputMode="numeric"
					autoComplete="tel-national"
					enterKeyHint="go"
					placeholder="803 411 2233"
					aria-label="Phone number"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="min-w-0 flex-1 bg-transparent text-headline font-medium tabular-nums tracking-[0.02em] text-fg outline-none placeholder:text-fg-dim placeholder:font-normal"
				/>
			</div>

			<p className="mt-2 text-meta text-fg-dim">
				0803… or +234803… — both work.
			</p>

			<FailureNote failure={failure} />

			<div className="mt-3.5">
				<PrimaryButton type="submit" disabled={!valid || busy}>
					{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
					Continue
				</PrimaryButton>
			</div>
		</form>
	);
}

function NotFoundStep({
	organizationName,
	onRetry,
}: {
	organizationName: string;
	onRetry: () => void;
}) {
	return (
		<div>
			<SheetHeading
				title="We couldn't find that number"
				description={`There's no one with that number in ${organizationName}'s register. The parish office can add you, or check whether it was recorded differently.`}
			/>
			<div className="mt-4 space-y-2">
				<PrimaryButton onClick={onRetry}>
					Try another number
				</PrimaryButton>
				<p className="text-center text-meta text-fg-dim">
					Ask at the parish office to be added to the register.
				</p>
			</div>
		</div>
	);
}

// --- Step 2 ----------------------------------------------------------------

function ConfirmStep({
	match,
	onYes,
	onNo,
}: {
	match: ParishionerPreview;
	onYes: () => void;
	onNo: () => void;
}) {
	return (
		<div>
			<SheetHeading
				title="Is this you?"
				description="We found one person with that number in the register."
			/>

			<div className="mt-4 flex items-center gap-3.5 rounded-xl border border-hairline bg-surface-1 px-3.5 py-4">
				<span
					aria-hidden
					className="flex size-12 items-center justify-center rounded-full bg-surface-3 text-[16px] font-semibold text-gold"
				>
					{match.displayName
						.split(" ")
						.map((part) => part[0])
						.join("")
						.slice(0, 2)
						.toUpperCase()}
				</span>
				<div>
					<p className="text-title font-semibold text-fg">
						{match.displayName}
					</p>
					<p className="mt-0.5 text-meta text-fg-muted">
						{match.organizationName}
					</p>
				</div>
			</div>

			<div className="mt-3 flex items-start gap-2">
				<Lock className="mt-0.5 size-3.5 shrink-0 text-fg-dim" aria-hidden />
				<p className="text-meta leading-[18px] text-fg-dim">
					We never show your full number, address or email on this device.
				</p>
			</div>

			<div className="mt-4.5 space-y-1">
				<PrimaryButton onClick={onYes}>Yes, that&rsquo;s me</PrimaryButton>
				<button
					type="button"
					onClick={onNo}
					className="flex min-h-11 w-full items-center justify-center text-body text-fg-body"
				>
					That&rsquo;s not me
				</button>
			</div>
		</div>
	);
}

// --- Step 3 ----------------------------------------------------------------

function CodeStep({
	match,
	value,
	onChange,
	onComplete,
	busy,
	failure,
	helpOpen,
	onToggleHelp,
	onUsePassword,
}: {
	match: ParishionerPreview;
	value: string;
	onChange: (value: string) => void;
	onComplete: (value: string) => void;
	busy: boolean;
	failure: Failure;
	helpOpen: boolean;
	onToggleHelp: () => void;
	onUsePassword: () => void;
}) {
	const firstName = match.displayName.split(" ")[0];

	return (
		<div>
			<SheetHeading
				title="Enter your code"
				description={`Ask the parish office for your code. It confirms you're the ${firstName} in the register.`}
			/>

			<div className="mt-4">
				<OTPInput
					value={value}
					onChange={(next) => onChange(next.toUpperCase())}
					onComplete={(next) => onComplete(next.toUpperCase())}
					maxLength={ACCESS_CODE_LENGTH}
					autoFocus
					// Alphanumeric, and paste-aware for free — people are often
					// sent the code by SMS and will paste it.
					inputMode="text"
					pattern="[A-Za-z0-9]*"
					containerClassName="flex items-center gap-[7px]"
					render={({ slots }) => (
						<>
							{slots.map((slot, index) => (
								<div
									key={index}
									className={cn(
										"flex h-[54px] flex-1 items-center justify-center rounded-[10px] border bg-surface-0 font-plex-mono text-headline text-fg transition-colors",
										slot.isActive ? "border-[1.5px] border-gold"
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

			<button
				type="button"
				onClick={onToggleHelp}
				aria-expanded={helpOpen}
				className="flex min-h-11 items-center text-body-sm font-semibold text-gold"
			>
				How do I get a code?
			</button>

			{helpOpen && (
				<p className="-mt-1 mb-2 rounded-[10px] bg-surface-1 p-3 text-body-sm text-fg-body">
					Ask at the parish office, or call them. They&rsquo;ll read you a
					six-character code that works once and expires after a day.
				</p>
			)}

			<FailureNote failure={failure} />

			<div className="mt-2">
				<PrimaryButton
					onClick={() => onComplete(value)}
					disabled={value.length !== ACCESS_CODE_LENGTH || busy}
				>
					{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
					Confirm
				</PrimaryButton>
			</div>

			<button
				type="button"
				onClick={onUsePassword}
				className="mt-1 flex min-h-11 w-full items-center justify-center text-body-sm text-fg-muted"
			>
				Use my password instead
			</button>
		</div>
	);
}

// --- Password route --------------------------------------------------------

function PasswordStep({
	match,
	email,
	password,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onUseCode,
	busy,
	failure,
}: {
	match: ParishionerPreview | null;
	email: string;
	password: string;
	onEmailChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: () => void;
	onUseCode?: () => void;
	busy: boolean;
	failure: Failure;
}) {
	const firstName = match?.displayName.split(" ")[0];

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
		>
			<SheetHeading
				title="Sign in with your password"
				description={
					match && !match.allowsCodeSignIn ?
						`${firstName ?? "This account"} uses a password rather than a parish code.`
					:	"Use the email and password you set on your account."
				}
			/>

			<div className="mt-4 space-y-2.5">
				<input
					type="email"
					inputMode="email"
					autoComplete="email"
					aria-label="Email address"
					placeholder="Email address"
					value={email}
					onChange={(event) => onEmailChange(event.target.value)}
					className="h-12 w-full rounded-xl border border-hairline bg-surface-0 px-3.5 text-body text-fg outline-none placeholder:text-fg-dim focus:border-gold"
					required
				/>
				<input
					type="password"
					autoComplete="current-password"
					aria-label="Password"
					placeholder="Password"
					value={password}
					onChange={(event) => onPasswordChange(event.target.value)}
					className="h-12 w-full rounded-xl border border-hairline bg-surface-0 px-3.5 text-body text-fg outline-none placeholder:text-fg-dim focus:border-gold"
					required
				/>
			</div>

			<FailureNote failure={failure} />

			<div className="mt-3.5">
				<PrimaryButton
					type="submit"
					disabled={busy || !email.trim() || !password}
				>
					{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
					Sign in
				</PrimaryButton>
			</div>

			{onUseCode && (
				<button
					type="button"
					onClick={onUseCode}
					className="mt-1 flex min-h-11 w-full items-center justify-center text-body-sm text-fg-muted"
				>
					Use a parish code instead
				</button>
			)}
		</form>
	);
}

function TwoFactorStep({
	method,
	value,
	onChange,
	onSubmit,
	busy,
	failure,
}: {
	method: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	busy: boolean;
	failure: Failure;
}) {
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit(value);
			}}
		>
			<SheetHeading
				title="One more code"
				description={
					method === "TOTP" ?
						"Open your authenticator app and enter the six digits it shows."
					:	"We've emailed you a six-digit code. It expires in five minutes."
				}
			/>

			<input
				inputMode="numeric"
				autoComplete="one-time-code"
				aria-label="Two-factor code"
				placeholder="000000"
				maxLength={6}
				value={value}
				onChange={(event) =>
					onChange(event.target.value.replace(/\D/g, ""))
				}
				className="mt-4 h-14 w-full rounded-xl border border-hairline bg-surface-0 px-3.5 text-center font-plex-mono text-headline tracking-[0.3em] text-fg outline-none placeholder:text-fg-dim focus:border-gold"
				required
			/>

			<FailureNote failure={failure} />

			<div className="mt-3.5">
				<PrimaryButton type="submit" disabled={busy || value.length !== 6}>
					{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
					Confirm
				</PrimaryButton>
			</div>
		</form>
	);
}

// --- Step 4 ----------------------------------------------------------------

function DoneStep({
	name,
	organizationName,
	pendingLabel,
	onContinue,
}: {
	name: string;
	organizationName: string;
	pendingLabel: string | null;
	onContinue: () => void;
}) {
	const firstName = name.split(" ")[0];

	// The action resumes on its own. The button is an escape hatch for anyone
	// who wants to dismiss it sooner, not the thing that makes it happen.
	useEffect(() => {
		const timer = setTimeout(onContinue, 1600);
		return () => clearTimeout(timer);
	}, [onContinue]);

	return (
		<div>
			<div className="flex flex-col items-center gap-3 text-center">
				<span
					aria-hidden
					className="flex size-15 items-center justify-center rounded-full border border-positive/40 bg-positive/15"
				>
					<Check className="size-6.5 text-positive" strokeWidth={2} />
				</span>
				<h2 className="text-headline font-semibold text-fg">
					Welcome, {firstName}
				</h2>
				<p className="max-w-[30ch] text-body text-pretty text-fg-body">
					This phone is now yours at {organizationName}. You won&rsquo;t need
					the code again.
				</p>
			</div>

			{pendingLabel && (
				<div className="mt-5 rounded-xl border border-hairline bg-surface-1 p-3.5">
					<p className="text-meta text-fg-dim">
						Picking up where you left off
					</p>
					<div className="mt-1.5 flex items-center justify-between gap-3">
						<p className="text-title-sm font-semibold text-fg">
							{pendingLabel}
						</p>
						<span className="flex shrink-0 items-center gap-1.5 text-meta text-fg-muted">
							<Loader2 className="size-3 animate-spin" aria-hidden />
							opening
						</span>
					</div>
				</div>
			)}

			<div className="mt-4">
				<PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
			</div>
		</div>
	);
}

/** Exported for the "not on the register" screen's call button. */
export function CallParishOffice({ phone }: { phone: string | null }) {
	if (!phone) return null;
	return (
		<a
			href={`tel:${phone}`}
			className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline text-body font-medium text-fg"
		>
			<Phone className="size-4" aria-hidden />
			Call the parish office
		</a>
	);
}

export { X as LockInCloseIcon };
