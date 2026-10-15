"use client";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type {
  CreateTagInput,
  TagsQuery,
  UpdateTagInput,
} from "@/lib/apollo/generated/graphql";
import {
  CREATE_TAG,
  DELETE_TAG,
  TAGS_QUERY,
  UPDATE_TAG,
} from "@/lib/apollo/operations";
import { supportedLocales } from "@/lib/locales";
import type { TranslationDraft } from "@/types/category.types";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
export function useTenantTags() {
  const permissions = useTenantUserPermissions();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const query = useQuery(TAGS_QUERY, {
    variables: { search: search || null, page, pageSize: 25 },
    skip: !permissions.canViewTags,
    fetchPolicy: "network-only",
  });
  const [create, cs] = useMutation(CREATE_TAG);
  const [update, us] = useMutation(UPDATE_TAG);
  const [remove, ds] = useMutation(DELETE_TAG);
  async function mutate(action: () => Promise<unknown>, message: string) {
    setActionError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await query.refetch();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to save tag",
      );
      return false;
    }
  }
  return {
    permissions,
    tags: query.data?.tags ?? [],
    initialLoading: permissions.loading || (query.loading && !query.data),
    loading: query.loading,
    error: query.error,
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    notice,
    actionError,
    clearFeedback: () => {
      setActionError("");
      setNotice("");
    },
    applySearch: () => {
      setSearch(searchInput.trim());
      setPage(1);
    },
    create: (input: CreateTagInput) =>
      mutate(() => create({ variables: { input } }), "Tag created"),
    update: (id: string, input: UpdateTagInput) =>
      mutate(() => update({ variables: { id, input } }), "Tag updated"),
    remove: (id: string) =>
      mutate(() => remove({ variables: { id } }), "Tag deleted"),
    saving: cs.loading || us.loading || ds.loading,
  };
}

type Tag = TagsQuery["tags"][number];
export function useTenantTagForm(tags: ReturnType<typeof useTenantTags>) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);
  const [translations, setTranslations] = useState<TranslationDraft[]>([]);
  const locales = supportedLocales.filter((locale) => locale.code !== "en");
  const available = locales.filter(
    (locale) => !translations.some((item) => item.locale === locale.code),
  );
  const valid = Boolean(
    name.trim() &&
    name.trim().length <= 160 &&
    slug.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    translations.every(
      (item) =>
        item.name.trim() &&
        item.name.trim().length <= 160 &&
        item.locale !== "en",
    ) &&
    new Set(translations.map((item) => item.locale)).size ===
      translations.length,
  );
  function showForm(tag: Tag | null = null) {
    tags.clearFeedback();
    setEditing(tag);
    setName(tag?.name ?? "");
    setSlug(tag?.slug ?? "");
    setManualSlug(Boolean(tag));
    setTranslations(tag?.translations.map((item) => ({ ...item })) ?? []);
    setOpen(true);
  }
  async function submit() {
    if (!valid || tags.saving) return;
    const input = {
      name: name.trim(),
      slug,
      translations: translations.map((item) => ({
        locale: item.locale.toLowerCase(),
        name: item.name.trim(),
      })),
    };
    if (await (editing ? tags.update(editing.id, input) : tags.create(input)))
      setOpen(false);
  }
  function updateTranslation(index: number, patch: Partial<TranslationDraft>) {
    setTranslations((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }
  return {
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
  };
}
