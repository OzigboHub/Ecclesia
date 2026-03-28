import { getMyActiveSessions } from "@/app/actions/auth.actions";
import { auth } from "@/auth";
import { ActiveSessionsCard } from "@/components/auth/active-sessions-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Active Sessions | Ecclesia",
	description: "Review and revoke active sessions for your account",
};

export default async function SessionsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	const result = await getMyActiveSessions();
	const sessions = result.success && result.data ? result.data : [];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard">
						<ArrowLeft className="h-4 w-4" />
						<span className="sr-only">Back to dashboard</span>
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Session Security
					</h1>
					<p className="text-muted-foreground">
						Manage active sessions for your account across devices.
					</p>
				</div>
			</div>

			<ActiveSessionsCard sessions={sessions} />
		</div>
	);
}
