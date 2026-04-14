"use client";

import { NAVLINKS } from "@/lib/const";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Button } from "../ui/button";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { canInstall, install } = usePwaInstall();
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-secondary/95 px-4 backdrop-blur md:px-8">
      <Link href={"/"}>
        <Image
          src={"/standalone-golden-yellow-logo-typography.png"}
          alt="logo"
          width={"1000"}
          height={"1000"}
          className="h-8 w-auto"
        />
      </Link>
      <div
        onClick={() => {
          return setOpen(!open);
        }}
        className="md:hidden">
        {!open ? (
          <FaBars className=" w-6 h-6" />
        ) : (
          <IoMdClose className=" w-6 h-6" />
        )}
      </div>

      <div className="hidden items-center md:flex gap-2">
        {NAVLINKS.map((i, k) => {
          return (
            <Link
              key={k}
              href={i.link}
              className="rounded-[10px] px-3 py-2 text-[13px] font-medium text-white hover:bg-white/10">
              {i.name}
            </Link>
          );
        })}
        <div className="flex gap-3">
          {canInstall && (
            <Button
              variant={"outline"}
              onClick={install}
              className="border-primary/50 text-primary hover:bg-primary/10 gap-1.5">
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}
          <Button
            variant={"outline"}
            className="border-white/20 text-white hover:bg-white/10">
            <Link href={"/auth/register"}>Register</Link>
          </Button>
          <Button className="text-secondary">
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
                  className="w-full rounded-[10px] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10"
                  key={k}
                  href={i.link}
                  onClick={() => setOpen(false)}>
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
                  className="border-primary/50 text-primary hover:bg-primary/10 gap-1.5 w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  Install App
                </Button>
              )}
              <Button
                variant={"outline"}
                onClick={() => setOpen(false)}
                className="border-white/20 text-white hover:bg-white/10">
                <Link href={"/auth/register"}>Register</Link>
              </Button>
              <Button onClick={() => setOpen(false)} className="text-secondary">
                <Link href={"/auth/login"}>Login</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
