import { getMemberDevices } from "@/app/actions/member.actions";
import { getSecurityStatus } from "@/app/actions/member-security.actions";
import { DeviceList } from "@/components/feed/me/device-list";
import { FeedShell } from "@/components/feed/feed-shell";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Devices · Ecclesia" };

export default async function DevicesPage() {
	const [result, security] = await Promise.all([
		getMemberDevices(),
		getSecurityStatus(),
	]);

	if (!result.success) redirect("/me");

	const devices = result.data ?? [];
	const hasPassword = security.data?.hasPassword ?? false;

	return (
		<FeedShell
			topBar={
				<div className="sticky top-0 z-30 flex items-center gap-1 border-b border-hairline bg-surface-1/95 px-2 py-2 backdrop-blur pt-[calc(8px+env(safe-area-inset-top))]">
					<Link
						href="/me"
						className="flex size-11 items-center justify-center rounded-[10px] text-fg-muted"
					>
						<ChevronLeft className="size-5" aria-hidden />
						<span className="sr-only">Back</span>
					</Link>
					<h1 className="text-title font-semibold text-fg">Devices</h1>
				</div>
			}
		>
			<p className="px-4 py-3.5 text-body text-fg-muted">
				{devices.length === 1 ?
					"You're signed in on this device only."
				:	`You're signed in on ${devices.length} devices.`}{" "}
				Signing a device out means it will need your password, or a new
				code from the parish office.
			</p>

			<DeviceList devices={devices} hasPassword={hasPassword} />
		</FeedShell>
	);
}
