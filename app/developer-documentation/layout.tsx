import { getDocSections } from "@/lib/docs";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { ReactNode } from "react";
import { DocsNavbar } from "@/components/docs/docs-navbar";
import { HidePublicNavbar } from "@/components/docs/hide-public-navbar";

export const metadata = {
  title: "Documentation — Ecclesia DPM",
  description: "Developer documentation for Ecclesia Digital Parish Manager",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  const sections = getDocSections();

  return (
    <>
      <HidePublicNavbar />
      <div className="min-h-screen bg-background">
        <DocsNavbar />
        <div className="mx-auto flex max-w-[1400px]">
          <DocsSidebar sections={sections} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
