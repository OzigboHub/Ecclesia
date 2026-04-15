import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { ParishSearchDialog } from "@/components/shared/parish-search-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURES } from "@/lib/const";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { FaArrowRightLong, FaCalendarDays } from "react-icons/fa6";
import { HiMiniArrowRightCircle } from "react-icons/hi2";
import { IoLocation } from "react-icons/io5";
import { MdBrandingWatermark, MdVolunteerActivism } from "react-icons/md";

export default function LandingPage() {
	return (
		<div>
			<div className="relative">
				<Image
					src={"/landing-page.png"}
					alt="landing-page"
					width={"1000"}
					height={"1000"}
					className="h-[70vh] w-full object-cover md:h-screen"
				/>
				<div className="absolute top-0 h-[70vh] w-full bg-linear-to-r from-[#000000c1] to-[#00000040] md:h-screen">
					<MaxWidthWrapper>
						<div className="flex h-[70vh] flex-col justify-center gap-4 px-4 text-white md:h-screen md:px-10">
							<p className="max-w-xl text-3xl font-bold md:text-5xl">
								Your Faith, Your Community, Online.
							</p>
							<p className="max-w-xl text-base md:text-lg">
								Stay connected with your parish through
								livestreams, interactive calendars and real-time
								community updates. Faith has no boundaries.
							</p>
							<div className="flex flex-col gap-3 sm:flex-row">
								<Button className="rounded-[15px] py-6 sm:w-auto">
									<HiMiniArrowRightCircle />
									Access Live Streams
								</Button>
								<Button
									variant={"ghost"}
									className="rounded-[15px] border-muted-foreground bg-linear-to-r from-[#cac9c937] to-[#ebebeb3c] py-6 sm:w-auto"
								>
									Learn More
								</Button>
							</div>
						</div>
					</MaxWidthWrapper>
				</div>
			</div>
			<MaxWidthWrapper>
				<div className="grid gap-4 py-8 md:grid-cols-3">
					<Card className=" bg-primary-foreground md:col-span-2">
						<CardContent className=" pt-6">
							<div className=" flex flex-row items-center gap-3">
								<IoLocation className=" text-primary w-5 h-5" />
								<p className=" font-bold text-xl">
									Find Your Parish
								</p>
							</div>
							<div className="">
								<p className=" mt-2 max-w-md text-muted-foreground">
									Search for your local congregation to view
									their specific events, updates and
									stewardship opportunities.
								</p>
								<div className="mt-[10px]">
									<ParishSearchDialog />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className=" w-full bg-primary/30">
						<CardContent className=" pt-6">
							<div className=" flex flex-row items-center gap-3">
								<FaUserCircle className=" text-primary-foreground w-5 h-5" />
								<p className=" font-bold text-xl">
									Parishioner Portal
								</p>
							</div>
							<div className="">
								<p className=" text-white w-full mt-[10px]">
									Already a registered member? Access your
									profile, giving history and ministry groups.
								</p>
								<div className="mt-[10px]">
									<Button
										asChild
										className="w-full rounded-[15px] bg-primary py-6"
									>
										<Link href={"/auth/login"}>
											Login To Your Account
											<FaArrowRightLong />
										</Link>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className=" py-12 md:py-16">
					<p className=" font-bold text-center text-primary">
						EXPERIENCE CONNECTION
					</p>
					<div className="mt-10 flex flex-col gap-8 md:flex-row md:justify-between">
						<div className=" flex gap-7 items-center flex-col">
							<div className=" p-[20px] bg-primary/30 rounded-[15px] ">
								<FaBell className=" text-primary w-6 h-6" />
							</div>
							<div className="max-w-xs text-center">
								<p>
									Never miss a service or update. Recieve
									instant alerts or emergency changes or
									upcoming special liturgies.
								</p>
							</div>
						</div>
						<div className=" flex gap-7 items-center flex-col">
							<div className=" p-[20px] bg-primary/30 rounded-[15px] ">
								<FaCalendarDays className=" text-primary w-6 h-6" />
							</div>
							<div className="max-w-xs text-center">
								<p className="">
									A centralized hub for all ministries, mass
									schedules and volunteer opportunities in
									your parish.
								</p>
							</div>
						</div>
						<div className=" flex gap-7 items-center flex-col">
							<div className=" p-[20px] bg-primary/30 rounded-[15px] ">
								<MdVolunteerActivism className=" text-primary w-6 h-6" />
							</div>
							<div className="max-w-xs text-center">
								<p>
									Support your parish&apos;s mission with
									secure, transparent, and simple one-time or
									recurring contributions.
								</p>
							</div>
						</div>
					</div>
				</div>
			</MaxWidthWrapper>
			<div id="features" className="bg-primary/30">
				<MaxWidthWrapper>
					<div className="flex items-center flex-col py-12 md:py-16">
						<p className="max-w-2xl text-center text-3xl font-extrabold md:text-4xl">
							Everything Your Parish Needs, In One Platform
						</p>
						<p className="mt-4 max-w-xl text-center text-muted-foreground">
							A comprehensive SaaS solution built to empower and
							connect modern spiritual communities through a
							single, intuitive interface.
						</p>
						<div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
							{FEATURES.map((i, k) => {
								return (
									<ContentCard
										content={i.content}
										icon={i.icon}
										title={i.title}
										key={k}
									/>
								);
							})}
						</div>
					</div>
				</MaxWidthWrapper>
			</div>
			<div className=" bg-primary-foreground ">
				<MaxWidthWrapper>
					<div className="flex flex-col items-center gap-8 py-12 md:flex-row md:py-16">
						<div className=" ">
							<p className=" text-3xl font-bold md:text-4xl">
								Your Parish. Your Digital Presence. Fully
								Managed.
							</p>
							<div className=" mt-5 flex flex-col gap-4">
								<div className=" flex flex-row items-start gap-3">
									<div className=" p-[15px] bg-primary/30 rounded-[15px] ">
										<MdBrandingWatermark className=" text-primary w-5 h-5" />
									</div>
									<div className="">
										<p className=" text-[15px] font-bold">
											Branded Spaces
										</p>
										<p className=" text-muted-foreground">
											Customized layout with your parish
											colors, logos and specific identity.
										</p>
									</div>
								</div>
								<div className=" flex flex-row items-start gap-3">
									<div className=" p-[15px] bg-primary/30 rounded-[15px] ">
										<MdBrandingWatermark className=" text-primary w-5 h-5" />
									</div>
									<div className="">
										<p className=" text-[15px] font-bold">
											Branded Spaces
										</p>
										<p className=" text-muted-foreground">
											Customized layout with your parish
											colors, logos and specific identity.
										</p>
									</div>
								</div>
								<div className=" flex flex-row items-start gap-3">
									<div className=" p-[15px] bg-primary/30 rounded-[15px] ">
										<MdBrandingWatermark className=" text-primary w-5 h-5" />
									</div>
									<div className="">
										<p className=" text-[15px] font-bold">
											Branded Spaces
										</p>
										<p className=" text-muted-foreground">
											Customized layout with your parish
											colors, logos and specific identity.
										</p>
									</div>
								</div>
								<div className="">
									<Button
										asChild
										className=" rounded-[15px] py-6"
									>
										<Link href={"/contact"}>
											Request a Demo
										</Link>
									</Button>
								</div>
							</div>
						</div>
						<div className="relative w-full max-w-lg">
							<Image
								src={"/placeholder.webp"}
								alt="placeholder"
								width={"1000"}
								height={"1000"}
								className=" rounded-[40px]"
							/>
							<div className="mt-4 rounded-[15px] bg-primary px-6 py-4 text-secondary md:absolute md:-left-[50px] md:-bottom-[50px]">
								<p className=" font-bold text-2xl">99.99%</p>
								<p className=" font-bold">UPTIME GUARANTEED</p>
							</div>
						</div>
					</div>
				</MaxWidthWrapper>
			</div>
		</div>
	);
}

export const ContentCard = ({
	content,
	icon,
	title,
}: {
	icon: ReactNode;
	title: string;
	content: string;
}) => {
	return (
		<div className=" rounded-[20px] border border-primary/20 p-[30px]">
			<div className=" text-primary text-[25px]">{icon}</div>
			<div className=" flex flex-col gap-2">
				<p className=" text-[20px] font-bold">{title}</p>
				<p>{content}</p>
			</div>
		</div>
	);
};
