import {
	getSocieties,
	SocietyWithRelations,
} from "@/app/actions/society.actions";
import { auth } from "@/auth";
import { JoinRequestButton } from "@/components/societies/join-request-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import db from "@/lib/db";
import { canManageSocieties } from "@/lib/permissions";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SocietiesPage() {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect("/auth/login");
	}

	const canCreate = canManageSocieties(session.user.role);

	const isParishioner = session.user.role === "PARISHIONER";

	const result = await getSocieties();

	if (!result.success) {
		return (
			<div className="text-center py-10">
				<p className="text-destructive">{result.message}</p>
			</div>
		);
	}

	const societies: SocietyWithRelations[] = result.data ?? [];

	let membershipSet = new Set<string>();
	let joinRequestMap = new Map<string, "PENDING" | "REJECTED">();

	if (isParishioner && session.user.parishionerId) {
		const [memberships, joinRequests] = await Promise.all([
			db.societyMembership.findMany({
				where: { parishionerId: session.user.parishionerId },
				select: { societyId: true },
			}),
			db.societyJoinRequest.findMany({
				where: {
					parishionerId: session.user.parishionerId,
					status: { in: ["PENDING", "REJECTED"] },
				},
				select: { societyId: true, status: true },
			}),
		]);

		const typedMemberships = memberships as Array<{ societyId: string }>;
		membershipSet = new Set(typedMemberships.map((m) => m.societyId));

		const typedJoinRequests = joinRequests as Array<{
			societyId: string;
			status: string;
		}>;
		joinRequestMap = new Map(
			typedJoinRequests.map((r) => [
				r.societyId,
				r.status as "PENDING" | "REJECTED",
			]),
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Societies
					</h1>
					<p className="text-muted-foreground">
						{isParishioner ?
							"Browse and join church societies."
						:	"Manage church societies, groups, and organizations."}
					</p>
				</div>
				{canCreate && (
					<Button asChild>
						<Link href="/dashboard/societies/new">
							<PlusCircle className="mr-2 h-4 w-4" />
							New Society
						</Link>
					</Button>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{societies.length === 0 ?
					<div className="col-span-full">
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No societies found</EmptyTitle>
								<EmptyDescription>
									{isParishioner ?
										"No societies are available in your parish yet."
									:	"Create your first society to get started."
									}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				:	societies.map((society: SocietyWithRelations) => {
						const joinStatus =
							isParishioner ?
								membershipSet.has(society.id) ?
									"MEMBER"
								:	(joinRequestMap.get(society.id) ?? "NONE")
							:	null;

						return (
							<Card
								key={society.id}
								className="hover:shadow-md transition-shadow"
							>
								<CardHeader>
									<div className="flex justify-between items-start">
										<CardTitle className="text-xl">
											<Link
												href={`/dashboard/societies/${society.id}`}
												className="hover:underline"
											>
												{society.name}
											</Link>
										</CardTitle>
									</div>
									{society.description && (
										<CardDescription className="line-clamp-2">
											{society.description}
										</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<div className="space-y-3 text-sm">
										<div className="flex items-center text-muted-foreground">
											<Users className="mr-2 h-4 w-4" />
											<span>
												{society._count.members} Members
											</span>
										</div>

										{society.president && (
											<div className="pt-2 border-t">
												<span className="font-medium">
													President:
												</span>{" "}
												{society.president.firstName}{" "}
												{society.president.lastName}
											</div>
										)}

										{isParishioner &&
											joinStatus !== null && (
												<div className="pt-2 border-t">
													<JoinRequestButton
														societyId={society.id}
														initialStatus={
															joinStatus as
																| "NONE"
																| "PENDING"
																| "MEMBER"
																| "REJECTED"
														}
													/>
												</div>
											)}
									</div>
								</CardContent>
							</Card>
						);
					})
				}
			</div>
		</div>
	);
}
