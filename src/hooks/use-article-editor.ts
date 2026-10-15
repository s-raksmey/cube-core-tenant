"use client";

import { useMemo, useState, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { ARTICLE_FOR_EDIT_QUERY, CATEGORIES_QUERY, TAGS_QUERY, CREATE_ARTICLE, UPDATE_ARTICLE,
  SUBMIT_ARTICLE_FOR_REVIEW, PUBLISH_ARTICLE, SCHEDULE_ARTICLE,
  SET_ARTICLE_BREAKING, SET_ARTICLE_FEATURED } from "@/lib/apollo/operations";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import { articleFormInput, articleToForm, emptyArticleForm, type ArticleFormState } from "@/types/article.types";
import { supportedLocales } from "@/lib/locales";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { articleActions } from "@/lib/article-workflow";

export type SaveMode = "draft" | "submit" | "publish" | "schedule";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function useArticleEditor(id?: string) {
  const router = useRouter();
  const viewer = useConsoleUser();
  const permissions = useTenantUserPermissions();
  const articleQuery = useQuery(ARTICLE_FOR_EDIT_QUERY, { variables: { id: id ?? "" }, skip: !id || !permissions.canViewArticles });
  const categoriesQuery = useQuery(CATEGORIES_QUERY, { variables: { search: null }, skip: !permissions.canViewCategories });
  const [tagSearch, setTagSearch] = useState("");
  const tagsQuery = useQuery(TAGS_QUERY, { variables: { search: tagSearch || null, page: 1, pageSize: 100 }, skip: !permissions.canViewTags });
  const [create] = useMutation(CREATE_ARTICLE);
  const [update] = useMutation(UPDATE_ARTICLE);
  const [submit] = useMutation(SUBMIT_ARTICLE_FOR_REVIEW);
  const [publish] = useMutation(PUBLISH_ARTICLE);
  const [schedule] = useMutation(SCHEDULE_ARTICLE);
  const [setBreaking] = useMutation(SET_ARTICLE_BREAKING);
  const [setFeatured] = useMutation(SET_ARTICLE_FEATURED);
  const [draft, setDraft] = useState<{ articleId: string | null; form: ArticleFormState } | null>(null);
  const [manualSlug, setManualSlug] = useState(Boolean(id));
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const article = articleQuery.data?.article;
  const articleId = article?.id ?? null;
  const loadedForm = article ? articleToForm(article) : emptyArticleForm();
  const form = draft?.articleId === articleId ? draft.form : loadedForm;
  function setForm(update: SetStateAction<ArticleFormState>) {
    setDraft((current) => {
      const base = current?.articleId === articleId ? current.form : loadedForm;
      return { articleId, form: typeof update === "function" ? update(base) : update };
    });
  }
  const categories = categoriesQuery.data?.categories ?? [];
  const subcategories = categories.find((category) => category.id === form.categoryId)?.subcategories ?? [];
  const availableLocales = supportedLocales.filter((locale) => locale.code !== "en" && !form.translations.some((item) => item.locale === locale.code));
  const tagOptions = useMemo(() => {
    const byId = new Map((article?.tags ?? []).map((tag) => [tag.id, tag]));
    for (const tag of tagsQuery.data?.tags ?? []) byId.set(tag.id, tag);
    return [...byId.values()];
  }, [article?.tags, tagsQuery.data?.tags]);
  const canEdit = !id ? permissions.canCreateArticles : Boolean(article && articleActions(article, viewer.id, permissions).edit);
  function patch<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function titleChanged(value: string) {
    setForm((current) => ({ ...current, title: value, slug: manualSlug ? current.slug : slugify(value) }));
  }
  function categoryChanged(value: string) {
    setForm((current) => ({ ...current, categoryId: value, subcategoryId: "" }));
  }
  function translationChanged(index: number, value: Partial<ArticleFormState["translations"][number]>) {
    setForm((current) => ({ ...current, translations: current.translations.map((item, i) => i === index ? { ...item, ...value } : item) }));
  }
  async function save(mode: SaveMode) {
    if (busy || !canEdit) return;
    setError("");
    const input = articleFormInput(form);
    if (!input.title || !input.slug || !input.categoryId || !input.subcategoryId) { setError("Title, slug, category and subcategory are required."); return; }
    if (mode !== "draft" && !input.content.trim()) { setError("Content is required before submission or publication."); return; }
    if (form.translations.some((item) => !item.title.trim() || !item.content.trim()) || new Set(form.translations.map((item) => item.locale)).size !== form.translations.length) {
      setError("Complete each translation and use each language once."); return;
    }
    if (mode === "schedule" && (!scheduledAt || Number.isNaN(Date.parse(`${scheduledAt}Z`)) || new Date(`${scheduledAt}Z`) <= new Date())) {
      setError("Enter a future UTC date and time."); return;
    }
    setBusy(true);
    try {
      const articleId = id ?? (await create({ variables: { input } })).data?.createArticle.id;
      if (!articleId) throw new Error("Article was not created");
      if (id) await update({ variables: { id: articleId, input } });
      if (permissions.canSetBreakingArticles && form.isBreaking !== (article?.isBreaking ?? false)) await setBreaking({ variables: { id: articleId, enabled: form.isBreaking } });
      if (permissions.canSetFeaturedArticles && form.isFeatured !== (article?.isFeatured ?? false)) await setFeatured({ variables: { id: articleId, enabled: form.isFeatured } });
      if (mode === "submit") await submit({ variables: { id: articleId } });
      if (mode === "publish") await publish({ variables: { id: articleId } });
      if (mode === "schedule") await schedule({ variables: { id: articleId, scheduledAt: `${scheduledAt}Z` } });
      router.push(`/content/articles/${articleId}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save article"); }
    finally { setBusy(false); }
  }
  return { permissions, article, form, patch, titleChanged, categoryChanged, translationChanged,
    manualSlug, setManualSlug, scheduledAt, setScheduledAt, tagSearch, setTagSearch, categories,
    subcategories, tagOptions, availableLocales, busy, error, save, canEdit,
    loading: permissions.loading || Boolean(id && articleQuery.loading),
    loadError: articleQuery.error, tagsLoading: tagsQuery.loading };
}
