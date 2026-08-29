import { getSecurityStatus } from "@/app/actions/member-security.actions";
import { FeedShell } from "@/components/feed/feed-shell";
import { SecurityLadder } from "@/components/feed/me/security-ladder";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
	const result = await getSecurityStatus();

	if (!result.success || !result.data) redirect("/me");

	return (
		<FeedShell
			topBar={
				<div className="sticky top-16 z-30 flex items-center gap-1 border-b border-hairline bg-surface-1/95 px-2 py-2 backdrop-blur pt-[calc(8px+env(safe-area-inset-top))]">
					<Link
						href="/me"
						className="flex size-11 items-center justify-center rounded-[10px] text-fg-muted"
					>
						<ChevronLeft className="size-5" aria-hidden />
						<span className="sr-only">Back</span>
					</Link>
					<h1 className="text-title font-semibold text-fg">Security</h1>
				</div>
			}
		>
			<p className="px-4 py-3.5 text-body text-fg-muted">
				A phone number and a code from the parish office is all you need. If
				you&rsquo;d rather have more than that, everything below is yours to
				turn on — nothing here is required.
			</p>

			<SecurityLadder status={result.data} />
		</FeedShell>
	);
}
