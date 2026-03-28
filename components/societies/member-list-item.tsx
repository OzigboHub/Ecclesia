"use client";

import { removeMember } from "@/app/actions/society.actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface MemberListItemProps {
	societyId: string;
	membership: {
		parishionerId: string;
		joinedAt: Date;
		role: string; // Using string to match the Prisma return type inference or enum
		parishioner: {
			id: string;
			firstName: string;
			lastName: string;
			phone: string | null;
		};
	};
	readOnly?: boolean;
}

export function MemberListItem({
	societyId,
	membership,
	readOnly = false,
}: MemberListItemProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleRemove = () => {
		startTransition(async () => {
			const result = await removeMember(
				societyId,
				membership.parishionerId,
			);

			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case "PRESIDENT":
			case "VICE_PRESIDENT":
			case "SECRETARY":
			case "TREASURER":
				return "default";
			case "PRO":
			case "OTHER":
				return "secondary";
			default:
				return "outline";
		}
	};

	const formatRole = (role: string) => {
		return role
			.replace("_", " ")
			.toLowerCase()
			.replace(/\b\w/g, (l) => l.toUpperCase());
	};

	return (
		<li className="py-3 flex justify-between items-center">
			<div>
				<p className="font-medium">
					{membership.parishioner.firstName}{" "}
					{membership.parishioner.lastName}
				</p>
				<div className="flex gap-2 items-center">
					<p className="text-xs text-muted-foreground">
						{membership.parishioner.phone || "No phone"}
					</p>
					<span className="text-xs text-muted-foreground">•</span>
					<p className="text-xs text-muted-foreground">
						Joined{" "}
						{new Date(membership.joinedAt).toLocaleDateString()}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant={getRoleBadgeVariant(membership.role)}>
					{formatRole(membership.role)}
				</Badge>

				{!readOnly && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive hover:text-destructive/90"
							>
								{isPending ?
									<Loader2 className="h-4 w-4 animate-spin" />
								:	<Trash2 className="h-4 w-4" />}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Remove Member?
								</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to remove{" "}
									{membership.parishioner.firstName} from this
									society? This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleRemove}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Remove
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>
		</li>
	);
}
