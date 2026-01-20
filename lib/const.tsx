import {
	Calendar,
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
		href: "/parishioners",
	},
	{
		icon: <Coins className=" w-5 h-5" />,
		name: "Payments",
		href: "/payments",
	},
	{
		icon: <ClipboardList className=" w-5 h-5" />,
		name: "Mass Intentions",
		href: "/mass-intentions",
	},
	{
		icon: <Calendar className=" w-5 h-5" />,
		name: "Appointments",
		href: "/appointments",
	},
	{
		icon: <CirclePile className=" w-5 h-5" />,
		name: "Organizations",
		href: "/organizations",
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

export const SUPERADMIN_EXTENDED = [
	{
		name: "Manage Organizations",
		href: "/dashboard/admin/organizations",
		icon: <FolderKanban className=" w-5 h-5" />,
	},
];
