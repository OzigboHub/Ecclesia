"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The five-slot bottom tab bar.
 *
 * Icons are inline SVG rather than lucide so the stroke weights match the
 * design exactly at 20px — at this size the difference between 1.6 and 2 is
 * the difference between crisp and muddy on a cheap Android panel.
 */

type Tab = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TABS: Tab[] = [
  {
    href: "/feed",
    label: "Parish Bulletin",
    icon: (p) => (
      <svg viewBox="0 0 20 20" className={p.className} {...stroke}>
        <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
        <line x1="6" y1="8" x2="14" y2="8" />
        <line x1="6" y1="11.5" x2="11" y2="11.5" />
      </svg>
    ),
  },
  {
    href: "/readings",
    label: "Readings",
    icon: (p) => (
      <svg viewBox="0 0 20 20" className={p.className} {...stroke}>
        <path d="M3 4.5A2.5 2.5 0 0 1 5.5 2H17v14.5H5.5A2.5 2.5 0 0 0 3 19V4.5z" />
        <path d="M3 16.5A2.5 2.5 0 0 1 5.5 14H17" />
        <line x1="8" y1="6.5" x2="13" y2="6.5" />
        <line x1="8" y1="10" x2="11.5" y2="10" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (p) => (
      <svg viewBox="0 0 20 20" className={p.className} {...stroke}>
        <circle cx="9" cy="9" r="5.5" />
        <line x1="13.2" y1="13.2" x2="17" y2="17" />
      </svg>
    ),
  },
  /*
	{
		href: "/give",
		label: "Give",
		icon: (p) => (
			<svg viewBox="0 0 20 20" className={p.className} {...stroke}>
				<circle cx="10" cy="10" r="7" />
				<text
					x="10"
					y="13.6"
					textAnchor="middle"
					fontSize="9.5"
					fill="currentColor"
					stroke="none"
				>
					₦
				</text>
			</svg>
		),
	},
	{
		href: "/alerts",
		label: "Alerts",
		icon: (p) => (
			<svg viewBox="0 0 20 20" className={p.className} {...stroke}>
				<path d="M6 13.5V9a4 4 0 0 1 8 0v4.5l1.4 1.8H4.6z" />
				<path d="M8.4 16.4a1.7 1.7 0 0 0 3.2 0" />
			</svg>
		),
	},
	{
		href: "/me",
		label: "Me",
		icon: (p) => (
			<svg viewBox="0 0 20 20" className={p.className} {...stroke}>
				<circle cx="10" cy="7.2" r="3.1" />
				<path d="M4.6 16.6a5.4 5.4 0 0 1 10.8 0" />
			</svg>
		),
	},
	*/
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      // pb-safe-bottom clears the iOS home indicator. Without it the last
      // row of labels sits under the gesture bar on every modern iPhone.
      className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-between border-t border-hairline bg-surface-1 px-1 pt-1.5 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // 44px minimum target regardless of how small the
              // label is — shrinking type must never shrink the
              // thing a thumb has to hit.
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-[3px] rounded-lg transition-colors",
              active ? "text-gold" : "text-fg-dim",
            )}>
            <Icon className="size-5" />
            <span className="text-caption font-medium leading-[14px]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop equivalent: a labelled rail, same destinations. */
export function NavRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex lg:flex-col lg:gap-1 lg:pt-4">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-title-sm transition-colors",
              active
                ? "bg-surface-2 font-semibold text-gold"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}>
            <Icon className="size-5 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
