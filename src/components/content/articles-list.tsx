"use client";

import { useConsoleUser } from "@/components/providers/console-user-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useTenantArticles,
  type ArticleListAction,
} from "@/hooks/use-tenant-articles";
import type {
  ArticleScope,
  ArticleStatus,
} from "@/lib/apollo/generated/graphql";
import { articleActions } from "@/lib/article-workflow";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statuses: ArticleStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];
const statusLabel = (status: ArticleStatus) =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm";
const actionLabels: Record<ArticleListAction, string> = {
  delete: "Delete draft",
  deleteArchived: "Delete permanently",
  submit: "Submit for review",
  requestChanges: "Request changes",
  publish: "Publish now",
  schedule: "Schedule",
  reschedule: "Change schedule",
  cancelSchedule: "Cancel schedule",
  unpublish: "Unpublish",
  archive: "Archive draft",
  restore: "Restore to draft",
  breaking: "Change breaking status",
  featured: "Change featured status",
};
type PendingAction = {
  action: ArticleListAction;
  id: string;
  title: string;
  enabled?: boolean;
};

export function ArticlesList({ initialScope }: { initialScope: ArticleScope }) {
  const data = useTenantArticles(initialScope);
  const viewer = useConsoleUser();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [comment, setComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const needsDate =
    pending?.action === "schedule" || pending?.action === "reschedule";
  const needsComment = pending?.action === "requestChanges";
  const validDate =
    !needsDate ||
    Boolean(
      scheduledAt &&
      !Number.isNaN(Date.parse(`${scheduledAt}Z`)) &&
      new Date(`${scheduledAt}Z`) > new Date(),
    );
  async function confirmAction() {
    if (!pending || (needsComment && !comment.trim()) || !validDate) return;
    const value = needsComment
      ? comment.trim()
      : needsDate
        ? new Date(`${scheduledAt}Z`).toISOString()
        : pending.enabled;
    if (await data.act(pending.action, pending.id, value)) {
      setPending(null);
      setComment("");
      setScheduledAt("");
    }
  }
  if (!data.permissions.loading && !data.permissions.canViewArticles) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        You do not have permission to view articles.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full gap-2 sm:max-w-md">
          <Input
            value={data.searchInput}
            maxLength={160}
            placeholder="Search articles"
            aria-label="Search articles"
            onChange={(event) => data.setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") data.applySearch();
            }}
          />
          <Button variant="outline" onClick={data.applySearch}>
            Search
          </Button>
        </div>
        <select
          className={selectClass}
          aria-label="Filter status"
          value={data.status}
          onChange={(event) =>
            data.setStatus(event.target.value as ArticleStatus | "")
          }
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Filter category"
          value={data.categoryId}
          onChange={(event) => data.setCategoryId(event.target.value)}
        >
          <option value="">All categories</option>
          {data.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {data.permissions.canCreateArticles ? (
          <Button className="sm:ml-auto" asChild>
            <Link href="/content/articles/new">
              <Plus />
              Create article
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2 border-b text-sm">
        {(
          [
            "ALL",
            "MY",
            ...(data.permissions.canReviewArticles ? ["REVIEW"] : []),
          ] as ArticleScope[]
        ).map((scope) => (
          <button
            key={scope}
            type="button"
            className={`px-3 py-2 ${data.scope === scope ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => {
              data.setScope(scope);
              history.replaceState(
                null,
                "",
                scope === "ALL"
                  ? "/content/articles"
                  : `/content/articles?scope=${scope.toLowerCase()}`,
              );
            }}
          >
            {scope === "ALL"
              ? "All articles"
              : scope === "MY"
                ? "My articles"
                : "Review queue"}
          </button>
        ))}
      </div>
      {data.error || data.actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {data.actionError || data.error?.message}
        </p>
      ) : null}
      <div
        className="overflow-hidden rounded-xl border bg-card"
        aria-busy={data.refreshing}
      >
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Article</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.loading ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 text-muted-foreground"
                  >
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading articles…
                  </div>
                </td>
              </tr>
            ) : data.items.length ? (
              data.items.map((article) => {
                const actions = articleActions(
                  article,
                  viewer.id,
                  viewer.role,
                  data.permissions,
                );
                const offer = (
                  action: ArticleListAction,
                  label = actionLabels[action],
                  enabled?: boolean,
                ) =>
                  actions[action] ? (
                    <DropdownMenuItem
                      key={action}
                      variant={
                        action === "delete" || action === "deleteArchived"
                          ? "destructive"
                          : "default"
                      }
                      onSelect={() =>
                        setPending({
                          action,
                          id: article.id,
                          title: article.title,
                          enabled,
                        })
                      }
                    >
                      {label}
                    </DropdownMenuItem>
                  ) : null;
                return (
                  <tr key={article.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link
                        className="flex items-center gap-3 font-medium hover:text-primary"
                        href={`/content/articles/${article.id}`}
                      >
                        {article.featuredImageUrl ? (
                          <img
                            src={article.featuredImageUrl}
                            alt=""
                            className="size-10 rounded object-cover"
                          />
                        ) : null}
                        <span>{article.title}</span>
                      </Link>
                    </td>
                    <td className="p-3">{article.categoryName}</td>
                    <td className="p-3">{article.authorName ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant="secondary">
                        {statusLabel(article.status)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${article.title}`}
                            disabled={data.actionBusy}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-52">
                          <DropdownMenuItem asChild>
                            <Link href={`/content/articles/${article.id}`}>
                              View article
                            </Link>
                          </DropdownMenuItem>
                          {article.status !== "ARCHIVED" ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/content/articles/${article.id}#article-preview`}
                              >
                                Preview
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {actions.edit ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/content/articles/${article.id}/edit`}
                              >
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {offer("submit")}
                          {offer("requestChanges")}
                          {offer("publish")}
                          {offer("schedule")}
                          {offer("reschedule")}
                          {offer("cancelSchedule")}
                          {offer("unpublish")}
                          {offer(
                            "breaking",
                            article.isBreaking
                              ? "Remove breaking"
                              : "Mark as breaking",
                            !article.isBreaking,
                          )}
                          {offer(
                            "featured",
                            article.isFeatured
                              ? "Remove featured"
                              : "Mark as featured",
                            !article.isFeatured,
                          )}
                          {offer("archive")}
                          {offer("restore")}
                          {offer("deleteArchived")}
                          {offer("delete")}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            ) : !data.error ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  <p>{data.search ? "No articles found" : "No articles yet"}</p>
                  <p className="mt-1">
                    {data.search
                      ? "Try another search term."
                      : "Create your first article to start publishing content."}
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {data.total > 25 ? (
        <div className="flex items-center justify-end gap-3 text-sm">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={data.page <= 1 || data.refreshing}
            onClick={() => data.setPage(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={data.page >= data.totalPages || data.refreshing}
            onClick={() => data.setPage(data.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !data.actionBusy) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending ? `${actionLabels[pending.action]}?` : "Article action"}
            </DialogTitle>
            <DialogDescription>
              {pending?.action === "unpublish"
                ? `“${pending.title}” will be removed from the public website and returned to Draft. You can then edit it, change Breaking or Featured, or archive it.`
                : pending?.action === "deleteArchived"
                  ? `Permanently delete archived article “${pending.title}”? Its content and review history will be removed. This cannot be undone.`
                  : pending?.action === "delete"
                    ? `Delete “${pending.title}” permanently? This cannot be undone.`
                    : pending
                      ? `${actionLabels[pending.action]} for “${pending.title}”?`
                      : ""}
            </DialogDescription>
          </DialogHeader>
          {needsComment ? (
            <label className="grid gap-1.5 text-sm font-medium">
              Reason *
              <textarea
                className="min-h-24 rounded-md border p-2 text-sm font-normal"
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
          ) : null}
          {needsDate ? (
            <Input
              type="datetime-local"
              aria-label="Scheduled time in UTC"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={data.actionBusy}
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              variant={
                pending?.action === "delete" ||
                pending?.action === "deleteArchived"
                  ? "destructive"
                  : "default"
              }
              disabled={
                data.actionBusy ||
                (needsComment && !comment.trim()) ||
                !validDate
              }
              onClick={() => void confirmAction()}
            >
              {data.actionBusy
                ? "Saving…"
                : pending?.action === "deleteArchived"
                  ? "Delete permanently"
                  : needsComment
                    ? "Request changes"
                    : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
