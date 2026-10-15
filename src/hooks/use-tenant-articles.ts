"use client";

import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type {
  ArticleScope,
  ArticleStatus,
} from "@/lib/apollo/generated/graphql";
import {
  ARCHIVE_ARTICLE,
  ARTICLES_QUERY,
  CANCEL_ARTICLE_SCHEDULE,
  CATEGORIES_QUERY,
  DELETE_ARCHIVED_ARTICLE,
  DELETE_ARTICLE,
  PUBLISH_ARTICLE,
  REQUEST_ARTICLE_CHANGES,
  RESTORE_ARTICLE,
  SCHEDULE_ARTICLE,
  SET_ARTICLE_BREAKING,
  SET_ARTICLE_FEATURED,
  SUBMIT_ARTICLE_FOR_REVIEW,
  UNPUBLISH_ARTICLE,
  UPDATE_ARTICLE_SCHEDULE,
} from "@/lib/apollo/operations";
import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

export type ArticleListAction =
  | "delete"
  | "deleteArchived"
  | "submit"
  | "requestChanges"
  | "publish"
  | "schedule"
  | "reschedule"
  | "cancelSchedule"
  | "unpublish"
  | "archive"
  | "restore"
  | "breaking"
  | "featured";

export function useTenantArticles(initialScope: ArticleScope = "ALL") {
  const permissions = useTenantUserPermissions();
  const [scope, setScope] = useState<ArticleScope>(initialScope);
  const effectiveScope =
    scope === "REVIEW" && !permissions.canReviewArticles ? "ALL" : scope;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const query = useQuery(ARTICLES_QUERY, {
    variables: {
      search: search || null,
      status: status || null,
      categoryId: categoryId || null,
      scope: effectiveScope,
      page,
      pageSize: 25,
    },
    skip: !permissions.canViewArticles,
    fetchPolicy: "network-only",
  });
  const categoriesQuery = useQuery(CATEGORIES_QUERY, {
    variables: { search: null },
    skip: !permissions.canViewCategories,
  });
  const [remove] = useMutation(DELETE_ARTICLE);
  const [removeArchived] = useMutation(DELETE_ARCHIVED_ARTICLE);
  const [submit] = useMutation(SUBMIT_ARTICLE_FOR_REVIEW);
  const [requestChanges] = useMutation(REQUEST_ARTICLE_CHANGES);
  const [publish] = useMutation(PUBLISH_ARTICLE);
  const [unpublish] = useMutation(UNPUBLISH_ARTICLE);
  const [schedule] = useMutation(SCHEDULE_ARTICLE);
  const [reschedule] = useMutation(UPDATE_ARTICLE_SCHEDULE);
  const [cancelSchedule] = useMutation(CANCEL_ARTICLE_SCHEDULE);
  const [archive] = useMutation(ARCHIVE_ARTICLE);
  const [restore] = useMutation(RESTORE_ARTICLE);
  const [breaking] = useMutation(SET_ARTICLE_BREAKING);
  const [featured] = useMutation(SET_ARTICLE_FEATURED);
  const pageData = query.data?.articles;
  const totalPages = Math.max(1, Math.ceil((pageData?.total ?? 0) / 25));
  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data],
  );
  async function act(
    action: ArticleListAction,
    id: string,
    value?: string | boolean,
  ) {
    if (actionBusy) return false;
    setActionBusy(true);
    setActionError("");
    try {
      switch (action) {
        case "delete":
          await remove({ variables: { id } });
          break;
        case "deleteArchived":
          await removeArchived({ variables: { id } });
          break;
        case "submit":
          await submit({ variables: { id } });
          break;
        case "requestChanges":
          await requestChanges({
            variables: { id, comment: String(value ?? "") },
          });
          break;
        case "publish":
          await publish({ variables: { id } });
          break;
        case "unpublish":
          await unpublish({ variables: { id } });
          break;
        case "schedule":
          await schedule({ variables: { id, scheduledAt: String(value) } });
          break;
        case "reschedule":
          await reschedule({ variables: { id, scheduledAt: String(value) } });
          break;
        case "cancelSchedule":
          await cancelSchedule({ variables: { id } });
          break;
        case "archive":
          await archive({ variables: { id } });
          break;
        case "restore":
          await restore({ variables: { id } });
          break;
        case "breaking":
          await breaking({ variables: { id, enabled: Boolean(value) } });
          break;
        case "featured":
          await featured({ variables: { id, enabled: Boolean(value) } });
          break;
      }
      await query.refetch();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not update article",
      );
      return false;
    } finally {
      setActionBusy(false);
    }
  }
  return {
    permissions,
    items: pageData?.items ?? [],
    total: pageData?.total ?? 0,
    page,
    totalPages,
    categories,
    scope: effectiveScope,
    status,
    categoryId,
    searchInput,
    search,
    loading: permissions.loading || (query.loading && !query.data),
    refreshing: query.loading,
    error: query.error,
    actionError,
    actionBusy,
    setSearchInput,
    applySearch: () => {
      setSearch(searchInput.trim());
      setPage(1);
    },
    setScope: (value: ArticleScope) => {
      setScope(value);
      setPage(1);
    },
    setStatus: (value: ArticleStatus | "") => {
      setStatus(value);
      setPage(1);
    },
    setCategoryId: (value: string) => {
      setCategoryId(value);
      setPage(1);
    },
    setPage,
    act,
  };
}
