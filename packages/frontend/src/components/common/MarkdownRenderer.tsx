import { useMemo } from "react";
import { marked } from "marked";
import { cn } from "@/lib/cn";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export const MarkdownRenderer = ({
  content,
  className,
}: MarkdownRendererProps) => {
  const html = useMemo(() => {
    return marked.parse(content, { async: false }) as string;
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-p:text-gray-700",
        "prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline",
        "prose-ul:list-disc prose-ol:list-decimal",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
