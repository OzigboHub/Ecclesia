"use client";

import {
	confirmTwoFactorSetup,
	disableTwoFactor,
	startTwoFactorSetup,
} from "@/app/actions/auth.actions";
import {
	confirmEmailVerification,
	sendEmailVerification,
	setCodeSignIn,
	setMemberPassword,
	type SecurityStatus,
} from "@/app/actions/member-security.actions";
import { ConfirmWithPassword } from "@/components/feed/me/confirm-with-password";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * The security ladder, one row per rung.
 *
 * Each row states where the account stands and what the next step is. Rungs
 * above where you are read as available, not as warnings — this is an offer,
 * not a nag. Nobody is failing at security by having only a phone number.
 */
export function SecurityLadder({ status }: { status: SecurityStatus }) {
	const [open, setOpen] = useState<string | null>(null);

	const rungs = [
		{
			id: "password",
			title: "Email and password",
			state: status.hasPassword ? (status.email ?? "Set") : "Not set",
			done: status.hasPassword,
			body: <PasswordRung status={status} />,
		},
		{
			id: "email",
			title: "Confirmed email",
			state:
				status.emailVerified ? "Confirmed"
				: status.hasPassword ? "Not confirmed"
				: "Add a password first",
			done: status.emailVerified,
			locked: !status.hasPassword,
			body: <EmailRung status={status} />,
		},
		{
			id: "twofactor",
			title: "Two-factor",
			state:
				status.twoFactorEnabled ?
					status.twoFactorMethod === "TOTP" ?
						"Authenticator app"
					:	"Email code"
				: status.hasPassword ? "Off"
				: "Add a password first",
			done: status.twoFactorEnabled,
			locked: !status.hasPassword,
			body: <TwoFactorRung status={status} />,
		},
	];

	if (status.codeSignInApplies) {
		rungs.push({
			id: "code",
			title: "Sign in with a parish code",
			state: status.allowCodeSignIn ? "Allowed" : "Turned off",
			// "Done" here means the door is closed, which is the higher rung.
			done: !status.allowCodeSignIn,
			locked: status.allowCodeSignIn && !status.canDisableCodeSignIn,
			body: <CodeSignInRung status={status} />,
		});
	}

	return (
		<ul className="divide-y divide-hairline border-y border-hairline">
			{rungs.map((rung) => {
				const expanded = open === rung.id;
				return (
					<li key={rung.id}>
						<button
							type="button"
							onClick={() => setOpen(expanded ? null : rung.id)}
							aria-expanded={expanded}
							className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
						>
							<span
								aria-hidden
								className={cn(
									"flex size-8 shrink-0 items-center justify-center rounded-full",
									rung.done ?
										"bg-positive/15 text-positive"
									: rung.locked ? "bg-surface-2 text-fg-dim"
									: "bg-surface-3 text-fg-muted",
								)}
							>
								{rung.done ?
									<Check className="size-4" strokeWidth={2.5} />
								:	<Lock className="size-3.5" />}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block text-body text-fg">
									{rung.title}
								</span>
								<span
									className={cn(
										"mt-0.5 block truncate text-meta",
										rung.done ? "text-positive" : "text-fg-dim",
									)}
								>
									{rung.state}
								</span>
							</span>
							<ChevronDown
								className={cn(
									"size-4 shrink-0 text-fg-dim transition-transform",
									expanded && "rotate-180",
								)}
								aria-hidden
							/>
						</button>
						{expanded && <div className="px-4 pb-4">{rung.body}</div>}
					</li>
				);
			})}
		</ul>
	);
}

function Field({
	label,
	...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<label className="block">
			<span className="mb-1 block text-meta text-fg-muted">{label}</span>
			<input
				{...props}
				className="h-11 w-full rounded-[10px] border border-hairline bg-surface-0 px-3 text-body text-fg outline-none focus:border-gold"
			/>
		</label>
	);
}

function Primary({
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="submit"
			{...props}
			className={cn(
				"flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-body font-semibold transition-colors",
				props.disabled ?
					"bg-surface-3 text-fg-dim"
				:	"bg-gold text-on-gold hover:brightness-105",
			)}
		>
			{children}
		</button>
	);
}

