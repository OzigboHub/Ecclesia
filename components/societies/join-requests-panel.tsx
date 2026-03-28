"use client";

import {
	approveJoinRequest,
	rejectJoinRequest,
	type JoinRequestWithParishioner,
} from "@/app/actions/society.actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { Check, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface JoinRequestsPanelProps {
	requests: JoinRequestWithParishioner[];
}

export function JoinRequestsPanel({
	requests: initialRequests,
}: JoinRequestsPanelProps) {
	const router = useRouter();
	const [requests, setRequests] = useState(initialRequests);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleApprove = (requestId: string) => {
		setProcessingId(requestId);
		startTransition(async () => {
			const res = await approveJoinRequest(requestId);
			if (res.success) {
				toast.success(res.message);
				setRequests((prev) => prev.filter((r) => r.id !== requestId));
				router.refresh();
			} else {
				toast.error(res.message);
			}
			setProcessingId(null);
		});
	};

	const handleReject = (requestId: string) => {
		setProcessingId(requestId);
		startTransition(async () => {
			const res = await rejectJoinRequest(requestId);
			if (res.success) {
				toast.success(res.message);
				setRequests((prev) => prev.filter((r) => r.id !== requestId));
				router.refresh();
			} else {
				toast.error(res.message);
			}
			setProcessingId(null);
		});
	};

	if (requests.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
				<p className="text-sm">No pending join requests</p>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<ul className="divide-y">
				{requests.map((req) => {
					const initials =
						`${req.parishioner.firstName[0]}${req.parishioner.lastName[0]}`.toUpperCase();
					const isProcessing = processingId === req.id && isPending;

					return (
						<li
							key={req.id}
							className="flex items-center justify-between py-4 gap-4"
						>
							<div className="flex items-center gap-3 min-w-0">
								<Avatar className="h-9 w-9 shrink-0">
									<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="font-medium text-sm truncate">
										{req.parishioner.firstName}{" "}
										{req.parishioner.lastName}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{req.parishioner.phone ||
											req.parishioner.email ||
											"—"}
									</p>
									<p className="text-xs text-muted-foreground">
										Requested{" "}
										{formatDistanceToNow(
											new Date(req.createdAt),
											{ addSuffix: true },
										)}
									</p>
								</div>
								{req.message && (
									<Tooltip>
										<TooltipTrigger asChild>
											<MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 cursor-pointer" />
										</TooltipTrigger>
										<TooltipContent
											side="top"
											className="max-w-[220px]"
										>
											<p className="text-xs">
												{req.message}
											</p>
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Badge
									variant="outline"
									className="text-amber-600 border-amber-300 bg-amber-50 text-xs hidden sm:flex"
								>
									Pending
								</Badge>
								<Button
									size="sm"
									variant="outline"
									className="text-green-700 border-green-300 hover:bg-green-50 h-8 px-3"
									onClick={() => handleApprove(req.id)}
									disabled={isProcessing}
								>
									<Check className="h-3.5 w-3.5 mr-1" />
									Approve
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="text-destructive border-destructive/30 hover:bg-destructive/5 h-8 px-3"
									onClick={() => handleReject(req.id)}
									disabled={isProcessing}
								>
									<X className="h-3.5 w-3.5 mr-1" />
									Reject
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</TooltipProvider>
	);
}
