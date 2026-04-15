"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  BookOpen,
  Layers,
  Boxes,
  Code2,
  BookMarked,
  Wrench,
} from "lucide-react";
import type { DocSection } from "@/lib/docs";

const sectionIcons: Record<string, React.ReactNode> = {
  "getting-started": <BookOpen className="size-4" />,
  architecture: <Layers className="size-4" />,
  features: <Boxes className="size-4" />,
  "api-reference": <Code2 className="size-4" />,
  guides: <BookMarked className="size-4" />,
  development: <Wrench className="size-4" />,
};

interface DocsSidebarProps {
  sections: DocSection[];
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/50 px-4 py-6 lg:block">
        <SidebarContent sections={sections} pathname={pathname} />
      </aside>

      {/* Mobile sidebar (sheet-style) */}
      <MobileSidebar sections={sections} pathname={pathname} />
    </>
  );
}

function MobileSidebar({
  sections,
  pathname,
}: {
  sections: DocSection[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Open navigation">
        <BookOpen className="size-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background px-4 py-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Navigation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <SidebarContent
              sections={sections}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}

function SidebarContent({
  sections,
  pathname,
  onNavigate,
}: {
  sections: DocSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <SidebarSection
          key={section.slug}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarSection({
  section,
  pathname,
  onNavigate,
}: {
  section: DocSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActiveSection = section.items.some(
    (item) => pathname === `/developer-documentation/${item.slug}`,
  );
  const [expanded, setExpanded] = useState(isActiveSection);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground">
        {sectionIcons[section.slug] ?? <BookOpen className="size-4" />}
        <span className="flex-1 text-left">{section.title}</span>
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/50 pl-3">
          {section.items.map((item) => {
            const href = `/developer-documentation/${item.slug}`;
            const isActive = pathname === href;

            return (
              <Link
                key={item.slug}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2 py-1 text-[13px] transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}>
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
