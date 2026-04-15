"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { DocsSearch } from "@/components/docs/docs-search";
import { useState } from "react";

export function DocsNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4">
          {/* Logo */}
          <Link
            href="/developer-documentation"
            className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              E
            </span>
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              Ecclesia
            </span>
          </Link>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="ml-4 flex h-8 flex-1 max-w-sm items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground hover:bg-muted/50">
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search documentation...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="ml-auto hidden rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* Links */}
          <nav className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link
              href="/developer-documentation"
              className="text-xs font-medium text-foreground">
              Docs
            </Link>
          </nav>
        </div>
      </header>

      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
