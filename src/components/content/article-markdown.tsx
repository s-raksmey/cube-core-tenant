"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useId, useRef, useState } from "react";
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
          img: ({ alt, src }) => {
            if (typeof src !== "string") return null;

            return (
              <Image
                src={src}
                alt={alt ?? ""}
                width={1200}
                height={600}
                className="max-h-96 max-w-full rounded-lg object-contain"
              />
            );
          },
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
  onUploadImage,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const uploadInputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
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
  async function uploadSelectedImage(file?: File) {
    if (!file || !onUploadImage || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await onUploadImage(file);
      const field = ref.current;
      if (!field) return;
      const start = field.selectionStart;
      const end = field.selectionEnd;
      const description =
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[\[\]()]/g, " ")
          .trim() || "Image";
      const markdown = `![${description}](${url})`;
      onChange(field.value.slice(0, start) + markdown + field.value.slice(end));
      requestAnimationFrame(() => {
        field.focus();
        field.setSelectionRange(
          start + markdown.length,
          start + markdown.length,
        );
      });
    } catch (reason) {
      setUploadError(
        reason instanceof Error ? reason.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
    }
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
        {onUploadImage ? (
          <>
            <input
              id={uploadInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              aria-label={`Upload image for ${label}`}
              onChange={(event) => {
                void uploadSelectedImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <label htmlFor={uploadInputId} className="cursor-pointer">
                {uploading ? "Uploading…" : "Upload image"}
              </label>
            </Button>
          </>
        ) : null}
      </div>
      {uploadError ? (
        <p role="alert" className="text-xs text-destructive">
          {uploadError}
        </p>
      ) : null}
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
