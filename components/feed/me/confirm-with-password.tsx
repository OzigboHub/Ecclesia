"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Inline password confirmation for actions that lower an account's security.
 *
 * Deliberately inline rather than a modal: whatever is being confirmed stays on
 * screen above the field, so nobody types their password into a dialog that has
 * covered up what it is for.
 *
 * The trigger renders as a plain text button until pressed, so a screen full of
 * these — the devices list, say — doesn't read as a wall of password prompts.
 */
export function ConfirmWithPassword({
	label,
	description,
	confirmLabel,
	destructive,
	pending,
	disabled,
	onConfirm,
	triggerClassName,
}: {
	label: React.ReactNode;
	description: string;
	confirmLabel: string;
	destructive?: boolean;
	pending: boolean;
	disabled?: boolean;
	onConfirm: (password: string) => void;
	triggerClassName?: string;
}) {
	const [open, setOpen] = useState(false);
	const [password, setPassword] = useState("");

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				disabled={disabled}
				className={cn(
					"flex min-h-11 items-center text-body-sm font-semibold disabled:opacity-50",
					destructive ? "text-critical" : "text-gold",
					triggerClassName,
				)}
			>
				{label}
			</button>
		);
	}

	return (
		<form
			className="space-y-2.5 rounded-[10px] bg-surface-2 p-3"
			onSubmit={(event) => {
				event.preventDefault();
				onConfirm(password);
			}}
		>
			<p className="text-body-sm text-fg-muted">{description}</p>
			<label className="block">
				<span className="mb-1 block text-meta text-fg-muted">
					Your password
				</span>
				<input
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
					className="h-11 w-full rounded-[10px] border border-hairline bg-surface-0 px-3 text-body text-fg outline-none focus:border-gold"
				/>
			</label>
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={pending || !password}
					className={cn(
						"flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] text-body font-semibold transition-colors",
						pending || !password ? "bg-surface-3 text-fg-dim"
						: destructive ? "bg-critical text-surface-0"
						: "bg-gold text-on-gold",
					)}
				>
					{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
					{confirmLabel}
				</button>
				<button
					type="button"
					onClick={() => {
						setOpen(false);
						setPassword("");
					}}
					className="flex h-11 items-center px-3 text-body-sm text-fg-muted"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
