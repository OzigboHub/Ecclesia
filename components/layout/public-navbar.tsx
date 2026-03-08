"use client";

import { NAVLINKS } from "@/lib/const";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

export default function PublicNavbar() {
	const [open, setOpen] = useState(false);
	return (
		<div className="  fixed z-50 w-full flex bg-secondary items-center py-[20px] px-[20px] justify-between">
			<Link href={"/"}>
				<Image
					src={"/standalone-golden-yellow-logo-typography.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className=" w-[30%] md:w-[12%]"
				/>
			</Link>
			<div
				onClick={() => {
					return setOpen(!open);
				}}
				className=" md:hidden"
			>
				{!open ?
					<FaBars className=" w-6 h-6" />
				:	<IoMdClose className=" w-6 h-6" />}
			</div>

			<div className=" hidden items-center md:flex flex-row gap-9">
				{NAVLINKS.map((i, k) => {
					return (
						<Link key={k} href={i.link}>
							{i.name}
						</Link>
					);
				})}
				<Button variant={"outline"}>View Mass</Button>
				<Button>Login</Button>
			</div>
			{open && (
				<div className=" top-0 left-0 mt-[64px] absolute w-full h-screen bg-secondary">
					<div className=" px-[20px]">
						<div className="  items-start flex mt-[20px] flex-col gap-9">
							{NAVLINKS.map((i, k) => {
								return (
									<Link
										className="text-[20px]"
										key={k}
										href={i.link}
									>
										{i.name}
									</Link>
								);
							})}
							<div className=" flex gap-3">
								<Button variant={"outline"}>View Mass</Button>
								<Button>Login</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