function PasswordRung({ status }: { status: SecurityStatus }) {
	const router = useRouter();
	const [email, setEmail] = useState(status.email ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [pending, startTransition] = useTransition();

	return (
		<form
			className="space-y-3"
			onSubmit={(event) => {
				event.preventDefault();
				startTransition(async () => {
					const result = await setMemberPassword({
						email,
						password,
						confirmPassword,
						currentPassword: currentPassword || undefined,
					});
					if (!result.success) {
						toast.error(result.message);
						return;
					}
					toast.success(result.message);
					setPassword("");
					setConfirmPassword("");
					setCurrentPassword("");
					router.refresh();
				});
			}}
		>
			<p className="text-body-sm text-fg-muted">
				A password lets you sign in without asking the parish office for a
				code, and it&rsquo;s what everything else here is built on.
			</p>
			<Field
				label="Email address"
				type="email"
				autoComplete="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			{status.hasPassword && (
				<Field
					label="Current password"
					type="password"
					autoComplete="current-password"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
					required
				/>
			)}
			<Field
				label={status.hasPassword ? "New password" : "Password"}
				type="password"
				autoComplete="new-password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			<Field
				label="Confirm password"
				type="password"
				autoComplete="new-password"
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				required
			/>
			<p className="text-caption text-fg-dim">
				At least 8 characters, with an uppercase letter, a lowercase letter,
				a number and a symbol.
			</p>
			<Primary disabled={pending}>
				{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
				{status.hasPassword ? "Update password" : "Set password"}
			</Primary>
		</form>
	);
}

function EmailRung({ status }: { status: SecurityStatus }) {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [sent, setSent] = useState(false);
	const [pending, startTransition] = useTransition();

	if (!status.hasPassword) {
		return (
			<p className="text-body-sm text-fg-muted">
				Set an email and password first — there&rsquo;s nothing to confirm
				yet.
			</p>
		);
	}

	if (status.emailVerified) {
		return (
			<p className="text-body-sm text-fg-muted">
				{status.email} is confirmed. This is where a password reset would be
				sent, so it&rsquo;s worth keeping it an address you actually read.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-body-sm text-fg-muted">
				We&rsquo;ll send a six-digit code to {status.email}. Confirming it is
				what makes a password reset possible later.
			</p>

			{!sent ?
				<Primary
					type="button"
					disabled={pending}
					onClick={() =>
						startTransition(async () => {
							const result = await sendEmailVerification();
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							toast.success(result.message);
							setSent(true);
						})
					}
				>
					{pending && (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					)}
					Send the code
				</Primary>
			:	<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault();
						startTransition(async () => {
							const result = await confirmEmailVerification(code);
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							toast.success(result.message);
							router.refresh();
						});
					}}
				>
					<Field
						label="Six-digit code"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
						required
					/>
					<Primary disabled={pending || code.length !== 6}>
						{pending && (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						)}
						Confirm
					</Primary>
					<button
						type="button"
						className="flex min-h-11 w-full items-center justify-center text-body-sm text-fg-muted"
						onClick={() => setSent(false)}
					>
						Send another code
					</button>
				</form>
			}
		</div>
	);
}

