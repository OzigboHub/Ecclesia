"use client";

import {
	ADMIN_EXTENDED,
	SIDEBAR,
	SUPERADMIN_EXTENDED,
	SUPERADMIN_SIDEBAR,
} from "@/lib/const";
import {
	canBookAppointments,
	canBookMassIntentions,
	canManageOrganizations,
	canManageParishioners,
	canManageUsers,
	canRecordPayments,
	canViewMassCalendar,
	canViewSocieties,
} from "@/lib/permissions";
import { getInitials } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

export default function ProtectedNavbar() {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathName = usePathname();
	const session = useSession();
	const user = session.data?.user;
	const userRole = user?.role;
	const isSuperAdmin = userRole === "SUPER_ADMIN";
	const contextId = user?.organizationId;

	const isParishioner = userRole === "PARISHIONER";

	const PARISHIONER_LINKS = [
		"Dashboard",
		"Mass Intentions",
		"Mass Calendar",
		"Appointments",
		"Announcements",
		"Societies",
	];

	const mainNav = SIDEBAR.filter((item) => {
		if (!userRole) return false;
		if (isSuperAdmin && !contextId) return false;

		if (isParishioner) return PARISHIONER_LINKS.includes(item.name);

		if (item.name === "Parishioners")
			return canManageParishioners(userRole);
		if (item.name === "Payments") return canRecordPayments(userRole);
		if (item.name === "Mass Intentions")
			return canBookMassIntentions(userRole);
		if (item.name === "Mass Calendar") return canViewMassCalendar(userRole);
		if (item.name === "Appointments") return canBookAppointments(userRole);
		if (item.name === "Societies") return canViewSocieties(userRole);
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

	return (
		<div className="z-50 bg-secondary fixed w-full lg:w-[84%] py-2.5 lg:px-15">
			<div className="w-full flex items-center justify-between">
				<div className="lg:hidden inline w-25">
					<Image
						src={"/standalone-golden-yellow-logo-typography.png"}
						width={"1000"}
						height={"1000"}
						alt="logo"
						className="w-full object-cover"
					/>
				</div>

				<div
					onClick={handleToggleOpen}
					className="w-full flex items-center justify-end flex-row gap-3"
				>
					<Avatar>
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
				</div>
			</div>

			{open && (
				<div className="bg-secondary absolute px-2.5 left-0 top-0 w-full h-screen">
					<div className="w-full py-2.5 flex items-center justify-between">
						<div className="lg:hidden inline w-25">
							<Image
								src={
									"/standalone-golden-yellow-logo-typography.png"
								}
								width={"1000"}
								height={"1000"}
								alt="logo"
								className="w-full object-cover"
							/>
						</div>
						<div
							onClick={handleToggleOpen}
							className="w-full flex items-center justify-end flex-row gap-3"
						>
							<Avatar>
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
								<div className="text-[12px] text-primary">
									<p>{user?.email}</p>
								</div>
							</div>
						</div>
					</div>
					<div className="mt-5">
						<div className="flex justify-between flex-col h-full">
							<div className="flex justify-between gap-3 flex-col">
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
													:	" text-white"
												}  items-center py-2.5  flex gap-5 rounded-[10px] px-5`}
											>
												<div>{i.icon}</div>
												<div className="text-[13px]">
													<p>{i.name}</p>
												</div>
											</Link>
										))}
										<Separator className="my-3" />
									</div>
								)}

								{(!isSuperAdmin || contextId) && (
									<div className="px-2">
										{contextId && isSuperAdmin ?
											<p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
												Viewing Organization
											</p>
										:	null}
										{mainNav.map((i, k) => (
											<Link
												href={i.href}
												onClick={() => setOpen(false)}
												key={k}
												className={`${
													pathName === i.href ?
														"text-secondary bg-primary "
													:	" text-white"
												}  items-center py-2.5  flex gap-5 rounded-[10px] px-5`}
											>
												<div>{i.icon}</div>
												<div className="text-[13px]">
													<p>{i.name}</p>
												</div>
											</Link>
										))}
									</div>
								)}
							</div>

							<div className="mt-5">
								{!isSuperAdmin && filteredAdmin.length > 0 && (
									<>
										<p className="text-[13px] text-primary font-bold">
											Manage
										</p>
										<div className="mt-2.5">
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
														:	" text-white"
													}  items-center py-2.5  flex gap-5 rounded-[10px] px-5`}
												>
													<div>{i.icon}</div>
													<div className="text-[13px]">
														<p>{i.name}</p>
													</div>
												</Link>
											))}
										</div>
									</>
								)}

								{isSuperAdmin && (
									<div className="mt-2.5">
										<p className="text-[13px] text-primary font-bold">
											Admin Tools
										</p>
										<div className="mt-2.5">
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
														:	" text-white"
													}  items-center py-2.5  flex gap-5 rounded-[10px] px-5`}
												>
													<div>{i.icon}</div>
													<div className="text-[13px]">
														<p>{i.name}</p>
													</div>
												</Link>
											))}
										</div>
									</div>
								)}

								<Separator className="my-5" />
								<div
									onClick={async () => {
										await signOut({ redirect: false });
										router.push("/auth/login");
									}}
									className="px-5 mt-5 text-primary cursor-pointer gap-5 flex flex-row"
								>
									<LogOut className="w-5 h-5" />
									<p className="text-[13px] font-extrabold">
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
