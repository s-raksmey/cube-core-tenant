"use client";

import { Button } from "@/components/ui/button";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export function ArticleMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 wrap-break-word text-sm leading-7 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ alt, src }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="max-h-96 max-w-full rounded-lg object-contain"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ArticleMarkdownEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function insert(before: string, after = "", placeholder = "text") {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    onChange(
      value.slice(0, start) + before + selected + after + value.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert("## ", "", "Heading")}
        >
          Heading
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert("**", "**", "bold text")}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert("*", "*", "italic text")}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert("- ", "", "list item")}
        >
          List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert("[", "](https://example.com)", "link text")}
        >
          Link
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            insert(
              "![",
              "](https://example.com/image.jpg)",
              "image description",
            )
          }
        >
          Image
        </Button>
      </div>
      <textarea
        ref={ref}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-64 w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        maxLength={100000}
        placeholder="Write article content in Markdown…"
      />
      <p className="text-xs text-muted-foreground">
        Use Markdown for headings, emphasis, lists, links and images. Preview
        shows the published rendering.
      </p>
    </div>
  );
}
