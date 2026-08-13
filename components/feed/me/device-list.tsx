"use client";

import { revokeDevice, type MemberDevice } from "@/app/actions/member.actions";
import { ConfirmWithPassword } from "@/components/feed/me/confirm-with-password";
import { relativeTime } from "@/components/feed/feed-card-shell";
import { Loader2, Smartphone } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function DeviceList({
	devices,
	hasPassword,
}: {
	devices: MemberDevice[];
	/** Whether the account has a password to re-prove. Rung 0 accounts don't. */
	hasPassword: boolean;
}) {
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	function signOut(device: MemberDevice, password?: string) {
		setPendingId(device.tokenId);
		startTransition(async () => {
			const result = await revokeDevice(device.tokenId, password);
			setPendingId(null);
			if (!result.success) toast.error(result.message);
			else toast.success(result.message);
		});
	}

	function signOutThisDevice(device: MemberDevice) {
		const confirmed = window.confirm(
			"Sign this device out? You'll need your password, or a new code from the parish office, to use it again.",
		);
		if (confirmed) signOut(device);
	}

	return (
		<ul className="divide-y divide-hairline border-y border-hairline">
			{devices.map((device) => {
				const busy = pendingId === device.tokenId;
				return (
					<li key={device.tokenId} className="px-4 py-3">
						<div className="flex items-center gap-3">
							<span
								aria-hidden
								className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2"
							>
								<Smartphone className="size-4.5 text-fg-muted" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-body text-fg">
									{device.label}
									{device.isCurrent && (
										<span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-caption font-medium text-gold">
											This device
										</span>
									)}
								</p>
								<p className="mt-0.5 text-caption text-fg-dim">
									Last used {relativeTime(device.lastSeenAt)} · added{" "}
									{relativeTime(device.createdAt)}
								</p>
							</div>

							{/* Leaving is always easy. It's the one thing somebody
							    on a borrowed phone urgently needs to do. */}
							{device.isCurrent || !hasPassword ?
								<button
									type="button"
									onClick={() =>
										device.isCurrent ?
											signOutThisDevice(device)
										:	signOut(device)
									}
									disabled={pendingId !== null}
									className="flex min-h-11 shrink-0 items-center px-2 text-body-sm font-semibold text-critical disabled:opacity-50"
								>
									{busy ?
										<Loader2
											className="size-4 animate-spin"
											aria-hidden
										/>
									:	"Sign out"}
								</button>
							:	null}
						</div>

						{/* Signing out a device you aren't holding needs the
						    password — otherwise an unlocked handset can strand
						    you on everything else you own. */}
						{!device.isCurrent && hasPassword && (
							<div className="mt-1 pl-13">
								<ConfirmWithPassword
									label="Sign out"
									description={`Signing out ${device.label} means it will need your password, or a new code from the parish office.`}
									confirmLabel="Sign it out"
									destructive
									pending={busy}
									disabled={pendingId !== null && !busy}
									onConfirm={(password) =>
										signOut(device, password)
									}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
