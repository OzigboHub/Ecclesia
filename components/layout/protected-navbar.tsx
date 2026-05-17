"use client";

import { logout } from "@/app/actions/auth.actions";
import { getAllOrganizationsWithMetrics } from "@/app/actions/super-admin.actions";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import {
	ADMIN_EXTENDED,
	SIDEBAR,
	SUPERADMIN_EXTENDED,
	SUPERADMIN_SIDEBAR,
} from "@/lib/const";
import {
	canBookAppointments,
	canBookMassIntentions,
	canEditOrganizationProfile,
	canManageFinancials,
	canManageMassIntentions,
	canManageOrganizations,
	canManageParishioners,
	canManageUsers,
	canRecordPayments,
	canViewLiveStreams,
	canViewMassCalendar,
	canViewSocieties,
	canViewSessions,
	isSocietyHead,
} from "@/lib/permissions";
import { getInitials } from "@/lib/utils";
import { Download, LogOut, Menu, Settings, X } from "lucide-react";
import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OrganizationContextSwitcher } from "../admin/organization-context-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

export default function ProtectedNavbar({
	session,
}: {
	session: Session | null;
}) {
	const [open, setOpen] = useState(false);
	const pathName = usePathname();
	const { canInstall, install } = usePwaInstall();
	const user = session?.user;
	const userRole = user?.role;
	const isSuperAdmin = userRole === "SUPER_ADMIN";
	const contextId = user?.organizationId;
	const isParishioner = userRole === "PARISHIONER";
	const isSocietyPresident = userRole === "SOCIETY_PRESIDENT";
	const isOutstationAdmin = userRole === "OUTSTATION_ADMIN";

	const [organizations, setOrganizations] = useState<
		{ id: string; name: string }[]
	>([]);
	const [mySocietyId, setMySocietyId] = useState<string | null>(null);
	const isSocietyHeadRole = isSocietyHead(userRole ?? "");

	useEffect(() => {
		if (isSuperAdmin) {
			getAllOrganizationsWithMetrics(1, 100).then((result) => {
				if (result.success && result.data) {
					setOrganizations(
						result.data.data.map((org) => ({
							id: org.id,
							name: org.name,
						})),
					);
				}
			});
		}
	}, [isSuperAdmin]);

	useEffect(() => {
		if (userRole && isSocietyHead(userRole)) {
			import("@/app/actions/society.actions").then(
				({ getSocietyForCurrentUser }) => {
					getSocietyForCurrentUser().then((result) => {
						if (result.success && result.data) {
							setMySocietyId(result.data.id);
						}
					});
				},
			);
		}
	}, [userRole]);

	const PARISHIONER_LINKS = [
		"Dashboard",
		"Mass Intentions",
		"Mass Calendar",
		"Appointments",
		"Announcements",
		"Societies",
		"Live Streams",
	];

	const OUTSTATION_ADMIN_LINKS = [
		"Dashboard",
		"Parishioners",
		"Mass Calendar",
		"Mass Intentions",
		"Appointments",
		"Announcements",
		"Societies",
		"Organization",
		"Payments",
		"Parish Finances",
		"Live Streams",
	];

	const mainNav = SIDEBAR.filter((item) => {
		if (!userRole) return false;
		if (isSuperAdmin && !contextId) return false;

		if (isParishioner) return PARISHIONER_LINKS.includes(item.name);

		if (isOutstationAdmin)
			return OUTSTATION_ADMIN_LINKS.includes(item.name);

		if (item.name === "Parishioners")
			return canManageParishioners(userRole);
		if (item.name === "Payments")
			return canRecordPayments(userRole) && !isSocietyHeadRole;
		if (item.name === "Mass Intentions")
			return canBookMassIntentions(userRole);
		if (item.name === "Mass Calendar") return canViewMassCalendar(userRole);
		if (item.name === "Mass Schedule")
			return canManageMassIntentions(userRole);
		if (item.name === "Appointments") return canBookAppointments(userRole);
		if (item.name === "Societies") return canViewSocieties(userRole);
		if (item.name === "Live Streams") return canViewLiveStreams(userRole);
		if (item.name === "Parish Finances")
			return canManageFinancials(userRole);
		if (item.name === "Sessions") return canViewSessions(userRole);
		if (item.name === "Organization")
			return canEditOrganizationProfile(userRole);
		if (item.name === "Settings") return isSuperAdmin;
		return true;
	});

	const filteredAdmin = ADMIN_EXTENDED.filter((item) => {
		if (!userRole) return false;
		if (isSuperAdmin) return false;
		if (item.name === "Manage Organizations")
			return canManageOrganizations(userRole);
		if (item.name === "Manage Users") return canManageUsers(userRole);
		return false;
	});

	const handleToggleOpen = () => {
		if (window.innerWidth > 768) return;
		setOpen(!open);
	};

	if (!user) return null;

	return (
		<div className="fixed inset-x-0 top-0 z-50 bg-secondary/95 backdrop-blur lg:left-[280px] lg:w-[calc(100%-280px)]">
			<div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
				<div className="lg:hidden inline w-28">
					<Image
						src={"/standalone-golden-yellow-logo-typography.png"}
						width={"1000"}
						height={"1000"}
						alt="logo"
						className="w-full object-cover"
					/>
				</div>

				<div className="flex w-full items-center justify-end gap-3">
					<Link
						href="/profile"
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						<Avatar>
							<AvatarImage
								src={user?.displayPicture || undefined}
								alt={user?.name ?? "User"}
							/>
							<AvatarFallback className="bg-primary text-secondary font-extrabold">
								{getInitials(user?.name ?? "")}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col items-start text-left">
							<div className="flex flex-row-reverse gap-4">
								<p className="text-primary font-bold">
									{user?.name}
								</p>
							</div>
							<Badge className="text-[10px]">
								{user?.role.replaceAll("_", " ")}
							</Badge>
						</div>
					</Link>
					<button
						onClick={handleToggleOpen}
						className="lg:hidden p-1 text-primary"
					>
						{open ?
							<X className="w-5 h-5" />
						:	<Menu className="w-5 h-5" />}
					</button>
				</div>
			</div>

			{open && (
				<div className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] bg-secondary px-3 py-4 overflow-y-auto lg:hidden">
					<div className="mt-5">
						<div className="flex min-h-[calc(100vh-10rem)] flex-col justify-between">
							<div className="flex flex-col gap-3">
								{isSuperAdmin && (
									<div className="px-2 pb-2">
										<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
											System Admin
										</p>
										{SUPERADMIN_SIDEBAR.map((i, k) => (
											<Link
												href={i.href}
												onClick={() => setOpen(false)}
												key={k}
												className={`${
													pathName === i.href ?
														"text-secondary bg-primary "
													:	" text-white hover:bg-white/10"
												} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
											>
												<div className="shrink-0">
													{i.icon}
												</div>
												<div className="text-[13px] font-medium">
													{i.name}
												</div>
											</Link>
										))}
										<Separator className="my-3 bg-white/10" />
									</div>
								)}

								{isSuperAdmin && (
									<div className="px-2 mb-4">
										<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-3">
											Organization Context
										</p>
										<OrganizationContextSwitcher
											organizations={organizations}
											currentOrgId={contextId}
										/>
									</div>
								)}

								{(!isSuperAdmin || contextId) && (
									<div className="px-2">
										{contextId && (
											<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
												Viewing Parish
											</p>
										)}
										{mainNav.map((i, k) => (
											<Link
												href={i.href}
												onClick={() => setOpen(false)}
												key={k}
												className={`${
													pathName === i.href ?
														"text-secondary bg-primary "
													:	" text-white hover:bg-white/10"
												} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
											>
												<div className="shrink-0">
													{i.icon}
												</div>
												<div className="text-[13px] font-medium">
													{i.name}
												</div>
											</Link>
										))}
										{mySocietyId && (
											<Link
												href={`/dashboard/societies/${mySocietyId}/manage`}
												onClick={() => setOpen(false)}
												className={`${
													(
														pathName.includes(
															`/societies/${mySocietyId}/manage`,
														)
													) ?
														"text-secondary bg-primary "
													:	" text-white hover:bg-white/10"
												} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
											>
												<div className="shrink-0">
													<Settings className="w-5 h-5" />
												</div>
												<div className="text-[13px] font-medium">
													My Society
												</div>
											</Link>
										)}
									</div>
								)}
							</div>

							<div className="mt-5 px-2">
								{!isSuperAdmin && filteredAdmin.length > 0 && (
									<>
										<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
											Manage
										</p>
										<div className="mt-2">
											{filteredAdmin.map((i, k) => (
												<Link
													onClick={() =>
														setOpen(false)
													}
													href={i.href}
													key={k}
													className={`${
														pathName === i.href ?
															"text-secondary bg-primary "
														:	" text-white hover:bg-white/10"
													} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
												>
													<div className="shrink-0">
														{i.icon}
													</div>
													<div className="text-[13px] font-medium">
														{i.name}
													</div>
												</Link>
											))}
										</div>
									</>
								)}

								{isSuperAdmin && (
									<div className="mt-4">
										<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
											Admin Tools
										</p>
										<div className="mt-2">
											{SUPERADMIN_EXTENDED.map((i, k) => (
												<Link
													onClick={() =>
														setOpen(false)
													}
													href={i.href}
													key={k}
													className={`${
														pathName === i.href ?
															"text-secondary bg-primary "
														:	" text-white hover:bg-white/10"
													} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
												>
													<div className="shrink-0">
														{i.icon}
													</div>
													<div className="text-[13px] font-medium">
														{i.name}
													</div>
												</Link>
											))}
										</div>
									</div>
								)}

								<Separator className="my-4 bg-white/10" />
								<Link
									href="/profile"
									onClick={() => setOpen(false)}
									className={`${
										pathName === "/profile" ?
											"text-secondary bg-primary "
										:	" text-white hover:bg-white/10"
									} items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}
								>
									<div className="text-[13px] font-medium">
										My Profile
									</div>
								</Link>
								{canInstall && (
									<div
										onClick={install}
										className="px-4 py-2 text-primary cursor-pointer hover:bg-white/10 rounded-[10px] gap-4 flex items-center mb-1 transition-all"
									>
										<Download className="w-5 h-5 shrink-0" />
										<p className="text-[13px] font-bold">
											Install App
										</p>
									</div>
								)}
								<div
									onClick={async () => {
										await logout();
									}}
									className="px-4 py-2 text-primary cursor-pointer hover:bg-white/10 rounded-[10px] gap-4 flex items-center mb-6 transition-all"
								>
									<LogOut className="w-5 h-5 shrink-0" />
									<p className="text-[13px] font-bold">
										Logout
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