function TwoFactorRung({ status }: { status: SecurityStatus }) {
	const router = useRouter();
	const [method, setMethod] = useState<"EMAIL" | "TOTP">("EMAIL");
	const [secret, setSecret] = useState<string | null>(null);
	const [challengeToken, setChallengeToken] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const [pending, startTransition] = useTransition();

	if (!status.hasPassword) {
		return (
			<p className="text-body-sm text-fg-muted">
				Two-factor guards a password, so you need one first.
			</p>
		);
	}

	if (status.twoFactorEnabled) {
		return (
			<div className="space-y-3">
				<p className="text-body-sm text-fg-muted">
					Signing in asks for a code from{" "}
					{status.twoFactorMethod === "TOTP" ?
						"your authenticator app"
					:	"your email"}{" "}
					as well as your password.
				</p>
				<ConfirmWithPassword
					label="Turn two-factor off"
					description={
						status.allowCodeSignIn ?
							"Enter your password to confirm."
						:	"Parish codes will start working again too — a password on its own can't be your only door."
					}
					confirmLabel="Turn it off"
					destructive
					pending={pending}
					onConfirm={(value) =>
						startTransition(async () => {
							const result = await disableTwoFactor(value);
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							toast.success(result.message);
							router.refresh();
						})
					}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div
				role="radiogroup"
				aria-label="Two-factor method"
				className="flex gap-2"
			>
				{(["EMAIL", "TOTP"] as const).map((option) => (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={method === option}
						onClick={() => setMethod(option)}
						className={cn(
							"flex min-h-11 flex-1 items-center justify-center rounded-[10px] border text-body-sm transition-colors",
							method === option ?
								"border-gold bg-gold/10 font-medium text-gold"
							:	"border-hairline text-fg-body",
						)}
					>
						{option === "EMAIL" ? "Email code" : "Authenticator app"}
					</button>
				))}
			</div>

			{secret && (
				<div className="rounded-[10px] bg-surface-2 p-3">
					<p className="text-meta text-fg-muted">
						Add this key to your authenticator app:
					</p>
					<p className="mt-1 select-all font-plex-mono text-body-sm tracking-[0.12em] text-fg">
						{secret}
					</p>
				</div>
			)}

			{!secret && !challengeToken ?
				<Primary
					type="button"
					disabled={pending}
					onClick={() =>
						startTransition(async () => {
							const result = await startTwoFactorSetup({ method });
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							setSecret(result.data?.secret ?? null);
							setChallengeToken(result.data?.challengeToken ?? null);
							toast.success(result.message);
						})
					}
				>
					{pending && (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					)}
					Start setup
				</Primary>
			:	<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault();
						startTransition(async () => {
							const result = await confirmTwoFactorSetup({
								method,
								code,
								challengeToken: challengeToken ?? undefined,
							});
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							toast.success(result.message);
							router.refresh();
						});
					}}
				>
					<Field
						label="Six-digit code"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
						required
					/>
					<Primary disabled={pending || code.length !== 6}>
						{pending && (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						)}
						Turn two-factor on
					</Primary>
				</form>
			}
		</div>
	);
}

function CodeSignInRung({ status }: { status: SecurityStatus }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function change(enabled: boolean, password?: string) {
		startTransition(async () => {
			const result = await setCodeSignIn(enabled, password);
			if (!result.success) {
				toast.error(result.message);
				return;
			}
			toast.success(result.message);
			router.refresh();
		});
	}

	if (!status.allowCodeSignIn) {
		return (
			<div className="space-y-3">
				<p className="text-body-sm text-fg-muted">
					A parish code won&rsquo;t sign you in any more — only your
					password and two-factor will. If you lose both, the parish office
					can turn this back on for you.
				</p>
				<ConfirmWithPassword
					label="Allow parish codes again"
					description="Enter your password to confirm. A code from the parish office will be enough to sign in as you once more."
					confirmLabel="Allow codes"
					pending={pending}
					onConfirm={(value) => change(true, value)}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-body-sm text-fg-muted">
				Right now, a code from the parish office is enough to sign in as you.
				Turning that off makes your password and two-factor the only way in.
			</p>
			{status.canDisableCodeSignIn ?
				<>
					<button
						type="button"
						disabled={pending}
						onClick={() => change(false)}
						className="flex h-11 w-full items-center justify-center rounded-[10px] border border-hairline text-body font-semibold text-fg disabled:opacity-50"
					>
						{pending && (
							<Loader2
								className="mr-2 size-4 animate-spin"
								aria-hidden
							/>
						)}
						Turn off parish-code sign-in
					</button>
					<p className="text-caption text-fg-dim">
						Make sure you can reach {status.email} — that&rsquo;s how
						you&rsquo;d reset a forgotten password.
					</p>
				</>
			:	<p className="rounded-[10px] bg-surface-2 p-3 text-body-sm text-fg-muted">
					{status.blockedBecause}
				</p>
			}
		</div>
	);
}
