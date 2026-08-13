"use client";

import { ThemeToggle } from "@/components/feed/chrome/theme-toggle";
import { LockInSheet } from "@/components/feed/lock-in/lock-in-sheet";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The Me tab before anyone has locked in.
 *
 * Explains what locking in gets you before asking for a phone number — nobody
 * should have to hand over a number to find out what it is for.
 */
export function SignedOutMe({
	organizationId,
	organizationName,
}: {
	organizationId: string | null;
	organizationName: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	return (
		<div className="px-5 py-10">
			<div className="flex flex-col items-center text-center">
				<span
					aria-hidden
					className="flex size-14 items-center justify-center rounded-full bg-surface-2"
				>
					<UserRound className="size-6 text-fg-dim" />
				</span>
				<h2 className="mt-4 text-title font-semibold text-fg">
					Lock in your account
				</h2>
				<p className="mt-2 max-w-[34ch] text-body text-pretty text-fg-muted">
					Give in your own name, book a Mass intention, join a society and
					see your giving history. Your phone number and a code from the
					parish office is all it takes.
				</p>

				{organizationId ?
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="mt-5 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-gold text-title-sm font-semibold text-on-gold"
					>
						Lock in
					</button>
				:	<Link
						href="/start"
						className="mt-5 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-gold text-title-sm font-semibold text-on-gold"
					>
						Choose your parish first
					</Link>
				}

				<Link
					href="/auth/login"
					className="mt-2 flex min-h-11 items-center text-body-sm text-fg-muted"
				>
					Parish staff? Sign in with your email
				</Link>
			</div>

			<div className="mt-10 flex items-center justify-between border-t border-hairline pt-5">
				<span className="text-body text-fg">Appearance</span>
				<ThemeToggle />
			</div>

			{organizationId && (
				<LockInSheet
					open={open}
					onOpenChange={setOpen}
					organizationId={organizationId}
					organizationName={organizationName}
					pendingLabel={null}
					onSuccess={() => router.refresh()}
				/>
			)}
		</div>
	);
}
