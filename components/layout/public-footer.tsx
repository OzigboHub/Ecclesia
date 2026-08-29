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
    <div className="w-full bg-secondary py-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 pb-8 md:px-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <IoShieldCheckmark className=" w-6 h-6" />
          <p className="text-[15px]  font-bold">SECURE AUTH</p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <IoShieldCheckmark className=" w-6 h-6" />
          <p className="text-[15px]  font-bold">ADMIN APPROVED</p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <IoShieldCheckmark className=" w-6 h-6" />
          <p className="text-[15px]  font-bold">SAFE PAYMENTS</p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <IoShieldCheckmark className=" w-6 h-6" />
          <p className="text-[15px]  font-bold">GDPR READY</p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-4 md:px-8">
        <div className="shadow-2xl bg-primary md:rounded-[60px] py-12 md:py-20 px-6 md:px-10">
          <div className="text-secondary w-full">
            <p className="text-center text-3xl font-extrabold md:text-5xl">
              Ready to bring your parish online?
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-base md:text-[20px]">
              Join thousands of parishioners and leaders who are transforming
              spiritual engagement for the digital age.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
            <Button className="rounded-[15px] bg-white py-6 hover:bg-white">
              Access Your Parish Now
            </Button>
            <Button className="rounded-[15px] bg-black/20 py-6 hover:bg-black/20">
              Bring your parish to Ecclesia
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col justify-between gap-10 px-4 md:mt-20 md:flex-row md:px-8">
        <div className="md:w-[30%]">
          <Image
            src={"/standalone-golden-yellow-logo-typography.png"}
            alt="logo"
            width={"1000"}
            height={"1000"}
            className="h-10 w-auto"
          />
          <div className=" mt-[20px]">
            <p className=" text-muted-foreground">
              Our mission is to bridge the gap between faith and technology,
              ensuring every believer stays connected to their community, no
              matter where they are.
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
        <div className="flex flex-col gap-8 md:flex-row md:gap-16">
          {FOOTERITEMS.map((i, k) => {
            return (
              <div key={k} className=" flex flex-col">
                <p className=" text-primary font-bold">{i.title}</p>
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
          <p className=" text-primary font-bold">JOIN THE JOURNEY</p>
          <p className=" mt-[20px] max-w-xs text-muted-foreground">
            Get the latest updates on the new parish features.
          </p>
          <div className=" mt-[20px]">
            <Input className="bg-background text-foreground border-border placeholder:text-muted-foreground" placeholder="Email" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between md:px-8">
        <p>© {dateYear} EcclesiaLight. All rights reserved.</p>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <Link href={""}>Terms of Services</Link>
          <Link href={""}>Privacy Policy</Link>
          <Link href={""}>Cookie Settings</Link>
        </div>
      </div>
    </div>
  );
}
