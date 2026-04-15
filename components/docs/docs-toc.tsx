"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTableOfContentsProps {
  content: string;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[`*_~]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ id, text, level });
  }

  return headings;
}

export function DocsTableOfContents({ content }: DocsTableOfContentsProps) {
  const headings = extractHeadings(content);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-4 xl:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
        On this page
      </p>
      <nav className="space-y-0.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "block py-1 text-[12px] leading-tight transition-colors",
              heading.level === 3 && "pl-3",
              heading.level === 4 && "pl-6",
              activeId === heading.id
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}>
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
