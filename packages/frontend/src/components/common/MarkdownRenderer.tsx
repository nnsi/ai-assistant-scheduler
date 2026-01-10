import { useMemo } from "react";
import { marked, Renderer } from "marked";
import DOMPurify from "dompurify";
import { cn } from "@/lib/cn";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const createRenderer = (): Renderer => {
  const renderer = new Renderer();

  renderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  return renderer;
};

export const MarkdownRenderer = ({
  content,
  className,
}: MarkdownRendererProps) => {
  const html = useMemo(() => {
    const renderer = createRenderer();
    const rawHtml = marked.parse(content, { async: false, renderer }) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ["target", "rel"],
    });
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-4 prose-headings:mb-2",
        "prose-h2:text-base prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-1",
        "prose-h3:text-sm",
        "prose-p:text-gray-700 prose-p:my-2 prose-p:leading-relaxed",
        "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800",
        "prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5",
        "prose-strong:text-gray-900",
        "prose-hr:my-4 prose-hr:border-gray-200",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
