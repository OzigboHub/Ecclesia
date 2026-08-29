"use client";

import {
	getSocietyJoinContext,
	type PublicSocietyItem,
} from "@/app/actions/society.actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { PublicJoinSocietyDialog } from "../public/public-join-society-dialog";

interface DashboardJoinSocietyHandlerProps {
	userRole?: string | null;
	userOrganizationId?: string | null;
}

function DashboardJoinSocietyHandlerContent({
	userRole,
	userOrganizationId,
}: DashboardJoinSocietyHandlerProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const [society, setSociety] = useState<PublicSocietyItem | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isNotFoundDialogOpen, setIsNotFoundDialogOpen] = useState(false);

	const clearJoinParam = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("joinSociety");
		const next = params.toString();
		startTransition(() => {
			router.replace(next ? `${pathname}?${next}` : pathname, {
				scroll: false,
			});
		});
	};

	useEffect(() => {
		const targetSocietyId = searchParams.get("joinSociety");
		if (!targetSocietyId) return;

		let isMounted = true;
		async function fetchSocietyContext() {
			const res = await getSocietyJoinContext(targetSocietyId!);
			if (!isMounted) return;

			if (res.success && res.data?.society) {
				setSociety(res.data.society);
				setIsDialogOpen(true);
			} else {
				setIsNotFoundDialogOpen(true);
			}
		}

		fetchSocietyContext();

		return () => {
			isMounted = false;
		};
	}, [searchParams]);

	return (
		<>
			{society && (
				<PublicJoinSocietyDialog
					society={society}
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) clearJoinParam();
					}}
					parishId={society.organizationId}
					currentRole={userRole}
					userOrganizationId={userOrganizationId}
				/>
			)}

			{/* Society Not Found Dialog */}
			<Dialog
				open={isNotFoundDialogOpen}
				onOpenChange={(open) => {
					setIsNotFoundDialogOpen(open);
					if (!open) clearJoinParam();
				}}
			>
				<DialogContent className="sm:max-w-[440px]">
					<DialogHeader>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<SearchX className="h-6 w-6" />
						</div>
						<DialogTitle className="text-xl">Society Not Found</DialogTitle>
						<DialogDescription className="text-sm">
							The society you are trying to join does not exist or is no
							longer active.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
						Please check the societies available in your parish from the
						societies menu or public parish page.
					</div>

					<DialogFooter className="mt-2">
						<Button
							variant="outline"
							onClick={() => {
								setIsNotFoundDialogOpen(false);
								clearJoinParam();
							}}
						>
							Dismiss
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function DashboardJoinSocietyHandler(
	props: DashboardJoinSocietyHandlerProps,
) {
	return (
		<Suspense fallback={null}>
			<DashboardJoinSocietyHandlerContent {...props} />
		</Suspense>
	);
}
