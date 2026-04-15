import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { notFound } from "next/navigation";
import { DocsContent } from "@/components/docs/docs-content";
import { DocsTableOfContents } from "@/components/docs/docs-toc";

interface DocsPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = getDocBySlug(slugPath);

  if (!doc) return { title: "Not Found" };

  return {
    title: `${doc.meta.title} — Ecclesia Docs`,
    description: doc.meta.description,
  };
}

export default async function DocPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = getDocBySlug(slugPath);

  if (!doc) notFound();

  return (
    <div className="flex">
      <article className="min-w-0 flex-1 px-6 py-8 md:px-10 lg:px-12">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{doc.meta.section.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
        </div>
        <DocsContent content={doc.content} />
      </article>
      <DocsTableOfContents content={doc.content} />
    </div>
  );
}
