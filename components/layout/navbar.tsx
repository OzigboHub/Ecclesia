"use client";

import { useSession } from "next-auth/react";
import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { getInitials } from "@/lib/utils";

export default function Navbar() {
	const { data: session } = useSession();
	return (
		<div className=" bg-secondary   py-[10px] px-[20px] ">
			<div className=" flex items-center justify-end flex-row gap-3">
				<Avatar>
					<AvatarFallback className=" bg-primary text-secondary font-extrabold">
						{getInitials(session?.user.name ?? "")}
					</AvatarFallback>
				</Avatar>
				<div className=" flex flex-col items-start text-left">
					<div className=" flex flex-row-reverse  gap-4">
						<p className=" text-primary  font-bold">
							{session?.user.name}
						</p>
					</div>
					<Badge className=" text-[10px]">
						{session?.user.role.replaceAll("_", " ")}
					</Badge>
					{/* <p className="  text-[12px]">{session?.user.email}</p> */}
				</div>
			</div>
		</div>
	);
}
