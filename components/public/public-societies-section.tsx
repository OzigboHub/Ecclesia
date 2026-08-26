"use client";

import type { PublicSocietyItem } from "@/app/actions/society.actions";
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
import {
	Calendar,
	CheckCircle2,
	Clock,
	Crown,
	SearchX,
	ShieldCheck,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { PublicJoinSocietyDialog } from "./public-join-society-dialog";

interface PublicSocietiesSectionProps {
	parishId: string;
	societies: PublicSocietyItem[];
	currentRole?: string | null;
	userOrganizationId?: string | null;
	showViewAllLink?: boolean;
}

function PublicSocietiesSectionContent({
	parishId,
	societies,
	currentRole,
	userOrganizationId,
	showViewAllLink = false,
}: PublicSocietiesSectionProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const [activeSociety, setActiveSociety] =
		useState<PublicSocietyItem | null>(null);
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

	// Auto-open society join modal if redirected back with ?joinSociety=[id]
	useEffect(() => {
		const targetSocietyId = searchParams.get("joinSociety");
		if (targetSocietyId) {
			const matched = societies.find((s) => s.id === targetSocietyId);
			if (matched) {
				setActiveSociety(matched);
				setIsDialogOpen(true);
			} else {
				setIsNotFoundDialogOpen(true);
			}
		}
	}, [searchParams, societies]);

	const handleOpenJoin = (society: PublicSocietyItem) => {
		setActiveSociety(society);
		setIsDialogOpen(true);
	};

	const notFoundModal = (
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
					<DialogTitle className="text-xl">
						Society Not Found
					</DialogTitle>
					<DialogDescription className="text-sm">
						The society you are trying to join does not exist in this parish
						or is no longer active.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
					You can only join societies that are actively registered with
					this parish. Explore the list of available societies below.
				</div>

				<DialogFooter className="gap-2 sm:gap-0 mt-2">
					<Button
						variant="outline"
						onClick={() => {
							setIsNotFoundDialogOpen(false);
							clearJoinParam();
						}}
					>
						Dismiss
					</Button>
					<Button
						onClick={() => {
							setIsNotFoundDialogOpen(false);
							clearJoinParam();
							const element = document.getElementById("societies");
							element?.scrollIntoView({ behavior: "smooth" });
						}}
					>
						Browse Available Societies
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	if (societies.length === 0) {
		return (
			<section id="societies" className="space-y-6 scroll-mt-28">
				<div className="flex items-center gap-2">
					<Users className="h-5 w-5 text-primary" />
					<h2 className="text-2xl font-bold">Societies & Groups</h2>
				</div>
				<div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
					<Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
					<p className="text-base font-medium">No societies registered yet</p>
					<p className="mt-1 text-sm">
						Parish societies and pious organizations will appear here once
						created.
					</p>
				</div>
				{notFoundModal}
			</section>
		);
	}

	return (
		<section id="societies" className="space-y-6 scroll-mt-28">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						<h2 className="text-2xl font-bold">Societies & Groups</h2>
					</div>
					<p className="text-sm text-muted-foreground mt-0.5">
						Explore church societies, pious groups, and ministries in this
						parish.
					</p>
				</div>
				{showViewAllLink && societies.length > 3 && (
					<Button asChild variant="outline" size="sm">
						<Link href={`/p/${parishId}/societies`}>
							View all ({societies.length})
						</Link>
					</Button>
				)}
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{societies.map((society) => {
					const isMember = society.userStatus === "MEMBER";
					const isPending = society.userStatus === "PENDING";

					return (
						<div
							key={society.id}
							className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs transition hover:shadow-md"
						>
							<div className="space-y-3">
								<div className="flex items-start justify-between gap-2">
									<h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-1">
										{society.name}
									</h3>
									{isMember && (
										<Badge
											variant="secondary"
											className="shrink-0 bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
										>
											<CheckCircle2 className="mr-1 h-3 w-3" />
											Member
										</Badge>
									)}
									{isPending && (
										<Badge
											variant="outline"
											className="shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
										>
											<Clock className="mr-1 h-3 w-3" />
											Pending
										</Badge>
									)}
								</div>

								{society.patronSaint && (
									<div className="flex items-center gap-1.5 text-xs text-primary font-medium">
										<Crown className="h-3.5 w-3.5" />
										<span>Patron: {society.patronSaint}</span>
									</div>
								)}

								<p className="text-sm text-muted-foreground line-clamp-3">
									{society.description ||
										"A fellowship community dedicated to spiritual growth and parish service."}
								</p>

								<div className="space-y-1.5 pt-2 border-t text-xs text-muted-foreground">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5">
											<Users className="h-3.5 w-3.5 text-muted-foreground/70" />
											{society.memberCount} member
											{society.memberCount === 1 ? "" : "s"}
										</span>
										{society.monthlyDueAmount ? (
											<span className="font-medium text-foreground">
												₦
												{society.monthlyDueAmount.toLocaleString()}
												/mo
											</span>
										) : (
											<span className="text-muted-foreground/80">
												No monthly dues
											</span>
										)}
									</div>

									{society.meetingSchedule && (
										<div className="flex items-center gap-1.5 line-clamp-1">
											<Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
											<span>Meets: {society.meetingSchedule}</span>
										</div>
									)}

									{society.presidentName && (
										<div className="flex items-center gap-1.5 line-clamp-1">
											<UserCheck className="h-3.5 w-3.5 text-muted-foreground/70" />
											<span>President: {society.presidentName}</span>
										</div>
									)}
								</div>
							</div>

							<div className="mt-5 pt-3 border-t">
								{isMember ? (
									<Button
										asChild
										variant="outline"
										size="sm"
										className="w-full"
									>
										<Link
											href={`/dashboard/societies/${society.id}`}
										>
											<ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
											View Dashboard
										</Link>
									</Button>
								) : isPending ? (
									<Button
										variant="outline"
										size="sm"
										className="w-full text-amber-700 dark:text-amber-300 border-amber-500/30"
										onClick={() => handleOpenJoin(society)}
									>
										<Clock className="mr-2 h-4 w-4" />
										Request Pending
									</Button>
								) : (
									<Button
										size="sm"
										className="w-full"
										onClick={() => handleOpenJoin(society)}
									>
										<UserPlus className="mr-2 h-4 w-4" />
										Join Society
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{activeSociety && (
				<PublicJoinSocietyDialog
					society={activeSociety}
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					parishId={parishId}
					currentRole={currentRole}
					userOrganizationId={userOrganizationId}
				/>
			)}

			{notFoundModal}
		</section>
	);
}

export function PublicSocietiesSection(props: PublicSocietiesSectionProps) {
	return (
		<Suspense
			fallback={
				<section id="societies" className="space-y-6 scroll-mt-28">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						<h2 className="text-2xl font-bold">Societies & Groups</h2>
					</div>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-48 rounded-xl border bg-card/50 animate-pulse"
							/>
						))}
					</div>
				</section>
			}
		>
			<PublicSocietiesSectionContent {...props} />
		</Suspense>
	);
}
