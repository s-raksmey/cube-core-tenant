"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTenantTagForm, useTenantTags } from "@/hooks/use-tenant-tags";
import { Pencil, Plus, Trash2 } from "lucide-react";
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
export function TagsPanel() {
  const tags = useTenantTags();
  const permissions = tags.permissions;
  const {
    open,
    setOpen,
    editing,
    deleting,
    setDeleting,
    name,
    setName,
    slug,
    setSlug,
    manualSlug,
    setManualSlug,
    translations,
    setTranslations,
    locales,
    available,
    valid,
    showForm,
    submit,
    updateTranslation,
  } = useTenantTagForm(tags);
  const showActions = permissions.canEditTags || permissions.canDeleteTags;
  if (!permissions.loading && !permissions.canViewTags)
    return (
      <p className="text-sm text-muted-foreground" role="alert">
        {permissions.error?.message ??
          "You do not have permission to view tags."}
      </p>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:max-w-md">
          <Input
            aria-label="Search tags"
            value={tags.searchInput}
            onChange={(event) => tags.setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") tags.applySearch();
            }}
            placeholder="Search tags"
            maxLength={160}
          />
          <Button variant="outline" onClick={tags.applySearch}>
            Search
          </Button>
        </div>
        {permissions.canCreateTags ? (
          <Button className="sm:ml-auto" onClick={() => showForm()}>
            <Plus />
            Create tag
          </Button>
        ) : null}
      </div>
      {tags.notice ? (
        <p role="status" className="text-sm">
          {tags.notice}
        </p>
      ) : null}
      {tags.error || (tags.actionError && !open && !deleting) ? (
        <p role="alert" className="text-sm text-destructive">
          {tags.error?.message ?? tags.actionError}
        </p>
      ) : null}
      <div
        className="overflow-hidden rounded-xl border bg-card"
        aria-busy={tags.loading}
      >
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th>Slug</th>
              <th>Translations</th>
              {showActions ? <th className="p-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {tags.initialLoading ? (
              <tr>
                <td colSpan={showActions ? 4 : 3} className="p-8 text-center">
                  Loading tags…
                </td>
              </tr>
            ) : tags.tags.length ? (
              tags.tags.map((tag) => (
                <tr key={tag.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{tag.name}</td>
                  <td>{tag.slug}</td>
                  <td>
                    {tag.translations
                      .map((item) => item.locale.toUpperCase())
                      .join(" · ") || "—"}
                  </td>
                  {showActions ? (
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {permissions.canEditTags ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${tag.name}`}
                            title="Edit tag"
                            onClick={() => showForm(tag)}
                          >
                            <Pencil />
                          </Button>
                        ) : null}
                        {permissions.canDeleteTags ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${tag.name}`}
                            title="Delete tag"
                            onClick={() => {
                              tags.clearFeedback();
                              setDeleting(tag);
                            }}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : !tags.error ? (
              <tr>
                <td
                  colSpan={showActions ? 4 : 3}
                  className="p-8 text-center text-muted-foreground"
                >
                  <p>
                    {tags.search
                      ? "No tags found"
                      : tags.page > 1
                        ? "No more tags"
                        : "No tags yet"}
                  </p>
                  <p className="mt-1">
                    {tags.search
                      ? "Try another search term."
                      : "Create tags to help organize and connect related articles."}
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {tags.page > 1 || tags.tags.length === 25 ? (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            disabled={tags.page === 1 || tags.loading}
            onClick={() => tags.setPage(tags.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">Page {tags.page}</span>
          <Button
            variant="outline"
            disabled={tags.tags.length < 25 || tags.loading}
            onClick={() => tags.setPage(tags.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!tags.saving) setOpen(value);
        }}
      >
        <DialogContent className="gap-5 p-0 sm:max-w-md">
          <DialogHeader className="gap-1 px-5 pt-5">
            <DialogTitle>{editing ? "Edit tag" : "Create tag"}</DialogTitle>
            <DialogDescription>
              Start with the English name, then add translations when needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </span>
              <Input
                autoFocus
                maxLength={160}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!manualSlug) setSlug(slugify(event.target.value));
                }}
                placeholder="Enter tag name"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Slug <span className="text-destructive">*</span>
              </span>
              <Input
                maxLength={120}
                value={slug}
                onChange={(event) => {
                  setManualSlug(true);
                  setSlug(slugify(event.target.value));
                }}
                placeholder="Created from the English name"
              />
            </label>
            <section className="space-y-2" aria-label="Additional translations">
              <div>
                <h3 className="text-sm font-medium">Translations</h3>
                <p className="text-xs text-muted-foreground">
                  Optional names for other languages.
                </p>
              </div>
              {translations.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[9.5rem_minmax(0,1fr)_auto] gap-2"
                >
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    aria-label={`Language for translation ${index + 1}`}
                    value={item.locale}
                    onChange={(event) =>
                      updateTranslation(index, { locale: event.target.value })
                    }
                  >
                    {locales.map((locale) => (
                      <option
                        key={locale.code}
                        value={locale.code}
                        disabled={translations.some(
                          (other, i) =>
                            i !== index && other.locale === locale.code,
                        )}
                      >
                        {locale.label} ({locale.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label={`Tag name in ${item.locale}`}
                    maxLength={160}
                    value={item.name}
                    onChange={(event) =>
                      updateTranslation(index, { name: event.target.value })
                    }
                    placeholder="Translation"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.locale} translation`}
                    onClick={() =>
                      setTranslations((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {available.length ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTranslations((current) => [
                      ...current,
                      { locale: available[0].code, name: "" },
                    ])
                  }
                >
                  <Plus />
                  Add translation
                </Button>
              ) : null}
            </section>
            {tags.actionError ? (
              <p role="alert" className="text-sm text-destructive">
                {tags.actionError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-b-xl bg-muted/40 px-5 py-3.5">
            <Button
              variant="outline"
              disabled={tags.saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={tags.saving || !valid}
              onClick={() => void submit()}
            >
              {tags.saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(value) => {
          if (!value && !tags.saving) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag?</DialogTitle>
            <DialogDescription>
              You are about to delete &quot;{deleting?.name}&quot;. This action
              cannot be undone. Articles will be preserved.
            </DialogDescription>
          </DialogHeader>
          {tags.actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {tags.actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={tags.saving}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={tags.saving}
              onClick={async () => {
                if (deleting && (await tags.remove(deleting.id)))
                  setDeleting(null);
              }}
            >
              {tags.saving ? "Deleting…" : "Delete tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
