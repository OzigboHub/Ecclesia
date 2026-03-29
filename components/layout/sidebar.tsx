"use client";

import { getAllOrganizationsWithMetrics } from "@/app/actions/super-admin.actions";
import {
  ADMIN_EXTENDED,
  SIDEBAR,
  SUPERADMIN_EXTENDED,
  SUPERADMIN_SIDEBAR,
} from "@/lib/const";
import {
  canBookAppointments,
  canBookMassIntentions,
  canManageMassIntentions,
  canManageOrganizations,
  canManageParishioners,
  canManageUsers,
  canRecordPayments,
  canViewMassCalendar,
  canViewSocieties,
} from "@/lib/permissions";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrganizationContextSwitcher } from "../admin/organization-context-switcher";
import { Separator } from "../ui/separator";

export default function Sidebar() {
  const router = useRouter();
  const pathName = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Organization context state (in a real app, this might come from the session or a cookie)
  // For this refactor, we'll assume it's part of the session if a super admin has switched context
  const contextId = session?.user?.organizationId; // If super admin has switched, this will be the target org

  const [organizations, setOrganizations] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllOrganizationsWithMetrics(1, 100).then((result) => {
        if (result.success && result.data) {
          setOrganizations(
            result.data.data.map((org) => ({
              id: org.id,
              name: org.name,
            })),
          );
        }
      });
    }
  }, [isSuperAdmin]);

  const isParishioner = userRole === "PARISHIONER";

  // Parishioners get a curated set of links
  const PARISHIONER_LINKS = [
    "Dashboard",
    "Mass Intentions",
    "Mass Calendar",
    "Appointments",
    "Announcements",
    "Societies",
  ];

  // Filter sidebar items based on role or active context
  let mainNav = SIDEBAR.filter((item) => {
    if (!userRole) return false;
    // If super admin and no context, show super admin primary nav
    if (isSuperAdmin && !contextId) return false; // Handled separately below

    // Parishioners only see their curated links
    if (isParishioner) return PARISHIONER_LINKS.includes(item.name);

    if (item.name === "Parishioners") return canManageParishioners(userRole);
    if (item.name === "Payments") return canRecordPayments(userRole);
    if (item.name === "Mass Intentions") return canBookMassIntentions(userRole);
    if (item.name === "Mass Calendar") return canViewMassCalendar(userRole);
    if (item.name === "Mass Schedule") return canManageMassIntentions(userRole);
    if (item.name === "Appointments") return canBookAppointments(userRole);
    if (item.name === "Societies") return canViewSocieties(userRole);
    if (item.name === "Settings") return isSuperAdmin; // Only Super Admin / System Admin
    return true; // Dashboard
  });

  // Filter admin items based on role
  const filteredAdmin = ADMIN_EXTENDED.filter((item) => {
    if (!userRole) return false;
    if (isSuperAdmin) return false; // Handled by SUPERADMIN_SIDEBAR/EXTENDED
    if (item.name === "Manage Organizations")
      return canManageOrganizations(userRole);
    if (item.name === "Manage Users") return userRole === "SUPER_ADMIN";
    return false;
  });

  return (
    <div className="hidden bg-secondary w-[20%] h-screen shrink-0 py-[20px] px-[10px] justify-start items-center lg:flex flex-col gap-8 overflow-y-auto">
      <Link href="/dashboard">
        <Image
          src={"/standalone-golden-yellow-logo-typography.png"}
          width={"150"}
          height={"150"}
          alt="logo"
          className=" w-[150px] object-cover"
        />
      </Link>

      <div className=" flex justify-between flex-col h-full w-full">
        <div className="flex justify-between gap-3 flex-col">
          {/* Super Admin Primary Nav */}
          {isSuperAdmin && (
            <>
              <div className="px-2 pb-2">
                <p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
                  System Admin
                </p>
                {SUPERADMIN_SIDEBAR.map((i, k) => (
                  <Link
                    href={i.href}
                    key={k}
                    className={` ${
                      pathName === i.href
                        ? "text-secondary bg-primary "
                        : " text-white hover:bg-white/10"
                    }  items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}>
                    <div className="shrink-0">{i.icon}</div>
                    <div className="text-[13px] font-medium">{i.name}</div>
                  </Link>
                ))}
              </div>
              <Separator className="my-2 bg-white/10" />
            </>
          )}

          {/* Context Switcher - Only for Super Admin */}
          {isSuperAdmin && (
            <div className="px-2 mb-4">
              <p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-3">
                Organization Context
              </p>
              <OrganizationContextSwitcher
                organizations={organizations}
                currentOrgId={contextId}
              />
            </div>
          )}

          {/* Standard Navigation (or Context Navigation) */}
          {(!isSuperAdmin || contextId) && (
            <div className="px-2">
              {contextId && (
                <p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
                  Viewing Organization
                </p>
              )}
              {mainNav.map((i, k) => (
                <Link
                  href={i.href}
                  key={k}
                  className={` ${
                    pathName === i.href
                      ? "text-secondary bg-primary "
                      : " text-white hover:bg-white/10"
                  }  items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}>
                  <div className="shrink-0">{i.icon}</div>
                  <div className="text-[13px] font-medium">{i.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-2">
          {/* Role Specific Admin Section (Non-Super Admin) */}
          {!isSuperAdmin && filteredAdmin.length > 0 && (
            <>
              <Separator className="my-4 bg-white/10" />
              <p className="text-[11px] text-primary/70 font-bold uppercase tracking-wider mb-2">
                Manage
              </p>
              <div className="mt-2">
                {filteredAdmin.map((i, k) => (
                  <Link
                    href={i.href}
                    key={k}
                    className={` ${
                      pathName === i.href
                        ? "text-secondary bg-primary "
                        : " text-white hover:bg-white/10"
                    }  items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}>
                    <div className="shrink-0">{i.icon}</div>
                    <div className="text-[13px] font-medium">{i.name}</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Super Admin Secondary Nav */}
          {isSuperAdmin && (
            <div className="mt-4">
              {SUPERADMIN_EXTENDED.map((i, k) => (
                <Link
                  href={i.href}
                  key={k}
                  className={` ${
                    pathName === i.href
                      ? "text-secondary bg-primary "
                      : " text-white hover:bg-white/10"
                  }  items-center py-2.5 flex gap-4 rounded-[10px] px-4 mb-1 transition-all`}>
                  <div className="shrink-0">{i.icon}</div>
                  <div className="text-[13px] font-medium">{i.name}</div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Separator className="my-4 bg-white/10" />
            <div
              onClick={async () => {
                await signOut({ redirect: false });
                router.push("/auth/login");
              }}
              className="px-4 py-2 text-primary cursor-pointer hover:bg-white/10 rounded-[10px] gap-4 flex items-center mb-6 transition-all">
              <LogOut className="w-5 h-5 shrink-0" />
              <p className="text-[13px] font-bold">Logout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
