"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleMarkdown, ArticleMarkdownEditor } from "@/components/content/article-markdown";
import { useArticleEditor, type SaveMode } from "@/hooks/use-article-editor";
import type { ArticleTranslationDraft } from "@/types/article.types";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const fieldClass = "grid gap-1.5 text-sm font-medium";

export function ArticleEditor({ id }: { id?: string }) {
  const editor = useArticleEditor(id);
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [rememberedTags, setRememberedTags] = useState<{ id: string; name: string }[]>([]);
  if (editor.loading) return <div className="space-y-4"><Skeleton className="h-9 w-48" /><Skeleton className="h-96 w-full" /></div>;
  if (id && !editor.article) return <p role="alert" className="text-sm text-destructive">{editor.loadError?.message ?? "Article not found"}</p>;
  if (!editor.canEdit) return <p role="alert" className="text-sm text-muted-foreground">You do not have permission to edit this article in its current status.</p>;
  const { form, permissions } = editor;
  const selectedTags = [...new Map([...rememberedTags, ...editor.tagOptions].map((tag) => [tag.id, tag])).values()]
    .filter((tag) => form.tagIds.includes(tag.id));
  const canSubmit = form.content.trim() && form.categoryId && form.subcategoryId;
  function action(mode: SaveMode) { void editor.save(mode); }
  return <div className="space-y-5">
    <PageHeader title={id ? "Edit article" : "Create article"} description="Write and organize content for your workspace." />
    <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={id ? `/content/articles/${id}` : "/content/articles"}>Back</Link></Button>
      <Button variant={preview ? "default" : "outline"} onClick={() => setPreview(!preview)}>{preview ? "Edit content" : "Preview content"}</Button>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5 rounded-xl border bg-card p-5">
        <label className={fieldClass}>Title *<Input value={form.title} maxLength={240} autoFocus placeholder="Article title" onChange={(event) => editor.titleChanged(event.target.value)} /></label>
        <label className={fieldClass}>Slug *<Input value={form.slug} maxLength={120} placeholder="article-url-slug" onChange={(event) => { editor.setManualSlug(true); editor.patch("slug", event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")); }} /></label>
        <label className={fieldClass}>Summary<textarea className="min-h-20 rounded-md border border-input bg-background p-3 text-sm" maxLength={500} value={form.summary} onChange={(event) => editor.patch("summary", event.target.value)} /></label>
        <section className="space-y-2"><h2 className="text-sm font-medium">Content *</h2>
          {preview ? <div className="min-h-64 rounded-md border p-4"><ArticleMarkdown content={form.content} /></div> :
            <ArticleMarkdownEditor value={form.content} onChange={(value) => editor.patch("content", value)} label="Article content" />}
        </section>
        <section className="space-y-3 border-t pt-4"><div><h2 className="text-sm font-medium">Translations</h2><p className="text-xs text-muted-foreground">Optional content for additional languages. English is stored above.</p></div>
          {form.translations.map((item, index) => <div key={index} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2"><select className={selectClass} aria-label={`Language for translation ${index + 1}`} value={item.locale}
              onChange={(event) => editor.translationChanged(index, { locale: event.target.value })}>
              {[...editor.availableLocales, { code: item.locale, label: item.locale.toUpperCase() }].map((locale) => <option key={locale.code} value={locale.code}>{locale.label} ({locale.code.toUpperCase()})</option>)}
            </select><Button variant="ghost" size="icon" aria-label={`Remove ${item.locale} translation`} onClick={() => editor.patch("translations", form.translations.filter((_, i) => i !== index))}><Trash2 /></Button></div>
            <Input aria-label={`Title in ${item.locale}`} maxLength={240} placeholder="Translated title" value={item.title} onChange={(event) => editor.translationChanged(index, { title: event.target.value })} />
            <Input aria-label={`Summary in ${item.locale}`} maxLength={500} placeholder="Translated summary (optional)" value={item.summary} onChange={(event) => editor.translationChanged(index, { summary: event.target.value })} />
            <ArticleMarkdownEditor label={`Content in ${item.locale}`} value={item.content} onChange={(value) => editor.translationChanged(index, { content: value })} />
          </div>)}
          {editor.availableLocales.length ? <Button variant="outline" size="sm" onClick={() => editor.patch("translations", [...form.translations, { locale: editor.availableLocales[0].code, title: "", summary: "", content: "" } satisfies ArticleTranslationDraft])}><Plus />Add translation</Button> : null}
        </section>
      </div>
      <div className="space-y-5">
        <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-sm font-medium">Organization</h2>
          <label className={fieldClass}>Category *<select className={selectClass} value={form.categoryId} onChange={(event) => editor.categoryChanged(event.target.value)}><option value="">Select category</option>{editor.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className={fieldClass}>Subcategory *<select className={selectClass} value={form.subcategoryId} disabled={!form.categoryId} onChange={(event) => editor.patch("subcategoryId", event.target.value)}><option value="">Select subcategory</option>{editor.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.translations.find((item) => item.locale === "en")?.name ?? subcategory.slug}</option>)}</select></label>
          <div className="space-y-2"><label className={fieldClass}>Tags<input className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={tagInput} onChange={(event) => { setTagInput(event.target.value); editor.setTagSearch(event.target.value); }} placeholder="Search tags" /></label>
            {selectedTags.length ? <div className="flex flex-wrap gap-1">{selectedTags.map((tag) => <Button key={tag.id} variant="secondary" size="xs" onClick={() => editor.patch("tagIds", form.tagIds.filter((id) => id !== tag.id))}>{tag.name} ×</Button>)}</div> : null}
            {tagInput ? <div className="max-h-36 overflow-y-auto rounded-md border">{editor.tagOptions.filter((tag) => !form.tagIds.includes(tag.id)).map((tag) => <button type="button" key={tag.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setRememberedTags((current) => [...current, tag]); editor.patch("tagIds", [...form.tagIds, tag.id]); setTagInput(""); editor.setTagSearch(""); }}>{tag.name}</button>)}</div> : null}
          </div>
        </section>
        <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-sm font-medium">Media</h2><label className={fieldClass}>Featured image URL<Input type="url" placeholder="https://example.com/image.jpg" value={form.featuredImageUrl} onChange={(event) => editor.patch("featuredImageUrl", event.target.value)} /></label><p className="text-xs text-muted-foreground">Use an HTTPS image URL. The Media library is not available yet.</p></section>
        {(permissions.canSetBreakingArticles || permissions.canSetFeaturedArticles) ? <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-sm font-medium">Presentation</h2>
          {permissions.canSetBreakingArticles ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isBreaking} onChange={(event) => editor.patch("isBreaking", event.target.checked)} />Breaking news</label> : null}
          {permissions.canSetFeaturedArticles ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(event) => editor.patch("isFeatured", event.target.checked)} />Featured article</label> : null}
        </section> : null}
        {permissions.canScheduleArticles ? <section className="space-y-2 rounded-xl border bg-card p-5"><label className={fieldClass}>Schedule (UTC)<Input type="datetime-local" value={editor.scheduledAt} onChange={(event) => editor.setScheduledAt(event.target.value)} /></label><p className="text-xs text-muted-foreground">Enter a future UTC date and time.</p></section> : null}
      </div>
    </div>
    {editor.error ? <p role="alert" className="text-sm text-destructive">{editor.error}</p> : null}
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
      <Button variant="outline" disabled={editor.busy} onClick={() => action("draft")}>{editor.busy ? "Saving…" : id ? "Save changes" : "Save draft"}</Button>
      {(!id || editor.article?.status === "DRAFT") && permissions.canSubmitArticles ? <Button variant="outline" disabled={editor.busy || !canSubmit} onClick={() => action("submit")}>Submit for review</Button> : null}
      {(!id || ["DRAFT", "IN_REVIEW"].includes(editor.article?.status ?? "DRAFT")) && permissions.canPublishArticles ? <Button disabled={editor.busy || !canSubmit} onClick={() => action("publish")}>Publish now</Button> : null}
      {(!id || ["DRAFT", "IN_REVIEW"].includes(editor.article?.status ?? "DRAFT")) && permissions.canScheduleArticles ? <Button variant="outline" disabled={editor.busy || !canSubmit || !editor.scheduledAt} onClick={() => action("schedule")}>Schedule</Button> : null}
    </div>
  </div>;
}
