"use client";

import { restoreCodeSignIn } from "@/app/actions/member-security.actions";
import { issueAccessCode } from "@/app/actions/parish-code.actions";
import { formatAccessCode } from "@/lib/access-code";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Issue a one-time lock-in code.
 *
 * The plaintext is shown here and nowhere else, ever. Only a bcrypt hash is
 * stored, so if this panel is dismissed before the code is read out, the only
 * way forward is to issue another — which is the correct trade: nobody, staff
 * included, holds standing power to sign in as a parishioner.
 */
export function IssueAccessCode({
	parishionerId,
	parishionerName,
	hasPhone,
	allowCodeSignIn,
}: {
	parishionerId: string;
	parishionerName: string;
	hasPhone: boolean;
	allowCodeSignIn: boolean;
}) {
	const router = useRouter();
	const [code, setCode] = useState<string | null>(null);
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);
	const [pending, startTransition] = useTransition();
	const firstName = parishionerName.split(" ")[0];

	function issue() {
		startTransition(async () => {
			const result = await issueAccessCode(parishionerId);
			if (!result.success || !result.data) {
				toast.error(result.message);
				return;
			}
			setCode(result.data.code);
			setExpiresAt(new Date(result.data.expiresAt));
		});
	}

	// This person deliberately closed the code door: they hold a password and
	// two-factor. Issuing a code would be issuing something that cannot work,
	// so offer recovery instead — which is a decision staff should make
	// knowingly, not stumble into.
	if (!allowCodeSignIn) {
		return (
			<div className="rounded-lg border border-border bg-background p-4">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<KeyRound className="size-4 text-primary" aria-hidden />
					Access code
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					{firstName} signs in with a password and two-factor, and turned
					off parish codes for their account. A code won&rsquo;t work
					while that&rsquo;s the case.
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					Only restore it if they&rsquo;ve genuinely lost access and
					you&rsquo;re sure who you&rsquo;re speaking to — it lowers their
					account back to a code being enough.
				</p>
				<Button
					variant="outline"
					size="sm"
					className="mt-3"
					disabled={pending}
					onClick={() =>
						startTransition(async () => {
							const result = await restoreCodeSignIn(parishionerId);
							if (!result.success) {
								toast.error(result.message);
								return;
							}
							toast.success(result.message);
							router.refresh();
						})
					}
				>
					{pending && (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					)}
					Restore code sign-in
				</Button>
			</div>
		);
	}

	if (!hasPhone) {
		return (
			<div className="rounded-lg border border-border bg-background p-4">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<KeyRound className="size-4 text-primary" aria-hidden />
					Access code
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					{parishionerName} has no usable phone number on record. Lock-in
					starts with the phone number, so add one before issuing a code.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-background p-4">
			<h3 className="flex items-center gap-2 text-sm font-semibold">
				<KeyRound className="size-4 text-primary" aria-hidden />
				Access code
			</h3>

			{code ?
				<div className="mt-3">
					<p className="text-xs text-muted-foreground">
						Read this out to {firstName}. It will not
						be shown again.
					</p>
					<p className="mt-2 select-all font-mono text-3xl font-semibold tracking-[0.18em] text-primary">
						{formatAccessCode(code)}
					</p>
					<p className="mt-2 text-xs text-muted-foreground">
						Works once, on one device, and expires{" "}
						{expiresAt ?
							new Intl.DateTimeFormat("en-NG", {
								weekday: "long",
								hour: "numeric",
								minute: "2-digit",
							}).format(expiresAt)
						:	"in a day"}
						.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() => setCode(null)}
					>
						Done
					</Button>
				</div>
			:	<div className="mt-2">
					<p className="text-sm text-muted-foreground">
						Issue a code so {firstName} can sign in on
						their own phone. Any code issued earlier stops working.
					</p>
					<Button
						size="sm"
						className="mt-3"
						onClick={issue}
						disabled={pending}
					>
						{pending && (
							<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
						)}
						Issue a code
					</Button>
				</div>
			}
		</div>
	);
}
