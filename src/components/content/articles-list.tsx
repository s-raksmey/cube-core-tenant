"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { useTenantArticles } from "@/hooks/use-tenant-articles";
import type { ArticleScope, ArticleStatus } from "@/lib/apollo/generated/graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statuses: ArticleStatus[] = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
const statusLabel = (status: ArticleStatus) => status.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
const selectClass = "h-9 rounded-md border border-input bg-background px-2 text-sm";

export function ArticlesList({ initialScope }: { initialScope: ArticleScope }) {
  const data = useTenantArticles(initialScope);
  const viewer = useConsoleUser();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  if (!data.permissions.loading && !data.permissions.canViewArticles) {
    return <p role="alert" className="text-sm text-muted-foreground">You do not have permission to view articles.</p>;
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex w-full gap-2 sm:max-w-md">
        <Input value={data.searchInput} maxLength={160} placeholder="Search articles" aria-label="Search articles"
          onChange={(event) => data.setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") data.applySearch(); }} />
        <Button variant="outline" onClick={data.applySearch}>Search</Button>
      </div>
      <select className={selectClass} aria-label="Filter status" value={data.status}
        onChange={(event) => data.setStatus(event.target.value as ArticleStatus | "")}>
        <option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
      </select>
      <select className={selectClass} aria-label="Filter category" value={data.categoryId}
        onChange={(event) => data.setCategoryId(event.target.value)}>
        <option value="">All categories</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      {data.permissions.canCreateArticles ? <Button className="sm:ml-auto" asChild><Link href="/content/articles/new"><Plus />Create article</Link></Button> : null}
    </div>
    <div className="flex gap-2 border-b text-sm">
      {(["ALL", "MY", ...(data.permissions.canReviewArticles ? ["REVIEW"] : [])] as ArticleScope[]).map((scope) =>
        <button key={scope} type="button" className={`px-3 py-2 ${data.scope === scope ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
          onClick={() => { data.setScope(scope); history.replaceState(null, "", scope === "ALL" ? "/content/articles" : `/content/articles?scope=${scope.toLowerCase()}`); }}>
          {scope === "ALL" ? "All articles" : scope === "MY" ? "My articles" : "Review queue"}
        </button>)}
    </div>
    {data.feedback ? <p role="status" className="text-sm">{data.feedback}</p> : null}
    {data.actionError || data.error ? <p role="alert" className="text-sm text-destructive">{data.actionError || data.error?.message}</p> : null}
    <div className="overflow-hidden rounded-xl border bg-card" aria-busy={data.refreshing}>
      <table className="w-full text-sm"><thead className="border-b text-left text-muted-foreground"><tr>
        <th className="p-3">Article</th><th className="p-3">Category</th><th className="p-3">Author</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3 text-right">Actions</th>
      </tr></thead><tbody>
        {data.loading ? Array.from({ length: 3 }, (_, index) => <tr key={index} className="border-b"><td colSpan={6} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>) :
          data.items.length ? data.items.map((article) => {
            const canEdit = (data.permissions.canUpdateAnyArticle || (article.authorId === viewer.id && data.permissions.canUpdateOwnArticles)) &&
              (article.status === "DRAFT" || (data.permissions.canUpdateAnyArticle && ["IN_REVIEW", "PUBLISHED"].includes(article.status)));
            const canDelete = article.status === "DRAFT" && (data.permissions.canDeleteAnyArticle || (article.authorId === viewer.id && data.permissions.canDeleteOwnArticles));
            return <tr key={article.id} className="border-b last:border-0">
              <td className="p-3"><Link className="flex items-center gap-3 font-medium hover:text-primary" href={`/content/articles/${article.id}`}>
                {article.featuredImageUrl ? <img src={article.featuredImageUrl} alt="" className="size-10 rounded object-cover" /> : null}
                <span>{article.title}</span></Link></td>
              <td className="p-3">{article.categoryName}</td><td className="p-3">{article.authorName ?? "—"}</td>
              <td className="p-3"><Badge variant="secondary">{statusLabel(article.status)}</Badge></td>
              <td className="p-3">{new Date(article.updatedAt).toLocaleDateString()}</td>
              <td className="p-3 text-right"><div className="flex justify-end gap-1">
                {canEdit ? <Button variant="ghost" size="icon" asChild title="Edit article"><Link aria-label={`Edit ${article.title}`} href={`/content/articles/${article.id}/edit`}><Pencil /></Link></Button> : null}
                {canDelete ? <Button variant="ghost" size="icon" title="Delete draft" aria-label={`Delete ${article.title}`} onClick={() => setDeleteTarget({ id: article.id, title: article.title })}><Trash2 className="text-destructive" /></Button> : null}
              </div></td>
            </tr>;
          }) : !data.error ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
            <p>{data.search ? "No articles found" : "No articles yet"}</p><p className="mt-1">{data.search ? "Try another search term." : "Create your first article to start publishing content."}</p>
            {!data.search && data.permissions.canCreateArticles ? <Button className="mt-3" asChild><Link href="/content/articles/new">Create article</Link></Button> : null}
          </td></tr> : null}
      </tbody></table>
    </div>
    {data.total > 25 ? <div className="flex items-center justify-end gap-3 text-sm"><span>Page {data.page} of {data.totalPages}</span>
      <Button variant="outline" disabled={data.page <= 1 || data.refreshing} onClick={() => data.setPage(data.page - 1)}>Previous</Button>
      <Button variant="outline" disabled={data.page >= data.totalPages || data.refreshing} onClick={() => data.setPage(data.page + 1)}>Next</Button>
    </div> : null}
    <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !data.deleting) setDeleteTarget(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Delete draft?</DialogTitle><DialogDescription>Delete “{deleteTarget?.title}” permanently? This cannot be undone.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={data.deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" disabled={data.deleting} onClick={async () => { if (deleteTarget && await data.deleteDraft(deleteTarget.id)) setDeleteTarget(null); }}>{data.deleting ? "Deleting…" : "Delete draft"}</Button>
        </DialogFooter></DialogContent>
    </Dialog>
  </div>;
}
