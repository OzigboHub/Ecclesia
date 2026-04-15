"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { cn } from "@/lib/utils";

interface DocsContentProps {
  content: string;
}

export function DocsContent({ content }: DocsContentProps) {
  return (
    <div className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              className="mb-4 scroll-mt-20 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mb-3 mt-10 scroll-mt-20 border-b border-border/50 pb-2 text-xl font-semibold text-foreground md:text-2xl"
              {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mb-2 mt-8 scroll-mt-20 text-lg font-semibold text-foreground"
              {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="mb-2 mt-6 scroll-mt-20 text-base font-semibold text-foreground"
              {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-7 text-muted-foreground" {...props}>
              {children}
            </p>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              {...props}>
              {children}
            </a>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground"
              {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground"
              {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-7" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="mb-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground"
              {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-[12px] font-mono text-primary"
                  {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn("text-[13px] font-mono", className)}
                {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              className="mb-4 overflow-x-auto rounded-lg border border-border/50 bg-muted/50 p-4 text-[13px]"
              {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="border-b border-border/50 bg-muted/30" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground"
              {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-muted-foreground" {...props}>
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-border/30 last:border-0" {...props}>
              {children}
            </tr>
          ),
          hr: () => <hr className="my-8 border-border/50" />,
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className="my-4 rounded-lg border border-border/50"
              loading="lazy"
              {...props}
            />
          ),
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
