import fs from "fs";
import path from "path";
import matter from "gray-matter";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export interface DocMeta {
  title: string;
  description?: string;
  order: number;
  section: string;
}

export interface Doc {
  slug: string;
  content: string;
  meta: DocMeta;
}

export interface DocSection {
  title: string;
  order: number;
  slug: string;
  items: { title: string; slug: string; order: number }[];
}

function getAllDocFiles(dir: string, basePath = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllDocFiles(fullPath, relativePath));
    } else if (entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

export function getDocBySlug(slug: string): Doc | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    content,
    meta: {
      title: data.title ?? slug,
      description: data.description,
      order: data.order ?? 999,
      section: data.section ?? "uncategorized",
    },
  };
}

export function getAllDocs(): Doc[] {
  const files = getAllDocFiles(DOCS_DIR);

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
      return getDocBySlug(slug);
    })
    .filter((doc): doc is Doc => doc !== null)
    .sort((a, b) => a.meta.order - b.meta.order);
}

export function getDocSections(): DocSection[] {
  const docs = getAllDocs();
  const sectionMap = new Map<string, DocSection>();

  // Define section order and titles
  const sectionConfig: Record<string, { title: string; order: number }> = {
    "getting-started": { title: "Getting Started", order: 1 },
    architecture: { title: "Architecture", order: 2 },
    features: { title: "Features", order: 3 },
    "api-reference": { title: "API Reference", order: 4 },
    guides: { title: "Guides", order: 5 },
    development: { title: "Development", order: 6 },
  };

  for (const doc of docs) {
    const sectionSlug = doc.meta.section;
    if (!sectionMap.has(sectionSlug)) {
      const config = sectionConfig[sectionSlug] ?? {
        title: sectionSlug,
        order: 99,
      };
      sectionMap.set(sectionSlug, {
        title: config.title,
        slug: sectionSlug,
        order: config.order,
        items: [],
      });
    }

    sectionMap.get(sectionSlug)!.items.push({
      title: doc.meta.title,
      slug: doc.slug,
      order: doc.meta.order,
    });
  }

  // Sort items within each section
  for (const section of sectionMap.values()) {
    section.items.sort((a, b) => a.order - b.order);
  }

  return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
}
