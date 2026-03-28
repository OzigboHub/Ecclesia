import {
  Calendar,
  CalendarDays,
  CirclePile,
  ClipboardList,
  Coins,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Settings,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import { FaMoneyBill } from "react-icons/fa";
import { FaCalendarDay, FaHandshakeSimple, FaUserGroup } from "react-icons/fa6";
import { HiSpeakerphone } from "react-icons/hi";
import { MdGroups2, MdNotificationsActive } from "react-icons/md";
import { RiFileEditFill, RiLiveFill } from "react-icons/ri";

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
    icon: <ClipboardList className=" w-5 h-5" />,
    name: "Mass Intentions",
    href: "/mass-intentions",
  },
  {
    icon: <CalendarDays className=" w-5 h-5" />,
    name: "Mass Calendar",
    href: "/masses",
  },
  {
    icon: <Calendar className=" w-5 h-5" />,
    name: "Appointments",
    href: "/appointments",
  },
  {
    icon: <Megaphone className=" w-5 h-5" />,
    name: "Announcements",
    href: "/announcements",
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
  {
    icon: <Coins className=" w-5 h-5" />,
    name: "Payments",
    href: "/payments",
  },
  {
    icon: <Shield className=" w-5 h-5" />,
    name: "Sessions",
    href: "/sessions",
  },
];

export const ADMIN_EXTENDED = [
  {
    name: "Manage Parish",
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

export const NAVLINKS = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "Features",
    link: "#features",
  },
  {
    name: "Pricing",
    link: "/pricing",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  {
    name: "Masses",
    link: "/mass",
  },
];

export const FEATURES = [
  {
    icon: <FaMoneyBill />,
    title: "Secure Donations",
    content:
      "Encourage stewardship with fast, secure and recurring digital giving options.",
  },
  {
    icon: <FaUserGroup />,
    title: "Mass Intentions",
    content:
      "Submit and manage  prayer requests and intentions easily throught the portal.",
  },
  {
    icon: <HiSpeakerphone />,
    title: "Announcements",
    content:
      "Keep your communitities informed with real-time news and bulletin updates.",
  },
  {
    icon: <RiLiveFill />,
    title: "Live Mass",
    content:
      "Broadcast high quality liturgical services to those unable to attend in person.",
  },
  {
    icon: <MdGroups2 />,
    title: "Join Stream",
    content:
      "Interactive participation with chat and shared prayer during live events.",
  },
  {
    icon: <FaCalendarDay />,
    title: "Priests Appointments",
    content:
      "Simplify scheduling for confessionsl, counseling or spritual direction.",
  },
  {
    icon: <RiFileEditFill />,
    title: "Event Registration",
    content:
      "Easy sign-ups for retreats, classes and community social gatherings.",
  },
  {
    icon: <MdNotificationsActive />,
    title: "Smart Notifications",
    content:
      "Modile alerts	 for urgent updates, schedule changes and community news.",
  },
  {
    icon: <FaHandshakeSimple />,
    title: "Volunteer Sign-ups",
    content:
      "Streamline coordinations for liturgical roles and outreach programs.",
  },
];

export const FOOTERITEMS = [
  {
    title: "RESOURCES",
    links: [
      {
        name: "Documentation",
        link: "",
      },
      {
        name: "Support Center",
        link: "",
      },
      {
        name: "Parish Search",
        link: "",
      },
      {
        name: "Live Streaming Guide",
        link: "",
      },
    ],
  },
  {
    title: "COMPANY",
    links: [
      {
        name: "About Us",
        link: "",
      },
      {
        name: "Mission Statements",
        link: "",
      },
      {
        name: "Contact",
        link: "",
      },
      {
        name: "Privacy Policy",
        link: "",
      },
    ],
  },
];
