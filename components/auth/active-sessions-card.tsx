"use client";

import {
	revokeMySession,
	type ActiveSession,
} from "@/app/actions/auth.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Laptop, Loader2, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ActiveSessionsCardProps {
	sessions: ActiveSession[];
}

function formatDateTime(value: Date): string {
	return new Intl.DateTimeFormat("en-NG", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

export function ActiveSessionsCard({ sessions }: ActiveSessionsCardProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

	const handleRevoke = (sessionId: string) => {
		startTransition(async () => {
			setTargetSessionId(sessionId);
			const result = await revokeMySession(sessionId);
			setTargetSessionId(null);

			if (!result.success) {
				toast.error(result.message || "Failed to revoke session");
				return;
			}

			toast.success(result.message || "Session revoked");

			if (result.data?.revokedCurrent) {
				await signOut({ callbackUrl: "/auth/login" });
				return;
			}

			router.refresh();
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Laptop className="h-5 w-5" />
					Active Sessions
				</CardTitle>
				<CardDescription>
					Review active device sessions and revoke any you do not
					recognize.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{sessions.length === 0 ?
					<div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
						No active sessions found.
					</div>
				:	<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Device</TableHead>
									<TableHead>IP Address</TableHead>
									<TableHead>Last Seen</TableHead>
									<TableHead>Expires</TableHead>
									<TableHead className="text-right">
										Action
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sessions.map((session) => {
									const revoking =
										isPending &&
										targetSessionId === session.id;

									return (
										<TableRow key={session.id}>
											<TableCell className="max-w-[300px]">
												<div className="flex flex-col gap-1">
													<span className="truncate text-sm">
														{session.userAgent ||
															"Unknown device"}
													</span>
													<div className="flex items-center gap-2">
														<Badge
															variant={
																(
																	session.isCurrent
																) ?
																	"default"
																:	"secondary"
															}
														>
															{session.isCurrent ?
																"Current"
															:	"Active"}
														</Badge>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{session.ipAddress || "-"}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDateTime(
													session.lastSeenAt,
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDateTime(
													session.expiresAt,
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant={
														session.isCurrent ?
															"destructive"
														:	"outline"
													}
													size="sm"
													disabled={isPending}
													onClick={() =>
														handleRevoke(session.id)
													}
												>
													{revoking ?
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Revoking...
														</>
													: session.isCurrent ?
														"Sign out"
													:	"Revoke"}
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				}

				<div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-300">
					<ShieldAlert className="mt-0.5 h-4 w-4" />
					<p>
						Revoke sessions you do not recognize immediately.
						Revoking the current session signs you out right away.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
