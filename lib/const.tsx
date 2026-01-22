import {
    Calendar,
    CalendarDays,
    CirclePile,
    ClipboardList,
    Coins,
    FolderKanban,
    LayoutDashboard,
    Settings,
    UserCog,
    Users,
} from "lucide-react";

export const SIDEBAR = [
	{
		icon: <LayoutDashboard className=" w-5 h-5" />,
		name: "Dashboard",
		href: "/dashboard",
	},
	{
		icon: <Users className=" w-5 h-5" />,
		name: "Parishioners",
		href: "/dashboard/parishioners",
	},
	{
		icon: <Coins className=" w-5 h-5" />,
		name: "Payments",
		href: "/dashboard/payments",
	},
	{
		icon: <ClipboardList className=" w-5 h-5" />,
		name: "Mass Intentions",
		href: "/mass-intentions",
	},
	{
		icon: <CalendarDays className=" w-5 h-5" />,
		name: "Mass Calendar",
		href: "/dashboard/masses",
	},
	{
		icon: <Calendar className=" w-5 h-5" />,
		name: "Appointments",
		href: "/appointments",
	},
	{
		icon: <CirclePile className=" w-5 h-5" />,
		name: "Societies",
		href: "/dashboard/societies",
	},
	{
		icon: <Settings className=" w-5 h-5" />,
		name: "Settings",
		href: "/settings",
	},
];

export const ADMIN_EXTENDED = [
	{
		name: "Manage Organizations",
		href: "/dashboard/admin/organizations",
		icon: <FolderKanban className=" w-5 h-5" />,
	},
	{
		name: "Manage Users",
		href: "/users",
		icon: <UserCog className=" w-5 h-5" />,
	},
];

export const SUPERADMIN_SIDEBAR = [
	{
		name: "Overview",
		href: "/dashboard/admin/overview",
		icon: <LayoutDashboard className=" w-5 h-5" />,
	},
	{
		name: "Organizations",
		href: "/dashboard/admin/organizations",
		icon: <FolderKanban className=" w-5 h-5" />,
	},
	{
		name: "Global Actions",
		href: "/dashboard/admin/global-actions",
		icon: <CirclePile className=" w-5 h-5" />,
	},
];

export const SUPERADMIN_EXTENDED = [
	{
		name: "Audit Logs",
		href: "/dashboard/admin/audit-logs",
		icon: <ClipboardList className=" w-5 h-5" />,
	},
];
