import { FOOTERITEMS } from "@/lib/const";
import Image from "next/image";
import Link from "next/link";
import { IoShieldCheckmark } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import { RiInstagramFill } from "react-icons/ri";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function PublicFooter() {
	const dateYear = new Date().getFullYear();
	return (
		<div className=" md:px-[30px] w-full py-[50px] bg-secondary ">
			<div className=" pb-[40px] w-full flex-wrap px-[50px] gap-7 flex-row flex justify-between">
				<div className="text-muted-foreground flex flex-row items-center gap-4">
					<IoShieldCheckmark className=" w-6 h-6" />
					<p className="text-[15px]  font-bold">SECURE AUTH</p>
				</div>
				<div className="text-muted-foreground flex  flex-row items-center gap-4">
					<IoShieldCheckmark className=" w-6 h-6" />
					<p className="text-[15px]  font-bold">ADMIN APPROVED</p>
				</div>
				<div className="text-muted-foreground flex  flex-row items-center gap-4">
					<IoShieldCheckmark className=" w-6 h-6" />
					<p className="text-[15px]  font-bold">SAFE PAYMENTS</p>
				</div>
				<div className="text-muted-foreground flex  flex-row items-center gap-4">
					<IoShieldCheckmark className=" w-6 h-6" />
					<p className="text-[15px]  font-bold">GDPR READY</p>
				</div>
			</div>

			<div className=" shadow-2xl bg-primary mt-[50px] md:rounded-[60px] py-[80px] px-[30px]">
				<div className=" text-secondary   w-full">
					<p className=" font-extrabold text-center text-5xl">
						Ready to bring your parish online?
					</p>
					<p className=" text-center mx-auto mt-[30px] text-[20px] md:w-[50%]">
						Join thousands of parishioners and leaders who are
						transforming spiritual engagement for the digital age.
					</p>
				</div>
				<div className=" mt-[30px] md:flex-row flex-col flex gap-3 justify-center">
					<Button className=" hover:bg-white bg-white rounded-[15px] py-[30px]">
						Access Your Parish Now
					</Button>
					<Button className="rounded-[15px] py-[30px] hover:bg-black/20 bg-black/20">
						Bring your parish to Ecclesia
					</Button>
				</div>
			</div>

			<div className="  px-[50px]  flex flex-col md:flex-row justify-between mt-[60px] md:mt-[100px]">
				<div className=" md:w-[30%] ">
					<Image
						src={"/standalone-golden-yellow-logo-typography.png"}
						alt="logo"
						width={"1000"}
						height={"1000"}
						className=" w-[30%]"
					/>
					<div className=" mt-[20px]">
						<p className=" text-muted-foreground">
							Our mission is to bridge the gap between faith and
							technology, ensuring every believer stays connected
							to their community, no matter where they are.
						</p>
						<div className=" mt-[10px] flex flex-row gap-3">
							<Link href={""}>
								<MdEmail className=" w-6 h-6" />
							</Link>
							<Link href={""}>
								<RiInstagramFill className=" w-6 h-6" />
							</Link>
						</div>
					</div>
				</div>
				<div className=" flex flex-col md:flex-row justify-between gap-5 mt-[20px] md:gap-56">
					{FOOTERITEMS.map((i, k) => {
						return (
							<div key={k} className=" flex flex-col">
								<p className=" text-primary font-bold">
									{i.title}
								</p>
								<div className=" text-muted-foreground flex-col flex mt-[20px] gap-4">
									{i.links.map((e, k) => {
										return (
											<Link key={k} href={e.link}>
												{e.name}
											</Link>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
				<div className="">
					<p className=" text-primary mt-[20px] font-bold">
						JOIN THE JOURNEY
					</p>
					<p className=" text-muted-foreground w-[70%] mt-[20px] ">
						Get the latest updates on the new parish features.
					</p>
					<div className=" mt-[20px]">
						<Input
							className="bg-white text-black "
							placeholder="Email"
						/>
					</div>
				</div>
			</div>
			<div className=" flex md:flex-row flex-col gap-6 items-center md:items-start md:justify-between text-muted-foreground mt-[50px]">
				<p>© {dateYear} EcclesiaLight. All rights reserved.</p>

				<div className=" flex gap-8">
					<Link href={""}>Terms of Services</Link>
					<Link href={""}>Privacy Policy</Link>
					<Link href={""}>Cookie Settings</Link>
				</div>
			</div>
		</div>
	);
}
