"use client";

import { usePwaInstall } from "@/hooks/use-pwa-install";
import { NAVLINKS } from "@/lib/const";
import { Download, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeIconToggle } from "./theme-toggle";
import { Button } from "../ui/button";

export default function PublicNavbar() {
	const [open, setOpen] = useState(false);
	const { canInstall, install } = usePwaInstall();
	return (
		<div
			data-public-navbar
			className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-secondary/95 px-4 text-secondary-foreground backdrop-blur md:px-8"
		>
			<Link href={"/"}>
				<Image
					src={"/standalone-golden-yellow-logo-typography.png"}
					alt="logo"
					width={"1000"}
					height={"1000"}
					className="h-8 w-auto"
				/>
			</Link>
			<div className="flex items-center gap-1 md:hidden">
				<ThemeIconToggle />
				<button
					onClick={() => setOpen(!open)}
					className="p-2 text-secondary-foreground"
					type="button"
				>
					{open ?
						<X className="w-6 h-6" />
					:	<Menu className="w-6 h-6" />}
				</button>
			</div>

			<div className="hidden items-center md:flex gap-2">
				{NAVLINKS.map((i, k) => {
					return (
						<Link
							key={k}
							href={i.link}
							className="rounded-[10px] px-3 py-2 text-[13px] font-medium text-secondary-foreground hover:bg-accent"
						>
							{i.name}
						</Link>
					);
				})}
				<div className="flex items-center gap-3">
					<ThemeIconToggle />
					{canInstall && (
						<Button
							variant={"outline"}
							onClick={install}
							className="border-primary/50 text-primary hover:bg-primary/10 gap-1.5"
						>
							<Download className="w-4 h-4" />
							Install App
						</Button>
					)}
					<Button
						variant={"outline"}
						className="border-border text-secondary-foreground hover:bg-accent"
					>
						<Link href={"/auth/register"}>Register</Link>
					</Button>
					<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
						<Link href={"/auth/login"}>Login</Link>
					</Button>
				</div>
			</div>
			{open && (
				<div className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] bg-secondary px-4 py-6 overflow-y-auto md:hidden">
					<div className="items-start flex flex-col gap-3">
						{NAVLINKS.map((i, k) => {
							return (
								<Link
									className="w-full rounded-[10px] px-4 py-2.5 text-[13px] font-medium text-secondary-foreground hover:bg-accent"
									key={k}
									href={i.link}
									onClick={() => setOpen(false)}
								>
									{i.name}
								</Link>
							);
						})}
						<div className="flex w-full flex-col gap-3 sm:flex-row">
							{canInstall && (
								<Button
									variant={"outline"}
									onClick={() => {
										install();
										setOpen(false);
									}}
									className="border-primary/50 text-primary hover:bg-primary/10 gap-1.5 w-full sm:w-auto"
								>
									<Download className="w-4 h-4" />
									Install App
								</Button>
							)}
							<Button
								variant={"outline"}
								onClick={() => setOpen(false)}
								className="border-border text-secondary-foreground hover:bg-accent"
							>
								<Link href={"/auth/register"}>Register</Link>
							</Button>
							<Button
								onClick={() => setOpen(false)}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								<Link href={"/auth/login"}>Login</Link>
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
