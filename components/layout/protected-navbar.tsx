"use client";

import { ADMIN_EXTENDED, SIDEBAR } from "@/lib/const";
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
import { User } from "@prisma/client";

export default function ProtectedNavbar({ user }: { user: any }) {
	const [open, setOpen] = useState(false);
	// const { data: session, status } = useSession();
	const router = useRouter();
	const pathName = usePathname();

	const handleToggleOpen = () => {
		if (window.innerWidth > 768) return;
		setOpen(!open);
	};

	return (
		<div className=" z-50 bg-secondary fixed w-full lg:w-[84%] py-[10px] px-[10px] lg:px-[60px] ">
			<div className=" w-full flex items-center justify-between">
				<div className=" lg:hidden inline w-[100px] ">
					<Image
						src={"/standalone-golden-yellow-logo-typography.png"}
						width={"1000"}
						height={"1000"}
						alt="logo"
						className=" w-full object-cover"
					/>
				</div>

				<div
					onClick={handleToggleOpen}
					className="  w-full flex items-center justify-end flex-row gap-3"
				>
					<Avatar>
						<AvatarFallback className=" bg-primary text-secondary font-extrabold">
							{getInitials(user.name ?? "")}
						</AvatarFallback>
					</Avatar>
					<div className=" flex flex-col items-start text-left">
						<div className=" flex flex-row-reverse  gap-4">
							<p className=" text-primary  font-bold">
								{user.name}
							</p>
						</div>
						<Badge className=" text-[10px]">
							{user?.role.replaceAll("_", " ")}
						</Badge>
					</div>
				</div>
			</div>

			{open && (
				<div className=" bg-secondary absolute px-[10px] left-0 top-0 w-full h-screen">
					<div className=" w-full py-[10px] flex items-center justify-between">
						<div className=" lg:hidden inline w-[100px] ">
							<Image
								src={
									"/standalone-golden-yellow-logo-typography.png"
								}
								width={"1000"}
								height={"1000"}
								alt="logo"
								className=" w-full object-cover"
							/>
						</div>
						<div
							onClick={handleToggleOpen}
							className="  w-full flex items-center justify-end flex-row gap-3"
						>
							<Avatar>
								<AvatarFallback className=" bg-primary text-secondary font-extrabold">
									{getInitials(user.name ?? "")}
								</AvatarFallback>
							</Avatar>
							<div className=" flex flex-col items-start text-left">
								<div className=" flex flex-row-reverse  gap-4">
									<p className=" text-primary  font-bold">
										{user.name}
									</p>
								</div>
								<div className=" text-[12px] text-primary">
									<p>{user.email}</p>
								</div>
							</div>
						</div>
					</div>
					<div className=" mt-[20px]">
						<div className=" flex justify-between flex-col h-full ">
							<div className="flex justify-between gap-3 flex-col">
								{SIDEBAR.map((i, k) => {
									return (
										<Link
											href={i.href}
											onClick={() => setOpen(false)}
											key={k}
											className={` ${
												pathName === i.href ?
													"text-secondary bg-primary "
												:	" text-white"
											}  items-center py-[10px]  flex gap-5 rounded-[10px] px-[20px]`}
										>
											<div className="">{i.icon}</div>
											<div className=" text-[13px]">
												<p>{i.name}</p>
											</div>
										</Link>
									);
								})}
							</div>

							<div className=" mt-[20px]">
								<p className="text-[13px] text-primary font-bold">
									Manage
								</p>
								<div className=" mt-[10px]">
									{ADMIN_EXTENDED.map((i, k) => {
										return (
											<Link
												onClick={() => setOpen(false)}
												href={i.href}
												key={k}
												className={` ${
													pathName === i.href ?
														"text-secondary bg-primary "
													:	" text-white"
												}  items-center py-[10px]  flex gap-5 rounded-[10px] px-[20px]`}
											>
												<div className="">{i.icon}</div>
												<div className=" text-[13px]">
													<p>{i.name}</p>
												</div>
											</Link>
										);
									})}
									<Separator className="my-[20px]" />
									<div
										onClick={async () => {
											await signOut({ redirect: false });
											router.push("/auth/login");
										}}
										className=" px-[20px] mt-[20px] text-primary cursor-pointer  gap-5 flex flex-row"
									>
										<LogOut className=" w-5 h-5" />
										<p className=" text-[13px] font-extrabold">
											Logout
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
