"use client";

import {
	cancelJoinRequest,
	requestToJoinSociety,
	type PublicSocietyItem,
} from "@/app/actions/society.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	LogIn,
	ShieldAlert,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface PublicJoinSocietyDialogProps {
	society: PublicSocietyItem;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parishId: string;
	currentRole?: string | null;
	userOrganizationId?: string | null;
}

export function PublicJoinSocietyDialog({
	society,
	open,
	onOpenChange,
	parishId,
	currentRole,
	userOrganizationId,
}: PublicJoinSocietyDialogProps) {
	const router = useRouter();
	const [status, setStatus] = useState<PublicSocietyItem["userStatus"]>(
		society.userStatus,
	);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setStatus(society.userStatus);
	}, [society.userStatus]);

	const canAutoJoin =
		currentRole === "PARISH_ADMIN" || currentRole === "PARISH_SECRETARY";

	const callbackUrl = `/dashboard?joinSociety=${society.id}`;
	const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
	const registerUrl = `/auth/register?organizationId=${parishId}&callbackUrl=${encodeURIComponent(
		callbackUrl,
	)}`;

	const handleRequest = () => {
		startTransition(async () => {
			const res = await requestToJoinSociety(
				society.id,
				message || undefined,
			);
			if (res.success) {
				toast.success(res.message);
				setStatus(canAutoJoin ? "MEMBER" : "PENDING");
				setMessage("");
				router.refresh();
			} else {
				toast.error(res.message);
			}
		});
	};

	const handleCancel = () => {
		startTransition(async () => {
			const res = await cancelJoinRequest(society.id);
			if (res.success) {
				toast.success(res.message);
				setStatus("NONE");
				router.refresh();
			} else {
				toast.error(res.message);
			}
		});
	};

	if (status === "WRONG_PARISH") {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[460px]">
					<DialogHeader>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<AlertCircle className="h-6 w-6" />
						</div>
						<DialogTitle className="text-xl">
							Different Parish
						</DialogTitle>
						<DialogDescription className="text-sm">
							You cannot request membership in societies outside your registered parish.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
							<p>
								Parish societies and pious organizations are restricted to registered parishioners and staff belonging to that specific parish.
							</p>
							<p className="text-xs">
								To join a society, please explore and join the societies registered under your own parish.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 mt-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Dismiss
						</Button>
						<Button asChild onClick={() => onOpenChange(false)}>
							<Link href="/dashboard/societies">
								Show Available Societies
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<div className="flex items-center gap-2 mb-1">
						<Badge variant="outline" className="text-xs">
							Society
						</Badge>
						{society.patronSaint && (
							<span className="text-xs text-muted-foreground">
								Patron: {society.patronSaint}
							</span>
						)}
					</div>
					<DialogTitle className="text-xl">
						{society.name}
					</DialogTitle>
					<DialogDescription className="line-clamp-2">
						{society.description ||
							"Join this parish society to participate in meetings, activities, and community service."}
					</DialogDescription>
				</DialogHeader>

				{/* Society Quick Meta */}
				<div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5 text-muted-foreground">
					<div className="flex items-center justify-between">
						<span className="flex items-center gap-1.5 font-medium text-foreground">
							<Users className="h-3.5 w-3.5 text-primary" />
							{society.memberCount} active member
							{society.memberCount === 1 ? "" : "s"}
						</span>
						{society.monthlyDueAmount ? (
							<span>
								Dues: ₦{society.monthlyDueAmount.toLocaleString()}/mo
							</span>
						) : null}
					</div>
					{society.meetingSchedule && (
						<div className="flex items-center gap-1.5">
							<Calendar className="h-3.5 w-3.5 text-primary" />
							<span>Meets: {society.meetingSchedule}</span>
						</div>
					)}
				</div>

				{/* State A: Unauthenticated */}
				{status === "UNAUTHENTICATED" && (
					<div className="space-y-4 py-2">
						<Alert className="border-primary/20 bg-primary/5">
							<LogIn className="h-4 w-4 text-primary" />
							<AlertTitle>Sign in required</AlertTitle>
							<AlertDescription className="text-xs">
								You need to sign in or create an account with this
								parish to join or request membership in this
								society.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<Button asChild className="w-full">
								<Link href={loginUrl}>
									<LogIn className="mr-2 h-4 w-4" />
									Log in to Continue
								</Link>
							</Button>
							<Button asChild variant="outline" className="w-full">
								<Link href={registerUrl}>
									<UserPlus className="mr-2 h-4 w-4" />
									Register as Parishioner
								</Link>
							</Button>
						</div>
					</div>
				)}

				{/* State B: Already a Member */}
				{status === "MEMBER" && (
					<div className="space-y-4 py-2">
						<Alert className="border-green-500/30 bg-green-500/10 text-green-900 dark:text-green-200">
							<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
							<AlertTitle>Already a member</AlertTitle>
							<AlertDescription className="text-xs">
								You are already an active member of{" "}
								<strong>{society.name}</strong>.
							</AlertDescription>
						</Alert>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Close
							</Button>
							<Button asChild onClick={() => onOpenChange(false)}>
								<Link href={`/dashboard/societies/${society.id}`}>
									View Society Dashboard
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
					</div>
				)}

				{/* State D: Inappropriate Role */}
				{status === "WRONG_ROLE" && (
					<div className="space-y-4 py-2">
						<Alert variant="destructive">
							<ShieldAlert className="h-4 w-4" />
							<AlertTitle>Access restricted</AlertTitle>
							<AlertDescription className="text-xs">
								Your account role does not have permission to join
								parish societies. Only registered parishioners and
								parish staff can join.
							</AlertDescription>
						</Alert>

						<div className="flex justify-end">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Dismiss
							</Button>
						</div>
					</div>
				)}

				{/* State E: Request Pending */}
				{status === "PENDING" && (
					<div className="space-y-4 py-2">
						<Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
							<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							<AlertTitle>Request Pending Approval</AlertTitle>
							<AlertDescription className="text-xs">
								Your request to join <strong>{society.name}</strong>{" "}
								is currently pending review by the society
								president or secretary.
							</AlertDescription>
						</Alert>

						<div className="flex items-center justify-between pt-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
								disabled={isPending}
								className="text-destructive hover:text-destructive"
							>
								{isPending ? "Cancelling..." : "Cancel Request"}
							</Button>
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Close
							</Button>
						</div>
					</div>
				)}

				{/* State F: Eligible to Join / Request */}
				{(status === "NONE" || status === "REJECTED") && (
					<div className="space-y-4 py-2">
						{status === "REJECTED" && (
							<Alert variant="default" className="border-amber-500/30 bg-amber-500/10 text-xs">
								<AlertCircle className="h-4 w-4 text-amber-600" />
								<AlertTitle className="text-xs font-semibold">
									Previous request not approved
								</AlertTitle>
								<AlertDescription className="text-xs">
									You may submit a new request to join this society.
								</AlertDescription>
							</Alert>
						)}

						{canAutoJoin ? (
							<p className="text-xs text-muted-foreground flex items-center gap-1.5">
								<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
								As parish staff, your membership will be active
								immediately without review.
							</p>
						) : (
							<div className="space-y-1.5">
								<Label htmlFor="join-message" className="text-xs font-medium">
									Message to Society Leadership (optional)
								</Label>
								<Textarea
									id="join-message"
									placeholder="Tell the leadership why you would like to join..."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={3}
									maxLength={300}
									className="text-sm"
								/>
								<p className="text-[11px] text-muted-foreground text-right">
									{message.length}/300
								</p>
							</div>
						)}

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button onClick={handleRequest} disabled={isPending}>
								{isPending ? (
									"Submitting..."
								) : canAutoJoin ? (
									"Join Society"
								) : (
									<>
										<UserPlus className="mr-2 h-4 w-4" />
										Submit Join Request
									</>
								)}
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
