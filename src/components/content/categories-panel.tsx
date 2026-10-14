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
import { useTenantCategories } from "@/hooks/use-tenant-categories";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import { supportedLocales } from "@/lib/locales";
import { categoryToFormState, type CategoryTarget, type TenantCategory, type TranslationDraft } from "@/types/category.types";
import { ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

const defaultTranslation = (): TranslationDraft => ({ locale: "en", name: "" });

function formatSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tenant-scoped category list and translation-aware create workflow. */
export function CategoriesPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TenantCategory | null>(null);
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [translations, setTranslations] = useState<TranslationDraft[]>([
    defaultTranslation(),
  ]);
  const [subcategoryTarget, setSubcategoryTarget] = useState<CategoryTarget | null>(null);
  const [subcategorySlug, setSubcategorySlug] = useState("");
  const [subcategoryTranslations, setSubcategoryTranslations] = useState<TranslationDraft[]>([defaultTranslation()]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => new Set());

  const {
    searchInput,
    setSearchInput,
    applySearch,
    categories,
    initialLoading: loading,
    error,
    createCategory,
    createSubcategory,
    updateCategory,
    deleteCategory,
    creatingCategory,
    creatingSubcategory,
    createCategoryError,
    createSubcategoryError,
    updatingCategory,
  } = useTenantCategories();
  const {
    canCreateCategories,
    canViewSubcategories,
    canCreateSubcategories,
    canEditCategories,
    canDeleteCategories,
  } = useTenantUserPermissions();
  const showActions =
    canCreateSubcategories || canEditCategories || canDeleteCategories;
  const availableLocales = useMemo(
    () =>
      supportedLocales.filter((locale) => locale.code !== "th").filter(
        (locale) => !translations.some((item) => item.locale === locale.code),
      ),
    [translations],
  );
  const hasIncompleteTranslation = translations.some(
    (translation) => !translation.name.trim(),
  );
  const availableSubcategoryLocales = useMemo(
    () =>
      supportedLocales
        .filter((locale) => locale.code !== "th")
        .filter(
          (locale) => !subcategoryTranslations.some((item) => item.locale === locale.code),
        ),
    [subcategoryTranslations],
  );
  const hasIncompleteSubcategoryTranslation = subcategoryTranslations.some(
    (translation) => !translation.name.trim(),
  );

  function resetCreateForm() {
    setSlug("");
    setIsSlugManuallyEdited(false);
    setTranslations([defaultTranslation()]);
  }

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    setEditingCategory(null);
    resetCreateForm();
  }

  function openEditDialog(category: TenantCategory) {
    const form = categoryToFormState(category);
    setEditingCategory(category);
    setSlug(form.slug);
    setIsSlugManuallyEdited(true);
    setTranslations(form.translations);
    setIsCreateDialogOpen(true);
  }

  function updateTranslation(index: number, update: Partial<TranslationDraft>) {
    setTranslations((current) =>
      current.map((translation, translationIndex) =>
        translationIndex === index ? { ...translation, ...update } : translation,
      ),
    );
  }

  function openSubcategoryDialog(category: CategoryTarget) {
    setSubcategoryTarget(category);
    setSubcategorySlug("");
    setSubcategoryTranslations([defaultTranslation()]);
  }

  function closeSubcategoryDialog() {
    setSubcategoryTarget(null);
    setSubcategorySlug("");
    setSubcategoryTranslations([defaultTranslation()]);
  }

  function updateSubcategoryTranslation(index: number, update: Partial<TranslationDraft>) {
    setSubcategoryTranslations((current) =>
      current.map((translation, translationIndex) =>
        translationIndex === index ? { ...translation, ...update } : translation,
      ),
    );
  }
  async function submitSubcategory() {
    if (!subcategoryTarget) return;

    try {
      await createSubcategory({
            categoryId: subcategoryTarget.id,
            slug: subcategorySlug,
            translations: subcategoryTranslations.map((translation) => ({
              ...translation,
              name: translation.name.trim(),
            })),
      });
      setExpandedCategoryIds((current) => new Set(current).add(subcategoryTarget.id));
      closeSubcategoryDialog();
    } catch {
      // The operation error is presented in the dialog.
    }
  }
  async function submit() {
    try {
      const input = {
        slug,
        translations: translations.map((translation) => ({
          ...translation,
          name: translation.name.trim(),
        })),
      };
      if (editingCategory) await updateCategory(editingCategory.id, input);
      else await createCategory(input);
      closeCreateDialog();
    } catch {
      // The operation error is presented next to the form actions.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:max-w-md">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applySearch();
            }}
            placeholder="Search categories"
          />
          <Button
            type="button"
            variant="outline"
            onClick={applySearch}
          >
            Search
          </Button>
        </div>
        {canCreateCategories ? (
          <Button className="sm:ml-auto" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus />
            Create category
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <div className="overflow-hidden rounded-xl border bg-card">
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
            {loading ? (
              <tr>
                <td colSpan={showActions ? 4 : 3} className="p-8 text-center">
                  Loading categories…
                </td>
              </tr>
            ) : null}
            {!loading && categories.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 4 : 3} className="p-8 text-center text-muted-foreground">
                  No categories yet. Create your first category to organize your content.
                </td>
              </tr>
            ) : null}
            {!loading
              ? categories.map((category) => {
                  const isExpanded = expandedCategoryIds.has(category.id);
                  const categoryName = category.name;

                  return (
                    <Fragment key={category.id}>
                      <tr className="border-b">
                        <td className="p-3 font-medium">
                          {canViewSubcategories ? (
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-left hover:text-primary"
                              onClick={() =>
                                setExpandedCategoryIds((current) => {
                                  const next = new Set(current);
                                  if (next.has(category.id)) next.delete(category.id);
                                  else next.add(category.id);
                                  return next;
                                })
                              }
                              aria-expanded={isExpanded}
                            >
                              {canViewSubcategories && isExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-4 text-muted-foreground" />
                              )}
                              {categoryName}
                              <span className="font-normal text-muted-foreground">
                                ({category.subcategories.length})
                              </span>
                            </button>
                          ) : (
                            categoryName
                          )}
                        </td>
                        <td>{category.slug}</td>
                        <td>
                          {category.translations
                            .map((translation) => translation.locale.toUpperCase())
                            .join(" · ")}
                        </td>
                        {showActions ? (
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              {canEditCategories ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit category"
                                  aria-label={`Edit ${categoryName}`}
                                  onClick={() => openEditDialog(category)}
                                >
                                  <Pencil />
                                </Button>
                              ) : null}
                              {canCreateSubcategories ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Add subcategory"
                                  aria-label={`Add a subcategory to ${categoryName}`}
                                  onClick={() =>
                                    openSubcategoryDialog({ id: category.id, name: categoryName })
                                  }
                                >
                                  <FolderPlus />
                                </Button>
                              ) : null}
                              {canDeleteCategories ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete category"
                                  aria-label={`Delete ${categoryName}`}
                                  onClick={() => void deleteCategory(category.id)}
                                >
                                  <Trash2 className="text-destructive" />
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                      {canViewSubcategories && isExpanded ? (
                        category.subcategories.length ? (
                          category.subcategories.map((subcategory) => (
                            <tr key={subcategory.id} className="border-b bg-muted/25 text-muted-foreground">
                              <td className="py-2.5 pr-3 pl-10 font-medium text-foreground">
                                ↳ {subcategory.translations[0]?.name ?? subcategory.slug}
                              </td>
                              <td>{subcategory.slug}</td>
                              <td>
                                {subcategory.translations
                                  .map((translation) => translation.locale.toUpperCase())
                                  .join(" · ")}
                              </td>
                              {showActions ? <td /> : null}
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b bg-muted/25">
                            <td colSpan={showActions ? 4 : 3} className="px-10 py-3 text-sm text-muted-foreground">
                              No subcategories yet.
                            </td>
                          </tr>
                        )
                      ) : null}
                    </Fragment>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="gap-5 p-0 sm:max-w-md">
          <DialogHeader className="gap-1 px-5 pt-5">
            <DialogTitle>{editingCategory ? "Edit category" : "Create category"}</DialogTitle>
            <DialogDescription>
              Start with the English name, then add translations when needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Category name <span className="text-destructive">*</span>
                <span className="ml-1 font-normal text-muted-foreground">(English)</span>
              </span>
              <Input
                value={translations[0].name}
                onChange={(event) => {
                  const name = event.target.value;
                  updateTranslation(0, { name });
                  if (!isSlugManuallyEdited) {
                    setSlug(formatSlug(name));
                  }
                }}
                placeholder="Enter category name"
                autoFocus
              />
            </label>

            {translations.length > 1 ? (
              <section className="space-y-2" aria-label="Additional translations">
                <div>
                  <h3 className="text-sm font-medium">Translations</h3>
                  <p className="text-xs text-muted-foreground">
                    Names displayed when readers use another language.
                  </p>
                </div>
                {translations.slice(1).map((translation, index) => {
                  const translationIndex = index + 1;
                  return (
                    <div
                      key={translation.locale}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto]"
                    >
                      <label className="sr-only" htmlFor={`category-locale-${translationIndex}`}>
                        Language for translation {translationIndex}
                      </label>
                      <select
                        id={`category-locale-${translationIndex}`}
                        className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        value={translation.locale}
                        onChange={(event) =>
                          updateTranslation(translationIndex, { locale: event.target.value })
                        }
                      >
                        {supportedLocales
                          .filter((locale) => locale.code !== "en" && locale.code !== "th")
                          .map((locale) => (
                            <option
                              key={locale.code}
                              value={locale.code}
                              disabled={translations.some(
                                (item, itemIndex) =>
                                  itemIndex !== translationIndex && item.locale === locale.code,
                              )}
                            >
                              {locale.label} ({locale.code})
                            </option>
                          ))}
                      </select>
                      <label className="sr-only" htmlFor={`category-name-${translationIndex}`}>
                        Category name in {translation.locale}
                      </label>
                      <Input
                        id={`category-name-${translationIndex}`}
                        value={translation.name}
                        onChange={(event) =>
                          updateTranslation(translationIndex, { name: event.target.value })
                        }
                        placeholder="Translation"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setTranslations((current) =>
                            current.filter((_, itemIndex) => itemIndex !== translationIndex),
                          )
                        }
                        aria-label={`Remove ${translation.locale} translation`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </section>
            ) : null}

            {availableLocales.length ? (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setTranslations((current) => [
                    ...current,
                    { locale: availableLocales[0].code, name: "" },
                  ])
                }
              >
                <Plus />
                Add translation
              </Button>
            ) : null}

            <label className="grid gap-1.5 border-t pt-4">
              <span className="text-sm font-medium">
                URL slug <span className="text-destructive">*</span>
              </span>
              <Input
                value={slug}
                onChange={(event) => {
                  setIsSlugManuallyEdited(true);
                  setSlug(formatSlug(event.target.value));
                }}
                placeholder="Created from the English name"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">
                Used in links. Lowercase letters, numbers, and hyphens only.
              </span>
            </label>

            {createCategoryError ? (
              <p className="text-sm text-destructive">{createCategoryError.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-b-xl bg-muted/40 px-5 py-3.5">
            <Button variant="outline" onClick={closeCreateDialog}>
              Cancel
            </Button>
            <Button
              disabled={creatingCategory || updatingCategory || !slug || hasIncompleteTranslation}
              onClick={() => void submit()}
            >
              {creatingCategory || updatingCategory ? "Saving…" : editingCategory ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(subcategoryTarget)}
        onOpenChange={(open) => {
          if (!open) closeSubcategoryDialog();
        }}
      >
        <DialogContent className="gap-5 p-0 sm:max-w-md">
          <DialogHeader className="gap-1 px-5 pt-5">
            <DialogTitle>Create subcategory</DialogTitle>
            <DialogDescription>
              Create a subcategory under <span className="font-medium text-foreground">{subcategoryTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Subcategory name <span className="text-destructive">*</span>
                <span className="ml-1 font-normal text-muted-foreground">(English)</span>
              </span>
              <Input
                value={subcategoryTranslations[0].name}
                onChange={(event) => {
                  const name = event.target.value;
                  updateSubcategoryTranslation(0, { name });
                  setSubcategorySlug(formatSlug(name));
                }}
                placeholder="Enter subcategory name"
                autoFocus
              />
            </label>

            {subcategoryTranslations.length > 1 ? (
              <section className="space-y-2" aria-label="Subcategory translations">
                <div>
                  <h3 className="text-sm font-medium">Translations</h3>
                  <p className="text-xs text-muted-foreground">
                    Add a localized subcategory name for readers using another language.
                  </p>
                </div>
                {subcategoryTranslations.slice(1).map((translation, index) => {
                  const translationIndex = index + 1;
                  return (
                    <div
                      key={translation.locale}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto]"
                    >
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        value={translation.locale}
                        onChange={(event) =>
                          updateSubcategoryTranslation(translationIndex, {
                            locale: event.target.value,
                          })
                        }
                        aria-label={`Language for subcategory translation ${translationIndex}`}
                      >
                        {supportedLocales
                          .filter((locale) => locale.code !== "en" && locale.code !== "th")
                          .map((locale) => (
                            <option
                              key={locale.code}
                              value={locale.code}
                              disabled={subcategoryTranslations.some(
                                (item, itemIndex) =>
                                  itemIndex !== translationIndex && item.locale === locale.code,
                              )}
                            >
                              {locale.label} ({locale.code})
                            </option>
                          ))}
                      </select>
                      <Input
                        value={translation.name}
                        onChange={(event) =>
                          updateSubcategoryTranslation(translationIndex, {
                            name: event.target.value,
                          })
                        }
                        placeholder="Translation"
                        aria-label={`Subcategory name in ${translation.locale}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setSubcategoryTranslations((current) =>
                            current.filter((_, itemIndex) => itemIndex !== translationIndex),
                          )
                        }
                        aria-label={`Remove ${translation.locale} translation`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </section>
            ) : null}

            {availableSubcategoryLocales.length ? (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setSubcategoryTranslations((current) => [
                    ...current,
                    { locale: availableSubcategoryLocales[0].code, name: "" },
                  ])
                }
              >
                <Plus />
                Add translation
              </Button>
            ) : null}

            <label className="grid gap-1.5 border-t pt-4">
              <span className="text-sm font-medium">
                URL slug <span className="text-destructive">*</span>
              </span>
              <Input
                value={subcategorySlug}
                onChange={(event) => setSubcategorySlug(formatSlug(event.target.value))}
                placeholder="Created from the English name"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">
                Used in links. Lowercase letters, numbers, and hyphens only.
              </span>
            </label>

            {createSubcategoryError ? (
              <p className="text-sm text-destructive">{createSubcategoryError.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-b-xl bg-muted/40 px-5 py-3.5">
            <Button variant="outline" onClick={closeSubcategoryDialog}>
              Cancel
            </Button>
            <Button
              disabled={
                creatingSubcategory || hasIncompleteSubcategoryTranslation || !subcategorySlug
              }
              onClick={() => void submitSubcategory()}
            >
              {creatingSubcategory ? "Creating…" : "Create subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

























