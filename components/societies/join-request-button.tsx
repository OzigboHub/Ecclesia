"use client";

import {
	cancelJoinRequest,
	requestToJoinSociety,
} from "@/app/actions/society.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/hooks/use-role";
import { CheckCircle2, Clock, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type JoinStatus = "NONE" | "PENDING" | "MEMBER" | "REJECTED";

interface JoinRequestButtonProps {
	societyId: string;
	initialStatus: JoinStatus;
}

export function JoinRequestButton({
	societyId,
	initialStatus,
}: JoinRequestButtonProps) {
	const router = useRouter();
	const { role } = useRole();
	const canAutoJoin = role === "PARISH_ADMIN" || role === "PARISH_SECRETARY";
	const [status, setStatus] = useState<JoinStatus>(initialStatus);
	const [isOpen, setIsOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleRequest = () => {
		startTransition(async () => {
			const res = await requestToJoinSociety(
				societyId,
				message || undefined,
			);
			if (res.success) {
				toast.success(res.message);
				setStatus("PENDING");
				setIsOpen(false);
				setMessage("");
				router.refresh();
			} else {
				toast.error(res.message);
			}
		});
	};

	const handleCancel = () => {
		startTransition(async () => {
			const res = await cancelJoinRequest(societyId);
			if (res.success) {
				toast.success(res.message);
				setStatus("NONE");
				router.refresh();
			} else {
				toast.error(res.message);
			}
		});
	};

	if (status === "MEMBER") {
		return (
			<Badge
				variant="secondary"
				className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
			>
				<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
				You are a member
			</Badge>
		);
	}

	if (status === "PENDING") {
		return (
			<div className="flex items-center gap-2">
				<Badge
					variant="outline"
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
				>
					<Clock className="h-3.5 w-3.5 text-amber-500" />
					Request Pending
				</Badge>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleCancel}
					disabled={isPending}
					className="text-destructive hover:text-destructive"
				>
					Cancel Request
				</Button>
			</div>
		);
	}

	if (status === "REJECTED") {
		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="outline" size="sm">
						<XCircle className="h-4 w-4 mr-2 text-destructive" />
						{canAutoJoin ? "Join Society" : "Request Again"}
					</Button>
				</DialogTrigger>
				<RequestDialogContent
					message={message}
					setMessage={setMessage}
					isPending={isPending}
					onSubmit={handleRequest}
					canAutoJoin={canAutoJoin}
				/>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="default" size="sm">
					<UserPlus className="h-4 w-4 mr-2" />
					{canAutoJoin ? "Join Society" : "Request to Join"}
				</Button>
			</DialogTrigger>
			<RequestDialogContent
				message={message}
				setMessage={setMessage}
				isPending={isPending}
				onSubmit={handleRequest}
				canAutoJoin={canAutoJoin}
			/>
		</Dialog>
	);
}

function RequestDialogContent({
	message,
	setMessage,
	isPending,
	onSubmit,
	canAutoJoin,
}: {
	message: string;
	setMessage: (v: string) => void;
	isPending: boolean;
	onSubmit: () => void;
	canAutoJoin: boolean;
}) {
	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>
					{canAutoJoin ? "Join Society" : "Request to Join Society"}
				</DialogTitle>
				<DialogDescription>
					{canAutoJoin ?
						"You will be added immediately. No approval needed."
					:	"Your request will be reviewed by the society president or secretary."
					}
				</DialogDescription>
			</DialogHeader>
			<div className="space-y-3 py-2">
				<div className="space-y-1.5">
					<Label htmlFor="message">Message (optional)</Label>
					<Textarea
						id="message"
						placeholder="Why would you like to join this society?"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						rows={3}
						maxLength={300}
					/>
					<p className="text-xs text-muted-foreground text-right">
						{message.length}/300
					</p>
				</div>
			</div>
			<DialogFooter>
				<Button onClick={onSubmit} disabled={isPending}>
					{isPending ?
						"Submitting..."
					: canAutoJoin ?
						"Join Society"
					:	"Submit Request"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
