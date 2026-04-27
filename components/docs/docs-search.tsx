"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface SearchItem {
	title: string;
	section: string;
	slug: string;
}

// This data is passed statically from the layout; for now we hardcode the doc index
// A future enhancement could load this from an API route
const DOCS_INDEX: SearchItem[] = [
	{
		title: "Introduction",
		section: "Getting Started",
		slug: "getting-started/introduction",
	},
	{
		title: "Installation",
		section: "Getting Started",
		slug: "getting-started/installation",
	},
	{
		title: "Quick Start",
		section: "Getting Started",
		slug: "getting-started/quick-start",
	},
	{
		title: "Configuration",
		section: "Getting Started",
		slug: "getting-started/configuration",
	},
	{
		title: "Architecture Overview",
		section: "Architecture",
		slug: "architecture/overview",
	},
	{
		title: "Tech Stack",
		section: "Architecture",
		slug: "architecture/tech-stack",
	},
	{
		title: "Database Schema",
		section: "Architecture",
		slug: "architecture/database-schema",
	},
	{
		title: "Features Overview",
		section: "Features",
		slug: "features/overview",
	},
	{
		title: "User Management",
		section: "Features",
		slug: "features/user-management",
	},
	{
		title: "Financial Management",
		section: "Features",
		slug: "features/financial-management",
	},
	{
		title: "Server Actions",
		section: "API Reference",
		slug: "api-reference/server-actions",
	},
	{
		title: "Authentication API",
		section: "API Reference",
		slug: "api-reference/authentication",
	},
	{
		title: "Database Patterns",
		section: "API Reference",
		slug: "api-reference/database-patterns",
	},
	{
		title: "Coding Standards",
		section: "Development",
		slug: "development/coding-standards",
	},
	{
		title: "Project Backlog",
		section: "Development",
		slug: "development/backlog",
	},
];

interface DocsSearchProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DocsSearch({ open, onOpenChange }: DocsSearchProps) {
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const router = useRouter();

	const results = useMemo(() => {
		if (!query.trim()) return DOCS_INDEX;
		const q = query.toLowerCase();
		return DOCS_INDEX.filter(
			(item) =>
				item.title.toLowerCase().includes(q) ||
				item.section.toLowerCase().includes(q),
		);
	}, [query]);

	function closeSearch() {
		setQuery("");
		setSelectedIndex(0);
		onOpenChange(false);
	}

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				if (open) {
					closeSearch();
				} else {
					onOpenChange(true);
				}
			}
			if (e.key === "Escape") {
				closeSearch();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	function navigate(slug: string) {
		router.push(`/developer-documentation/${slug}`);
		closeSearch();
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter" && results[selectedIndex]) {
			navigate(results[selectedIndex].slug);
		}
	}

	if (!open) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-50 bg-black/50"
				onClick={closeSearch}
			/>
			<div className="fixed left-1/2 top-[15%] z-50 w-[90vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl">
				<div className="flex items-center gap-2 border-b border-border/50 px-4">
					<Search className="size-4 text-muted-foreground" />
					<input
						autoFocus
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
						onKeyDown={handleKeyDown}
						placeholder="Search documentation..."
						className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					/>
					<kbd className="rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
						ESC
					</kbd>
				</div>

				<div className="max-h-80 overflow-y-auto p-2">
					{results.length === 0 ?
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No results found for &quot;{query}&quot;
						</p>
					:	results.map((item, index) => (
							<button
								key={item.slug}
								onClick={() => navigate(item.slug)}
								onMouseEnter={() => setSelectedIndex(index)}
								className={cn(
									"flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
									index === selectedIndex ?
										"bg-primary/10 text-foreground"
									:	"text-muted-foreground hover:bg-accent",
								)}
							>
								<div>
									<p className="font-medium">{item.title}</p>
									<p className="text-xs text-muted-foreground">
										{item.section}
									</p>
								</div>
							</button>
						))
					}
				</div>
			</div>
		</>
	);
}
