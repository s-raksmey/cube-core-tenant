"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MoreHorizontal, Pencil } from "lucide-react";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { ArticleMarkdown } from "@/components/content/article-markdown";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useArticleDetail, type ArticleDetailAction } from "@/hooks/use-article-detail";
import { supportedLocales } from "@/lib/locales";
import { articleActions } from "@/lib/article-workflow";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ArticleDetail({ id }: { id: string }) {
  const data = useArticleDetail(id);
  const viewer = useConsoleUser();
  const [locale, setLocale] = useState("en");
  const [dialog, setDialog] = useState<ArticleDetailAction | null>(null);
  const [comment, setComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  if (data.loading && !data.article) return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading article…</div>;
  if (!data.permissions.canViewArticles) return <p role="alert">You do not have permission to view articles.</p>;
  const article = data.article;
  if (!article) return <p role="alert" className="text-sm text-destructive">{data.loadError?.message ?? "Article not found"}</p>;
  const translation = article.translations.find((item) => item.locale === locale);
  const actions = articleActions(article, viewer.id, data.permissions);
  async function confirm() {
    if (!dialog) return;
    if (dialog === "requestChanges" && !comment.trim()) return;
    if ((dialog === "schedule" || dialog === "reschedule") && (!scheduledAt || new Date(`${scheduledAt}Z`) <= new Date())) return;
    if (await data.act(dialog, dialog === "requestChanges" ? comment : scheduledAt)) { setDialog(null); setComment(""); setScheduledAt(""); }
  }
  return <div className="space-y-5">
    <PageHeader title={article.title} description={`${article.categoryName} · ${article.subcategoryName}`} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" asChild><Link href="/content/articles">Back to articles</Link></Button>
        <Badge variant="secondary">{article.status.replaceAll("_", " ")}</Badge>
        {article.isBreaking ? <Badge variant="outline">Breaking</Badge> : null}
        {article.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" asChild><a href="#article-preview">Preview</a></Button>
        {actions.edit ? <Button asChild><Link href={`/content/articles/${id}/edit`}><Pencil />Edit article</Link></Button> : null}
        {actions.unpublish ? <Button disabled={data.busy} onClick={() => setDialog("unpublish")}>Unpublish</Button> : null}
        {actions.submit ? <Button variant="outline" disabled={data.busy} onClick={() => void data.act("submit")}>Submit for review</Button> : null}
        {actions.requestChanges ? <Button variant="outline" disabled={data.busy} onClick={() => setDialog("requestChanges")}>Request changes</Button> : null}
        {actions.publish ? <Button variant="outline" disabled={data.busy} onClick={() => void data.act("publish")}>Publish now</Button> : null}
        {actions.cancelSchedule ? <Button variant="outline" disabled={data.busy} onClick={() => void data.act("cancelSchedule")}>Cancel schedule</Button> : null}
        {actions.restore ? <Button disabled={data.busy} onClick={() => void data.act("restore")}>Restore to draft</Button> : null}
        {actions.deleteArchived ? <Button variant="destructive" disabled={data.busy} onClick={() => setDialog("deleteArchived")}>Delete permanently</Button> : null}
        {(actions.schedule || actions.reschedule || actions.breaking || actions.featured || actions.archive) ?
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={data.busy}><MoreHorizontal />More actions</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              {actions.schedule ? <DropdownMenuItem onSelect={() => setDialog("schedule")}>Schedule publication</DropdownMenuItem> : null}
              {actions.reschedule ? <DropdownMenuItem onSelect={() => { setScheduledAt(""); setDialog("reschedule"); }}>Change schedule</DropdownMenuItem> : null}
              {actions.breaking ? <DropdownMenuItem onSelect={() => void data.act("breaking", !article.isBreaking)}>{article.isBreaking ? "Remove breaking" : "Mark as breaking"}</DropdownMenuItem> : null}
              {actions.featured ? <DropdownMenuItem onSelect={() => void data.act("featured", !article.isFeatured)}>{article.isFeatured ? "Remove featured" : "Mark as featured"}</DropdownMenuItem> : null}
              {actions.archive ? <DropdownMenuItem onSelect={() => setDialog("archive")}>Archive draft</DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu> : null}
      </div>
    </div>
    {article.status === "PUBLISHED" ? <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">Unpublish this article before editing it, changing Breaking or Featured, or archiving it.</p> : null}
    {data.error ? <p role="alert" className="text-sm text-destructive">{data.error}</p> : null}{data.feedback ? <p role="status" className="text-sm">{data.feedback}</p> : null}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article id="article-preview" className="space-y-5 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap gap-2"><Button size="sm" variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>English</Button>
          {article.translations.map((item) => <Button key={item.locale} size="sm" variant={locale === item.locale ? "default" : "outline"} onClick={() => setLocale(item.locale)}>{supportedLocales.find((language) => language.code === item.locale)?.label ?? item.locale.toUpperCase()}</Button>)}
        </div>
        {article.featuredImageUrl ? <img src={article.featuredImageUrl} alt="" className="max-h-96 w-full rounded-lg object-cover" /> : null}
        <h1 className="text-2xl font-semibold">{translation?.title ?? article.title}</h1>
        {(translation?.summary ?? article.summary) ? <p className="text-muted-foreground">{translation?.summary ?? article.summary}</p> : null}
        <ArticleMarkdown content={translation?.content ?? article.content} />
      </article>
      <aside className="space-y-4"><div className="space-y-2 rounded-xl border bg-card p-4 text-sm"><h2 className="font-medium">Article details</h2>
        <p>Author: {article.authorName ?? "—"}</p><p>Slug: {article.slug}</p><p>Tags: {article.tags.map((tag) => tag.name).join(" · ") || "—"}</p>
        {article.scheduledAt ? <p>Scheduled: {new Date(article.scheduledAt).toLocaleString()}</p> : null}
        {article.publishedAt ? <p>Published: {new Date(article.publishedAt).toLocaleString()}</p> : null}
      </div><div className="space-y-3 rounded-xl border bg-card p-4 text-sm"><h2 className="font-medium">Review history</h2>
        {article.reviews.length ? article.reviews.map((review) => <div key={review.id} className="border-t pt-2"><p className="font-medium">{review.decision.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase())}</p><p className="text-muted-foreground">{review.reviewerName ?? "Former user"} · {new Date(review.createdAt).toLocaleString()}</p>{review.comment ? <p className="mt-1">{review.comment}</p> : null}</div>) : <p className="text-muted-foreground">No review activity yet.</p>}
      </div></aside>
    </div>
    <Dialog open={Boolean(dialog)} onOpenChange={(open) => { if (!open && !data.busy) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog === "deleteArchived" ? "Delete permanently?" : dialog === "unpublish" ? "Unpublish article?" : dialog === "archive" ? "Archive draft?" : dialog === "requestChanges" ? "Request changes" : dialog === "reschedule" ? "Change schedule" : "Schedule article"}</DialogTitle><DialogDescription>{dialog === "deleteArchived" ? `Permanently delete archived article “${article.title}”? Its content and review history will be removed. This cannot be undone.` : dialog === "unpublish" ? `“${article.title}” will be removed from the public website and returned to Draft. You can then edit, change Breaking or Featured, or archive it.` : dialog === "archive" ? `“${article.title}” will remain unavailable publicly until it is restored and published again.` : dialog === "requestChanges" ? "Tell the author what needs to change." : "Enter a future date and time in UTC."}</DialogDescription></DialogHeader>
      {dialog === "requestChanges" ? <textarea aria-label="Reason for changes" className="min-h-24 rounded-md border p-2 text-sm" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} /> : dialog === "schedule" || dialog === "reschedule" ? <Input type="datetime-local" aria-label="Scheduled time in UTC" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /> : null}
      <DialogFooter><Button variant="outline" disabled={data.busy} onClick={() => setDialog(null)}>Cancel</Button><Button variant={dialog === "deleteArchived" ? "destructive" : "default"} disabled={data.busy || (dialog === "requestChanges" ? !comment.trim() : dialog === "schedule" || dialog === "reschedule" ? !scheduledAt : false)} onClick={() => void confirm()}>{data.busy ? "Saving…" : dialog === "deleteArchived" ? "Delete permanently" : dialog === "unpublish" ? "Unpublish" : dialog === "archive" ? "Archive" : dialog === "requestChanges" ? "Request changes" : "Save schedule"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
