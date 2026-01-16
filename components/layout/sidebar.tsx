"use client";

import { ADMIN_EXTENDED, SIDEBAR } from "@/lib/const";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import Image from "next/image";

export default function Sidebar() {
	const pathName = usePathname();
	// const { data: session } = useSession();

	return (
		<div className=" bg-secondary w-[20%] py-[20px] px-[10px] justify-start items-center  flex flex-col gap-11">
			<Image
				src={"/standalone-golden-yellow-logo-typography.png"}
				width={"1000"}
				height={"1000"}
				alt="logo"
				className=" w-[150px] object-cover"
			/>
			<div className=" flex justify-between flex-col h-full ">
				<div className="flex justify-between gap-3 flex-col">
					{SIDEBAR.map((i, k) => {
						return (
							<Link
								href={i.href}
								key={k}
								className={` ${
									pathName === i.href
										? "text-secondary bg-primary "
										: " text-white"
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

				<div className="">
					<p className="text-[13px] text-primary font-bold">Manage</p>
					<div className=" mt-[10px]">
						{ADMIN_EXTENDED.map((i, k) => {
							return (
								<Link
									href={i.href}
									key={k}
									className={` ${
										pathName === i.href
											? "text-secondary bg-primary "
											: " text-white"
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
						<div className=" px-[20px] mt-[20px] text-primary  gap-5 flex flex-row">
							<LogOut className=" w-5 h-5" />
							<p className=" text-[13px] font-extrabold">
								Logout
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
