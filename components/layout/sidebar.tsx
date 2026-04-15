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
	canMakePayments,
	canManageFinancials,
	canManageMassIntentions,
	canManageOrganizations,
	canManageParishioners,
	canManageUsers,
	canRecordPayments,
	canViewLiveStreams,
	canViewMassCalendar,
	canViewSocieties,
	isSocietyHead,
} from "@/lib/permissions";
import { Download, LogOut, Settings, User } from "lucide-react";
import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OrganizationContextSwitcher } from "../admin/organization-context-switcher";
import { Separator } from "../ui/separator";

export default function Sidebar({ session }: { session: Session | null }) {
	const pathName = usePathname();
	const { canInstall, install } = usePwaInstall();
	const userRole = session?.user?.role;
	const isSuperAdmin = userRole === "SUPER_ADMIN";
	const isSocietyPresident = userRole === "SOCIETY_PRESIDENT";
	const linkBaseClass =
		"items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all";
	const getLinkClass = (href: string) =>
		`${
			pathName === href ?
				"text-secondary bg-primary "
			:	" text-white hover:bg-white/10"
		} ${linkBaseClass}`;

	// Organization context state (in a real app, this might come from the session or a cookie)
	// For this refactor, we'll assume it's part of the session if a super admin has switched context
	const contextId = session?.user?.organizationId;

	const [organizations, setOrganizations] = useState<
		{ id: string; name: string }[]
	>([]);
	const [mySocietyId, setMySocietyId] = useState<string | null>(null);

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

	const isParishioner = userRole === "PARISHIONER";

	// Parishioners get a curated set of links
	const PARISHIONER_LINKS = [
		"Dashboard",
		"Pay",
		"Mass Intentions",
		"Mass Calendar",
		"Appointments",
		"Announcements",
		"Societies",
		"Live Streams",
	];

	// Filter sidebar items based on role or active context
	const mainNav = SIDEBAR.filter((item) => {
		if (!userRole) return false;
		// If super admin and no context, show super admin primary nav
		if (isSuperAdmin && !contextId) return false;

		// Parishioners only see their curated links
		if (isParishioner) return PARISHIONER_LINKS.includes(item.name);

		if (item.name === "Parishioners")
			return canManageParishioners(userRole);
		if (item.name === "Payments")
			return canRecordPayments(userRole) && !isSocietyPresident;
		if (item.name === "Pay") return canMakePayments(userRole);
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
		if (item.name === "Settings") return isSuperAdmin;
		return true;
	});

	// Filter admin items based on role
	const filteredAdmin = ADMIN_EXTENDED.filter((item) => {
		if (!userRole) return false;
		if (isSuperAdmin) return false;
		if (item.name === "Manage Organizations")
			return canManageOrganizations(userRole);
		if (item.name === "Manage Users") return canManageUsers(userRole);
		return false;
	});

	if (!session?.user) return null;

	return (
		<aside className="sidebar-scroll hidden w-[280px] bg-secondary h-screen shrink-0 py-5 px-3 items-center lg:flex flex-col gap-6 overflow-x-hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
			<Link href="/dashboard">
				<Image
					src={"/standalone-golden-yellow-logo-typography.png"}
					width={"150"}
					height={"150"}
					alt="logo"
					className="w-37.5 object-cover"
				/>
			</Link>

			<div className="flex h-full min-h-0 w-full flex-col">
				<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
					{/* Super Admin Primary Nav */}
					{isSuperAdmin && (
						<>
							<div className="px-2 pb-2">
								<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
									System Admin
								</p>
								{SUPERADMIN_SIDEBAR.map((i) => (
									<Link
										href={i.href}
										key={i.href}
										className={getLinkClass(i.href)}
									>
										<div className="shrink-0">{i.icon}</div>
										<div className="text-[13px] font-medium">
											{i.name}
										</div>
									</Link>
								))}
							</div>
							<Separator className="my-2 bg-white/10" />
						</>
					)}

					{/* Context Switcher - Only for Super Admin */}
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

					{/* Standard Navigation (or Context Navigation) */}
					{(!isSuperAdmin || contextId) && (
						<div className="px-2">
							{contextId && (
								<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
									Viewing Parish
								</p>
							)}
							{mainNav.map((i) => (
								<Link
									href={i.href}
									key={i.href}
									className={getLinkClass(i.href)}
								>
									<div className="shrink-0">{i.icon}</div>
									<div className="text-[13px] font-medium">
										{i.name}
									</div>
								</Link>
							))}
							{/* Society Head Management Link */}
							{mySocietyId && (
								<Link
									href={`/dashboard/societies/${mySocietyId}/manage`}
									className={`${
										(
											pathName.includes(
												`/societies/${mySocietyId}/manage`,
											)
										) ?
											"text-secondary bg-primary "
										:	" text-white hover:bg-white/10"
									} ${linkBaseClass}`}
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

				<div className="px-2 pt-4">
					{/* Role Specific Admin Section (Non-Super Admin) */}
					{!isSuperAdmin && filteredAdmin.length > 0 && (
						<>
							<Separator className="my-4 bg-white/10" />
							<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
								Manage
							</p>
							<div className="mt-2">
								{filteredAdmin.map((i) => (
									<Link
										href={i.href}
										key={i.href}
										className={getLinkClass(i.href)}
									>
										<div className="shrink-0">{i.icon}</div>
										<div className="text-[13px] font-medium">
											{i.name}
										</div>
									</Link>
								))}
							</div>
						</>
					)}

					{/* Super Admin Secondary Nav */}
					{isSuperAdmin && (
						<div className="mt-4">
							{SUPERADMIN_EXTENDED.map((i) => (
								<Link
									href={i.href}
									key={i.href}
									className={getLinkClass(i.href)}
								>
									<div className="shrink-0">{i.icon}</div>
									<div className="text-[13px] font-medium">
										{i.name}
									</div>
								</Link>
							))}
						</div>
					)}

					<div className="mt-6">
						<Separator className="my-4 bg-white/10" />
						<Link
							href="/profile"
							className={getLinkClass("/profile")}
						>
							<User className="w-5 h-5 shrink-0" />
							<p className="text-[13px] font-bold">My Profile</p>
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
							<p className="text-[13px] font-bold">Logout</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
