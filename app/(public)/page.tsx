import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { HiMiniArrowRightCircle } from "react-icons/hi2";
import { IoLocation } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { FEATURES } from "@/lib/const";
import { ReactNode } from "react";
import { MdBrandingWatermark, MdVolunteerActivism } from "react-icons/md";
import { FaCalendarDays } from "react-icons/fa6";

export default function LandingPage() {
	return (
		<div>
			<div className=" relative">
				<Image
					src={"/landing-page.png"}
					alt="landing-page"
					width={"1000"}
					height={"1000"}
					className=" w-full h-screen object-cover"
				/>
				<div className="bg-linear-to-r from-[#000000c1] to-[#00000040] absolute w-full h-screen top-0 ">
					<MaxWidthWrapper>
						<div className=" px-[40px] gap-3 flex items-start flex-col justify-center h-screen">
							<p className=" md:w-[50%] font-bold text-5xl text-white">
								Your Faith, Your Community, Online.
							</p>
							<p className=" md:w-[50%]">
								Stay connected with your parish through
								livestreams, interactive calendars and real-time
								community updates. Faith has no boundaries.
							</p>
							<div className=" flex flex-col md:flex-row gap-4">
								<Button className="rounded-[15px] py-[30px]">
									<HiMiniArrowRightCircle />
									Access Live Streams
								</Button>
								<Button
									variant={"ghost"}
									className=" rounded-[15px] py-[30px] border-muted-foreground bg-linear-to-r from-[#cac9c937] to-[#ebebeb3c] "
								>
									Learn More
								</Button>
							</div>
						</div>
					</MaxWidthWrapper>
				</div>
			</div>
			<MaxWidthWrapper>
				<div className=" grid gap-4 py-[30px] grid-cols-1 md:grid-cols-3">
					<Card className=" bg-primary-foreground md:col-span-2">
						<CardContent className=" pt-6">
							<div className=" flex flex-row items-center gap-3">
								<IoLocation className=" text-primary w-5 h-5" />
								<p className=" font-bold text-xl">
									Find Your Parish
								</p>
							</div>
							<div className="">
								<p className=" text-muted-foreground md:w-[50%] mt-[10px]">
									Search for your local congregation to view
									their specific events, updates and
									stewardship opportunities.
								</p>
								<div className="  flex gap-3 items-center mt-[10px]">
									<div className=" relative w-full">
										<IoSearch className=" w-5 h-5 text-muted-foreground top-1/2 -translate-y-1/2 ml-[20px]  absolute" />
										<Input
											className=" py-[30px] pl-[50px] rounded-[15px]"
											placeholder="Search by name, city or zip...."
										/>
									</div>
									<Button className=" rounded-[15px] py-[30px]">
										Search
									</Button>
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
									<Button className=" hover:bg-white bg-white rounded-[15px] py-[30px] w-full">
										Login To Your Account
										<FaArrowRightLong />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className=" py-[60px]">
					<p className=" font-bold text-center text-primary">
						EXPERIENCE CONNECTION
					</p>
					<div className=" mt-[60px] flex-col gap-5 flex md:flex-row justify-between">
						<div className=" flex gap-7 items-center flex-col">
							<div className=" p-[20px] bg-primary/30 rounded-[15px] ">
								<FaBell className=" text-primary w-6 h-6" />
							</div>
							<div className="  md:w-[55%] text-center">
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
							<div className="  md:w-[55%] text-center">
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
							<div className=" md:w-[55%] text-center">
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
					<div className=" flex  items-center flex-col py-[60px]  ">
						<p className=" font-extrabold md:w-[50%] text-center text-4xl">
							Everything Your Parish Needs, In One Platform
						</p>
						<p className=" md:w-[40%] text-center text-muted-foreground">
							A comprehensive SaaS solution built to empower and
							connect modern spiritual communities through a
							single, intuitive interface.
						</p>
						<div className=" grid grid-cols-1 md:grid-cols-3 gap-5 mt-[90px]">
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
					<div className=" items-center md:flex-row flex-col flex gap-3 py-[70px]">
						<div className=" ">
							<p className=" text-4xl font-bold">
								Your Parish. Your Digital Presence. Fully
								Managed.
							</p>
							<div className=" flex flex-col gap-4 mt-[20px]">
								<div className=" flex flex-row items-start gap-3">
									<div className=" p-[15px] bg-primary/30 rounded-[15px] ">
										<MdBrandingWatermark className=" text-primary w-5 h-5" />
									</div>
									<div className="">
										<p className=" text-[15px] font-bold">
											Branded Spaces
										</p>
										<p className=" text-muted-foreground w-[90%]">
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
										<p className=" text-muted-foreground w-[90%]">
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
										<p className=" text-muted-foreground w-[90%]">
											Customized layout with your parish
											colors, logos and specific identity.
										</p>
									</div>
								</div>
								<div className="">
									<Button className=" rounded-[15px] py-[30px]">
										Request a Demo
									</Button>
								</div>
							</div>
						</div>
						<div className=" relative">
							<Image
								src={"/placeholder.webp"}
								alt="placeholder"
								width={"1000"}
								height={"1000"}
								className=" rounded-[40px]"
							/>
							<div className=" text-secondary absolute md:-left-[50px] -bottom-[50px] px-[30px] rounded-[15px] py-[20px] bg-primary">
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
