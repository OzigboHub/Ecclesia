"use client";

import { deleteSociety } from "@/app/actions/society.actions";
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
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteSocietyButtonProps {
	societyId: string;
	societyName: string;
}

export function DeleteSocietyButton({
	societyId,
	societyName,
}: DeleteSocietyButtonProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleDelete = () => {
		startTransition(async () => {
			const result = await deleteSociety(societyId);
			if (result.success) {
				toast.success(result.message);
				router.push("/dashboard/societies");
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm" className="gap-2">
					{isPending ?
						<Loader2 className="h-4 w-4 animate-spin" />
					:	<Trash2 className="h-4 w-4" />}
					Delete
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete society?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete {societyName} and its
						memberships. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
